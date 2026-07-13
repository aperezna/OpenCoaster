import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useHasSeenOnboarding } from '../useHasSeenOnboarding';
import { SyncPromise } from '../../../../test-utils/syncThenable';

// ---------------------------------------------------------------------------
// In-memory storage mock
// ---------------------------------------------------------------------------

function createMockStorage(initialValue?: string | null) {
  const store: Record<string, string | null> = {};
  if (initialValue !== undefined) {
    store['opencoaster:hasSeenOnboarding'] = initialValue;
  }

  return {
    getItem: jest.fn(
      (key: string) => SyncPromise.resolve(store[key] ?? null) as unknown as Promise<string | null>,
    ),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return SyncPromise.resolve(undefined) as unknown as Promise<void>;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return SyncPromise.resolve(undefined) as unknown as Promise<void>;
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useHasSeenOnboarding', () => {
  it('should start in loading state', () => {
    const storage = createMockStorage();
    // Override getItem to return a promise that never settles,
    // so the initial 'loading' state is preserved on render.
    storage.getItem = jest.fn().mockReturnValue(new Promise<string | null>(() => {}));

    const { result } = renderHook(() => useHasSeenOnboarding(storage));

    expect(result.current.status).toBe('loading');
  });

  it('should return unseen when no flag is stored (first launch)', async () => {
    const storage = createMockStorage();
    const { result } = renderHook(() => useHasSeenOnboarding(storage));

    await waitFor(() => {
      expect(result.current.status).not.toBe('loading');
    });

    expect(result.current.status).toBe('unseen');
  });

  it('should return seen when flag is stored as "true"', async () => {
    const storage = createMockStorage('true');
    const { result } = renderHook(() => useHasSeenOnboarding(storage));

    await waitFor(() => {
      expect(result.current.status).not.toBe('loading');
    });

    expect(result.current.status).toBe('seen');
  });

  it('should treat corrupt (non-boolean) stored value as unseen', async () => {
    const storage = createMockStorage('not-a-boolean');
    const { result } = renderHook(() => useHasSeenOnboarding(storage));

    await waitFor(() => {
      expect(result.current.status).not.toBe('loading');
    });

    expect(result.current.status).toBe('unseen');
  });

  it('should set flag to "true" when completeOnboarding is called', async () => {
    const storage = createMockStorage();
    const { result } = renderHook(() => useHasSeenOnboarding(storage));

    await waitFor(() => {
      expect(result.current.status).not.toBe('loading');
    });

    await act(async () => {
      await result.current.completeOnboarding();
    });

    expect(result.current.status).toBe('seen');
    expect(storage.setItem).toHaveBeenCalledWith('opencoaster:hasSeenOnboarding', 'true');
  });

  it('should handle AsyncStorage error gracefully (unseen fallback)', async () => {
    const storage = createMockStorage();
    storage.getItem.mockRejectedValue(new Error('Storage error'));

    const { result } = renderHook(() => useHasSeenOnboarding(storage));

    await waitFor(() => {
      expect(result.current.status).not.toBe('loading');
    });

    expect(result.current.status).toBe('unseen');
  });
});
