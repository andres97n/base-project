import {
  comparePasswordWithHashed,
  hashPassword,
  hashString,
} from './brypt.util';

describe('brypt.util', () => {
  describe('hashPassword / comparePasswordWithHashed', () => {
    it('round-trips a correct password', async () => {
      const hashed = await hashPassword('S3cret!');
      await expect(comparePasswordWithHashed('S3cret!', hashed)).resolves.toBe(
        true,
      );
    });

    it('rejects an incorrect password', async () => {
      const hashed = await hashPassword('S3cret!');
      await expect(
        comparePasswordWithHashed('wrong-password', hashed),
      ).resolves.toBe(false);
    });

    it('produces a hash different from the plain text', async () => {
      const hashed = await hashPassword('S3cret!');
      expect(hashed).not.toBe('S3cret!');
    });
  });

  describe('hashString', () => {
    it('hashes a value deterministically verifiable via bcrypt', async () => {
      const hashed = await hashString('token-value');
      expect(hashed).not.toBe('token-value');
      await expect(
        comparePasswordWithHashed('token-value', hashed),
      ).resolves.toBe(true);
    });
  });
});
