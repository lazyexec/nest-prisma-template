import { z } from 'zod';

const envSchema = z.object({
  app: z.object({
    name: z.string().trim().min(1).default('nest-prisma-template'),
    port: z.coerce.number().int().min(1).max(65535).default(3000),
    nodeEnv: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    debug: z.boolean().default(false),
    url: z.url().optional(),
    frontendUrl: z.url().default('http://localhost:5173'),
    rateLimitTtl: z.coerce.number().int().positive().default(60),
    rateLimitLimit: z.coerce.number().int().positive().default(100),
  }),
  database: z.object({
    url: z.url(),
    poolSize: z.coerce.number().int().positive().default(10),
  }),
  redis: z.object({
    url: z.url(),
    ttlSeconds: z.coerce.number().int().positive().default(300),
    keyPrefix: z.string().trim().min(1).default('app:'),
  }),
  auth: z.object({
    jwtAccessSecret: z.string().trim().min(16),
    jwtAccessExpiresIn: z.string().trim().min(1).default('15m'),
    jwtRefreshSecret: z.string().trim().min(16),
    jwtRefreshExpiresIn: z.string().trim().min(1).default('30d'),
    encryptionKey: z
      .string()
      .trim()
      .min(32, 'AUTH_ENCRYPTION_KEY must be 32 bytes (base64-encoded)'),
    loginMaxFails: z.coerce.number().int().positive().default(10),
    loginLockoutTtlSeconds: z.coerce.number().int().positive().default(900),
    passwordResetTtlSeconds: z.coerce.number().int().positive().default(1800),
    emailVerifyTtlSeconds: z.coerce.number().int().positive().default(86_400),
    twoFactorChallengeTtlSeconds: z.coerce
      .number()
      .int()
      .positive()
      .default(300),
  }),
  otp: z.object({
    length: z.coerce.number().int().min(4).max(10).default(6),
    emailTtlSeconds: z.coerce.number().int().positive().default(600),
    smsTtlSeconds: z.coerce.number().int().positive().default(300),
    maxAttempts: z.coerce.number().int().positive().default(5),
    resendCooldownSeconds: z.coerce.number().int().positive().default(60),
  }),
  totp: z.object({
    issuer: z.string().trim().min(1).default('NestPrismaTemplate'),
    window: z.coerce.number().int().nonnegative().default(1),
  }),
  mail: z.object({
    host: z.string().trim().min(1).default('smtp.gmail.com'),
    port: z.coerce.number().int().min(1).max(65535).default(587),
    secure: z.coerce.boolean().default(false),
    user: z.string().trim().min(1),
    pass: z.string().trim().min(1),
    from: z.string().trim().min(1),
  }),
  sms: z.object({
    accountSid: z.string().trim().optional(),
    authToken: z.string().trim().optional(),
    fromNumber: z.string().trim().optional(),
  }),
  oauth: z.object({
    google: z.object({
      // Comma-separated list of accepted audiences. The first entry is used
      // for issuing-side checks; the verifier accepts any. Supply at least
      // one (web/iOS/Android client IDs).
      clientIds: z
        .string()
        .trim()
        .optional()
        .transform((value) =>
          value
            ? value
                .split(',')
                .map((id) => id.trim())
                .filter(Boolean)
            : [],
        ),
    }),
    apple: z.object({
      // Apple Service ID / bundle ID(s) that issued the ID token (audience).
      clientIds: z
        .string()
        .trim()
        .optional()
        .transform((value) =>
          value
            ? value
                .split(',')
                .map((id) => id.trim())
                .filter(Boolean)
            : [],
        ),
    }),
  }),
});

export default () =>
  envSchema.parse({
    app: {
      name: process.env.APP_NAME,
      port: process.env.PORT,
      nodeEnv: process.env.NODE_ENV,
      debug:
        process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true',
      url: process.env.BACKEND_URL,
      frontendUrl: process.env.FRONTEND_URL,
      rateLimitTtl: process.env.RATE_LIMIT_TTL,
      rateLimitLimit: process.env.RATE_LIMIT_LIMIT,
    },
    database: {
      url: process.env.DATABASE_URL,
      poolSize: process.env.DATABASE_POOL_SIZE,
    },
    redis: {
      url: process.env.REDIS_URL,
      ttlSeconds: process.env.REDIS_TTL_SECONDS,
      keyPrefix: process.env.REDIS_KEY_PREFIX,
    },
    auth: {
      jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
      jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
      jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      encryptionKey: process.env.AUTH_ENCRYPTION_KEY,
      loginMaxFails: process.env.AUTH_LOGIN_MAX_FAILS,
      loginLockoutTtlSeconds: process.env.AUTH_LOGIN_LOCKOUT_TTL_SECONDS,
      passwordResetTtlSeconds: process.env.AUTH_PASSWORD_RESET_TTL_SECONDS,
      emailVerifyTtlSeconds: process.env.AUTH_EMAIL_VERIFY_TTL_SECONDS,
      twoFactorChallengeTtlSeconds:
        process.env.AUTH_2FA_CHALLENGE_TTL_SECONDS,
    },
    otp: {
      length: process.env.OTP_LENGTH,
      emailTtlSeconds: process.env.OTP_EMAIL_TTL_SECONDS,
      smsTtlSeconds: process.env.OTP_SMS_TTL_SECONDS,
      maxAttempts: process.env.OTP_MAX_ATTEMPTS,
      resendCooldownSeconds: process.env.OTP_RESEND_COOLDOWN_SECONDS,
    },
    totp: {
      issuer: process.env.TOTP_ISSUER,
      window: process.env.TOTP_WINDOW,
    },
    mail: {
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: process.env.MAIL_SECURE,
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
      from: process.env.MAIL_FROM,
    },
    sms: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_FROM_NUMBER,
    },
    oauth: {
      google: { clientIds: process.env.GOOGLE_CLIENT_IDS },
      apple: { clientIds: process.env.APPLE_CLIENT_IDS },
    },
  });

export type Config = z.infer<typeof envSchema>;
