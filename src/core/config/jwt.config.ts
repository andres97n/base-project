import {
  CONFIG_FIELD_JWT_REFRESH_TIME,
  CONFIG_FIELD_JWT_SECRET,
  CONFIG_FIELD_JWT_SECRET_REFRESH,
  CONFIG_FIELD_JWT_TIME,
} from 'src/common/constants';
import { JwtConfigInterface } from 'src/common/interfaces';

export const JwtConfiguration = (): JwtConfigInterface => ({
  [CONFIG_FIELD_JWT_SECRET]: process.env.JWT_SECRET || '',
  [CONFIG_FIELD_JWT_SECRET_REFRESH]: process.env.JWT_REFRESH_SECRET || '',
  [CONFIG_FIELD_JWT_TIME]: process.env.JWT_TIME,
  [CONFIG_FIELD_JWT_REFRESH_TIME]: process.env.JWT_REFRESH_TIME,
});
