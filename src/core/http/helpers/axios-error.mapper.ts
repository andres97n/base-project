import axios, { AxiosError } from 'axios';

import {
  AppException,
  BadGatewayException,
  ConflictException,
  ForbiddenException,
  InternalServerException,
  ResourceNotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  ValidationException,
} from 'src/common/exceptions';

const MAX_DETAIL_BODY_LENGTH = 2000;

/**
 * Extracts a human-readable message from an upstream error response,
 * falling back to the Axios error message.
 */
function extractMessage(error: AxiosError): string {
  const data = error.response?.data;

  if (data && typeof data === 'object') {
    const maybeMessage = (data as Record<string, unknown>).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage;
    }
  }

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  return error.message;
}

/**
 * Returns a safe, size-bounded representation of the upstream body for logging
 * and diagnostics. Never include request auth headers here.
 */
function trimBody(data: unknown): unknown {
  if (data === undefined || data === null) return undefined;

  if (typeof data === 'string') {
    return data.length > MAX_DETAIL_BODY_LENGTH
      ? data.slice(0, MAX_DETAIL_BODY_LENGTH)
      : data;
  }

  try {
    const json = JSON.stringify(data);
    if (json.length > MAX_DETAIL_BODY_LENGTH) {
      return {
        truncated: true,
        preview: json.slice(0, MAX_DETAIL_BODY_LENGTH),
      };
    }
    return data;
  } catch {
    return undefined;
  }
}

function buildDetails(error: AxiosError): Record<string, any> {
  const details: Record<string, any> = {
    url: error.config?.url,
    method: error.config?.method?.toUpperCase(),
    code: error.code,
  };

  if (error.response?.status !== undefined) {
    details.upstreamStatus = error.response.status;
  }

  const body = trimBody(error.response?.data);
  if (body !== undefined) {
    details.upstreamBody = body;
  }

  return details;
}

/**
 * Translates any error thrown by the Axios layer into a domain {@link AppException}.
 * Guarantees that no raw AxiosError ever escapes the HTTP client layer.
 */
export function mapAxiosError(error: unknown): AppException {
  if (error instanceof AppException) {
    return error;
  }

  if (!axios.isAxiosError(error)) {
    const message =
      error instanceof Error ? error.message : 'Unknown HTTP client error';
    return new InternalServerException(message);
  }

  const details = buildDetails(error);
  const message = extractMessage(error);

  // No response received: network error, timeout, DNS failure, etc.
  if (!error.response) {
    return new ServiceUnavailableException(message, details);
  }

  switch (error.response.status) {
    case 400:
      return new ValidationException(message, details);
    case 401:
      return new UnauthorizedException(message, details);
    case 403:
      return new ForbiddenException(message, details);
    case 404:
      return new ResourceNotFoundException(
        'External resource',
        error.config?.url ?? 'unknown',
        details,
      );
    case 409:
      return new ConflictException(message, details);
    case 422:
      return new ValidationException(message, details);
    case 502:
      return new BadGatewayException(message, details);
    case 503:
    case 504:
      return new ServiceUnavailableException(message, details);
    default:
      return new InternalServerException(message, details);
  }
}
