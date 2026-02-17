import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

import { DEFAULT_NOT_FOUND_MESSAGE } from '../constants';
import { ResourceNotFoundException } from '../exceptions';
import { BaseEntityStates } from '../enums';



@Injectable()
export class GenericService<T> {
  constructor(private readonly model: Model<T>) {}

  async findAll() {
    return await this.model.find().exec();
  }

  async findById(id: string, message?: string) {
    const record = await this.model.findById(id).exec();
    if (!record) throw new ResourceNotFoundException(
      message || DEFAULT_NOT_FOUND_MESSAGE,
      id
    );

    return record;
  }

  async findOne(filter: Partial<Record<keyof T, unknown>>, message?: string): Promise<T> {
    const result = await this.model.findOne(filter).exec();
    if (!result) throw new ResourceNotFoundException(
      message || DEFAULT_NOT_FOUND_MESSAGE,
      '-'
    );

    return result;
  }

  async findOneWithoutException(objectSearch: Partial<Record<keyof T, unknown>>) {
    return await this.model.findOne(objectSearch).exec();
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
