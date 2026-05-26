import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  ThrottlerModule,
  ThrottlerGuard,
  seconds,
  minutes,
} from '@nestjs/throttler';

import { DEFAULT_TOO_MANY_CALLS } from 'src/common/constants';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short', // Anti burst: max 10 req / 1 second
          ttl: seconds(1),
          limit: 10,
        },
        {
          name: 'medium', // Normal: max 60 req / 1 minute
          ttl: minutes(1),
          limit: 60,
        },
        {
          name: 'long', // Daily cuote: máx 1000 req / 1 hour
          ttl: minutes(60),
          limit: 1000,
        },
      ],
      errorMessage: DEFAULT_TOO_MANY_CALLS,
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, //Rule applies globally
    },
  ],
})
export class ThrottlerLocalModule {}
