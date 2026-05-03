import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { TwoFactorMethodType, type User } from '@prisma-client';
import { Config } from '@/configs/environment.config';
import { CryptoService } from '@/common/crypto/crypto.service';
import { TwoFactorRepository } from '@/core/auth/repositories/two-factor.repository';

export interface TotpEnrollmentResult {
  methodId: string;
  secret: string; // encoded for the auth app, NOT the encrypted form
  otpauthUrl: string;
  qrDataUrl: string;
}

@Injectable()
export class TotpService {
  constructor(
    private readonly config: ConfigService<Config>,
    private readonly crypto: CryptoService,
    private readonly twoFactor: TwoFactorRepository,
  ) {
    const totp = this.config.get<Config['totp']>('totp')!;
    authenticator.options = { window: totp.window };
  }

  async enroll(user: User): Promise<TotpEnrollmentResult> {
    const totp = this.config.get<Config['totp']>('totp')!;
    const secret = authenticator.generateSecret();
    const accountName = user.email ?? user.id;

    const encryptedSecret = this.crypto.encrypt(secret);
    const method = await this.twoFactor.upsert({
      userId: user.id,
      type: TwoFactorMethodType.TOTP,
      secret: encryptedSecret,
    });

    const otpauthUrl = authenticator.keyuri(accountName, totp.issuer, secret);
    const qrDataUrl = await toDataURL(otpauthUrl);

    return {
      methodId: method.id,
      secret,
      otpauthUrl,
      qrDataUrl,
    };
  }

  async confirm(userId: string, code: string): Promise<void> {
    const method = await this.twoFactor.findByUserAndType(
      userId,
      TwoFactorMethodType.TOTP,
    );
    if (!method || !method.secret) {
      throw new NotFoundException('TOTP enrollment not started');
    }
    if (method.isEnabled) {
      throw new ConflictException('TOTP already enabled');
    }

    if (!this.verifyCode(method.secret, code)) {
      throw new UnauthorizedException('Invalid authenticator code');
    }

    await this.twoFactor.enable(method.id);
  }

  verifyEnrolled(methodSecretCiphertext: string, code: string): boolean {
    return this.verifyCode(methodSecretCiphertext, code);
  }

  private verifyCode(secretCiphertext: string, code: string): boolean {
    const secret = this.crypto.decrypt(secretCiphertext);
    return authenticator.check(code, secret);
  }
}
