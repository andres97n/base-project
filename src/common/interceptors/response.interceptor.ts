
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';

import { SuccessResponse } from '../interfaces';
import { RAW_RESPONSE_KEY, RESPONSE_DEFAULT_MESSAGE } from '../constants';


@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, T | SuccessResponse<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<T | SuccessResponse<T>> {
    const rawResponse = this.reflector.get<boolean>(
      RAW_RESPONSE_KEY,
      context.getHandler(),
    );

    if (rawResponse) return next.handle();
    
    const httpCtx = context.switchToHttp();
    const response = httpCtx.getResponse<Response>();
    const request = httpCtx.getRequest<Request>();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode || HttpStatus.OK;

        const anyData: any = data as any;

        const payload = anyData?.data ?? data;
        const meta = anyData?.meta;
        const customMessage = anyData?.message;

        const successResponse: SuccessResponse<any> = {
          ok: true,
          statusCode,
          message: customMessage || RESPONSE_DEFAULT_MESSAGE,
          data: payload,
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
          requestId: request.headers['x-request-id'] as string,
          ...(meta && { meta }),
        };

        return successResponse;
      }),
    );
  }
}
