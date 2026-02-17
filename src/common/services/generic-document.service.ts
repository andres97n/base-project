import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

import { DEFAULT_NOT_FOUND_MESSAGE } from '../constants';
import { ResourceNotFoundException } from '../exceptions';
import { BaseEntityStates } from '../enums';


@Injectable()
export class GenericService<T> {
  constructor(private readonly model: Model<T>) {}

  async findAll(select?: string | Record<string, 0 | 1>) {
    const query = this.model.find();
    if (select) {
      query.select(select);
    }
    return await query.exec();
  }

  async findById(
    id: string, 
    message?: string, 
    select?: string | Record<string, 0 | 1>
  ) {
    const query = this.model.findById(id);
    if (select) query.select(select);
    
    const record = await query.exec();
    if (!record) throw new ResourceNotFoundException(
      message || DEFAULT_NOT_FOUND_MESSAGE,
      id
    );

    return record;
  }

  async findOne(
    filter: Partial<Record<keyof T, unknown>>, 
    message?: string, 
    select?: string | Record<string, 0 | 1>
  ): Promise<T> {
    const query = this.model.findOne(filter);
    if (select) query.select(select);
    
    const result = await query.exec();
    if (!result) throw new ResourceNotFoundException(
      message || DEFAULT_NOT_FOUND_MESSAGE,
      '-'
    );

    return result;
  }

  async findOneWithoutException(
    objectSearch: Partial<Record<keyof T, unknown>>, 
    select?: string | Record<string, 0 | 1>
  ) {
    const query = this.model.findOne(objectSearch);
    if (select) query.select(select);
    
    return await query.exec();
  }

  async create(createDto: any) {
    return await this.model.create(createDto);
  }

  async update(id: string, updateDto: any, message?: string) {
    const record = await this.model.findByIdAndUpdate(
      id,
      updateDto,
      { new: true }
    );
    if (!record) throw new ResourceNotFoundException(
      message || DEFAULT_NOT_FOUND_MESSAGE,
      id
    );

    return record;
  }

  async remove(id: string, message?: string) {
    const record = await this.model.findByIdAndUpdate(
      id,
      { state: BaseEntityStates.DELETED },
      { new: true }
    );
    if (!record) throw new ResourceNotFoundException(
      message || DEFAULT_NOT_FOUND_MESSAGE,
      id
    );

    return record;
  }

}
