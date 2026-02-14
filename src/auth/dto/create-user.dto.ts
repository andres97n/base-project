import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { USER_PASSWORD_ERROR_VALIDATION, USER_PASSWORD_PATTERN_REG } from '../constants';


export class CreateUserDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(
    USER_PASSWORD_PATTERN_REG, {
    message: USER_PASSWORD_ERROR_VALIDATION
  })
  password: string;

  @IsString()
  @MinLength(1)
  fullName: string;
}
