import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';

import { ResponseInterceptor } from './response.interceptor';
import { SuccessResponse } from '../interfaces';

describe('ResponseInterceptor', () => {
  let reflector: Reflector;
  let interceptor: ResponseInterceptor<unknown>;

  const buildContext = (): ExecutionContext =>
    ({
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getResponse: () => ({ statusCode: 200 }),
        getRequest: () => ({
          url: '/api/v1/example',
          method: 'GET',
          headers: { 'x-request-id': 'req-1' },
        }),
      }),
    }) as unknown as ExecutionContext;

  const buildHandler = (data: unknown): CallHandler => ({
    handle: () => of(data),
  });

  beforeEach(() => {
    reflector = new Reflector();
    interceptor = new ResponseInterceptor(reflector);
  });

  it('wraps successful payloads in the standard envelope', (done) => {
    jest.spyOn(reflector, 'get').mockReturnValue(false);

    interceptor
      .intercept(buildContext(), buildHandler({ id: 1 }))
      .subscribe((result) => {
        const response = result as SuccessResponse<{ id: number }>;
        expect(response.ok).toBe(true);
        expect(response.statusCode).toBe(200);
        expect(response.data).toEqual({ id: 1 });
        expect(response.path).toBe('/api/v1/example');
        expect(response.method).toBe('GET');
        expect(response.requestId).toBe('req-1');
        done();
      });
  });

  it('passes the payload through unwrapped when @RawResponse() is present', (done) => {
    jest.spyOn(reflector, 'get').mockReturnValue(true);

    interceptor
      .intercept(buildContext(), buildHandler({ id: 1 }))
      .subscribe((result) => {
        expect(result).toEqual({ id: 1 });
        done();
      });
  });
});
