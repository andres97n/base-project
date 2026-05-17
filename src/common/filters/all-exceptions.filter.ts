import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { AppException } from '../exceptions';
import { ErrorResponse } from '../interfaces';
import { getHttpExceptionCode } from '../helpers';
import { 
  DEFAULT_EXCEPTION_MESSAGE, 
} from '../constants';
import { EviromentTypes, ExceptionAppCodes } from '../enums';

/**
 * Filtro global que captura TODAS las excepciones no manejadas
 * Actúa como red de seguridad final
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = DEFAULT_EXCEPTION_MESSAGE;
    let code: string = ExceptionAppCodes.EXCEPTION_DEFAULT_CODE;
    let details: Record<string, any> | undefined;
    let stack: string | undefined;

    if (exception instanceof AppException) {
      status = exception.getStatus();
      message = exception.message;
      code = exception.code;
      details = exception.details;
      stack = exception.stack;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        details = exceptionResponse as Record<string, any>;
      }

      code = getHttpExceptionCode(status);
      stack = exception.stack;
    } else if (exception instanceof Error) {
      message = exception.message;
      stack = exception.stack;
      code = ExceptionAppCodes.EXCEPTION_UNHANDLED_CODE;
    }

    // Construir respuesta de error
    const errorResponse: ErrorResponse = {
      ok: false,
      statusCode: status,
      message,
      error: HttpStatus[status] || 'Unknown Error',
      code,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id'] as string,
      ...(details && { details }),
      ...(process.env.NODE_ENV === EviromentTypes.DEVELOPMENT && stack && { stack }),
    };

    // Severity Log Type
    if (status >= 500) {
      this.logger.error(
        `Error ${status} - ${message}`,
        stack || 'No stack trace',
        `${request.method} ${request.url}`,
      );
    } else {
      this.logger.warn(
        `Error ${status} - ${message}`,
        `${request.method} ${request.url}`,
      );
    }

    response.status(status).json(errorResponse);
  }

}
