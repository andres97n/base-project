import { HttpStatus } from '@nestjs/common';

import { AppException } from '../index';
import { EXCEPTION_INTERNAL_SERVER_DEFAULT_MESSAGE } from 'src/common/constants';
import { ExceptionAppCodes } from 'src/common/enums';

export class InternalServerException extends AppException {
  constructor(
    message: string = EXCEPTION_INTERNAL_SERVER_DEFAULT_MESSAGE,
    details?: Record<string, any>,
  ) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      ExceptionAppCodes.EXCEPTION_INTERNAL_SERVER_ERROR_ERROR,
      details,
      false,
    );
  }
}
