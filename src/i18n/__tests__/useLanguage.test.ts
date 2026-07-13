import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';
import { initI18n } from '../config';
import { useLanguage } from '../useLanguage';

// ---------------------------------------------------------------------------
// Mock AsyncStorage
// ---------------------------------------------------------------------------

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useLanguage', () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start with en as default when no persisted language', async () => {
    mockedAsyncStorage.getItem.mockResolvedValue(null);

    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(result.current.language).toBe('en');
    expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith('@opencoaster/language');
  });

  it('should load persisted es language from AsyncStorage', async () => {
    mockedAsyncStorage.getItem.mockResolvedValue('es');

    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(result.current.language).toBe('es');
  });

  it('should persist language change to AsyncStorage via setLanguage', async () => {
    mockedAsyncStorage.getItem.mockResolvedValue(null);
    mockedAsyncStorage.setItem.mockResolvedValue(undefined);

    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    await act(async () => {
      await result.current.setLanguage('es');
    });

    expect(result.current.language).toBe('es');
    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith('@opencoaster/language', 'es');
  });

  it('should reject invalid language and stay on current language', async () => {
    mockedAsyncStorage.getItem.mockResolvedValue(null);
    mockedAsyncStorage.setItem.mockResolvedValue(undefined);

    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    const currentLanguage = result.current.language;

    await act(async () => {
      await result.current.setLanguage('fr' as 'en');
    });

    expect(result.current.language).toBe(currentLanguage);
    expect(mockedAsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('should update the i18next language when setLanguage is called', async () => {
    mockedAsyncStorage.getItem.mockResolvedValue(null);
    mockedAsyncStorage.setItem.mockResolvedValue(undefined);

    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    await act(async () => {
      await result.current.setLanguage('es');
    });

    expect(i18next.language).toBe('es');
  });

  afterAll(async () => {
    await i18next.changeLanguage('en');
  });
});
