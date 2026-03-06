import { 
  CONFIG_FIELD_JWT_REFRESH_TIME, CONFIG_FIELD_JWT_SECRET, 
  CONFIG_FIELD_JWT_SECRET_REFRESH, CONFIG_FIELD_JWT_TIME 
} from "../constants";
import { EviromentTypes } from "../enums";


export interface EnvInterface {
  [CONFIG_FIELD_JWT_SECRET]: string;
  [CONFIG_FIELD_JWT_SECRET_REFRESH]: string;
  environment?: EviromentTypes;
  apiSubPath?: string;
  port?: number;
  defaultPageSize?: number;
  [CONFIG_FIELD_JWT_TIME]?: string;
  [CONFIG_FIELD_JWT_REFRESH_TIME]?: string;
  enableCache: boolean;
  cacheExpiredTime: number;
}

export interface DatabaseConfigInterface {
  dbUri: string;
  port?: number | undefined;
}