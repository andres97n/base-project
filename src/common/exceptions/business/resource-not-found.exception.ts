import { HttpStatus } from '@nestjs/common';

import { AppException } from '../index';
import { ExceptionAppCodes } from 'src/common/enums';

export class ResourceNotFoundException extends AppException {
  constructor(
    resourceType: string,
    identifier: string | number,
    details?: Record<string, any>,
  ) {
    super(
      `${resourceType} with identifier "${identifier}" not found`,
      HttpStatus.NOT_FOUND,
      ExceptionAppCodes.EXCEPTION_RESOURCE_NOT_FOUND_CODE,
      { resourceType, identifier, ...details },
      true,
    );
  }
}
