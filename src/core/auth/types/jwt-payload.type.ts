export type JwtTokenType = 'access' | 'refresh';

export type JwtPayload = {
  sub: string;
  tokenType: JwtTokenType;
};
