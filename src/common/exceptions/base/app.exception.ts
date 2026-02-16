import { HttpException, HttpStatus } from '@nestjs/common';

import { EXCEPTION_DEFAULT_CODE } from 'src/common/constants';


/**
 * Excepción base personalizada para toda la aplicación
 * Proporciona estructura consistente para todos los errores de negocio
 */
export class AppException extends HttpException {
  public readonly code: string;
  public readonly timestamp: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    code: string = EXCEPTION_DEFAULT_CODE,
    details?: Record<string, any>,
    isOperational: boolean = true,
  ) {
    super(message, statusCode);
    
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}
