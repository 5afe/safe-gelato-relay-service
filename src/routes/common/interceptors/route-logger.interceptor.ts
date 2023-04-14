import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ILoggingService, LoggingService } from '../logging/logging.interface';
import { Inject } from '@nestjs/common/decorators';
import { Observable, tap } from 'rxjs';

/**
 * The {@link RouteLoggerInterceptor} is an interceptor that logs the requests
 * that target a specific route.
 *
 * Since this is an interceptor we have access to the respective {@link ExecutionContext}
 * and have, therefore, more data regarding which route handled this request
 * See https://docs.nestjs.com/fundamentals/execution-context
 *
 * Note: this interceptor is triggered if there is a matching route. Therefore,
 * if a request is made to a non-existing route (resulting in a 404) this interceptor
 * does not log such event.
 */
@Injectable()
export class RouteLoggerInterceptor implements NestInterceptor {
  private static LOG_FORMAT = '[==>] %s %s %d';

  constructor(
    @Inject(LoggingService) private readonly loggingService: ILoggingService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();
    // TODO Use req.route.path to log the route path without any replacement
    return next.handle().pipe(
      tap({
        error: (e) => this.onError(request, e),
        complete: () => this.onComplete(request, response),
      }),
    );
  }

  /**
   * Handles error events that occur in the stream observable
   *
   * Important: Post-Request Interceptors are executed BEFORE exception filters.
   * This means that if an exception is not an HttpException it's impossible at
   * this stage to associate it with an HTTP Error Code.
   *
   * Therefore, 500 is assumed for non-HttpException types.
   * See https://github.com/nestjs/nest/issues/1342#issuecomment-444666214
   * @param request - the request object used in this context
   * @param error - the error which was triggered in the stream
   * @private
   */
  private onError(request: any, error: Error) {
    const statusCode =
      error instanceof HttpException
        ? error.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (statusCode >= 400 && statusCode < 500) {
      this.loggingService.info(
        RouteLoggerInterceptor.LOG_FORMAT,
        request.method,
        request.url,
        statusCode,
      );
    } else {
      this.loggingService.error(
        RouteLoggerInterceptor.LOG_FORMAT,
        request.method,
        request.url,
        statusCode,
      );
    }
  }

  private onComplete(request: any, response: any) {
    this.loggingService.info(
      RouteLoggerInterceptor.LOG_FORMAT,
      request.method,
      request.url,
      response.statusCode,
    );
  }
}
