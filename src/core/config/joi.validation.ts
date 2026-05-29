import * as Joi from 'joi';

import {
  API_SUB_PATH,
  CACHE_TIME_DURATION,
  DEFAULT_CORS,
  DEFAULT_PAGE_SIZE,
  DEFAULT_MONGODB_PORT,
  HTTP_DEFAULT_MAX_REDIRECTS,
  HTTP_DEFAULT_RETRY_ATTEMPTS,
  HTTP_DEFAULT_RETRY_BASE_DELAY,
  HTTP_DEFAULT_TIMEOUT,
  JWT_REFRESH_TIME,
  JWT_TIME,
} from 'src/common/constants';
import { DatabaseEnum, EviromentTypes, LogEnum } from 'src/common/enums';

export const JoiValidationSchema = Joi.object({
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  NODE_ENV: Joi.string()
    .valid(...Object.values(EviromentTypes))
    .default(EviromentTypes.DEVELOPMENT),
  API_SUB_PATH: Joi.string().default(API_SUB_PATH),
  DEFAULT_PAGE_SIZE: Joi.number().default(DEFAULT_PAGE_SIZE),
  JWT_TIME: Joi.string().default(JWT_TIME),
  JWT_REFRESH_TIME: Joi.string().default(JWT_REFRESH_TIME),
  ENABLE_CACHE: Joi.boolean().default(true),
  CACHE_EXPIRED_TIME: Joi.number().required().default(CACHE_TIME_DURATION),

  // HTTP client (outbound external API calls)
  HTTP_TIMEOUT: Joi.number().default(HTTP_DEFAULT_TIMEOUT),
  HTTP_MAX_REDIRECTS: Joi.number().default(HTTP_DEFAULT_MAX_REDIRECTS),
  HTTP_RETRY_ATTEMPTS: Joi.number().default(HTTP_DEFAULT_RETRY_ATTEMPTS),
  HTTP_RETRY_BASE_DELAY: Joi.number().default(HTTP_DEFAULT_RETRY_BASE_DELAY),

  CORS_ORIGIN: Joi.string().default(DEFAULT_CORS),
  LOG_LEVEL: Joi.string()
    .valid(...Object.values(LogEnum))
    .default(LogEnum.INFO_LOG),

  // Seed (optional — only needed when running pnpm seed)
  SEED_ADMIN_EMAIL: Joi.string().email().optional().allow(''),
  SEED_ADMIN_PASSWORD: Joi.string().optional().allow(''),
  SEED_ADMIN_FULL_NAME: Joi.string().optional().allow('').default('Admin'),

  //DATABASE
  DB_TYPE: Joi.string()
    .valid(...Object.values(DatabaseEnum))
    .default(DatabaseEnum.MONGODB),
  DB_URI: Joi.when('DB_TYPE', {
    is: DatabaseEnum.POSTGRES,
    then: Joi.string().optional().allow(''),
    otherwise: Joi.string().required(),
  }),
  PORT: Joi.number().default(DEFAULT_MONGODB_PORT),

  //POSTGRES
  POSTGRES_URI: Joi.string().optional().allow(''),
  POSTGRES_HOST: Joi.string().optional().default('localhost'),
  POSTGRES_PORT: Joi.number().optional().default(5432),
  POSTGRES_DB: Joi.string().optional().allow(''),
  POSTGRES_USER: Joi.string().optional().allow(''),
  POSTGRES_PASSWORD: Joi.string().optional().allow(''),
});
