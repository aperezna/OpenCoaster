declare module 'expo-background-fetch' {
  export const BackgroundFetchResult: {
    Failed: 2;
    NewData: 1;
    NoData: 3;
  };

  export function registerTaskAsync(
    taskName: string,
    options?: {
      minimumInterval?: number;
      startOnBoot?: boolean;
      stopOnTerminate?: boolean;
    },
  ): Promise<void>;
}

declare module 'expo-notifications' {
  export const AndroidImportance: {
    HIGH: 4;
  };

  export function getPermissionsAsync(): Promise<{ status: string }>;

  export function requestPermissionsAsync(): Promise<{ status: string }>;

  export function scheduleNotificationAsync(request: {
    content: {
      body: string;
      data?: Record<string, unknown>;
      title: string;
    };
    trigger: unknown;
  }): Promise<string>;

  export function setNotificationChannelAsync(
    channelId: string,
    channel: {
      importance: number;
      lightColor?: string;
      name: string;
      vibrationPattern?: number[];
    },
  ): Promise<void>;
}

declare module 'expo-task-manager' {
  export function defineTask(
    taskName: string,
    task: (data?: unknown) => Promise<number | void>,
  ): void;
}
