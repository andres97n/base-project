import { Injectable, Logger } from '@nestjs/common';
import {
  DeepPartial,
  EntityManager,
  FindOneOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  Not,
  Repository,
} from 'typeorm';

import { DEFAULT_NOT_FOUND_MESSAGE } from '../constants';
import { ResourceNotFoundException, ValidationException } from '../exceptions';
import {
  BasePostgresRepositoryInterface,
  CursorPaginatedResult,
  FindManyOptionsWithDeleted,
  FindOneOptionsWithDeleted,
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
    options: FindOneOptionsWithDeleted<T> = {},
    errorMessage: string = DEFAULT_NOT_FOUND_MESSAGE,
  ): Promise<T> {
    const { includeDeleted, ...restOptions } = options;
    const where = this.withNotDeleted(
      {
        ...((restOptions.where as object) ?? {}),
        id,
      } as FindOptionsWhere<T>,
      includeDeleted,
    );

    const record = await this.repository.findOne({ ...restOptions, where });

    this.validateNotFoundRecord(record, errorMessage, id);
    return record as T;
  }

  async findOne(
    filter: FindOptionsWhere<T>,
    options: FindOneOptionsWithDeleted<T> = {},
    errorMessage: string = DEFAULT_NOT_FOUND_MESSAGE,
  ): Promise<T> {
    const { includeDeleted, ...restOptions } = options;
    const where = this.withNotDeleted(
      {
        ...((restOptions.where as object) ?? {}),
        ...filter,
      },
      includeDeleted,
    );

    const record = await this.repository.findOne({ ...restOptions, where });

    this.validateNotFoundRecord(record, errorMessage);
    return record as T;
  }

  async findAll(
    filter: FindOptionsWhere<T> = {} as FindOptionsWhere<T>,
    page = 1,
    limit = 10,
    options: FindManyOptionsWithDeleted<T> = {},
  ): Promise<PaginatedResult<T>> {
    const { includeDeleted, ...restOptions } = options;
    const skip = (page - 1) * limit;

    const where = this.withNotDeleted(
      {
        ...((restOptions.where as object) ?? {}),
        ...filter,
      },
      includeDeleted,
    );

    const defaultOrder = { createdAt: 'DESC' } as FindOptionsOrder<T>;

    const [data, total] = await this.repository.findAndCount({
      ...restOptions,
      where,
      order: restOptions.order ?? defaultOrder,
      skip,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllCursor(
    filter: FindOptionsWhere<T> = {} as FindOptionsWhere<T>,
    cursorOpts: CursorPaginationDto = new CursorPaginationDto(),
    options: FindManyOptionsWithDeleted<T> = {},
  ): Promise<CursorPaginatedResult<T>> {
    const { includeDeleted, ...restOptions } = options;
    const { cursor, limit, sortField, sortOrder } = cursorOpts;
    const alias = 'entity';
    const op = sortOrder === 'asc' ? '>' : '<';
    const sortDir = sortOrder.toUpperCase() as 'ASC' | 'DESC';

    this.assertValidColumn(sortField);

    const qb = this.repository.createQueryBuilder(alias);

    const where = {
      ...((restOptions.where as object) ?? {}),
      ...(filter as object),
    } as Record<string, unknown>;

    Object.entries(where).forEach(([key, value]) => {
      this.assertValidColumn(key);
      qb.andWhere(`${alias}.${key} = :${key}`, { [key]: value });
    });

    if (!includeDeleted) {
      qb.andWhere(`${alias}.state != :notDeletedState`, {
        notDeletedState: BaseEntityStates.DELETED,
      });
    }

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

  protected withNotDeleted(
    where: FindOptionsWhere<T> = {} as FindOptionsWhere<T>,
    includeDeleted = false,
  ): FindOptionsWhere<T> {
    if (includeDeleted) return where;

    return {
      ...where,
      state: Not(BaseEntityStates.DELETED),
    } as FindOptionsWhere<T>;
  }

  protected assertValidColumn(column: string): void {
    const validColumns = this.repository.metadata.columns.map(
      (c) => c.propertyName,
    );
    if (!validColumns.includes(column)) {
      throw new ValidationException(`Invalid sort/filter field: ${column}`);
    }
  }

  private validateNotFoundRecord(
    record: T | null | undefined,
    errorMessage: string = DEFAULT_NOT_FOUND_MESSAGE,
    id: string = '-',
  ): void {
    if (!record) throw new ResourceNotFoundException(errorMessage, id);
  }
}
