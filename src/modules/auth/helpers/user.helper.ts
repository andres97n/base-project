import { comparePasswordWithHashed } from 'src/common/utils';
import { AuthUserSource, AuthTokens } from '../interfaces';

export const compareUserPassword = (
  candidatePassword: string,
  password: string,
): Promise<boolean> => {
  return comparePasswordWithHashed(candidatePassword, password);
};

export const toAuthResponse = (user: AuthUserSource, tokens: AuthTokens) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  isActive: user.isActive,
  roles: user.roles,
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
});
