import { AxiosError, AxiosHeaders } from 'axios';

import {
  BadGatewayException,
  ConflictException,
  ForbiddenException,
  InternalServerException,
  ResourceNotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  ValidationException,
} from 'src/common/exceptions';
import { ExceptionAppCodes } from 'src/common/enums';
import { mapAxiosError } from './axios-error.mapper';

function buildAxiosError(status?: number, data?: unknown): AxiosError {
  const config = {
    url: 'https://api.example.com/resource/1',
    method: 'get',
    headers: new AxiosHeaders(),
  };

  const error = new AxiosError(
    `Request failed with status code ${status ?? 'n/a'}`,
    status ? `ERR_BAD_RESPONSE` : 'ECONNABORTED',
    config as AxiosError['config'],
    {},
  );

  if (status !== undefined) {
    error.response = {
      status,
      statusText: '',
      data,
      headers: {},
      config: config as NonNullable<AxiosError['config']>,
    };
  }

  return error;
}

describe('mapAxiosError', () => {
  it('maps a no-response (network/timeout) error to ServiceUnavailableException', () => {
    const result = mapAxiosError(buildAxiosError(undefined));

    expect(result).toBeInstanceOf(ServiceUnavailableException);
    expect(result.code).toBe(
      ExceptionAppCodes.EXCEPTION_SERVICE_UNAVAILABLE_ERROR,
    );
  });

  // [upstreamStatus, ExpectedException, expectedCode, mappedClientStatus]
  // Note: mapped status may intentionally differ from upstream (e.g. 422 -> 400
  // ValidationException, 504 -> 503 ServiceUnavailableException).
  it.each([
    [
      400,
      ValidationException,
      ExceptionAppCodes.EXCEPTION_VALIDATION_CODE,
      400,
    ],
    [
      401,
      UnauthorizedException,
      ExceptionAppCodes.EXCEPTION_UNAUTHORIZED_CODE,
      401,
    ],
    [403, ForbiddenException, ExceptionAppCodes.EXCEPTION_FORBIDDEN_CODE, 403],
    [
      404,
      ResourceNotFoundException,
      ExceptionAppCodes.EXCEPTION_RESOURCE_NOT_FOUND_CODE,
      404,
    ],
    [409, ConflictException, ExceptionAppCodes.EXCEPTION_CONFLICT_ERROR, 409],
    [
      422,
      ValidationException,
      ExceptionAppCodes.EXCEPTION_VALIDATION_CODE,
      400,
    ],
    [
      502,
      BadGatewayException,
      ExceptionAppCodes.EXCEPTION_BAD_GATEWAY_ERROR,
      502,
    ],
    [
      503,
      ServiceUnavailableException,
      ExceptionAppCodes.EXCEPTION_SERVICE_UNAVAILABLE_ERROR,
      503,
    ],
    [
      504,
      ServiceUnavailableException,
      ExceptionAppCodes.EXCEPTION_SERVICE_UNAVAILABLE_ERROR,
      503,
    ],
    [
      500,
      InternalServerException,
      ExceptionAppCodes.EXCEPTION_INTERNAL_SERVER_ERROR_ERROR,
      500,
    ],
  ])(
    'maps upstream HTTP %s to the expected domain exception',
    (status, ExpectedException, expectedCode, mappedStatus) => {
      const result = mapAxiosError(
        buildAxiosError(status, { message: 'fail' }),
      );

      expect(result).toBeInstanceOf(ExpectedException);
      expect(result.code).toBe(expectedCode);
      expect(result.getStatus()).toBe(mappedStatus);
    },
  );

  it('extracts the upstream message from the response body', () => {
    const result = mapAxiosError(
      buildAxiosError(400, { message: 'Invalid payload' }),
    );

    expect(result.message).toBe('Invalid payload');
  });

  it('includes safe upstream diagnostics in details', () => {
    const result = mapAxiosError(buildAxiosError(409, { message: 'dup' }));

    expect(result.details).toMatchObject({
      upstreamStatus: 409,
      method: 'GET',
      url: 'https://api.example.com/resource/1',
    });
  });

  it('passes an existing AppException through unchanged', () => {
    const original = new ConflictException('already there');
    expect(mapAxiosError(original)).toBe(original);
  });

  it('maps an unknown non-Axios error to InternalServerException', () => {
    const result = mapAxiosError(new Error('boom'));

    expect(result).toBeInstanceOf(InternalServerException);
    expect(result.message).toBe('boom');
  });
});
