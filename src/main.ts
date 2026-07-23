import { Request, Response, NextFunction } from 'express';
import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  INestApplication,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';


process.on('uncaughtException', (error: Error) => {
  void handleFatalError('Uncaught Exception', error.stack);
});

process.on('unhandledRejection', (reason: unknown) => {
  void handleFatalError('Unhandled Promise Rejection', String(reason));
});

import { Logger as PinoLogger } from 'nestjs-pino';
import { v4 as uuidv4 } from 'uuid';
import helmet from 'helmet';
import compression from 'compression';

import { AppModule } from './app.module';
import {
  API_SUB_PATH,
  DEFAULT_APP_VERSION,
  DEFAULT_CORS,
  DEFAULT_MONGODB_PORT,
  DEFAULT_PREFFIX_VERSION,
  EXCEPTION_VALIDATION_DEFAULT_MESSAGE,
} from './common/constants';
import {
  ValidationExceptionFilter,
  AllExceptionsFilter,
  MongooseExceptionFilter,
} from './common/filters';
import { ResponseInterceptor } from './common/interceptors';
import { EviromentTypes } from './common/enums';
import { setupSwagger } from './core/swagger';
import { handleFatalError } from './core/helpers';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  let app: INestApplication | undefined;
  app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.enableShutdownHooks();
  app.useLogger(app.get(PinoLogger));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || DEFAULT_MONGODB_PORT;
  const globalPrefix = configService.get<string>('apiSubPath') || API_SUB_PATH;
  const environment = configService.get<string>('environment');

  app.use(
    helmet({
      contentSecurityPolicy:
        environment === EviromentTypes.PRODUCTION ? undefined : false,
    }),
  );
  app.use(compression());

  app.use((req: Request, res: Response, next: NextFunction) => {
    const headers = req.headers as any;
    headers['x-request-id'] = headers['x-request-id'] || uuidv4();
    res.setHeader('X-Request-ID', headers['x-request-id']);
    next();
  });

  app.setGlobalPrefix(globalPrefix);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: DEFAULT_APP_VERSION,
    prefix: DEFAULT_PREFFIX_VERSION,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,

      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },

      exceptionFactory: (errors) => {
        logger.warn(
          EXCEPTION_VALIDATION_DEFAULT_MESSAGE,
          JSON.stringify(errors),
        );
        return new BadRequestException(errors);
      },
    }),
  );

  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new MongooseExceptionFilter(),
    new ValidationExceptionFilter(),
  );

  const reflector = app.get(Reflector);

  app.useGlobalInterceptors(new ResponseInterceptor(reflector));

  setupSwagger(app, globalPrefix);

  const rawOrigin = configService.get<string>('corsOrigin') || DEFAULT_CORS;
  const origin =
    rawOrigin === DEFAULT_CORS
      ? DEFAULT_CORS
      : rawOrigin.split(',').map((o) => o.trim());
  app.enableCors({ origin });

  await app.listen(port);
  logger.log(
    `Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

void bootstrap();
