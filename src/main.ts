// IMPORTANT: this MUST be the very first import. The OpenTelemetry SDK patches
// modules at require()-time via auto-instrumentation; anything imported above
// this line will be invisible to traces.
import '@/infrastructure/observability/tracing.bootstrap';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { setupSwagger } from '@/configs/swagger.config';
import { Config } from '@/configs/environment.config';
import { RedisIoAdapter } from '@/infrastructure/redis/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService<Config>);
  const logger = app.get(Logger);

  // API PREFIX AND VERSION
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.enableShutdownHooks(['SIGINT', 'SIGTERM']);
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  if (config.get('app').nodeEnv !== 'production') {
    await setupSwagger(app);
  }

  // REDIS ADAPTER
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);
  app.getHttpServer().once('close', () => {
    void redisIoAdapter.close();
  });

  const port = config.get('app').port ?? 3000;
  const httpServer = app.getHttpServer() as {
    keepAliveTimeout?: number;
    headersTimeout?: number;
  };
  // Graceful connection draining settings suitable for containerized deploys.
  httpServer.keepAliveTimeout = 61_000;
  httpServer.headersTimeout = 65_000;
  await app.listen(port);

  const baseUrl = config.get('app').url ?? `http://localhost:${port}`;
  logger.log(`API  ready at ${baseUrl}/api/v1`);
  if (config.get('app').nodeEnv !== 'production') {
    logger.log(`Docs ready at ${baseUrl}/api/docs`);
  }
}

bootstrap();
