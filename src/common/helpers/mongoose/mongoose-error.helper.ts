import { HttpStatus } from "@nestjs/common";

import { ExceptionAppCodes } from "src/common/enums";
import { ErrorResponseHelper } from "src/common/interfaces";
import { EXCEPTION_DATABASE_DEFAULT_MESSAGE } from "src/common/constants";


export const getMongoResponseDefaultError = (
  exception: any
): ErrorResponseHelper => ({
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  code: ExceptionAppCodes.EXCEPTION_MONGODB_CODE,
  message: EXCEPTION_DATABASE_DEFAULT_MESSAGE,
  details: {
    mongoCode: exception.code,
    mongoMessage: exception.message,
  },
});