import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from './app.module';

describe('Application bootstrap', () => {
  it('Should init the app', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();

    await app.init();
    expect(app).toBeDefined();
    await app.close();
  });
});
