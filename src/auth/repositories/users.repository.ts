import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from 'src/common/repositories';
import { User } from '../entities';
import { PaginatedResult } from 'src/common/interfaces';


@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {
    super(userModel);
  }

  async findByEmail(email: string) {
    return this.findOne({ email });
  }

  async searchUsers(
    search: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<User>> {
    const filter = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    };

    return this.findAll(filter, page, limit, {
      select: 'name email isActive createdAt',
    });
  }
}
