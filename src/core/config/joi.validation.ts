import * as Joi from 'joi';

import { 
  API_SUB_PATH, CACHE_TIME_DURATION, DEFAULT_CORS, 
  DEFAULT_PAGE_SIZE, DEFAULT_PORT, JWT_REFRESH_TIME, 
  JWT_TIME
} from 'src/common/constants';
import { EviromentTypes } from 'src/common/enums';


export const JoiValidationSchema = Joi.object({
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  NODE_ENV: Joi
    .string()
    .valid(...Object.values(EviromentTypes))
    .default(EviromentTypes.DEVELOPMENT),
  API_SUB_PATH: Joi.string().default(API_SUB_PATH),
  PORT: Joi.number().default(DEFAULT_PORT),
  DEFAULT_PAGE_SIZE: Joi.number().default(DEFAULT_PAGE_SIZE),
  JWT_TIME: Joi.string().default(JWT_TIME),
  JWT_REFRESH_TIME: Joi.string().default(JWT_REFRESH_TIME),
  ENABLE_CACHE: Joi.boolean().default(true),
  CACHE_EXPIRED_TIME: Joi.number().required().default(CACHE_TIME_DURATION),
  
  CORS_ORIGIN: Joi.string().default(DEFAULT_CORS),

  //DATABASE
  DB_URI: Joi.required(),
})