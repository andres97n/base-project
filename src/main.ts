import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';

const processLogger = new Logger('Process');

process.on('uncaughtException', (error: Error) => {
  processLogger.error(
    'Uncaught Exception — forcing graceful shutdown',
    error.stack,
  );
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  processLogger.error('Unhandled Promise Rejection', String(reason));
  process.exit(1);
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

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

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

  app.use((req: any, res: any, next: any) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
    res.setHeader('X-Request-ID', req.headers['x-request-id']);
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
