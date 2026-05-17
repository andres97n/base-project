import { 
  DEFAULT_PAGE_SIZE } from "src/common/constants";
import { EviromentTypes } from "src/common/enums";
import { AppConfigInterface } from "src/common/interfaces";


export const AppConfiguration = (): AppConfigInterface => ({
  environment: EviromentTypes[process.env.NODE_ENV || EviromentTypes.DEVELOPMENT],
  apiSubPath: process.env.API_SUB_PATH,
  // port: +(process.env.PORT || DEFAULT_PORT),
  defaultPageSize: +(process.env.DEFAULT_PAGE_SIZE || DEFAULT_PAGE_SIZE),
  corsOrigin: process.env.CORS_ORIGIN || '*',
});