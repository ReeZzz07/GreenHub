import { validateRequiredEnv } from './env.validation';

describe('validateRequiredEnv', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      JWT_SECRET: 'a-real-secret',
      REDIS_URL: 'redis://localhost:6379',
    };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('does not throw when all required vars are set to non-default values', () => {
    expect(() => validateRequiredEnv()).not.toThrow();
  });

  it('throws when a required var is missing', () => {
    delete process.env.JWT_SECRET;
    expect(() => validateRequiredEnv()).toThrow(/JWT_SECRET/);
  });

  it('throws when JWT_SECRET is left at the insecure example default', () => {
    process.env.JWT_SECRET = 'change-me-in-production';
    expect(() => validateRequiredEnv()).toThrow(/значение по умолчанию/);
  });
});
