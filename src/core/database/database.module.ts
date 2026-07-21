import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { PostgresDatabaseModule } from './postgres-database.module';
import { DatabaseEnum } from 'src/common/enums';

const isPostgres = () => process.env.DB_TYPE === DatabaseEnum.POSTGRES;

@Global()
@Module({
  imports: [
    ...(!isPostgres()
      ? [
          MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
              uri: configService.get<string>('dbUri'),
            }),
          }),
        ]
      : []),

    ...(isPostgres() ? [PostgresDatabaseModule] : []),
  ],
})
export class DatabaseModule {}
