export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface Coords {
  latitude: number;
  longitude: number;
}

export interface LocationService {
  requestPermission(): Promise<PermissionStatus>;
  getCurrentPosition(): Promise<Coords | null>;
}
