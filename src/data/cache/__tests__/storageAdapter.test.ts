import type { StorageAdapter } from '../storageAdapter';

describe('StorageAdapter interface', () => {
  it('should allow creating a valid StorageAdapter implementation', () => {
    const adapter: StorageAdapter = {
      getItem: async (key: string) => (key === 'test' ? 'value' : null),
      setItem: async (_key: string, _value: string) => {},
      removeItem: async (_key: string) => {},
    };

    expect(adapter).toBeDefined();
    expect(typeof adapter.getItem).toBe('function');
    expect(typeof adapter.setItem).toBe('function');
    expect(typeof adapter.removeItem).toBe('function');
  });

  it('should return string or null from getItem', async () => {
    const adapter: StorageAdapter = {
      getItem: async (key: string) => (key === 'found' ? 'data' : null),
      setItem: async () => {},
      removeItem: async () => {},
    };

    const found = await adapter.getItem('found');
    expect(found).toBe('data');

    const notFound = await adapter.getItem('missing');
    expect(notFound).toBeNull();
  });

  it('should accept string key and value for setItem', async () => {
    let storedKey = '';
    let storedValue = '';

    const adapter: StorageAdapter = {
      getItem: async () => null,
      setItem: async (key: string, value: string) => {
        storedKey = key;
        storedValue = value;
      },
      removeItem: async () => {},
    };

    await adapter.setItem('cache-key', 'cache-value');
    expect(storedKey).toBe('cache-key');
    expect(storedValue).toBe('cache-value');
  });

  it('should accept string key for removeItem', async () => {
    let removedKey = '';

    const adapter: StorageAdapter = {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async (key: string) => {
        removedKey = key;
      },
    };

    await adapter.removeItem('to-remove');
    expect(removedKey).toBe('to-remove');
  });
});
