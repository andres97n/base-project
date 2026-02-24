import { Injectable } from '@nestjs/common';
import { HydratedDocument, Model, UpdateQuery, QueryFilter } from 'mongoose';

import { DEFAULT_NOT_FOUND_MESSAGE } from '../constants';
import { ResourceNotFoundException } from '../exceptions';
import { BaseEntityStates } from '../enums';
import { BaseSchema } from '../entities';
import { LeanDoc } from '../types';


@Injectable()
export class GenericService<T extends BaseSchema> {
  constructor(private readonly model: Model<T>) { }

  async findAll(select?: string | Record<string, 0 | 1>): Promise<LeanDoc<T>[]> {
    const query = this.model.find().lean<LeanDoc<T>[]>({ virtuals: true });
    if (select) query.select(select);
    return query.exec();
  }

  async findById(
    id: string,
    select?: string | Record<string, 0 | 1>,
    message?: string,
  ): Promise<LeanDoc<T>> {
    const query = this.model.findById(id).lean<LeanDoc<T>>({ virtuals: true });
    if (select) query.select(select);

    const record = await query.exec();
    if (!record) throw new ResourceNotFoundException(
      message || DEFAULT_NOT_FOUND_MESSAGE,
      id,
    );
    return record;
  }

  async findOne(
    filter: QueryFilter<T>,
    select?: string | Record<string, 0 | 1>,
    message?: string,
  ): Promise<LeanDoc<T>> {
    const query = this.model.findOne(filter).lean<LeanDoc<T>>({ virtuals: true });
    if (select) query.select(select);

    const result = await query.exec();
    if (!result) throw new ResourceNotFoundException(
      message || DEFAULT_NOT_FOUND_MESSAGE,
      '-',
    );
    return result;
  }

  async findOneWithoutException(
    filter: QueryFilter<T>,
    select?: string | Record<string, 0 | 1>,
  ): Promise<LeanDoc<T> | null> {
    const query = this.model.findOne(filter).lean<LeanDoc<T>>({ virtuals: true });
    if (select) query.select(select);
    return query.exec();
  }

  async create(createDto: Partial<T>): Promise<HydratedDocument<T>> {
    return this.model.create(createDto);
  }

  async update(
    id: string,
    updateDto: UpdateQuery<T>,
    message?: string,
  ): Promise<HydratedDocument<T>> {
    const record = await this.model.findByIdAndUpdate(id, updateDto, { new: true });
    if (!record) throw new ResourceNotFoundException(
      message || DEFAULT_NOT_FOUND_MESSAGE,
      id,
    );
    return record;
  }

  async remove(id: string, message?: string): Promise<HydratedDocument<T>> {
    const record = await this.model.findByIdAndUpdate(
      id,
      { state: BaseEntityStates.DELETED },
      { new: true },
    );
    if (!record) throw new ResourceNotFoundException(
      message || DEFAULT_NOT_FOUND_MESSAGE,
      id,
    );
    return record;
  }
}
