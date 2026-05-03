import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from '@/configs/environment.config';
import { CryptoService } from '@/common/crypto/crypto.service';
import { MAILER_PORT } from '@/infrastructure/mailer/mailer.constants';
import type { MailerPort } from '@/infrastructure/mailer/mailer.types';
import { AuthCacheService } from '@/core/auth/services/auth-cache.service';
import { UserRepository } from '@/core/auth/repositories/user.repository';

@Injectable()
export class EmailVerifyService {
  constructor(
    private readonly config: ConfigService<Config>,
    private readonly crypto: CryptoService,
    private readonly cache: AuthCacheService,
    private readonly users: UserRepository,
    @Inject(MAILER_PORT) private readonly mailer: MailerPort,
  ) {}

  async issueAndSend(userId: string, email: string): Promise<void> {
    const auth = this.config.get<Config['auth']>('auth')!;
    const app = this.config.get<Config['app']>('app')!;

    const rawToken = this.crypto.randomToken(32);
    const tokenHash = this.crypto.hashSha256(rawToken);

    await this.cache.setEmailVerify(
      tokenHash,
      { userId, email },
      auth.emailVerifyTtlSeconds,
    );

    const link = `${app.frontendUrl.replace(/\/$/, '')}/verify-email?token=${rawToken}`;
    await this.mailer.send({
      to: email,
      subject: 'Verify your email',
      text: `Click to verify your email: ${link}\n\nThis link expires in ${Math.round(auth.emailVerifyTtlSeconds / 3600)}h.`,
      html: `<p>Click to verify your email:</p><p><a href="${link}">${link}</a></p><p>This link expires in ${Math.round(auth.emailVerifyTtlSeconds / 3600)}h.</p>`,
    });
  }

  async confirm(token: string): Promise<{ userId: string }> {
    const tokenHash = this.crypto.hashSha256(token);
    const record = await this.cache.getEmailVerify(tokenHash);
    if (!record) {
      throw new NotFoundException('Verification link is invalid or expired');
    }

    await this.users.markEmailVerified(record.userId);
    await this.cache.deleteEmailVerify(tokenHash);

    return { userId: record.userId };
  }
}
