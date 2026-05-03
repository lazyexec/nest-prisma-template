import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { setupSwagger } from '@/configs/swagger.config';
import { Config } from '@/configs/environment.config';
import { RedisIoAdapter } from '@/infrastructure/redis/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Config>);

  // API PREFIX AND VERSION
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.enableShutdownHooks();
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
  await app.listen(port);
}

bootstrap();
