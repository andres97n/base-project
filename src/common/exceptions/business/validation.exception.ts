import { HttpStatus } from '@nestjs/common';

import { AppException } from '../index';
import { EXCEPTION_VALIDATION_DEFAULT_MESSAGE } from 'src/common/constants';
import { ExceptionAppCodes } from 'src/common/enums';


export class ValidationException extends AppException {
  constructor(
    message: string = EXCEPTION_VALIDATION_DEFAULT_MESSAGE,
    details?: Record<string, any>,
  ) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      ExceptionAppCodes.EXCEPTION_VALIDATION_CODE,
      details,
      true,
    );
  }
}