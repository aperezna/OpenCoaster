import { WikimediaCommonsProvider } from '../wikimediaCommons';
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

const compatibleImage: ImageMetadata = {
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:Park.jpg',
  creator: 'A. Creator',
  license: { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
  attribution: 'A. Creator, CC BY 4.0',
  thumbnailUrl: 'https://upload.wikimedia.org/thumb.jpg',
  fetchedAt: '2026-09-27T12:00:00.000Z',
};

const responseFor = (extmetadata: Record<string, { value: string }>) => ({
  query: {
    pages: {
      '1': {
        title: 'File:Park.jpg',
        imageinfo: [
          {
            descriptionurl: compatibleImage.sourceUrl,
            thumburl: compatibleImage.thumbnailUrl,
            extmetadata,
          },
        ],
      },
    },
  },
});

describe('WikimediaCommonsProvider', () => {
  it('encodes the normalized search query and requests thumbnail metadata', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      responseFor({
        Artist: { value: 'A. Creator' },
        LicenseShortName: { value: 'CC BY 4.0' },
        LicenseUrl: { value: 'https://creativecommons.org/licenses/by/4.0/' },
        Credit: { value: 'A. Creator, CC BY 4.0' },
      }),
    );
    const provider = new WikimediaCommonsProvider({
      fetcher,
      cache: new MemoryCache(),
      now: () => 0,
      throttleMs: 0,
    });

    await provider.searchImages('  Cedar   Point ');

    const url = new URL(fetcher.mock.calls[0][0]);
    expect(url.searchParams.get('origin')).toBe('*');
    expect(url.searchParams.get('generator')).toBe('search');
    expect(url.searchParams.get('gsrnamespace')).toBe('6');
    expect(url.searchParams.get('gsrsearch')).toBe('cedar point');
    expect(url.searchParams.get('iiurlwidth')).toBe('800');
    expect(url.searchParams.get('iiprop')).toBe('url|extmetadata');
  });

  it('maps imageinfo metadata and filters incompatible licenses', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      query: {
        pages: {
          '1': {
            title: 'File:Allowed.jpg',
            imageinfo: [
              {
                descriptionurl: compatibleImage.sourceUrl,
                thumburl: compatibleImage.thumbnailUrl,
                extmetadata: {
                  Artist: { value: 'A. Creator' },
                  LicenseShortName: { value: 'CC BY 4.0' },
                  LicenseUrl: { value: compatibleImage.license.url },
                  Credit: { value: compatibleImage.attribution },
                },
              },
            ],
          },
          '2': {
            title: 'File:Nope.jpg',
            imageinfo: [
              {
                descriptionurl: 'https://commons.wikimedia.org/wiki/File:Nope.jpg',
                thumburl: 'https://upload.wikimedia.org/nope.jpg',
                extmetadata: {
                  Artist: { value: 'Unknown' },
                  LicenseShortName: { value: 'CC BY-ND 4.0' },
                  LicenseUrl: { value: 'https://creativecommons.org/licenses/by-nd/4.0/' },
                },
              },
            ],
          },
        },
      },
    });
    const provider = new WikimediaCommonsProvider({
      fetcher,
      cache: new MemoryCache(),
      now: () => 0,
      throttleMs: 0,
    });

    await expect(provider.searchImages('Park')).resolves.toEqual([
      expect.objectContaining({
        ...compatibleImage,
        title: 'File:Allowed.jpg',
        fetchedAt: new Date(0).toISOString(),
      }),
    ]);
  });

  it('retains the Wikimedia page title', async () => {
    const provider = new WikimediaCommonsProvider({
      fetcher: jest.fn().mockResolvedValue(
        responseFor({
          Artist: { value: 'A. Creator' },
          LicenseShortName: { value: 'CC BY 4.0' },
          LicenseUrl: { value: compatibleImage.license.url },
        }),
      ),
      cache: new MemoryCache(),
      now: () => 0,
      throttleMs: 0,
    });

    await expect(provider.searchImages('Park')).resolves.toEqual([
      expect.objectContaining({ title: 'File:Park.jpg' }),
    ]);
  });

  it('normalizes HTML in Wikimedia creator and credit metadata', async () => {
    const provider = new WikimediaCommonsProvider({
      fetcher: jest.fn().mockResolvedValue(
        responseFor({
          Artist: { value: '<a href="https://commons.wikimedia.org">A. Creator</a>' },
          LicenseShortName: { value: 'CC BY 4.0' },
          LicenseUrl: { value: compatibleImage.license.url },
          Credit: { value: '<b>A. Creator</b> &amp; <span>OpenCoaster</span>' },
        }),
      ),
      cache: new MemoryCache(),
      now: () => 0,
      throttleMs: 0,
    });

    await expect(provider.searchImages('Park')).resolves.toEqual([
      expect.objectContaining({
        creator: 'A. Creator',
        attribution: 'A. Creator & OpenCoaster',
      }),
    ]);
  });

  it('uses unexpired cache, then fetches after expiry', async () => {
    let now = 0;
    const fetcher = jest.fn().mockResolvedValue(
      responseFor({
        Artist: { value: 'A. Creator' },
        LicenseShortName: { value: 'CC BY 4.0' },
        LicenseUrl: { value: compatibleImage.license.url },
      }),
    );
    const provider = new WikimediaCommonsProvider({
      fetcher,
      cache: new MemoryCache(),
      now: () => now,
      throttleMs: 0,
      cacheExpiryMs: 100,
    });

    await provider.searchImages('Park');
    await provider.searchImages(' park ');
    expect(fetcher).toHaveBeenCalledTimes(1);
    now = 101;
    await provider.searchImages('Park');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('does not cache failed requests', async () => {
    const fetcher = jest
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(
        responseFor({
          Artist: { value: 'A. Creator' },
          LicenseShortName: { value: 'CC BY 4.0' },
          LicenseUrl: { value: compatibleImage.license.url },
        }),
      );
    const provider = new WikimediaCommonsProvider({
      fetcher,
      cache: new MemoryCache(),
      now: () => 0,
      throttleMs: 0,
    });

    await expect(provider.searchImages('Park')).rejects.toThrow('offline');
    await expect(provider.searchImages('Park')).resolves.toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('serializes concurrent requests so only one API request is active', async () => {
    let releaseFirst!: () => void;
    const firstDone = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const fetcher = jest
      .fn()
      .mockImplementationOnce(async () => {
        await firstDone;
        return responseFor({
          Artist: { value: 'A. Creator' },
          LicenseShortName: { value: 'CC BY 4.0' },
          LicenseUrl: { value: compatibleImage.license.url },
        });
      })
      .mockResolvedValue(
        responseFor({
          Artist: { value: 'A. Creator' },
          LicenseShortName: { value: 'CC BY 4.0' },
          LicenseUrl: { value: compatibleImage.license.url },
        }),
      );
    const provider = new WikimediaCommonsProvider({
      fetcher,
      cache: new MemoryCache(),
      now: () => 0,
      throttleMs: 0,
    });

    const first = provider.searchImages('Park');
    const second = provider.searchImages('Attraction');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetcher).toHaveBeenCalledTimes(1);
    releaseFirst();
    await Promise.all([first, second]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
