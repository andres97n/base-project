import { USER_PASSWORD_PATTERN_REG } from "src/auth/constants";


export const isEmail = (email: string) => {
  return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
}

export const isPasswordValid = (password: string) => {
  // Al menos una mayúscula, una minúscula, un número y un carácter especial
  return USER_PASSWORD_PATTERN_REG.test(password);
}