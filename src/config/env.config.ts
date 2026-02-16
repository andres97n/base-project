import { 
  DEFAULT_PAGE_SIZE, 
  DEFAULT_PORT 
} from "src/common/constants";
import { EviromentTypes } from "src/common/enums";
import { EnvInterface } from "src/common/interfaces";


export const EnvConfiguration = (): EnvInterface => ({
  mongodbUri: process.env.DB_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',
  environment: EviromentTypes[process.env.NODE_ENV || EviromentTypes.DEVELOPMENT],
  apiSubPath: process.env.API_SUB_PATH,
  port: +(process.env.PORT || DEFAULT_PORT),
  defaultPageSize: +(process.env.DEFAULT_PAGE_SIZE || DEFAULT_PAGE_SIZE),
  jwtTime: process.env.JWT_EXPIRE_TIME,
  jwtRefreshTime: process.env.JWT_REFRESH_TIME,
});