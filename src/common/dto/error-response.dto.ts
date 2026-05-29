import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Canonical error envelope produced by the global exception filters.
 * Mirrors `ErrorResponse` from src/common/interfaces.
 */
export class ErrorResponseDto {
  @ApiProperty({
    example: false,
    description: 'Always false for error responses.',
  })
  ok: boolean;

  @ApiProperty({ example: 404, description: 'HTTP status code.' })
  statusCode: number;

  @ApiProperty({
    example: 'Resource not found',
    description: 'Human-readable message.',
  })
  message: string;

  @ApiProperty({ example: 'Not Found', description: 'Short error label.' })
  error: string;

  @ApiProperty({
    example: 'NOT_FOUND_ERROR',
    description: 'Application-specific error code.',
  })
  code: string;

  @ApiProperty({
    example: '2026-05-29T12:00:00.000Z',
    description: 'ISO timestamp.',
  })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/users/123', description: 'Request path.' })
  path: string;

  @ApiProperty({ example: 'GET', description: 'HTTP method.' })
  method: string;

  @ApiProperty({
    example: '3f1a9c2e-7b8d-4c6a-9e0f-1a2b3c4d5e6f',
    description: 'Correlation id echoed from the X-Request-ID header.',
    required: false,
  })
  requestId?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Optional contextual details about the error.',
  })
  details?: Record<string, unknown>;
}

/**
 * A single field-level validation failure.
 * Mirrors `ValidationError` from src/common/interfaces.
 */
export class ValidationErrorItemDto {
  @ApiProperty({
    example: 'email',
    description: 'Name of the field that failed validation.',
  })
  field: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { isEmail: 'email must be an email' },
    description: 'Map of failed constraints to their messages.',
  })
  constraints: Record<string, string>;

  @ApiPropertyOptional({ description: 'The rejected value.' })
  value?: unknown;
}

/**
 * Validation error envelope (HTTP 422).
 * Mirrors `ValidationErrorResponse` from src/common/interfaces.
 */
export class ValidationErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    type: [ValidationErrorItemDto],
    description: 'List of field-level validation failures.',
  })
  validationErrors: ValidationErrorItemDto[];
}
