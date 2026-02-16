import { HttpStatus } from '@nestjs/common';

import { AppException } from '../index';
import { EXCEPTION_UNAUTHORIZED_CODE, EXCEPTION_UNAUTHORIZED_DEFAULT_MESSAGE } from 'src/common/constants';


export class UnauthorizedException extends AppException {
  constructor(
    message: string = EXCEPTION_UNAUTHORIZED_DEFAULT_MESSAGE,
    details?: Record<string, any>,
  ) {
    super(
      message,
      HttpStatus.UNAUTHORIZED,
      EXCEPTION_UNAUTHORIZED_CODE,
      details,
      true,
    );
  }
}