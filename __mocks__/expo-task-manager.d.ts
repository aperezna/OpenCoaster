declare module 'expo-task-manager' {
  export function defineTask(taskName: string, task: (data: any) => Promise<void>): void;
}
