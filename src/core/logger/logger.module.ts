import { Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

import { EviromentTypes } from 'src/common/enums';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const env = configService.get<string>('environment');
        const level = configService.get<string>('logLevel') ?? 'info';
        const isDev = env !== EviromentTypes.PRODUCTION;

        return {
          forRoutes: [{ path: '{*path}', method: RequestMethod.ALL }],
          pinoHttp: {
            level,
            genReqId: (req) => req.headers['x-request-id'] as string,
            customProps: (req: any) => ({
              userId: req.user?.id,
              requestId: req.headers['x-request-id'],
            }),
            serializers: {
              req: (req) => ({ method: req.method, url: req.url }),
              res: (res) => ({ statusCode: res.statusCode }),
            },
            redact: {
              paths: ['req.headers.authorization', 'req.body.password'],
              censor: '[REDACTED]',
            },
            ...(isDev
              ? {
                  transport: {
                    target: 'pino-pretty',
                    options: {
                      colorize: true,
                      levelFirst: true,
                      translateTime: 'SYS:standard',
                      singleLine: false,
                    },
                  },
                }
              : {}),
          },
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class AppLoggerModule {}
