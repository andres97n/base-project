import { ExceptionAppCodes, HttpExceptionCode } from "../enums";
import { ValidationError } from "../interfaces";


export const getHttpExceptionCode = (status: number): ExceptionAppCodes => {
  if (Object.values(HttpExceptionCode).includes(status)) 
    return ExceptionAppCodes[`EXCEPTION_${HttpExceptionCode[status]}`] ?? ExceptionAppCodes.EXCEPTION_HTTP_CODE;

  return ExceptionAppCodes.EXCEPTION_HTTP_CODE;
}

export const formatValidationErrors = (errors: any[]): ValidationError[] => {
  return errors.map((error) => ({
    field: error.property,
    constraints: error.constraints || {},
    value: error.value,
  }));
}