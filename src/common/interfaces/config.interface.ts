import {
  CONFIG_FIELD_JWT_REFRESH_TIME,
  CONFIG_FIELD_JWT_SECRET,
  CONFIG_FIELD_JWT_SECRET_REFRESH,
  CONFIG_FIELD_JWT_TIME,
} from '../constants';
import { EviromentTypes } from '../enums';

export interface AppConfigInterface {
  environment?: EviromentTypes;
  apiSubPath?: string;
  port?: number;
  defaultPageSize?: number;
  corsOrigin?: string;
  logLevel?: string;
}

export interface DatabaseConfigInterface {
  dbUri: string;
  port?: number | undefined;
}

export interface JwtConfigInterface {
  [CONFIG_FIELD_JWT_SECRET]: string;
  [CONFIG_FIELD_JWT_SECRET_REFRESH]: string;
  [CONFIG_FIELD_JWT_TIME]?: string;
  [CONFIG_FIELD_JWT_REFRESH_TIME]?: string;
}

export interface CacheConfigInterface {
  enableCache: boolean;
  cacheExpiredTime: number;
}

export interface HttpConfigInterface {
  httpTimeout: number;
  httpMaxRedirects: number;
  httpRetryAttempts: number;
  httpRetryBaseDelay: number;
}

export interface PostgresConfigInterface {
  postgresUri?: string;
  postgresHost?: string;
  postgresPort?: number;
  postgresDb?: string;
  postgresUser?: string;
  postgresPassword?: string;
}
