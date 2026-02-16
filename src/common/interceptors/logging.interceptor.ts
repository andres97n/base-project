
import { 
  CallHandler, ExecutionContext, 
  Injectable, Logger, 
  NestInterceptor 
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';

/**
 * Interceptor para logging de requests y responses
 * Útil para debugging y monitoreo
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body } = request;
    const requestId = request.headers['x-request-id'];
    const startTime = Date.now();

    this.logger.log(`→ ${requestId}] ${method} ${url} - Started`);

    if (Object.keys(body || {}).length > 0) {
      this.logger.debug(`Body: ${JSON.stringify(body)}`);
    }

    return next.handle().pipe(
      tap(() => {
        const elapsedTime = Date.now() - startTime;
        this.logger.log(`← ${requestId}] ${method} ${url} - Completed in ${elapsedTime}ms`);
      }),
      catchError((error) => {
        const elapsedTime = Date.now() - startTime;
        this.logger.error(
          `✕ ${requestId}] ${method} ${url} - Failed in ${elapsedTime}ms`,
          error.stack,
        );
        throw error;
      }),
    );
  }
}
