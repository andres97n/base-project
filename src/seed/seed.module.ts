import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import {
  AppConfiguration,
  CacheConfiguration,
  DatabaseConfiguration,
  JoiValidationSchema,
  JwtConfiguration,
  PostgresConfiguration,
} from 'src/core/config';
import { DatabaseModule } from 'src/core/database';
import { AppClsModule } from 'src/core/cls';
import { AuthModule } from 'src/modules/auth/auth.module';
import { SeedService } from './seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        AppConfiguration,
        DatabaseConfiguration,
        PostgresConfiguration,
        JwtConfiguration,
        CacheConfiguration,
      ],
      validationSchema: JoiValidationSchema,
    }),
    AppClsModule,
    DatabaseModule,
    AuthModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
