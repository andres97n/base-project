import * as bcrypt from 'bcrypt';

import { InternalServerException } from '../exceptions';

export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch {
    throw new InternalServerException('Failed to hash password');
  }
};

export const comparePasswordWithHashed = async (
  candidatePassword: string,
  passwordHashed: string,
): Promise<boolean> => {
  try {
    return await bcrypt.compare(candidatePassword, passwordHashed);
  } catch {
    throw new InternalServerException('Failed to compare password');
  }
};

export const hashString = async (word: string): Promise<string> => {
  try {
    return await bcrypt.hash(word, 10);
  } catch {
    throw new InternalServerException('Failed to hash value');
  }
};
