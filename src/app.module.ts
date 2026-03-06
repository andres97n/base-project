import * as https from 'node:https';
import { Module } from '@nestjs/common';
import { ConditionalModule, ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';

import { CommonModule } from './common/common.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EnvConfiguration, JoiValidationSchema } from './config';
import { DatabaseConfiguration } from './config/database.config';


@Module({
  imports: [
    ConfigModule.forRoot({
      load: [ EnvConfiguration, DatabaseConfiguration ],
      validationSchema: JoiValidationSchema,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('dbUri'), //Configure URI BD
      }),
    }),

    HttpModule.register({
      global: true,
      timeout: 5000,
      maxRedirects: 5,
      httpsAgent: new https.Agent({ keepAlive: true }),
      // httpAgent: new http.Agent({ keepAlive: true }),
    }),

    ConditionalModule.registerWhen(
      CacheModule.register({
        isGlobal: true,
        ttl: EnvConfiguration().cacheExpiredTime,
      }),
      () => EnvConfiguration().enableCache,
    ),

    CommonModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
