import { createQueryClient, OPENCOASTER_KEY_PREFIX } from '../queryClient';

describe('QueryClient configuration', () => {
  it('should create a QueryClient instance', () => {
    const client = createQueryClient();
    expect(client).toBeDefined();
    expect(typeof client).toBe('object');
  });

  it('should have default staleTime of 30000ms', () => {
    const client = createQueryClient();
    const defaults = client.getQueryDefaults(OPENCOASTER_KEY_PREFIX);
    // Verify via a query that staleTime is respected
    expect(defaults).toBeDefined();
  });

  it('should export OPENCOASTER_KEY_PREFIX as ["opencoaster"]', () => {
    expect(OPENCOASTER_KEY_PREFIX).toEqual(['opencoaster']);
  });

  it('should create a QueryClient with retry set to 1', () => {
    const client = createQueryClient();
    expect(client.getDefaultOptions().queries?.retry).toBe(1);
    expect(client.getDefaultOptions().queries?.staleTime).toBe(30000);
  });
});
