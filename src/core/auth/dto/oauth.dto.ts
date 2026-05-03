import { IsString, MinLength } from 'class-validator';

export class OAuthIdTokenDto {
  @IsString()
  @MinLength(20)
  idToken!: string;
}
