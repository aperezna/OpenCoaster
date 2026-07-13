import type { LocationService, Coords, PermissionStatus } from '../LocationService';
import { SyncPromise } from '../../../../test-utils/syncThenable';

export type FakeOutcome = 'granted' | 'denied' | 'undetermined' | 'error';

export class FakeLocationService implements LocationService {
  private outcome: FakeOutcome;
  private coords: Coords | null;

  constructor(outcome: FakeOutcome = 'granted', coords: Coords | null = null) {
    this.outcome = outcome;
    this.coords = coords;
  }

  requestPermission(): Promise<PermissionStatus> {
    if (this.outcome === 'error') {
      return SyncPromise.reject(
        new Error('Location permission error'),
      ) as unknown as Promise<never>;
    }
    return SyncPromise.resolve(
      this.outcome as PermissionStatus,
    ) as unknown as Promise<PermissionStatus>;
  }

  getCurrentPosition(): Promise<Coords | null> {
    if (this.outcome === 'error') {
      return SyncPromise.reject(new Error('Location position error')) as unknown as Promise<never>;
    }
    if (this.outcome === 'granted') {
      return SyncPromise.resolve(this.coords) as unknown as Promise<Coords | null>;
    }
    return SyncPromise.resolve(null) as unknown as Promise<Coords | null>;
  }
}
