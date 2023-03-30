import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import * as winston from 'winston';
import { format } from 'winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableVersioning();

  // TODO: Define cors headers which we want to allow.
  app.enableCors({
    origin: '*',
  });

  winston.add(
    new winston.transports.Console({
      level: 'debug',
      format: format.combine(
        format.uncolorize(),
        format.splat(),
        format.simple(),
      ),
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get('applicationPort');

  await app.listen(port);
}
bootstrap();
