
import { DatabaseConfigInterface } from "src/common/interfaces";


export const DatabaseConfiguration = (): DatabaseConfigInterface => ({
  dbUri: process.env.DB_URI || '',
  port: process.env.PORT ? +(process.env.PORT) : undefined,
});