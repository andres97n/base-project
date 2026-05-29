import { HttpStatus } from '@nestjs/common';

import { AppException } from '../index';
import { EXCEPTION_SERVICE_UNAVAILABLE_DEFAULT_MESSAGE } from 'src/common/constants';
import { ExceptionAppCodes } from 'src/common/enums';

export class ServiceUnavailableException extends AppException {
  constructor(
    message: string = EXCEPTION_SERVICE_UNAVAILABLE_DEFAULT_MESSAGE,
    details?: Record<string, any>,
  ) {
    super(
      message,
      HttpStatus.SERVICE_UNAVAILABLE,
      ExceptionAppCodes.EXCEPTION_SERVICE_UNAVAILABLE_ERROR,
      details,
      true,
    );
  }
}
