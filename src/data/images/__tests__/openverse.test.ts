import { OpenverseProvider } from '../openverse';
import type { ImageMetadata } from '../imageMetadata';
import type { ImageMetadataCache } from '../imageMetadataCache';

class MemoryCache implements ImageMetadataCache {
  private readonly entries = new Map<string, { images: ImageMetadata[]; expiresAt: number }>();

  async get(query: string, now: number): Promise<ImageMetadata[] | undefined> {
    const entry = this.entries.get(query);
    return entry && entry.expiresAt > now ? entry.images : undefined;
  }

  async set(query: string, images: ImageMetadata[], expiresAt: number): Promise<void> {
    this.entries.set(query, { images, expiresAt });
  }
}

describe('OpenverseProvider', () => {
  it('queries bounded commercial-compatible results and maps compatible records', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      results: [
        {
          foreign_landing_url: 'https://example.com/source',
          title: 'Cedar Point roller coaster',
          creator: 'A. Creator',
          license: 'by-sa',
          license_version: '4.0',
          license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
          thumbnail: 'https://example.com/thumb.jpg',
          url: 'https://live.staticflickr.com/direct.jpg',
        },
        {
          foreign_landing_url: 'https://example.com/rejected',
          creator: 'Nope',
          license: 'by-nc',
          license_version: '4.0',
          thumbnail: 'https://example.com/rejected.jpg',
        },
      ],
    });
    const provider = new OpenverseProvider({ fetcher, cache: new MemoryCache(), now: () => 0 });

    await expect(provider.searchImages('  Cedar Point ')).resolves.toEqual([
      {
        sourceUrl: 'https://example.com/source',
        title: 'Cedar Point roller coaster',
        creator: 'A. Creator',
        license: {
          name: 'CC BY-SA 4.0',
          url: 'https://creativecommons.org/licenses/by-sa/4.0/',
        },
        attribution: 'A. Creator',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        originalUrl: 'https://live.staticflickr.com/direct.jpg',
        fetchedAt: new Date(0).toISOString(),
      },
    ]);
    const url = new URL(fetcher.mock.calls[0][0]);
    expect(url.searchParams.get('q')).toBe('cedar point');
    expect(url.searchParams.get('license_type')).toBe('commercial');
    expect(Number(url.searchParams.get('page_size'))).toBeGreaterThan(0);
    expect(Number(url.searchParams.get('page_size'))).toBeLessThanOrEqual(20);
  });

  it('retains the Openverse record title', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      results: [
        {
          foreign_landing_url: 'https://example.com/source',
          title: 'Cedar Point',
          license: 'cc0',
          license_url: 'https://creativecommons.org/publicdomain/zero/1.0/',
          thumbnail: 'https://example.com/thumb.jpg',
          url: 'https://example.com/image.jpg',
        },
      ],
    });
    const provider = new OpenverseProvider({ fetcher, cache: new MemoryCache(), now: () => 0 });

    await expect(provider.searchImages('Cedar Point')).resolves.toEqual([
      expect.objectContaining({ title: 'Cedar Point' }),
    ]);
  });

  it('aborts a request at the configured timeout and does not cache the failure', async () => {
    jest.useFakeTimers();
    const fetcher = jest.fn(
      (_url: string, options?: RequestInit) =>
        new Promise<never>((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const provider = new OpenverseProvider({
      fetcher,
      cache: new MemoryCache(),
      now: () => 0,
      timeoutMs: 10,
    });

    const request = provider.searchImages('Park');
    const firstFailure = expect(request).rejects.toThrow('aborted');
    await jest.advanceTimersByTimeAsync(10);
    await firstFailure;
    const secondFailure = expect(provider.searchImages('Park')).rejects.toThrow('aborted');
    await jest.advanceTimersByTimeAsync(10);
    await secondFailure;
    expect(fetcher).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });
});
