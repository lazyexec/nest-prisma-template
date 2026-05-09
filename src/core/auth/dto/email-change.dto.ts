import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RequestEmailChangeDto {
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  @IsEmail()
  @MaxLength(320)
  email!: string;
}

export class ConfirmEmailChangeDto {
  @IsString()
  @MinLength(20)
  token!: string;
}
