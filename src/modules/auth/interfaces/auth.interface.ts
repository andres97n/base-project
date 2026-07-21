import { UserRoles } from '../enums';

export interface AuthUserSource {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: UserRoles[];
}

export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string;
}
