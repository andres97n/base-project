import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
} from 'typeorm';

import { BasePostgresEntity } from 'src/common/entities';
import { PaginatedResult } from './base-repository.interface';


export interface BasePostgresRepositoryInterface<T extends BasePostgresEntity> {
  create(data: DeepPartial<T>): Promise<T>;

  findById(
    id: string,
    options?: FindOneOptions<T>,
    errorMessage?: string,
  ): Promise<T>;

  findOne(
    filter: FindOptionsWhere<T>,
    options?: FindOneOptions<T>,
    errorMessage?: string,
  ): Promise<T>;

  findAll(
    filter?: FindOptionsWhere<T>,
    page?: number,
    limit?: number,
    options?: FindManyOptions<T>,
  ): Promise<PaginatedResult<T>>;

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
}
