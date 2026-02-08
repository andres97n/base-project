import * as https from 'node:https';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EnvConfiguration, JoiValidationSchema } from './config';


@Module({
  imports: [
    ConfigModule.forRoot({
      load: [ EnvConfiguration ],
      validationSchema: JoiValidationSchema,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('mongodbUri'), //Configure URI BD
      }),
    }),

    HttpModule.register({
      global: true,
      timeout: 5000,
      maxRedirects: 5,
      httpsAgent: new https.Agent({ keepAlive: true }),
      // httpAgent: new http.Agent({ keepAlive: true }),
    }),

    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
