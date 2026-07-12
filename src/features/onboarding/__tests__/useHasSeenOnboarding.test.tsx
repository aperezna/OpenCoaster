import { renderHook, act } from '@testing-library/react-native';
import { useHasSeenOnboarding } from '../useHasSeenOnboarding';

// ---------------------------------------------------------------------------
// In-memory storage mock
// ---------------------------------------------------------------------------

function createMockStorage(initialValue?: string | null) {
  const store: Record<string, string | null> = {};
  if (initialValue !== undefined) {
    store['opencoaster:hasSeenOnboarding'] = initialValue;
  }

  return {
    getItem: jest.fn(async (key: string) => store[key] ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn(async (key: string) => {
      delete store[key];
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useHasSeenOnboarding', () => {
  it('should start in loading state', () => {
    const storage = createMockStorage();
    const { result } = renderHook(() => useHasSeenOnboarding(storage));

    expect(result.current.status).toBe('loading');
  });

  it('should return unseen when no flag is stored (first launch)', async () => {
    const storage = createMockStorage();
    const { result } = renderHook(() => useHasSeenOnboarding(storage));

    await act(async () => {});
    await act(async () => {});

    expect(result.current.status).toBe('unseen');
  });

  it('should return seen when flag is stored as "true"', async () => {
    const storage = createMockStorage('true');
    const { result } = renderHook(() => useHasSeenOnboarding(storage));

    await act(async () => {});
    await act(async () => {});

    expect(result.current.status).toBe('seen');
  });

  it('should treat corrupt (non-boolean) stored value as unseen', async () => {
    const storage = createMockStorage('not-a-boolean');
    const { result } = renderHook(() => useHasSeenOnboarding(storage));

    await act(async () => {});
    await act(async () => {});

    expect(result.current.status).toBe('unseen');
  });

  it('should set flag to "true" when completeOnboarding is called', async () => {
    const storage = createMockStorage();
    const { result } = renderHook(() => useHasSeenOnboarding(storage));

    await act(async () => {});
    await act(async () => {});

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

    await act(async () => {});
    await act(async () => {});

    expect(result.current.status).toBe('unseen');
  });
});
