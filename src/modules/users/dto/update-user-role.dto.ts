import { IsArray, IsEnum } from 'class-validator';

import { UserRoles } from 'src/modules/auth/enums';

export class UpdateUserRoleDto {
  @IsArray()
  @IsEnum(UserRoles, { each: true })
  roles: UserRoles[];
}
