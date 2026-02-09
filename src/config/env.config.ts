import { API_SUB_PATH, DEFAULT_MONGO_URI, DEFAULT_PAGE_SIZE, DEFAULT_PORT, JWT_EXPIRE_TIME, JWT_SECRET_KEY, NODE_ENV } from "src/common/constants";
import { EnvInterface } from "src/common/interfaces";


export const EnvConfiguration = (): EnvInterface => ({
  environment: process.env.NODE_ENV || NODE_ENV,
  apiSubPath: process.env.API_SUB_PATH || API_SUB_PATH,
  mongodbUri: process.env.DB_URI || DEFAULT_MONGO_URI,
  port: +(process.env.PORT || DEFAULT_PORT),
  defaultPageSize: +(process.env.DEFAULT_PAGE_SIZE || DEFAULT_PAGE_SIZE),
  jwtSecret: process.env.JWT_SECRET || JWT_SECRET_KEY,
  jwtExpireTime: process.env.JWT_EXPIRE_TIME || JWT_EXPIRE_TIME,
});