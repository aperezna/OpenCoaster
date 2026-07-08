import type { LocationService, Coords, PermissionStatus } from '../LocationService';

export type FakeOutcome = 'granted' | 'denied' | 'undetermined' | 'error';

export class FakeLocationService implements LocationService {
  private outcome: FakeOutcome;
  private coords: Coords | null;

  constructor(outcome: FakeOutcome = 'granted', coords: Coords | null = null) {
    this.outcome = outcome;
    this.coords = coords;
  }

  async requestPermission(): Promise<PermissionStatus> {
    if (this.outcome === 'error') {
      throw new Error('Location permission error');
    }
    return this.outcome as PermissionStatus;
  }

  async getCurrentPosition(): Promise<Coords | null> {
    if (this.outcome === 'error') {
      throw new Error('Location position error');
    }
    if (this.outcome === 'granted') {
      return this.coords;
    }
    return null;
  }
}
