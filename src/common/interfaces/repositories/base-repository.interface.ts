import {
  ClientSession,
  FlattenMaps,
  QueryFilter,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';

import { BaseSchema } from 'src/common/entities';
import { CursorPaginationDto } from 'src/common/dto';
import { CursorPaginatedResult } from './cursor-paginated-result.interface';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type FindOptions = QueryOptions & { includeDeleted?: boolean };

export interface BaseRepositoryInterface<T extends BaseSchema> {
  create(data: Partial<T>): Promise<FlattenMaps<T>>;

  findById(
    id: string,
    options?: FindOptions,
    errorMessage?: string,
  ): Promise<FlattenMaps<T>>;

  findOne(
    filter: QueryFilter<T>,
    options?: FindOptions,
    errorMessage?: string,
  ): Promise<FlattenMaps<T>>;

  findAll(
    filter?: QueryFilter<T>,
    page?: number,
    limit?: number,
    options?: FindOptions,
  ): Promise<PaginatedResult<FlattenMaps<T>>>;

  findAllCursor(
    filter?: QueryFilter<T>,
    cursorOpts?: CursorPaginationDto,
    options?: FindOptions,
  ): Promise<CursorPaginatedResult<FlattenMaps<T>>>;

  update(
    filter: QueryFilter<T>,
    data: UpdateQuery<T>,
    options?: QueryOptions,
  ): Promise<FlattenMaps<T>>;

  updateById(
    id: string,
    data: UpdateQuery<T>,
    options?: QueryOptions,
  ): Promise<FlattenMaps<T>>;

  remove(filter: QueryFilter<T>): Promise<boolean>;

  removeById(id: string): Promise<boolean>;

  withTransaction<R>(fn: (session: ClientSession) => Promise<R>): Promise<R>;
}
