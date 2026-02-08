import * as Joi from 'joi';
import { API_SUB_PATH, DEFAULT_PAGE_SIZE, DEFAULT_PORT } from 'src/common/constants';

export const JoiValidationSchema = Joi.object({
  DB_URI: Joi.required(),
  API_SUB_PATH: Joi.string().default(API_SUB_PATH),
  PORT: Joi.number().default(DEFAULT_PORT),
  DEFAULT_PAGE_SIZE: Joi.number().default(DEFAULT_PAGE_SIZE),
})