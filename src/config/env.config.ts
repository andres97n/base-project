import { 
  CONFIG_FIELD_JWT_REFRESH_TIME,
  CONFIG_FIELD_JWT_SECRET,
  CONFIG_FIELD_JWT_SECRET_REFRESH,
  CONFIG_FIELD_JWT_TIME,
  DEFAULT_PAGE_SIZE, 
  DEFAULT_PORT 
} from "src/common/constants";
import { EviromentTypes } from "src/common/enums";
import { EnvInterface } from "src/common/interfaces";


export const EnvConfiguration = (): EnvInterface => ({
  mongodbUri: process.env.DB_URI || '',
  [CONFIG_FIELD_JWT_SECRET]: process.env.JWT_SECRET || '',
  [CONFIG_FIELD_JWT_SECRET_REFRESH]: process.env.JWT_REFRESH_SECRET || '',
  environment: EviromentTypes[process.env.NODE_ENV || EviromentTypes.DEVELOPMENT],
  apiSubPath: process.env.API_SUB_PATH,
  port: +(process.env.PORT || DEFAULT_PORT),
  defaultPageSize: +(process.env.DEFAULT_PAGE_SIZE || DEFAULT_PAGE_SIZE),
  [CONFIG_FIELD_JWT_TIME]: process.env.JWT_TIME,
  [CONFIG_FIELD_JWT_REFRESH_TIME]: process.env.JWT_REFRESH_TIME,
});