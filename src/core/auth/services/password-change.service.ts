import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthProvider } from '@prisma-client';
import { CredentialRepository } from '@/core/auth/repositories/credential.repository';
import { TokenService } from '@/core/auth/services/token.service';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class PasswordChangeService {
  constructor(
    private readonly credentials: CredentialRepository,
    private readonly tokens: TokenService,
  ) {}

  async change(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const credential = await this.credentials.findByUserAndProvider(
      userId,
      AuthProvider.EMAIL,
    );
    if (!credential || !credential.passwordHash) {
      throw new NotFoundException('No password credential on this account');
    }

    const matches = await bcrypt.compare(
      currentPassword,
      credential.passwordHash,
    );
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new UnauthorizedException(
        'New password must differ from current password',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.credentials.updatePasswordHash(credential.id, passwordHash);
    await this.tokens.revokeAllForUser(userId);
  }
}
