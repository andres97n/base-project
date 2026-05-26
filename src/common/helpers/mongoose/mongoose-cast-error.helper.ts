import { HttpStatus } from '@nestjs/common';

import { ExceptionAppCodes } from 'src/common/enums';
import { ErrorResponseHelper } from 'src/common/interfaces';

export const getMongoResponseCastError = (
  exception: any,
): ErrorResponseHelper => ({
  status: HttpStatus.BAD_REQUEST,
  code: ExceptionAppCodes.EXCEPTION_INVALID_DATA_TYPE_CODE,
  message: `Invalid format for ${exception.path}`,
  details: {
    field: exception.path,
    value: exception.value,
    expectedType: exception.kind,
  },
});
