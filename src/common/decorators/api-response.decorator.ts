import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import type {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

import {
  ApiResponseDto,
  ErrorResponseDto,
  PaginationMetaDto,
  ValidationErrorResponseDto,
} from '../dto';

interface ApiOkResponseWrappedOptions {
  /** Document `data` as an array of `model`. */
  isArray?: boolean;
  /** Add the offset-pagination `meta` block (implies an array payload). */
  paginated?: boolean;
  /** Override the default 200 status (e.g. 201 for creation endpoints). */
  status?: HttpStatus;
  description?: string;
}

/**
 * Documents the real `ResponseInterceptor` success envelope for an endpoint,
 * wiring the given `model` into the `data` field in a single line.
 *
 * @example
 *   @ApiOkResponseWrapped(UserDto)
 *   @ApiOkResponseWrapped(UserDto, { paginated: true })
 */
export const ApiOkResponseWrapped = <TModel extends Type<unknown>>(
  model: TModel,
  options: ApiOkResponseWrappedOptions = {},
) => {
  const { isArray, paginated, status = HttpStatus.OK, description } = options;
  const asArray = isArray || paginated;

  const dataSchema: SchemaObject | ReferenceObject = asArray
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { $ref: getSchemaPath(model) };

  const extraProps: Record<string, SchemaObject | ReferenceObject> = {
    data: dataSchema,
  };
  if (paginated) {
    extraProps.meta = { $ref: getSchemaPath(PaginationMetaDto) };
  }

  return applyDecorators(
    ApiExtraModels(ApiResponseDto, PaginationMetaDto, model),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          { properties: extraProps },
        ],
      },
    }),
  );
};

/**
 * Attaches the common error envelopes thrown by the boilerplate's
 * `AppException` hierarchy + global validation pipe.
 */
export const ApiErrorResponses = () =>
  applyDecorators(
    ApiExtraModels(ErrorResponseDto, ValidationErrorResponseDto),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid credentials.',
      type: ErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description: 'Authenticated but not allowed to access the resource.',
      type: ErrorResponseDto,
    }),
    ApiNotFoundResponse({
      description: 'Resource not found.',
      type: ErrorResponseDto,
    }),
    ApiUnprocessableEntityResponse({
      description: 'Request body / query failed validation.',
      type: ValidationErrorResponseDto,
    }),
  );
