import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { UserRoles } from 'src/modules/auth/enums';
import { Auth } from 'src/modules/auth/decorators';
import { ApiErrorResponses, ApiOkResponseWrapped } from 'src/common/decorators';
import { SWAGGER_BEARER_AUTH_NAME } from 'src/common/constants';
import { SettingService } from '../services';
import { CreateSettingDto, SettingResponseDto, UpdateSettingDto } from '../dto';

@ApiTags('Settings')
@ApiBearerAuth(SWAGGER_BEARER_AUTH_NAME)
@ApiErrorResponses()
@Auth(UserRoles.ADMIN)
@Controller('settings')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @ApiOperation({ summary: 'Get a setting value by key' })
  @ApiOkResponseWrapped(SettingResponseDto)
  @Get(':key')
  findByKey(@Param('key') key: string) {
    return this.settingService.get(key);
  }

  @ApiOperation({ summary: 'Create or upsert a setting' })
  @ApiOkResponseWrapped(SettingResponseDto)
  @Post()
  create(@Body() dto: CreateSettingDto) {
    return this.settingService.set(dto.key, dto.value, dto.description);
  }

  @ApiOperation({ summary: 'Update a setting value' })
  @ApiOkResponseWrapped(SettingResponseDto)
  @Patch(':key')
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingService.set(key, dto.value, dto.description);
  }

  @ApiOperation({ summary: 'Delete a setting' })
  @Delete(':key')
  remove(@Param('key') key: string) {
    return this.settingService.delete(key);
  }
}
