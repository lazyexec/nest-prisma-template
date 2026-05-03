import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Config } from '@/configs/environment.config';
import { JwtStrategy } from '@/core/auth/strategies/jwt.strategy';
import { JwtRefreshStrategy } from '@/core/auth/strategies/jwt-refresh.strategy';
import { AuthCacheService } from '@/core/auth/services/auth-cache.service';
import { UserRepository } from '@/core/auth/repositories/user.repository';
import { CredentialRepository } from '@/core/auth/repositories/credential.repository';
import { SessionRepository } from '@/core/auth/repositories/session.repository';
import { TwoFactorRepository } from '@/core/auth/repositories/two-factor.repository';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Config>) => {
        const auth = configService.get<Config['auth']>('auth');
        return {
          secret: auth?.jwtAccessSecret,
          signOptions: {
            expiresIn: auth?.jwtAccessExpiresIn as unknown as number,
          },
        };
      },
    }),
  ],
  providers: [
    JwtStrategy,
    JwtRefreshStrategy,
    AuthCacheService,
    UserRepository,
    CredentialRepository,
    SessionRepository,
    TwoFactorRepository,
  ],
  exports: [
    JwtModule,
    PassportModule,
    AuthCacheService,
    UserRepository,
    CredentialRepository,
    SessionRepository,
    TwoFactorRepository,
  ],
})
export class AuthModule {}
