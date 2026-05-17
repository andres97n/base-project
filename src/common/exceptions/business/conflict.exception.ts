import { HttpStatus } from '@nestjs/common';

import { AppException } from '../index';
import { EXCEPTION_CONFLICT_DEFAULT_MESSAGE } from 'src/common/constants';
import { ExceptionAppCodes } from 'src/common/enums';


export class ConflictException extends AppException {
  constructor(
    message: string = EXCEPTION_CONFLICT_DEFAULT_MESSAGE,
    details?: Record<string, any>,
  ) {
    super(message, HttpStatus.CONFLICT, ExceptionAppCodes.EXCEPTION_CONFLICT_ERROR, details, true);
  }
}
