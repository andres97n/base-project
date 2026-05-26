import { SetMetadata } from '@nestjs/common';

import { UserRoles } from '../enums';
import { META_ROLES } from '../constants';

export const RoleProtected = (...args: UserRoles[]) => {
  return SetMetadata(META_ROLES, args);
};
