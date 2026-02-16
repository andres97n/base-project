import { EviromentTypes } from "../enums";


export interface EnvInterface {
  mongodbUri: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  environment?: EviromentTypes;
  apiSubPath?: string;
  port?: number;
  defaultPageSize?: number;
  jwtTime?: string;
  jwtRefreshTime?: string;
}