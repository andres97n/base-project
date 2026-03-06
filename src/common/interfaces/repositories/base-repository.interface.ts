import { FlattenMaps, QueryFilter, QueryOptions, UpdateQuery } from 'mongoose';

import { BaseSchema } from 'src/common/entities';


export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface BaseRepositoryInterface<T extends BaseSchema> {
  create(data: Partial<T>): Promise<FlattenMaps<T>>;

  findById(
    id: string,
    options?: QueryOptions,
    errorMessage?: string,
  ): Promise<FlattenMaps<T>>;

  findOne(
    filter: QueryFilter<T>,
    options?: QueryOptions,
    errorMessage?: string,
  ): Promise<FlattenMaps<T>>;
  
  findAll(
    filter?: QueryFilter<T>,
    page?: number,
    limit?: number,
    options?: QueryOptions,
  ): Promise<PaginatedResult<FlattenMaps<T>>>;

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

  remove(id: string): Promise<boolean>;
}