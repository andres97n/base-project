import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { UserRoles } from 'src/modules/auth/enums';
import { Auth } from 'src/modules/auth/decorators';
import { ApiErrorResponses, ApiOkResponseWrapped } from 'src/common/decorators';
import { SWAGGER_BEARER_AUTH_NAME } from 'src/common/constants';
import { UsersService } from '../services';
import {
  FindUsersDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  UserResponseDto,
} from '../dto';

@ApiTags('Users')
@ApiBearerAuth(SWAGGER_BEARER_AUTH_NAME)
@ApiErrorResponses()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'List users (paginated, admin only)' })
  @ApiOkResponseWrapped(UserResponseDto, { paginated: true })
  @Auth(UserRoles.ADMIN)
  @Get()
  findAll(@Query() { search, page, limit }: FindUsersDto) {
    return this.usersService.findAll(search, page, limit);
  }

  @ApiOperation({ summary: 'Get a user by id' })
  @ApiOkResponseWrapped(UserResponseDto)
  @Auth()
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @ApiOperation({ summary: 'Update a user roles (admin only)' })
  @ApiOkResponseWrapped(UserResponseDto)
  @Auth(UserRoles.ADMIN)
  @Patch(':id/roles')
  updateRoles(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRoles(id, updateUserRoleDto);
  }

  @ApiOperation({ summary: 'Update a user active status (admin only)' })
  @ApiOkResponseWrapped(UserResponseDto)
  @Auth(UserRoles.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(id, updateUserStatusDto);
  }

  @ApiOperation({ summary: 'Soft-delete a user (admin only)' })
  @ApiOkResponseWrapped(UserResponseDto)
  @Auth(UserRoles.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
