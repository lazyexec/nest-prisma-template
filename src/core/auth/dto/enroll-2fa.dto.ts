import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class EnrollEmailOtpDto {
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  @IsEmail()
  @MaxLength(320)
  email?: string;
}

export class EnrollSmsOtpDto {
  @IsOptional()
  @IsPhoneNumber(undefined)
  @MaxLength(32)
  phone?: string;
}

export class ConfirmEnrollmentDto {
  @IsString()
  @Matches(/^\d{4,10}$/)
  code!: string;
}
