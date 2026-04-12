import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Config } from './environment.config';

export async function setupSwagger(app: INestApplication): Promise<void> {
  const config = app.get(ConfigService<Config>);
  const swagger = new DocumentBuilder()
    .setTitle(config.get('app').name)
    .setDescription('Swagger documentation with proper API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swagger);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const docsDir = join(process.cwd(), 'docs');
  await mkdir(docsDir, { recursive: true });
  await writeFile(
    join(docsDir, 'swagger.json'),
    JSON.stringify(document, null, 2),
    'utf8',
  );
}
