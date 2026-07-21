import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FlattenMaps, Model } from 'mongoose';

import { BaseRepository } from 'src/common/repositories';
import { AuditContextService } from 'src/common/services';
import { Setting } from '../schemas';
import { PaginatedResult } from 'src/common/interfaces';

const MAX_INITIAL_SETTINGS = 1000;

@Injectable()
export class SettingRepository extends BaseRepository<Setting> {
  constructor(
    @InjectModel(Setting.name)
    private readonly settingModel: Model<Setting>,
    auditContext: AuditContextService,
  ) {
    super(settingModel, auditContext);
  }

  async getInitialSettings(): Promise<PaginatedResult<FlattenMaps<Setting>>> {
    return super.findAll({ isInitialSetting: true }, 1, MAX_INITIAL_SETTINGS);
  }
}
