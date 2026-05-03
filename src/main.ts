import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { setupSwagger } from '@/configs/swagger.config';
import { Config } from '@/configs/environment.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Config>);

  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (config.get('app').nodeEnv !== 'production') {
    await setupSwagger(app);
  }

  const port = config.get('app').port ?? 3000;
  await app.listen(port);
}

bootstrap();
