import { HttpStatus } from '@nestjs/common';

import { AppException } from '../index';
import { EXCEPTION_VALIDATION_CODE, EXCEPTION_VALIDATION_DEFAULT_MESSAGE } from 'src/common/constants';


export class ValidationException extends AppException {
  constructor(
    message: string = EXCEPTION_VALIDATION_DEFAULT_MESSAGE,
    details?: Record<string, any>,
  ) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      EXCEPTION_VALIDATION_CODE,
      details,
      true,
    );
  }
}