import {
  DeepPartial,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
} from 'typeorm';

import { BasePostgresEntity } from 'src/common/entities';
import { CursorPaginationDto } from 'src/common/dto';
import { PaginatedResult } from './base-repository.interface';
import { CursorPaginatedResult } from './cursor-paginated-result.interface';

export type FindOneOptionsWithDeleted<T> = FindOneOptions<T> & {
  includeDeleted?: boolean;
};

export type FindManyOptionsWithDeleted<T> = FindManyOptions<T> & {
  includeDeleted?: boolean;
};

export interface BasePostgresRepositoryInterface<T extends BasePostgresEntity> {
  create(data: DeepPartial<T>): Promise<T>;

  findById(
    id: string,
    options?: FindOneOptionsWithDeleted<T>,
    errorMessage?: string,
  ): Promise<T>;

  findOne(
    filter: FindOptionsWhere<T>,
    options?: FindOneOptionsWithDeleted<T>,
    errorMessage?: string,
  ): Promise<T>;

  findAll(
    filter?: FindOptionsWhere<T>,
    page?: number,
    limit?: number,
    options?: FindManyOptionsWithDeleted<T>,
  ): Promise<PaginatedResult<T>>;

  findAllCursor(
    filter?: FindOptionsWhere<T>,
    cursorOpts?: CursorPaginationDto,
    options?: FindManyOptionsWithDeleted<T>,
  ): Promise<CursorPaginatedResult<T>>;

  updateById(
    id: string,
    data: DeepPartial<T>,
    options?: FindOneOptions<T>,
  ): Promise<T>;

  update(
    filter: FindOptionsWhere<T>,
    data: DeepPartial<T>,
    options?: FindOneOptions<T>,
  ): Promise<T>;

  removeById(id: string): Promise<boolean>;

  remove(filter: FindOptionsWhere<T>): Promise<boolean>;

  withTransaction<R>(fn: (manager: EntityManager) => Promise<R>): Promise<R>;
}
