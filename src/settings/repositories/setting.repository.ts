import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FlattenMaps, Model} from 'mongoose';

import { BaseRepository } from 'src/common/repositories';
import { Setting } from '../schemas';
import { PaginatedResult } from 'src/common/interfaces';


@Injectable()
export class SettingRepository extends BaseRepository<Setting> {
  constructor(
    @InjectModel(Setting.name)
    private readonly settingModel: Model<Setting>,
  ) {
    super(settingModel);
  }

  async getInitialSettings(): Promise<PaginatedResult<FlattenMaps<Setting>>> {
    return super.findAll({
      isInitialSetting: true
    });
  }

}