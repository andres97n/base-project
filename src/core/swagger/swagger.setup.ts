import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import {
  SWAGGER_BEARER_AUTH_NAME,
  SWAGGER_CONTACT_EMAIL,
  SWAGGER_CONTACT_NAME,
  SWAGGER_CONTACT_URL,
  SWAGGER_DESCRIPTION,
  SWAGGER_DOC_PATH,
  SWAGGER_TITLE,
  SWAGGER_VERSION,
} from 'src/common/constants';
import {
  ApiResponseDto,
  ErrorResponseDto,
  PaginationMetaDto,
  ValidationErrorResponseDto,
} from 'src/common/dto';

/**
 * Global Swagger/OpenAPI configuration.
 *
 * Mounts the UI at `<globalPrefix>/<SWAGGER_DOC_PATH>` (e.g. `/api/docs`),
 * declares the JWT bearer security scheme, and pre-registers the shared
 * response envelope DTOs so they are always present in the schema catalog.
 *
 * @param app          The Nest application instance.
 * @param globalPrefix The configured API prefix (e.g. `api`).
 */
export const setupSwagger = (
  app: INestApplication,
  globalPrefix: string,
): void => {
  const builder = new DocumentBuilder()
    .setTitle(SWAGGER_TITLE)
    .setDescription(SWAGGER_DESCRIPTION)
    .setVersion(SWAGGER_VERSION)
    .addServer(`/${globalPrefix}`)
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      SWAGGER_BEARER_AUTH_NAME,
    );

  if (SWAGGER_CONTACT_NAME || SWAGGER_CONTACT_URL || SWAGGER_CONTACT_EMAIL) {
    builder.setContact(
      SWAGGER_CONTACT_NAME,
      SWAGGER_CONTACT_URL,
      SWAGGER_CONTACT_EMAIL,
    );
  }

  const document = SwaggerModule.createDocument(app, builder.build(), {
    extraModels: [
      ApiResponseDto,
      PaginationMetaDto,
      ErrorResponseDto,
      ValidationErrorResponseDto,
    ],
  });

  SwaggerModule.setup(`${globalPrefix}/${SWAGGER_DOC_PATH}`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
};
