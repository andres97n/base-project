import { Injectable, Logger } from '@nestjs/common';
import {
  DeepPartial,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository,
} from 'typeorm';

import { DEFAULT_NOT_FOUND_MESSAGE } from '../constants';
import { ResourceNotFoundException } from '../exceptions';
import {
  BasePostgresRepositoryInterface,
  CursorPaginatedResult,
  PaginatedResult,
} from '../interfaces';
import { BaseEntityStates } from '../enums';
import { BasePostgresEntity } from '../entities';
import { AuditContextService } from '../services';
import { CursorPaginationDto } from '../dto';
import { decodeCursor, encodeCursor } from '../utils';

@Injectable()
export abstract class BasePostgresRepository<
  T extends BasePostgresEntity,
> implements BasePostgresRepositoryInterface<T> {
  protected readonly logger: Logger;

  protected constructor(
    protected readonly repository: Repository<T>,
    protected readonly auditContext?: AuditContextService,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const userId = this.auditContext?.getUserId() ?? undefined;
    const auditData = userId ? { createdBy: userId, updatedBy: userId } : {};
    const entity = this.repository.create({
      ...data,
      ...auditData,
    } as DeepPartial<T>);
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
    };

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
    };

    const defaultOrder = { createdAt: 'DESC' } as FindOptionsOrder<T>;

    const [data, total] = await this.repository.findAndCount({
      ...options,
      where,
      order: options.order ?? defaultOrder,
      skip,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllCursor(
    filter: FindOptionsWhere<T> = {} as FindOptionsWhere<T>,
    cursorOpts: CursorPaginationDto = new CursorPaginationDto(),
    options: FindManyOptions<T> = {},
  ): Promise<CursorPaginatedResult<T>> {
    const { cursor, limit, sortField, sortOrder } = cursorOpts;
    const alias = 'entity';
    const op = sortOrder === 'asc' ? '>' : '<';
    const sortDir = sortOrder.toUpperCase() as 'ASC' | 'DESC';

    const qb = this.repository.createQueryBuilder(alias);

    const where = {
      ...((options.where as object) ?? {}),
      ...(filter as object),
    } as Record<string, unknown>;

    Object.entries(where).forEach(([key, value]) => {
      qb.andWhere(`${alias}.${key} = :${key}`, { [key]: value });
    });

    if (cursor) {
      const { value, id } = decodeCursor(cursor);
      qb.andWhere(
        `(${alias}.${sortField} ${op} :cursorValue OR (${alias}.${sortField} = :cursorValue AND ${alias}.id ${op} :cursorId))`,
        { cursorValue: value, cursorId: id },
      );
    }

    qb.orderBy(`${alias}.${sortField}`, sortDir)
      .addOrderBy(`${alias}.id`, sortDir)
      .take(limit + 1);

    const data = await qb.getMany();

    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;
    const lastItem = items[items.length - 1];

    const nextCursor =
      hasMore && lastItem
        ? encodeCursor({
            value: (lastItem as Record<string, unknown>)[sortField],
            id: lastItem.id,
          })
        : null;

    return { data: items, nextCursor, hasMore, limit };
  }

  async updateById(
    id: string,
    data: DeepPartial<T>,
    options: FindOneOptions<T> = {},
  ): Promise<T> {
    const userId = this.auditContext?.getUserId() ?? undefined;
    const auditData = userId ? { updatedBy: userId } : {};
    const record = await this.findById(id, options);
    const merged = this.repository.merge(record, {
      ...data,
      ...auditData,
    } as DeepPartial<T>);
    return this.repository.save(merged);
  }

  async update(
    filter: FindOptionsWhere<T>,
    data: DeepPartial<T>,
    options: FindOneOptions<T> = {},
  ): Promise<T> {
    const userId = this.auditContext?.getUserId() ?? undefined;
    const auditData = userId ? { updatedBy: userId } : {};
    const record = await this.findOne(filter, options);
    const merged = this.repository.merge(record, {
      ...data,
      ...auditData,
    } as DeepPartial<T>);
    return this.repository.save(merged);
  }

  async removeById(id: string): Promise<boolean> {
    const userId = this.auditContext?.getUserId() ?? undefined;
    const auditData = userId ? { updatedBy: userId } : {};
    const record = await this.findById(id);
    const merged = this.repository.merge(record, {
      state: BaseEntityStates.DELETED,
      ...auditData,
    } as DeepPartial<T>);
    const saved = await this.repository.save(merged);
    return saved.state === BaseEntityStates.DELETED;
  }

  async remove(filter: FindOptionsWhere<T>): Promise<boolean> {
    const userId = this.auditContext?.getUserId() ?? undefined;
    const auditData = userId ? { updatedBy: userId } : {};
    const record = await this.findOne(filter);
    const merged = this.repository.merge(record, {
      state: BaseEntityStates.DELETED,
      ...auditData,
    } as DeepPartial<T>);
    const saved = await this.repository.save(merged);
    return saved.state === BaseEntityStates.DELETED;
  }

  async withTransaction<R>(
    fn: (manager: EntityManager) => Promise<R>,
  ): Promise<R> {
    return this.repository.manager.transaction(fn);
  }

  private validateNotFoundRecord(
    record: T | null | undefined,
    errorMessage: string = DEFAULT_NOT_FOUND_MESSAGE,
    id: string = '-',
  ): void {
    if (!record) throw new ResourceNotFoundException(errorMessage, id);
  }
}
