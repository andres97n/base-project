import { HttpStatus } from '@nestjs/common';

import { AppException } from '../index';
import { EXCEPTION_BAD_GATEWAY_DEFAULT_MESSAGE } from 'src/common/constants';
import { ExceptionAppCodes } from 'src/common/enums';

export class BadGatewayException extends AppException {
  constructor(
    message: string = EXCEPTION_BAD_GATEWAY_DEFAULT_MESSAGE,
    details?: Record<string, any>,
  ) {
    super(
      message,
      HttpStatus.BAD_GATEWAY,
      ExceptionAppCodes.EXCEPTION_BAD_GATEWAY_ERROR,
      details,
      true,
    );
  }
}
