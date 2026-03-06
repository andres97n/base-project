import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model} from 'mongoose';

import { BaseRepository } from 'src/common/repositories';
import { Setting } from '../schemas';


@Injectable()
export class SettingRepository extends BaseRepository<Setting> {
  constructor(
    @InjectModel(Setting.name)
    private readonly settingModel: Model<Setting>,
  ) {
    super(settingModel);
  }

}