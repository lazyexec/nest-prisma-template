import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { Config } from '@/configs/environment.config';

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(config: ConfigService<Config>) {
    const auth = config.get<Config['auth']>('auth');
    if (!auth?.encryptionKey) {
      throw new Error('AUTH_ENCRYPTION_KEY missing');
    }

    const decoded = Buffer.from(auth.encryptionKey, 'base64');
    if (decoded.length !== 32) {
      throw new Error(
        'AUTH_ENCRYPTION_KEY must decode to 32 bytes (base64 of a 32-byte key)',
      );
    }
    this.key = decoded;
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGO, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  decrypt(payload: string): string {
    const parts = payload.split(':');
    if (parts.length !== 3) {
      throw new Error('Malformed ciphertext');
    }
    const [ivPart, tagPart, dataPart] = parts;
    const iv = Buffer.from(ivPart, 'base64');
    const tag = Buffer.from(tagPart, 'base64');
    const data = Buffer.from(dataPart, 'base64');

    if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
      throw new Error('Malformed ciphertext');
    }

    const decipher = createDecipheriv(ALGO, this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      'utf8',
    );
  }

  hashSha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  randomToken(byteLength = 32): string {
    return randomBytes(byteLength).toString('hex');
  }

  randomNumericCode(length: number): string {
    let code = '';
    while (code.length < length) {
      const buf = randomBytes(length);
      for (const byte of buf) {
        if (byte < 250) {
          code += String(byte % 10);
          if (code.length === length) break;
        }
      }
    }
    return code;
  }

  constantTimeEqual(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return timingSafeEqual(aBuf, bBuf);
  }
}
