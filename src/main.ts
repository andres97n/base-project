import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder } from '@nestjs/swagger/dist/document-builder';
import { SwaggerModule } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';

import { AppModule } from './app.module';
import { API_SUB_PATH, DEFAULT_PORT, EXCEPTION_VALIDATION_DEFAULT_MESSAGE } from './common/constants';
import { ValidationExceptionFilter, AllExceptionsFilter } from './common/filters';
import { LoggingInterceptor, ResponseInterceptor } from './common/interceptors';


async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || DEFAULT_PORT;
  const globalPrefix = configService.get<string>('apiSubPath') || API_SUB_PATH;
  
  app.setGlobalPrefix(globalPrefix);
  
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
        excludeExtraneousValues: true,
      },
      
      exceptionFactory: (errors) => {
        logger.warn(EXCEPTION_VALIDATION_DEFAULT_MESSAGE, JSON.stringify(errors));
        throw new BadRequestException(errors);
      },
    })
  );
  
  app.useGlobalFilters(
    new ValidationExceptionFilter(),  
    new AllExceptionsFilter(),       
  );

  app.use((req: any, res: any, next: any) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
    res.setHeader('X-Request-ID', req.headers['x-request-id']);
    next();
  });

  const reflector = app.get(Reflector);

  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(reflector),
  );

  const config = new DocumentBuilder()
    .setTitle('New Base Project')
    .setDescription('Full Config Project')
    .setVersion('1.0')
    .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);

    app.enableCors({
      origin: '*',
    });
    
    await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}/${globalPrefix}`, 'Bootstrap');
}

bootstrap();
