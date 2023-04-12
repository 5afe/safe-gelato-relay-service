import { INestApplication, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TestingModule } from '@nestjs/testing/testing-module';
import * as winston from 'winston';
import { format } from 'winston';

function configureLogger() {
  winston.add(
    new winston.transports.Console({
      level: 'debug',
      format: format.combine(format.splat(), format.simple()),
    }),
  );
}

function configureVersioning(app: INestApplication) {
  app.enableVersioning({
    type: VersioningType.URI,
  });
}

function configureCors(app: INestApplication) {
  app.enableCors({
    origin: '*',
  });
}

const DEFAULT_CONFIGURATION: ((app: INestApplication) => void)[] = [
  configureLogger,
  configureVersioning,
  configureCors,
];

/**
 * The main goal of {@link AppProvider} is to provide
 * a {@link INestApplication}.
 *
 * Extensions of this class should return the application in
 * {@link getApp}.
 *
 * Each provider should have a {@link configuration} which specifies
 * the steps taken to configure the application
 */
export abstract class AppProvider {
  protected abstract readonly configuration: Array<
    (app: INestApplication) => void
  >;

  public async provide(module: unknown): Promise<INestApplication> {
    const app = await this.getApp(module);
    this.configuration.forEach((f) => f(app));
    return app;
  }

  protected abstract getApp(module: unknown): Promise<INestApplication>;
}

/**
 * The default {@link AppProvider}
 *
 * This provider should be used to retrieve the actual implementation of the
 * service
 */
export class DefaultAppProvider extends AppProvider {
  protected readonly configuration: Array<(app: INestApplication) => void> =
    DEFAULT_CONFIGURATION;

  protected getApp(module: unknown): Promise<INestApplication> {
    return NestFactory.create(module);
  }
}

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
