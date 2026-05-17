import { Injectable, Logger } from '@nestjs/common';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository,
} from 'typeorm';

import { DEFAULT_NOT_FOUND_MESSAGE } from '../constants';
import { ResourceNotFoundException } from '../exceptions';
import { BasePostgresRepositoryInterface, PaginatedResult } from '../interfaces';
import { BaseEntityStates } from '../enums';
import { BasePostgresEntity } from '../entities';


@Injectable()
export abstract class BasePostgresRepository<T extends BasePostgresEntity>
  implements BasePostgresRepositoryInterface<T>
{
  protected readonly logger: Logger;

  protected constructor(protected readonly repository: Repository<T>) {
    this.logger = new Logger(this.constructor.name);
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findById(
    id: string,
    options: FindOneOptions<T> = {},
    errorMessage: string = DEFAULT_NOT_FOUND_MESSAGE,
  ): Promise<T> {
    const where = {
      ...((options.where as object) ?? {}),
      id,
    } as FindOptionsWhere<T>;

    const record = await this.repository.findOne({ ...options, where });

    this.validateNotFoundRecord(record, errorMessage, id);
    return record as T;
  }

  async findOne(
    filter: FindOptionsWhere<T>,
    options: FindOneOptions<T> = {},
    errorMessage: string = DEFAULT_NOT_FOUND_MESSAGE,
  ): Promise<T> {
    const where = {
      ...((options.where as object) ?? {}),
      ...filter,
    } as FindOptionsWhere<T>;

    const record = await this.repository.findOne({ ...options, where });

    this.validateNotFoundRecord(record, errorMessage);
    return record as T;
  }

  async findAll(
    filter: FindOptionsWhere<T> = {} as FindOptionsWhere<T>,
    page = 1,
    limit = 10,
    options: FindManyOptions<T> = {},
  ): Promise<PaginatedResult<T>> {
    const skip = (page - 1) * limit;

    const where = {
      ...((options.where as object) ?? {}),
      ...filter,
    } as FindOptionsWhere<T>;

    const defaultOrder = { createdAt: 'DESC' } as FindOptionsOrder<T>;

    const [data, total] = await this.repository.findAndCount({
      ...options,
      where,
      order: options.order ?? defaultOrder,
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async updateById(
    id: string,
    data: DeepPartial<T>,
    options: FindOneOptions<T> = {},
  ): Promise<T> {
    const record = await this.findById(id, options);
    const merged = this.repository.merge(record, data);
    return this.repository.save(merged);
  }

  async update(
    filter: FindOptionsWhere<T>,
    data: DeepPartial<T>,
    options: FindOneOptions<T> = {},
  ): Promise<T> {
    const record = await this.findOne(filter, options);
    const merged = this.repository.merge(record, data);
    return this.repository.save(merged);
  }

  async removeById(id: string): Promise<boolean> {
    const record = await this.findById(id);
    record.state = BaseEntityStates.DELETED;
    const saved = await this.repository.save(record);
    return saved.state === BaseEntityStates.DELETED;
  }

  async remove(filter: FindOptionsWhere<T>): Promise<boolean> {
    const record = await this.findOne(filter);
    record.state = BaseEntityStates.DELETED;
    const saved = await this.repository.save(record);
    return saved.state === BaseEntityStates.DELETED;
  }

  private validateNotFoundRecord(
    record: T | null | undefined,
    errorMessage: string = DEFAULT_NOT_FOUND_MESSAGE,
    id: string = '-',
  ): void {
    if (!record) throw new ResourceNotFoundException(errorMessage, id);
  }
}
