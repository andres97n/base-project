
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Error as MongooseError } from 'mongoose';
import { MongoError } from 'mongodb';

import { ErrorResponse } from '../interfaces';
import { EviromentTypes, ExceptionAppCodes } from '../enums';
import { EXCEPTION_DATABASE_DEFAULT_MESSAGE } from '../constants';
import { 
  getMongoResponseCastError, getMongoResponseDefaultError, 
  getMongoResponseDuplicateKeyError, getMongoResponseMongoValidationError 
} from '../helpers';

/**
 * Filtro especializado para errores de Mongoose y MongoDB
 * Captura:
 * - Errores de validación de Mongoose (ValidationError)
 * - Errores de clave duplicada (código 11000)
 * - Errores de cast (CastError)
 */
@Catch(MongooseError.ValidationError, MongooseError.CastError, MongoError)
export class MongooseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MongooseExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.BAD_REQUEST;
    let message = EXCEPTION_DATABASE_DEFAULT_MESSAGE;
    let code = ExceptionAppCodes.EXCEPTION_DATABASE_CODE;
    let details: Record<string, any> = {};

    if (exception instanceof MongooseError.ValidationError) {
      ({ status, code, message, details = {} } = getMongoResponseMongoValidationError(exception));

      this.logger.warn(
        `Mongoose validation error on ${request.method} ${request.url}`,
        JSON.stringify(details),
      );
    }

    if (exception.name === 'MongoServerError' && exception.code === 11000) {
      ({ status, code, message, details = {} } = getMongoResponseDuplicateKeyError(exception));
      
      this.logger.warn(
        `Duplicate key error on ${request.method} ${request.url}`,
        JSON.stringify(details),
      );
    }
    
    if (exception instanceof MongooseError.CastError) {
      ({ status, code, message, details = {} } = getMongoResponseCastError(exception));

      this.logger.warn(
        `Cast error on ${request.method} ${request.url}`,
        JSON.stringify(details),
      );
    }
    
    if (exception instanceof MongoError) {
      ({ status, code, message, details = {} } = getMongoResponseDefaultError(exception));

      this.logger.error(
        `MongoDB error on ${request.method} ${request.url}`,
        exception.stack,
      );
    }

    const errorResponse: ErrorResponse = {
      ok: false,
      statusCode: status,
      message,
      error: HttpStatus[status],
      code,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id'] as string,
      details,
      ...(process.env.NODE_ENV === EviromentTypes.DEVELOPMENT && { stack: exception.stack }),
    };

    response.status(status).json(errorResponse);
  }
}
