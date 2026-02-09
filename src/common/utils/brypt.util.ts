import * as bcrypt from 'bcrypt';


//Involve into try and catch
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export const comparePasswordWithHashed = (
  candidatePassword: string, 
  passwordHashed: string
): Promise<boolean> => {
  return bcrypt.compare(candidatePassword, passwordHashed);
}