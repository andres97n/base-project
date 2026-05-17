import * as https from 'node:https';
import { Module } from '@nestjs/common';
import { ConditionalModule, ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { JwtAuthGuard } from './modules/auth/guards';
import { 
  CacheConfiguration, AppConfiguration, 
  JoiValidationSchema, JwtConfiguration 
} from './core/config';
import { DatabaseConfiguration, PostgresConfiguration } from './core/config/database.config';
import { DatabaseModule } from './core/database';
import { ThrottlerLocalModule } from './core/throttler';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        AppConfiguration,
        DatabaseConfiguration,
        PostgresConfiguration,
        JwtConfiguration,
        CacheConfiguration
      ],
      validationSchema: JoiValidationSchema,
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
        ttl: CacheConfiguration().cacheExpiredTime,
      }),
      () => CacheConfiguration().enableCache,
    ),

    ThrottlerLocalModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
