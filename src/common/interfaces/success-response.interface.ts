import { PaginatedResult } from './index';


export interface SuccessMeta {
  total?: number;
  page?: number;
  limit?: number;
  // [key: string]: any;
}

export interface SuccessResponse<T = any> {
  ok: true;
  statusCode: number;
  message: string;
  data: T | PaginatedResult<T>;
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
  meta?: SuccessMeta;
}