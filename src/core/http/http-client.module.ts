import * as https from 'node:https';
import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { HttpClientService } from './http-client.service';

/**
 * Global module that centralizes outbound external-API access.
 *
 * Wraps `@nestjs/axios` with config-driven timeout/redirect settings and
 * exposes {@link HttpClientService} as the single consumption surface.
 */
@Global()
@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('httpTimeout'),
        maxRedirects: configService.get<number>('httpMaxRedirects'),
        httpsAgent: new https.Agent({ keepAlive: true }),
      }),
    }),
  ],
  providers: [HttpClientService],
  exports: [HttpClientService],
})
export class HttpClientModule {}
