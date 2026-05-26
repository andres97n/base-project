import { comparePasswordWithHashed, hashPassword } from 'src/common/utils';

export const compareUserPassword = (
  candidatePassword: string,
  password: string,
): Promise<boolean> => {
  return comparePasswordWithHashed(candidatePassword, password);
};
