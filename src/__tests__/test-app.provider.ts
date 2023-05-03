import { AppProvider, DEFAULT_CONFIGURATION } from '../app.provider';
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';

/**
 * A test {@link AppProvider}
 *
 * This provider provides an application given a {@link TestingModule}
 *
 * If the module provided is not a {@link TestingModule}, an error is thrown
 */
export class TestAppProvider extends AppProvider {
  protected readonly configuration: Array<(app: INestApplication) => void> =
    DEFAULT_CONFIGURATION;

  constructor() {
    super();
    if (process.env.NODE_ENV !== 'test') {
      throw Error('TestAppProvider used outside of a testing environment');
    }
  }

  protected getApp(module: unknown): Promise<INestApplication> {
    if (!(module instanceof TestingModule))
      return Promise.reject(`Provided module is not a TestingModule`);
    return Promise.resolve(module.createNestApplication());
  }
}
