import { IsString, MaxLength, MinLength } from 'class-validator';

export class SetPasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
