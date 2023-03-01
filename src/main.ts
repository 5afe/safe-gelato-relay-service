import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { API_VERSIONING } from './config/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableVersioning(API_VERSIONING);

  const configService = app.get(ConfigService);
  const port = configService.get('applicationPort');

  await app.listen(port);
}
bootstrap();
