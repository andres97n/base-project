import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder } from '@nestjs/swagger/dist/document-builder';


import { AppModule } from './app.module';
import { API_SUB_PATH, DEFAULT_PORT } from './common/constants';
import { SwaggerModule } from '@nestjs/swagger';


async function bootstrap() {
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
    })
  );

  // app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
  // app.useGlobalFilters(new AllExceptionsFilter());

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
    Logger.log(`Application is running on: http://localhost:${port}/${globalPrefix}`, 'Bootstrap');
}

bootstrap();
