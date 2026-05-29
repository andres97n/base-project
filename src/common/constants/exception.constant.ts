export const DEFAULT_EXCEPTION_MESSAGE =
  'Internal server error, please contact support.';

export const DEFAULT_BAD_REQUEST = 'Bad Request';

export const EXCEPTION_VALIDATION_DEFAULT_MESSAGE = 'Validation failed';

export const EXCEPTION_VALIDATION_DEFAULT_DETAIL_MESSAGE =
  'Request with validations issues';

export const EXCEPTION_UNAUTHORIZED_DEFAULT_MESSAGE = 'Not Authorized';

export const EXCEPTION_FORBIDDEN_DEFAULT_MESSAGE = 'Access Denied';

export const EXCEPTION_DATABASE_DEFAULT_MESSAGE = 'Operational database error';

export const EXCEPTION_CONFLICT_DEFAULT_MESSAGE = 'Resource already exists.';

export const EXCEPTION_INTERNAL_SERVER_DEFAULT_MESSAGE =
  'Internal server error, please contact support.';

export const EXCEPTION_BAD_GATEWAY_DEFAULT_MESSAGE =
  'Invalid response received from an upstream service.';

export const EXCEPTION_SERVICE_UNAVAILABLE_DEFAULT_MESSAGE =
  'An upstream service is currently unavailable, please try again later.';

export const SENSITIVE_VALIDATION_FIELDS = [
  'password',
  'confirmPassword',
  'currentPassword',
  'refreshToken',
  'token',
] as const;
