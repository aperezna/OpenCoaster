declare module 'expo-notifications' {
  export interface NotificationContent {
    title: string;
    body: string;
    data?: Record<string, any>;
  }

  export interface NotificationRequestInput {
    content: NotificationContent;
    trigger: any;
  }

  export const AndroidImportance: {
    HIGH: 4;
  };

  export function setNotificationChannelAsync(
    channelId: string,
    channel: {
      name: string;
      importance: number;
      vibrationPattern?: number[];
      lightColor?: string;
    },
  ): Promise<void>;

  export function scheduleNotificationAsync(request: NotificationRequestInput): Promise<string>;

  export function requestPermissionsAsync(): Promise<{ status: string }>;

  export function getPermissionsAsync(): Promise<{ status: string }>;
}
