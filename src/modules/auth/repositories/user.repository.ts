import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from 'src/common/repositories';
import { AuditContextService } from 'src/common/services';
import { PaginatedResult } from 'src/common/interfaces';
import { User } from '../entities';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    auditContext: AuditContextService,
  ) {
    super(userModel, auditContext);
  }

  async findByEmail(email: string, select: string = 'email fullName password') {
    return super.findOne({ email }, { select });
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

    return super.findAll(filter, page, limit, {
      select: 'name email isActive createdAt',
    });
  }
}
