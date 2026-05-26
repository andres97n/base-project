import { DEFAULT_MONGODB_NAME, DEFAULT_POSTGRES_NAME } from '../constants';

export enum DatabaseEnum {
  POSTGRES = `${DEFAULT_POSTGRES_NAME}`,
  MONGODB = `${DEFAULT_MONGODB_NAME}`,
}
