import { Injectable, Logger } from '@nestjs/common';
import {
  ClientSession,
  FlattenMaps,
  Model,
  QueryFilter,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';

import { DEFAULT_NOT_FOUND_MESSAGE } from '../constants';
import { ResourceNotFoundException } from '../exceptions';
import {
  BaseRepositoryInterface,
  CursorPaginatedResult,
  PaginatedResult,
} from '../interfaces';
import { BaseEntityStates } from '../enums';
import { BaseSchema } from '../entities';
import { decodeCursor, encodeCursor, getResultWithVirtualId } from '../utils';
import { AuditContextService } from '../services';
import { CursorPaginationDto } from '../dto';

@Injectable()
export abstract class BaseRepository<
  T extends BaseSchema,
> implements BaseRepositoryInterface<T> {
  protected readonly logger: Logger;

  protected constructor(
    protected readonly model: Model<T>,
    protected readonly auditContext?: AuditContextService,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  async create(data: Partial<T>): Promise<FlattenMaps<T>> {
    const userId = this.auditContext?.getUserId() ?? undefined;
    const auditData = userId ? { createdBy: userId, updatedBy: userId } : {};
    const record = (
      await this.model.create({ ...data, ...auditData })
    ).toObject() as FlattenMaps<T>;
    return getResultWithVirtualId(record);
  }

  async findById(
    id: string,
    options: QueryOptions = {},
    errorMessage: string = DEFAULT_NOT_FOUND_MESSAGE,
  ): Promise<FlattenMaps<T>> {
    const record = await this.model.findById(id, null, options).lean().exec();

    this.validateNotFoundRecord(record as FlattenMaps<T>, errorMessage, id);

    return getResultWithVirtualId(record as FlattenMaps<T>);
  }

  async findOne(
    filter: QueryFilter<T>,
    options: QueryOptions = {},
    errorMessage: string = DEFAULT_NOT_FOUND_MESSAGE,
  ): Promise<FlattenMaps<T>> {
    const record = await this.model
      .findOne(filter, null, options)
      .lean()
      .exec();

    this.validateNotFoundRecord(record as FlattenMaps<T>, errorMessage);

    return getResultWithVirtualId(record as FlattenMaps<T>);
  }

  async findAll(
    filter: QueryFilter<T> = {},
    page = 1,
    limit = 10,
    options: QueryOptions = {},
  ): Promise<PaginatedResult<FlattenMaps<T>>> {
    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
      this.model.countDocuments(filter).exec(),
      this.model
        .find(filter, null, {
          ...options,
          sort: options.sort || { createdAt: -1 },
          skip,
          limit,
        })
        .lean()
        .exec(),
    ]);

    return {
      data: (data as FlattenMaps<T>[]).map(getResultWithVirtualId),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllCursor(
    filter: QueryFilter<T> = {},
    cursorOpts: CursorPaginationDto = new CursorPaginationDto(),
    options: QueryOptions = {},
  ): Promise<CursorPaginatedResult<FlattenMaps<T>>> {
    const { cursor, limit, sortField, sortOrder } = cursorOpts;
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const op = sortOrder === 'asc' ? '$gt' : '$lt';

    const cursorFilter: Record<string, unknown> = {};
    if (cursor) {
      const { value, id } = decodeCursor(cursor);
      cursorFilter['$or'] = [
        { [sortField]: { [op]: value } },
        { [sortField]: value, _id: { [op]: id } },
      ];
    }

    const combinedFilter = { ...filter, ...cursorFilter } as QueryFilter<T>;

    const data = await this.model
      .find(combinedFilter, null, {
        ...options,
        sort: { [sortField]: sortDir, _id: sortDir },
        limit: limit + 1,
      })
      .lean()
      .exec();

    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;
    const lastItem = items[items.length - 1];

    const lastItemAny = lastItem as unknown as Record<string, unknown>;
    const nextCursor =
      hasMore && lastItem
        ? encodeCursor({
            value: lastItemAny[sortField],
            id: String(lastItemAny['_id']),
          })
        : null;

    return {
      data: (items as FlattenMaps<T>[]).map(getResultWithVirtualId),
      nextCursor,
      hasMore,
      limit,
    };
  }

  async updateById(
    id: string,
    data: UpdateQuery<T>,
    options: QueryOptions = {},
  ): Promise<FlattenMaps<T>> {
    const userId = this.auditContext?.getUserId() ?? undefined;
    const auditData = userId ? { updatedBy: userId } : {};
    const recordUpdated = await this.model
      .findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date(), ...auditData },
        { ...options, new: true },
      )
      .lean()
      .exec();

    this.validateNotFoundRecord(recordUpdated as FlattenMaps<T>);
    return getResultWithVirtualId(recordUpdated as FlattenMaps<T>);
  }

  async update(
    filter: QueryFilter<T>,
    data: UpdateQuery<T>,
    options: QueryOptions = {},
  ): Promise<FlattenMaps<T>> {
    const userId = this.auditContext?.getUserId() ?? undefined;
    const auditData = userId ? { updatedBy: userId } : {};
    const recordUpdated = await this.model
      .findOneAndUpdate(
        filter,
        { ...data, updatedAt: new Date(), ...auditData },
        { ...options, new: true },
      )
      .lean()
      .exec();

    this.validateNotFoundRecord(recordUpdated as FlattenMaps<T>);
    return getResultWithVirtualId(recordUpdated as FlattenMaps<T>);
  }

  async remove(filter: QueryFilter<T>): Promise<boolean> {
    const userId = this.auditContext?.getUserId() ?? undefined;
    const auditData = userId ? { updatedBy: userId } : {};
    const recordDeleted = await this.model
      .findOneAndUpdate(
        filter,
        {
          state: BaseEntityStates.DELETED,
          updatedAt: new Date(),
          ...auditData,
        },
        { new: true },
      )
      .lean()
      .exec();

    return this.getRemoveResponse(recordDeleted as FlattenMaps<T>);
  }

  async removeById(id: string): Promise<boolean> {
    const userId = this.auditContext?.getUserId() ?? undefined;
    const auditData = userId ? { updatedBy: userId } : {};
    const recordDeleted = await this.model
      .findByIdAndUpdate(
        id,
        {
          state: BaseEntityStates.DELETED,
          updatedAt: new Date(),
          ...auditData,
        },
        { new: true },
      )
      .lean()
      .exec();

    return this.getRemoveResponse(recordDeleted as FlattenMaps<T>);
  }

  async withTransaction<R>(
    fn: (session: ClientSession) => Promise<R>,
  ): Promise<R> {
    const session = await this.model.db.startSession();
    try {
      return await session.withTransaction(() => fn(session));
    } finally {
      await session.endSession();
    }
  }

  private getRemoveResponse(recordDeleted: FlattenMaps<T>) {
    this.validateNotFoundRecord(recordDeleted);

    if (!recordDeleted || !recordDeleted.state) return false;
    return recordDeleted.state === BaseEntityStates.DELETED;
  }

  private validateNotFoundRecord(
    record: FlattenMaps<T> | null,
    errorMessage: string = DEFAULT_NOT_FOUND_MESSAGE,
    id: string = '-',
  ): FlattenMaps<T> | void {
    if (!record) throw new ResourceNotFoundException(errorMessage, id);

    return record;
  }
}
