import { HttpStatus } from '@nestjs/common';

import { ExceptionAppCodes, UserSameFieldMessages } from 'src/common/enums';
import { ErrorResponseHelper } from 'src/common/interfaces';

export const getMongoResponseDuplicateKeyError = (
  exception: any,
): ErrorResponseHelper => {
  const field = Object.keys(exception.keyValue)[0];
  const value = exception.keyValue[field];

  return {
    status: HttpStatus.CONFLICT,
    code: ExceptionAppCodes.EXCEPTION_DUPLICATE_KEY_CODE,
    message: UserSameFieldMessages[field] ?? `${field} already exists`,
    details: {
      field,
      value,
      constraint: 'unique',
      // suggestion:
      //   field === 'email'
      //     ? 'Try login or restore your password'
      //     : 'Please set another email',
    },
  };
};
