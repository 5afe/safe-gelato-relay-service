import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from './app.module';
import { TestAppProvider } from './app.provider';

describe('Application bootstrap', () => {
  it('Should init the app', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = await new TestAppProvider().provide(moduleFixture);

    await app.init();
    expect(app).toBeDefined();
    await app.close();
  });
});
