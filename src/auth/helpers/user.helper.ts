import { comparePasswordWithHashed, hashPassword } from "src/common/utils";


export const validateAndHashPassword = async (
  password: string,
  next: (err?: Error) => void,
  isModified: boolean = false
): Promise<void> => {
  if (!isModified) return next();
  
  try {
    password = await hashPassword(password);
    next();
  } catch (error) {
    next(error);
  }
}

export const compareUserPassword = (
  candidatePassword: string,
  password: string
): Promise<boolean> => {
  return comparePasswordWithHashed(candidatePassword, password);
}