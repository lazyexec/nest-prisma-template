import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthProvider } from '@prisma-client';
import { Config } from '@/configs/environment.config';
import { CryptoService } from '@/common/crypto/crypto.service';
import { MAILER_PORT } from '@/infrastructure/mailer/mailer.constants';
import type { MailerPort } from '@/infrastructure/mailer/mailer.types';
import { AuthCacheService } from '@/core/auth/services/auth-cache.service';
import { TokenService } from '@/core/auth/services/token.service';
import { UserRepository } from '@/core/auth/repositories/user.repository';
import { CredentialRepository } from '@/core/auth/repositories/credential.repository';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly config: ConfigService<Config>,
    private readonly crypto: CryptoService,
    private readonly cache: AuthCacheService,
    private readonly users: UserRepository,
    private readonly credentials: CredentialRepository,
    private readonly tokens: TokenService,
    @Inject(MAILER_PORT) private readonly mailer: MailerPort,
  ) {}

  async request(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      // Always return success-shaped response; never disclose existence.
      return;
    }

    const auth = this.config.get<Config['auth']>('auth')!;
    const app = this.config.get<Config['app']>('app')!;

    const rawToken = this.crypto.randomToken(32);
    const tokenHash = this.crypto.hashSha256(rawToken);

    await this.cache.setPasswordReset(
      tokenHash,
      { userId: user.id },
      auth.passwordResetTtlSeconds,
    );

    const link = `${app.frontendUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
    const minutes = Math.round(auth.passwordResetTtlSeconds / 60);

    try {
      await this.mailer.send({
        to: email,
        subject: 'Reset your password',
        text: `Reset your password: ${link}\n\nThis link expires in ${minutes} minutes. If you did not request this, ignore.`,
        html: `<p>Reset your password:</p><p><a href="${link}">${link}</a></p><p>This link expires in ${minutes} minutes. If you did not request this, you can safely ignore this email.</p>`,
      });
    } catch {
      // swallow to avoid leaking provider failures
    }
  }

  async reset(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.crypto.hashSha256(token);
    const record = await this.cache.getPasswordReset(tokenHash);
    if (!record) {
      throw new NotFoundException('Reset link is invalid or expired');
    }

    const credential = await this.credentials.findByUserAndProvider(
      record.userId,
      AuthProvider.EMAIL,
    );
    if (!credential) {
      throw new NotFoundException('No password credential on this account');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.credentials.updatePasswordHash(credential.id, passwordHash);
    await this.cache.deletePasswordReset(tokenHash);
    await this.tokens.revokeAllForUser(record.userId);
  }
}
