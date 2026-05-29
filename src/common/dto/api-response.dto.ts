import { ApiProperty } from '@nestjs/swagger';

/**
 * Canonical success envelope produced by `ResponseInterceptor`.
 * Mirrors `SuccessResponse<T>` from src/common/interfaces.
 *
 * The `data` payload is intentionally NOT declared here — it is supplied
 * per-endpoint by the `@ApiOkResponseWrapped(model)` helper decorator so the
 * documented schema reflects the real returned type.
 */
export class ApiResponseDto {
  @ApiProperty({
    example: true,
    description: 'Always true for success responses.',
  })
  ok: boolean;

  @ApiProperty({ example: 200, description: 'HTTP status code.' })
  statusCode: number;

  @ApiProperty({
    example: 'Request processed successfully',
    description: 'Human-readable message.',
  })
  message: string;

  @ApiProperty({
    example: '2026-05-29T12:00:00.000Z',
    description: 'ISO timestamp when the response was generated.',
  })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/users', description: 'Request path.' })
  path: string;

  @ApiProperty({ example: 'GET', description: 'HTTP method.' })
  method: string;

  @ApiProperty({
    example: '3f1a9c2e-7b8d-4c6a-9e0f-1a2b3c4d5e6f',
    description: 'Correlation id echoed from the X-Request-ID header.',
    required: false,
  })
  requestId?: string;
}
