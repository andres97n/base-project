import { HttpStatus } from '@nestjs/common';

import { AppException } from '../index';
import { EXCEPTION_FORBIDDEN_CODE, EXCEPTION_FORBIDDEN_DEFAULT_MESSAGE } from 'src/common/constants';


export class ForbiddenException extends AppException {
  constructor(
    message: string = EXCEPTION_FORBIDDEN_DEFAULT_MESSAGE,
    details?: Record<string, any>,
  ) {
    super(
      message,
      HttpStatus.FORBIDDEN,
      EXCEPTION_FORBIDDEN_CODE,
      details,
      true,
    );
  }
}