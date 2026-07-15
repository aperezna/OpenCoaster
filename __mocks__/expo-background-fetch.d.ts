declare module 'expo-background-fetch' {
  export const BackgroundFetchResult: {
    NewData: 1;
    Failed: 2;
    NoData: 3;
  };
  export function registerTaskAsync(
    taskName: string,
    options?: { minimumInterval?: number; stopOnTerminate?: boolean; startOnBoot?: boolean },
  ): Promise<void>;
}
