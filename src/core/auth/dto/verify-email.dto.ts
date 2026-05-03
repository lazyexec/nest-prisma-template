import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RequestEmailVerificationDto {
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  @IsEmail()
  @MaxLength(320)
  email!: string;
}

export class ConfirmEmailVerificationDto {
  @IsString()
  @MinLength(20)
  token!: string;
}
