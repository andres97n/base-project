import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  FlattenMaps,
  Model,
  QueryFilter,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';

import { DEFAULT_NOT_FOUND_MESSAGE } from '../constants';
import { ResourceNotFoundException } from '../exceptions';
import { BaseRepositoryInterface, PaginatedResult } from '../interfaces';
import { BaseEntityStates } from '../enums';
import { BaseSchema } from '../entities';
import { getResultWithVirtualId } from '../utils';


@Injectable()
export abstract class BaseRepository<T extends BaseSchema>
  implements BaseRepositoryInterface<T>
{
  protected readonly logger: Logger;

  protected constructor(protected readonly model: Model<T>) {
    this.logger = new Logger(this.constructor.name);
  }

  async create(data: Partial<T>): Promise<FlattenMaps<T>> {
    const record = (await this.model.create(data)).toObject() as FlattenMaps<T>;
    return getResultWithVirtualId(record);
  }

  async findById(
    id: string,
    options: QueryOptions = {},
    errorMessage: string = DEFAULT_NOT_FOUND_MESSAGE
  ): Promise<FlattenMaps<T>> {
    const record = await this.model.findById(id, null, options).lean().exec();
    
    this.validateNotFoundRecord(record as FlattenMaps<T>, errorMessage, id);
    
    return getResultWithVirtualId(record as FlattenMaps<T>);
    
  }

  async findOne(
    filter: QueryFilter<T>,
    options: QueryOptions = {},
    errorMessage: string = DEFAULT_NOT_FOUND_MESSAGE
  ): Promise<FlattenMaps<T>> {
    const record = await this.model.findOne(filter, null, options).lean().exec();
    
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
      data: data as FlattenMaps<T>[],
      total,
      page,
      limit,
    };
  }

  async updateById(
    id: string,
    data: UpdateQuery<T>,
    options: QueryOptions = {},
  ): Promise<FlattenMaps<T>> {
    const recordUpdated = await this.model
      .findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
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
    const recordUpdated = await this.model
      .findByIdAndUpdate(
        filter,
        { ...data, updatedAt: new Date() },
        { ...options, new: true },
      )
      .lean()
      .exec();

    this.validateNotFoundRecord(recordUpdated as FlattenMaps<T>);
    return getResultWithVirtualId(recordUpdated as FlattenMaps<T>);
  }

  async remove(id: string): Promise<boolean> {
    const recordDeleted = await this.model
    .findByIdAndUpdate(
      id,
      { state: BaseEntityStates.DELETED, updatedAt: new Date() },
      { new: true },
    )
    .lean()
    .exec();

    this.validateNotFoundRecord(recordDeleted as FlattenMaps<T>);

    if (!recordDeleted || !recordDeleted.state) return false;
    return (recordDeleted.state === BaseEntityStates.DELETED);
  }

  private validateNotFoundRecord(
    record: FlattenMaps<T> | null,
    errorMessage: string = DEFAULT_NOT_FOUND_MESSAGE,
    id: string = '-',
  ): FlattenMaps<T> | void {
    if (!record) throw new ResourceNotFoundException(
      errorMessage,
      id,
    );

    return record;
  }
}
