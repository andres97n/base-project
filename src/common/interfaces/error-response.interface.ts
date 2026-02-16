import { ExceptionAppCodes } from "../enums";


export interface ErrorResponse {
  ok: boolean;
  statusCode: number;
  message: string;
  error: string;
  code: string;
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
  details?: Record<string, any>;
  stack?: string; // Only dev
}

export interface ValidationError {
  field: string;
  constraints: Record<string, string>;
  value?: any;
}

export interface ValidationErrorResponse extends ErrorResponse {
  validationErrors: ValidationError[];
}

export interface ErrorResponseHelper {
  status: number;
  code: ExceptionAppCodes;
  message: string;
  details?: Record<string, any>;
}