import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  USER_MAX_LENGTH_PASSWORD,
  USER_MIN_LENGTH_PASSWORD,
  USER_PASSWORD_ERROR_VALIDATION,
  USER_PASSWORD_PATTERN_REG,
} from '../constants';

export class LoginUserDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(USER_MIN_LENGTH_PASSWORD)
  @MaxLength(USER_MAX_LENGTH_PASSWORD)
  @Matches(USER_PASSWORD_PATTERN_REG, {
    message: USER_PASSWORD_ERROR_VALIDATION,
  })
  password: string;
}
