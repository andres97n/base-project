import { HttpStatus } from "@nestjs/common";

import { ExceptionAppCodes } from "../enums";
import { EXCEPTION_VALIDATION_DEFAULT_DETAIL_MESSAGE } from "../constants";
import { ErrorResponseHelper } from "../interfaces";


export const getResponseMongoValidationError = (
  exception: any
): ErrorResponseHelper => ({
  status: HttpStatus.BAD_REQUEST,
  code: ExceptionAppCodes.EXCEPTION_VALIDATION_CODE,
  message: EXCEPTION_VALIDATION_DEFAULT_DETAIL_MESSAGE,
  
  details: {
    fields: Object.keys(exception.errors).map((field) => ({
      field,
      message: exception.errors[field].message,
      kind: exception.errors[field].kind,
      value: exception.errors[field].value,
    })),
  }
})