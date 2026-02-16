import { HttpStatus } from '@nestjs/common';

import { EXCEPTION_RESOURCE_NOT_FOUND_CODE } from 'src/common/constants';
import { AppException } from '../index';


export class ResourceNotFoundException extends AppException {
  constructor(
    resourceType: string,
    identifier: string | number,
    details?: Record<string, any>,
  ) {
    super(
      `${resourceType} with identifier "${identifier}" not found`,
      HttpStatus.NOT_FOUND,
      EXCEPTION_RESOURCE_NOT_FOUND_CODE,
      { resourceType, identifier, ...details },
      true,
    );
  }
}