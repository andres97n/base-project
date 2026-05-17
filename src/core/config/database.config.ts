
import { DEFAULT_HOST, DEFAULT_MONGODB_PORT, DEFAULT_POSTGRES_PORT } from "src/common/constants";
import { DatabaseConfigInterface, PostgresConfigInterface } from "src/common/interfaces";


export const DatabaseConfiguration = (): DatabaseConfigInterface => ({
  dbUri: process.env.DB_URI || '',
  port: +(process.env.PORT || DEFAULT_MONGODB_PORT),
});

export const PostgresConfiguration = (): PostgresConfigInterface => ({
  postgresUri: process.env.POSTGRES_URI || '',
  postgresHost: process.env.POSTGRES_HOST || DEFAULT_HOST,
  postgresPort: process.env.POSTGRES_PORT ? +(process.env.POSTGRES_PORT) : DEFAULT_POSTGRES_PORT,
  postgresDb: process.env.POSTGRES_DB || '',
  postgresUser: process.env.POSTGRES_USER || '',
  postgresPassword: process.env.POSTGRES_PASSWORD || '',
});