import { EXCEPTION_HTTP_CODE } from "../constants";
import { HttpExceptionCode } from "../enums";
import { ValidationError } from "../interfaces";


export const getHttpExceptionCode = (status: number): string => {
  if (Object.values(HttpExceptionCode).includes(status)) return HttpExceptionCode[status];

  return EXCEPTION_HTTP_CODE;
}

export const formatValidationErrors = (errors: any[]): ValidationError[] => {
  return errors.map((error) => ({
    field: error.property,
    constraints: error.constraints || {},
    value: error.value,
  }));
}