import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthProvider } from '@prisma-client';
import { CredentialRepository } from '@/core/auth/repositories/credential.repository';
import { UserRepository } from '@/core/auth/repositories/user.repository';
import { TokenService } from '@/core/auth/services/token.service';

const BCRYPT_ROUNDS = 12;
// Apple's Hide-My-Email relay isn't a real address the user controls — never
// pin a password credential to it (password reset would be undeliverable).
const APPLE_RELAY_DOMAIN = '@privaterelay.appleid.com';

@Injectable()
export class PasswordChangeService {
  constructor(
    private readonly credentials: CredentialRepository,
    private readonly users: UserRepository,
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

  /**
   * Adds a password credential for an OAuth-only account so the user can
   * thereafter log in via email + password. Refuses if the user already has
   * an EMAIL credential (use `change` instead) or if their email isn't a
   * verified, deliverable address.
   */
  async set(userId: string, newPassword: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.email || !user.isEmailVerified) {
      throw new BadRequestException(
        'A verified email is required before setting a password',
      );
    }
    if (user.email.toLowerCase().endsWith(APPLE_RELAY_DOMAIN)) {
      throw new BadRequestException(
        'Add a real email address before setting a password',
      );
    }

    const existing = await this.credentials.findByUserAndProvider(
      userId,
      AuthProvider.EMAIL,
    );
    if (existing) {
      throw new ConflictException(
        'Password credential already exists; use change-password instead',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.credentials.create({
      userId,
      provider: AuthProvider.EMAIL,
      providerId: user.email,
      passwordHash,
    });
  }
}
