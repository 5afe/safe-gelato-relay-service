import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ILoggingService, LoggingService } from '../logging/logging.interface';
import { Inject } from '@nestjs/common/decorators';

/**
 * The {@link RouteLoggerInterceptor} is an interceptor that logs the requests
 * that target a specific route.
 *
 * Since this is an interceptor we have access to the respective {@link ExecutionContext}
 * See https://docs.nestjs.com/fundamentals/execution-context
 */
@Injectable()
export class RouteLoggerInterceptor implements NestInterceptor {
  constructor(
    @Inject(LoggingService) private readonly loggingService: ILoggingService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    // TODO Use req.route.path to log the route path without any replacement
    this.loggingService.info('[==>] %s %s', req.method, req.url);
    return next.handle();
  }
}
