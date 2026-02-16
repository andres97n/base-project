import { HttpStatus } from '@nestjs/common';

import { AppException } from '../index';
import { EXCEPTION_UNAUTHORIZED_DEFAULT_MESSAGE } from 'src/common/constants';
import { ExceptionAppCodes } from 'src/common/enums';


export class UnauthorizedException extends AppException {
  constructor(
    message: string = EXCEPTION_UNAUTHORIZED_DEFAULT_MESSAGE,
    details?: Record<string, any>,
  ) {
    super(
      message,
      HttpStatus.UNAUTHORIZED,
      ExceptionAppCodes.EXCEPTION_UNHANDLED_CODE,
      details,
      true,
    );
  }
}