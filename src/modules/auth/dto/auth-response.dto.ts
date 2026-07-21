import { ApiProperty } from '@nestjs/swagger';

import { UserRoles } from '../enums';

export class TokenPairDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1Ni...',
    description: 'Short-lived JWT access token.',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1Ni...',
    description: 'Long-lived JWT refresh token.',
  })
  refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: '665f1b2c9a1e4b0012a3c4d5',
    description: 'Document id.',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address.',
  })
  email: string;

  @ApiProperty({ example: 'Jane Doe', description: 'Full name.' })
  fullName: string;

  @ApiProperty({ example: true, description: 'Whether the account is active.' })
  isActive: boolean;

  @ApiProperty({
    enum: UserRoles,
    isArray: true,
    example: [UserRoles.USER],
    description: 'Roles granted to the user.',
  })
  roles: UserRoles[];

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1Ni...',
    description: 'JWT access token.',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1Ni...',
    description: 'JWT refresh token.',
  })
  refreshToken: string;
}

export class TokenStatusDto {
  @ApiProperty({ example: true, description: 'Whether the token is valid.' })
  valid: boolean;
}
