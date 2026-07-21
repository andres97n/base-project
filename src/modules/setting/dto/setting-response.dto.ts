import { ApiProperty } from '@nestjs/swagger';

export class SettingResponseDto {
  @ApiProperty({
    example: '665f1b2c9a1e4b0012a3c4d5',
    description: 'Document id.',
  })
  id: string;

  @ApiProperty({ example: 'feature.newDashboard' })
  key: string;

  @ApiProperty({
    example: true,
    description: 'Arbitrary JSON-serializable value.',
  })
  value: unknown;

  @ApiProperty({ required: false, example: 'Enables the new dashboard UI.' })
  description?: string;

  @ApiProperty({
    example: false,
    description: 'Whether this setting is preloaded into cache on boot.',
  })
  isInitialSetting?: boolean;

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
