import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  LocationPermissionResponse,
} from 'expo-location';
import type { LocationService, Coords, PermissionStatus } from './LocationService';

function mapPermission(permission: LocationPermissionResponse): PermissionStatus {
  if (permission.granted) return 'granted';
  if (permission.canAskAgain) return 'undetermined';
  return 'denied';
}

export class ExpoLocationService implements LocationService {
  async requestPermission(): Promise<PermissionStatus> {
    const response = await requestForegroundPermissionsAsync();
    return mapPermission(response);
  }

  async getCurrentPosition(): Promise<Coords | null> {
    const permission = await this.requestPermission();
    if (permission !== 'granted') return null;

    const position = await getCurrentPositionAsync({});
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  }
}
