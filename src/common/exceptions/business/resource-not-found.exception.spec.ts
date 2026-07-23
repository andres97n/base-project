import { HttpStatus } from '@nestjs/common';

import { ResourceNotFoundException } from './resource-not-found.exception';
import { ExceptionAppCodes } from 'src/common/enums';

describe('ResourceNotFoundException', () => {
  it('sets a 404 status with the resource-not-found app code', () => {
    const exception = new ResourceNotFoundException('User', '123');

    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(exception.code).toBe(
      ExceptionAppCodes.EXCEPTION_RESOURCE_NOT_FOUND_CODE,
    );
    expect(exception.isOperational).toBe(true);
    expect(exception.message).toBe('User with identifier "123" not found');
  });

  it('merges extra details with resourceType and identifier', () => {
    const exception = new ResourceNotFoundException('User', '123', {
      reason: 'soft-deleted',
    });

    expect(exception.details).toEqual({
      resourceType: 'User',
      identifier: '123',
      reason: 'soft-deleted',
    });
  });
});
