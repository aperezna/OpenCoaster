import en from '../locales/en.json';
import es from '../locales/es.json';

const REQUIRED_KEYS = [
  'busyMeter.low',
  'busyMeter.moderate',
  'busyMeter.busy',
  'busyMeter.cachedAgo',
  'notifications.threshold',
  'notifications.minutes',
  'notifications.setThreshold',
  'notifications.permissionDenied',
  'notifications.openSettings',
  'notifications.removeMonitoring',
  'profile.monitoredAttractions',
  'profile.noMonitoredAttractions',
] as const;

describe('notifications + busy meter locale bundles', () => {
  it.each([
    ['en', en],
    ['es', es],
  ])('includes the Phase 5 keys in %s', (_language, messages) => {
    const locale = messages as Record<string, string>;

    for (const key of REQUIRED_KEYS) {
      expect(locale[key]).toEqual(expect.any(String));
      expect(locale[key].trim().length).toBeGreaterThan(0);
    }
  });
});
