
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
import { ExceptionAppCodes } from '../enums';
import { EXCEPTION_DATABASE_DEFAULT_MESSAGE } from '../constants';
import { extractDuplicateField, getResponseMongoValidationError } from '../helpers';

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

    // 1. Error de validación de Mongoose
    if (exception instanceof MongooseError.ValidationError) {
      ({ status, code, message, details = {} } = getResponseMongoValidationError(exception));

      this.logger.warn(
        `Mongoose validation error on ${request.method} ${request.url}`,
        JSON.stringify(details),
      );
    }
    // 2. Error de clave duplicada (unique constraint)
    if (exception.name === 'MongoServerError' && exception.code === 11000) {
      status = HttpStatus.CONFLICT;
      code = ExceptionAppCodes.EXCEPTION_DUPLICATE_KEY_CODE;
      
      const field = extractDuplicateField(exception);
      const value = exception.keyValue?.[field];
      
      message = `El ${field} '${value}' ya existe en el sistema`;
      
      details = {
        field,
        value,
        constraint: 'unique',
      };

      this.logger.warn(
        `Duplicate key error on ${request.method} ${request.url}`,
        JSON.stringify(details),
      );
    }
    
    if (exception instanceof MongooseError.CastError) {
      status = HttpStatus.BAD_REQUEST;
      code = ExceptionAppCodes.EXCEPTION_INVALID_DATA_TYPE_CODE;
      message = `Valor inválido para el campo '${exception.path}'`;
      
      details = {
        field: exception.path,
        value: exception.value,
        expectedType: exception.kind,
        reason: 'El formato del dato no es válido',
      };

      this.logger.warn(
        `Cast error on ${request.method} ${request.url}`,
        JSON.stringify(details),
      );
    }
    
    if (exception instanceof MongoError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = ExceptionAppCodes.EXCEPTION_MONGODB_CODE;
      message = 'Error interno de base de datos';
      
      details = {
        mongoCode: exception.code,
        mongoMessage: exception.message,
      };

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
      ...(process.env.NODE_ENV === 'development' && { stack: exception.stack }),
    };

    response.status(status).json(errorResponse);
  }
}
