import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSettingDto {
  @ApiProperty({ example: 'feature.newDashboard' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    example: true,
    description: 'Arbitrary JSON-serializable value.',
  })
  value: unknown;

  @ApiProperty({ required: false, example: 'Enables the new dashboard UI.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    required: false,
    default: false,
    description: 'Whether this setting is preloaded into cache on boot.',
  })
  @IsOptional()
  @IsBoolean()
  isInitialSetting?: boolean;
}
