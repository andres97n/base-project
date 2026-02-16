import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { ValidationErrorResponse, ValidationError } from '../interfaces';
import { formatValidationErrors } from '../helpers';
import { 
  DEFAULT_BAD_REQUEST, 
  EXCEPTION_VALIDATION_DEFAULT_DETAIL_MESSAGE 
} from '../constants';
import { ExceptionAppCodes } from '../enums';

/**
 * Filtro especializado para errores de validación de DTOs
 * Formatea los errores de class-validator de forma legible
 */
@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse() as any;

    // Verificar si es un error de validación
    const isValidationError =
      Array.isArray(exceptionResponse.message) &&
      exceptionResponse.message.length > 0 &&
      typeof exceptionResponse.message[0] === 'object';

    // If is not validation error, set the exception
    if (!isValidationError) throw exception;

    const validationErrors: ValidationError[] = formatValidationErrors(
      exceptionResponse.message,
    );

    const errorResponse: ValidationErrorResponse = {
      ok: false,
      statusCode: status,
      message: EXCEPTION_VALIDATION_DEFAULT_DETAIL_MESSAGE,
      error: DEFAULT_BAD_REQUEST,
      code: ExceptionAppCodes.EXCEPTION_VALIDATION_CODE,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id'] as string,
      validationErrors,
    };

    this.logger.warn(
      `Validation error on ${request.method} ${request.url}`,
      JSON.stringify(validationErrors),
    );

    response.status(status).json(errorResponse);
  }
}
