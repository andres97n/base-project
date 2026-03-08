import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Setting, SettingSchema } from 'src/modules/settings/schemas';


@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('dbUri'),
      }),
    }),

    MongooseModule.forFeature([{
      name: Setting.name, 
      schema: SettingSchema 
    }]),
  ]
})
export class DatabaseModule {}