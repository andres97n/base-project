import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Setting, SettingSchema } from './schemas';
import { SettingRepository } from './repositories';
import { SettingService } from './services';
import { SettingController } from './controllers';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Setting.name, schema: SettingSchema }]),
  ],
  controllers: [SettingController],
  providers: [SettingRepository, SettingService],
  exports: [SettingService],
})
export class SettingModule {}
