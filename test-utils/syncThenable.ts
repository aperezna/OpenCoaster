/**
 * Synchronous thenable — fulfills or rejects Promise chains synchronously,
 * so async effects resolve inside the act() boundary in tests.
 *
 * Usage: wrap return values of mock async methods that are consumed
 * by `.then()` / `.catch()` chains inside React effects.
 */

export class SyncPromise<T> {
  private value: T | undefined;
  private error: unknown;
  private resolved: boolean;

  private constructor(value: T | undefined, error: unknown, resolved: boolean) {
    this.value = value;
    this.error = error;
    this.resolved = resolved;
  }

  static resolve<T>(value: T): SyncPromise<T> {
    return new SyncPromise(value, undefined, true);
  }

  static reject<T = never>(error: unknown): SyncPromise<T> {
    return new SyncPromise(undefined as T, error, false);
  }

  then<U>(
    onFulfilled?: ((value: T) => U | SyncPromise<U> | PromiseLike<U>) | null,
    onRejected?: ((reason: unknown) => U | SyncPromise<U> | PromiseLike<U>) | null,
  ): SyncPromise<U> {
    if (!this.resolved) {
      // Rejected — call onRejected if provided, else propagate
      if (onRejected) {
        try {
          const result = onRejected(this.error);
          if (result && typeof (result as PromiseLike<U>).then === 'function') {
            // Thenable adoption — return as-is; the caller will chain .then() on it
            return result as unknown as SyncPromise<U>;
          }
          return SyncPromise.resolve(result as U);
        } catch (e) {
          return SyncPromise.reject(e);
        }
      }
      // No rejection handler — propagate rejection
      return SyncPromise.reject(this.error) as unknown as SyncPromise<U>;
    }

    if (onFulfilled) {
      try {
        const result = onFulfilled(this.value as T);
        if (result && typeof (result as PromiseLike<U>).then === 'function') {
          // Thenable adoption — chain through
          return result as unknown as SyncPromise<U>;
        }
        return SyncPromise.resolve(result as U);
      } catch (e) {
        return SyncPromise.reject(e);
      }
    }
    // No handler — propagate resolved value
    return SyncPromise.resolve(this.value as unknown as U);
  }

  catch<U>(
    onRejected?: ((reason: unknown) => U | SyncPromise<U> | PromiseLike<U>) | null,
  ): SyncPromise<T | U> {
    if (this.resolved) {
      // Already resolved — skip catch
      return SyncPromise.resolve(this.value as unknown as U) as unknown as SyncPromise<T | U>;
    }
    if (onRejected) {
      try {
        const result = onRejected(this.error);
        if (result && typeof (result as PromiseLike<U>).then === 'function') {
          return result as unknown as SyncPromise<T | U>;
        }
        return SyncPromise.resolve(result as U) as unknown as SyncPromise<T | U>;
      } catch (e) {
        return SyncPromise.reject(e) as unknown as SyncPromise<T | U>;
      }
    }
    // No handler — propagate rejection
    return SyncPromise.reject(this.error) as unknown as SyncPromise<T | U>;
  }
}
