import { JoiValidationSchema } from './joi.validation';

describe('JoiValidationSchema', () => {
  const baseEnv = {
    JWT_SECRET: 'secret',
    JWT_REFRESH_SECRET: 'refresh-secret',
  };

  describe('mongodb (default)', () => {
    it('requires DB_URI', () => {
      const { error } = JoiValidationSchema.validate(baseEnv);
      expect(error?.message).toMatch(/DB_URI/);
    });

    it('passes when DB_URI is provided', () => {
      const { error } = JoiValidationSchema.validate({
        ...baseEnv,
        DB_URI: 'mongodb://localhost:27017/db',
      });
      expect(error).toBeUndefined();
    });
  });

  describe('postgres', () => {
    it('fails when neither POSTGRES_URI nor discrete credentials are provided', () => {
      const { error } = JoiValidationSchema.validate({
        ...baseEnv,
        DB_TYPE: 'postgres',
      });
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/POSTGRES_(DB|USER|PASSWORD)/);
    });

    it('passes when POSTGRES_URI is provided', () => {
      const { error } = JoiValidationSchema.validate({
        ...baseEnv,
        DB_TYPE: 'postgres',
        POSTGRES_URI: 'postgresql://user:pass@localhost:5432/db',
      });
      expect(error).toBeUndefined();
    });

    it('passes when discrete POSTGRES_DB/USER/PASSWORD are provided', () => {
      const { error } = JoiValidationSchema.validate({
        ...baseEnv,
        DB_TYPE: 'postgres',
        POSTGRES_DB: 'db',
        POSTGRES_USER: 'user',
        POSTGRES_PASSWORD: 'pass',
      });
      expect(error).toBeUndefined();
    });

    it('fails when only a subset of the discrete credentials is provided', () => {
      const { error } = JoiValidationSchema.validate({
        ...baseEnv,
        DB_TYPE: 'postgres',
        POSTGRES_DB: 'db',
      });
      expect(error).toBeDefined();
    });
  });
});
