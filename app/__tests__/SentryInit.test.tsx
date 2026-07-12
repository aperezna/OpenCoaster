// SentryInit.test.tsx
// Tests that Sentry.init is conditionally called based on DSN presence.
// Uses jest.isolateModules to ensure fresh module evaluation per test.

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve('true')),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('App — Sentry init', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should NOT call Sentry.init when DSN is not configured', () => {
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;

    jest.isolateModules(() => {
      // Loading App triggers the module-level init check
      require('../../App');
      const Sentry = require('@sentry/react-native');
      expect(Sentry.init).not.toHaveBeenCalled();
    });
  });

  it('should call Sentry.init when DSN is configured', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://example@ingest.sentry.io/123';

    jest.isolateModules(() => {
      // Loading App triggers the module-level init check
      require('../../App');
      const Sentry = require('@sentry/react-native');
      expect(Sentry.init).toHaveBeenCalledWith({
        dsn: 'https://example@ingest.sentry.io/123',
      });
    });
  });
});
