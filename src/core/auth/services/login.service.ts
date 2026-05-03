import {
  ForbiddenException,
  Injectable,
  TooManyRequestsException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthProvider, UserStatus } from '@prisma-client';
import { Config } from '@/configs/environment.config';
import { CryptoService } from '@/common/crypto/crypto.service';
import { AuthCacheService } from '@/core/auth/services/auth-cache.service';
import { TokenService } from '@/core/auth/services/token.service';
import { TwoFactorService } from '@/core/auth/services/two-factor.service';
import { CredentialRepository } from '@/core/auth/repositories/credential.repository';
import { TwoFactorRepository } from '@/core/auth/repositories/two-factor.repository';
import { UserRepository } from '@/core/auth/repositories/user.repository';
import type { LoginDto } from '@/core/auth/dto/login.dto';
import type {
  AuthTokens,
  RequestContext,
} from '@/core/auth/types/auth-tokens.type';
import type { TwoFactorMethodType } from '@prisma-client';

export type LoginResult =
  | { kind: 'tokens'; tokens: AuthTokens }
  | {
      kind: 'two-factor';
      challengeId: string;
      methods: TwoFactorMethodType[];
    };

@Injectable()
export class LoginService {
  constructor(
    private readonly config: ConfigService<Config>,
    private readonly crypto: CryptoService,
    private readonly cache: AuthCacheService,
    private readonly users: UserRepository,
    private readonly credentials: CredentialRepository,
    private readonly twoFactorRepo: TwoFactorRepository,
    private readonly twoFactor: TwoFactorService,
    private readonly tokens: TokenService,
  ) {}

  async login(dto: LoginDto, context: RequestContext): Promise<LoginResult> {
    const auth = this.config.get<Config['auth']>('auth')!;
    const emailHash = this.crypto.hashSha256(dto.email);

    const fails = await this.cache.getLoginFails(emailHash);
    if (fails >= auth.loginMaxFails) {
      throw new TooManyRequestsException(
        'Too many failed attempts. Try again later.',
      );
    }

    const user = await this.users.findByEmail(dto.email);
    if (!user) {
      await this.recordFail(emailHash, fails);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(`Account ${user.status.toLowerCase()}`);
    }

    const credential = await this.credentials.findByUserAndProvider(
      user.id,
      AuthProvider.EMAIL,
    );
    if (!credential || !credential.passwordHash) {
      await this.recordFail(emailHash, fails);
      throw new UnauthorizedException('Invalid email or password');
    }

    const matches = await bcrypt.compare(dto.password, credential.passwordHash);
    if (!matches) {
      await this.recordFail(emailHash, fails);
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.cache.deleteLoginFails(emailHash);
    await this.credentials.touchLastUsed(credential.id);

    const enabledMethods = await this.twoFactorRepo.findEnabledForUser(user.id);
    if (enabledMethods.length > 0) {
      const challenge = await this.twoFactor.issueChallenge(
        user,
        enabledMethods,
        context,
      );
      return {
        kind: 'two-factor',
        challengeId: challenge.challengeId,
        methods: challenge.methods,
      };
    }

    const tokens = await this.tokens.issue(user.id, context);
    return { kind: 'tokens', tokens };
  }

  private async recordFail(emailHash: string, current: number): Promise<void> {
    const auth = this.config.get<Config['auth']>('auth')!;
    await this.cache.setLoginFails(
      emailHash,
      current + 1,
      auth.loginLockoutTtlSeconds,
    );
  }
}
