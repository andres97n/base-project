import { applyDecorators, UseGuards } from '@nestjs/common';

import { UserRoles } from '../enums';
import { RoleProtected } from './index';
import { UserRoleGuard } from '../guards';


export function Auth(...roles: UserRoles[]) {

  return applyDecorators(
    RoleProtected(...roles),
    UseGuards(UserRoleGuard),
  );

}