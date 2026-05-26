import { ErrorResponse, SuccessResponse } from './index';

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;
