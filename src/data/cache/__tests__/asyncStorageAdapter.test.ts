import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageAdapter } from '../asyncStorageAdapter';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('AsyncStorageAdapter', () => {
  let adapter: AsyncStorageAdapter;

  beforeEach(() => {
    adapter = new AsyncStorageAdapter();
    jest.clearAllMocks();
  });

  it('should return stored value from getItem', async () => {
    (mockedAsyncStorage.getItem as jest.Mock).mockResolvedValue('stored-value');
    const result = await adapter.getItem('test-key');
    expect(result).toBe('stored-value');
    expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith('test-key');
  });

  it('should return null from getItem when key is missing', async () => {
    (mockedAsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await adapter.getItem('missing-key');
    expect(result).toBeNull();
    expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith('missing-key');
  });

  it('should store value via setItem', async () => {
    (mockedAsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    await adapter.setItem('data-key', 'data-value');
    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith('data-key', 'data-value');
  });

  it('should remove value via removeItem', async () => {
    (mockedAsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    await adapter.removeItem('key-to-remove');
    expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('key-to-remove');
  });
});
