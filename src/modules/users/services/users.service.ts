import { Injectable } from '@nestjs/common';

import { UserRepository } from 'src/modules/auth/repositories';
import { UpdateUserRoleDto, UpdateUserStatusDto } from '../dto';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  findAll(search: string, page: number, limit: number) {
    return this.userRepository.searchUsers(search, page, limit);
  }

  findById(id: string) {
    return this.userRepository.findById(id);
  }

  updateRoles(id: string, { roles }: UpdateUserRoleDto) {
    return this.userRepository.updateById(id, { roles });
  }

  updateStatus(id: string, { isActive }: UpdateUserStatusDto) {
    return this.userRepository.updateById(id, { isActive });
  }

  remove(id: string) {
    return this.userRepository.removeById(id);
  }
}
