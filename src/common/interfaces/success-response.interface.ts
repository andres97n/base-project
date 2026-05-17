export interface SuccessMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface SuccessResponse<T = any> {
  ok: true;
  statusCode: number;
  message: string;
  data: T | T[];
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
  meta?: SuccessMeta;
}