import { ExceptionAppCodes, HttpExceptionCode } from '../enums';
import { ValidationError } from '../interfaces';
import { SENSITIVE_VALIDATION_FIELDS } from '../constants';

export const getHttpExceptionCode = (status: number): ExceptionAppCodes => {
  if (Object.values(HttpExceptionCode).includes(status))
    return (
      ExceptionAppCodes[`EXCEPTION_${HttpExceptionCode[status]}`] ??
      ExceptionAppCodes.EXCEPTION_HTTP_CODE
    );

  return ExceptionAppCodes.EXCEPTION_HTTP_CODE;
};

const sensitiveFieldsSet = new Set<string>(SENSITIVE_VALIDATION_FIELDS);

export const formatValidationErrors = (errors: any[]): ValidationError[] => {
  return errors.map((error) => {
    const field = error.property;
    const isSensitive = sensitiveFieldsSet.has(field);
    const result: ValidationError = {
      field,
      constraints: error.constraints || {},
      ...(!isSensitive && Object.prototype.hasOwnProperty.call(error, 'value')
        ? { value: error.value }
        : {}),
    };

    return result;
  });
};
