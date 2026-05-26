import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseEnum, EviromentTypes } from 'src/common/enums';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProd =
          configService.get<string>('environment') ===
          EviromentTypes.PRODUCTION;
        const isDev =
          configService.get<string>('environment') ===
          EviromentTypes.DEVELOPMENT;
        const postgresUri = configService.get<string>('postgresUri');

        return {
          type: 'postgres',
          ...(postgresUri
            ? { url: postgresUri }
            : {
                host: configService.get<string>('postgresHost'),
                port: configService.get<number>('postgresPort'),
                username: configService.get<string>('postgresUser'),
                password: configService.get<string>('postgresPassword'),
                database: configService.get<string>('postgresDb'),
              }),
          autoLoadEntities: true,
          synchronize: !isProd,
          logging: isDev,
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class PostgresDatabaseModule {}
