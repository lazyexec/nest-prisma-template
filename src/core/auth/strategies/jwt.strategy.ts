import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Config } from '@/configs/environment.config';
import { JwtPayload } from '@/core/auth/types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService<Config>) {
    const auth = configService.get<Config['auth']>('auth');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: auth?.jwtAccessSecret,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    if (payload.tokenType !== 'access') {
      throw new UnauthorizedException('Access token required');
    }

    return payload;
  }
}
