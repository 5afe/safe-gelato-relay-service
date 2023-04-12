import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';
import { DefaultAppProvider } from './app.provider';
import { INestApplication } from '@nestjs/common';

async function bootstrap() {
  const app: INestApplication = await new DefaultAppProvider().provide(
    AppModule,
  );

  const configService = app.get(ConfigService);
  const port = configService.get('applicationPort');

  await app.listen(port);
}

bootstrap();
