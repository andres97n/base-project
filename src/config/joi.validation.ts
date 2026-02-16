import * as Joi from 'joi';

import { 
  API_SUB_PATH, DEFAULT_PAGE_SIZE, 
  DEFAULT_PORT, JWT_REFRESH_TIME, 
  JWT_TIME
} from 'src/common/constants';
import { EviromentTypes } from 'src/common/enums';


export const JoiValidationSchema = Joi.object({
  DB_URI: Joi.required(),
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  NODE_ENV: Joi.string()
    .valid(...Object.values(EviromentTypes))
    .default(EviromentTypes.DEVELOPMENT),
  API_SUB_PATH: Joi.string().default(API_SUB_PATH),
  PORT: Joi.number().default(DEFAULT_PORT),
  DEFAULT_PAGE_SIZE: Joi.number().default(DEFAULT_PAGE_SIZE),
  JWT_TIME: Joi.string().default(JWT_TIME),
  JWT_REFRESH_TIME: Joi.string().default(JWT_REFRESH_TIME)
})