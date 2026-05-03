import { TwoFactorMethodType } from '@prisma-client';
import { IsEnum, IsString, Matches, MinLength } from 'class-validator';

export class TwoFactorChallengeVerifyDto {
  @IsString()
  @MinLength(10)
  challengeId!: string;

  @IsEnum(TwoFactorMethodType)
  type!: TwoFactorMethodType;

  @IsString()
  @Matches(/^[A-Za-z0-9-]{4,32}$/)
  code!: string;
}

export class TwoFactorChallengeSendDto {
  @IsString()
  @MinLength(10)
  challengeId!: string;

  @IsEnum(TwoFactorMethodType)
  type!: TwoFactorMethodType;
}
