import { HttpStatus } from '@nestjs/common';

import { AppException } from '../index';
import { EXCEPTION_FORBIDDEN_DEFAULT_MESSAGE } from 'src/common/constants';
import { ExceptionAppCodes } from 'src/common/enums';

export class ForbiddenException extends AppException {
  constructor(
    message: string = EXCEPTION_FORBIDDEN_DEFAULT_MESSAGE,
    details?: Record<string, any>,
  ) {
    super(
      message,
      HttpStatus.FORBIDDEN,
      ExceptionAppCodes.EXCEPTION_FORBIDDEN_CODE,
      details,
      true,
    );
  }
}
