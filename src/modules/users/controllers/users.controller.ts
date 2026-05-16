import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';

import { UserRoles } from 'src/modules/auth/enums';
import { Auth } from 'src/modules/auth/decorators';
import { UsersService } from '../services';
import { UpdateUserRoleDto, UpdateUserStatusDto } from '../dto';


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Auth(UserRoles.ADMIN)
  @Get()
  findAll(
    @Query('search') search: string = '',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.usersService.findAll(search, +page, +limit);
  }

  @Auth()
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Auth(UserRoles.ADMIN)
  @Patch(':id/roles')
  updateRoles(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRoles(id, updateUserRoleDto);
  }

  @Auth(UserRoles.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(id, updateUserStatusDto);
  }

  @Auth(UserRoles.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
