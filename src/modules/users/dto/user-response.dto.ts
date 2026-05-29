import { ApiProperty } from '@nestjs/swagger';

import { UserRoles } from 'src/modules/auth/enums';

/**
 * Safe, documented projection of a user returned by the API.
 *
 * Recommended pattern: never expose the Mongoose entity directly — sensitive
 * fields (`password`, `refreshToken`) must never reach the OpenAPI schema or
 * the wire. Use a response DTO that lists only public fields.
 */
export class UserResponseDto {
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
    example: '2026-05-29T12:00:00.000Z',
    description: 'Creation timestamp.',
  })
  createdAt: string;

  @ApiProperty({
    example: '2026-05-29T12:00:00.000Z',
    description: 'Last update timestamp.',
  })
  updatedAt: string;
}
