import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { TOKEN_TYPE_KEY } from '@/core/auth/decorators/token-type.decorator';
import { JwtPayload, JwtTokenType } from '@/core/auth/types/jwt-payload.type';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  handleRequest<TUser = JwtPayload>(
    err: unknown,
    user: TUser,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw new UnauthorizedException();
    }

    const requiredTokenType = this.reflector.getAllAndOverride<JwtTokenType>(
      TOKEN_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredTokenType) {
      return user;
    }

    const payload = user as unknown as JwtPayload;
    if (payload.tokenType !== requiredTokenType) {
      throw new UnauthorizedException('Invalid token type for this route');
    }

    return user;
  }
}
