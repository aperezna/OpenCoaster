import { LicensedImageProvider } from '../licensedImageProvider';
import type { ImageMetadata } from '../imageMetadata';

const image = (sourceUrl: string, title?: string): ImageMetadata => ({
  sourceUrl,
  title,
  creator: 'Creator',
  license: { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
  attribution: 'Creator',
  thumbnailUrl: `${sourceUrl}/thumb.jpg`,
  fetchedAt: '2026-09-27T12:00:00.000Z',
});

describe('LicensedImageProvider', () => {
  it('prefers directly loadable Openverse results before Wikimedia results', async () => {
    const commons = { searchImages: jest.fn().mockResolvedValue([image('https://commons/a')]) };
    const openverse = {
      searchImages: jest.fn().mockResolvedValue([image('https://live.staticflickr.com/direct')]),
    };
    const provider = new LicensedImageProvider({ commons, openverse });

    await expect(provider.searchImages('Park')).resolves.toEqual([
      image('https://live.staticflickr.com/direct'),
      image('https://commons/a'),
    ]);
    expect(openverse.searchImages).toHaveBeenCalledWith('park');
  });

  it('falls back after an empty or failed Commons search, preserves order, and deduplicates source URLs', async () => {
    const commons = {
      searchImages: jest.fn().mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('offline')),
    };
    const openverse = {
      searchImages: jest
        .fn()
        .mockResolvedValue([
          image('https://commons/a'),
          image('https://upload.wikimedia.org/openverse/b'),
          image('https://upload.wikimedia.org/openverse/b'),
        ]),
    };
    const provider = new LicensedImageProvider({ commons, openverse });

    await expect(provider.searchImages('Park')).resolves.toEqual([
      image('https://commons/a'),
      image('https://upload.wikimedia.org/openverse/b'),
    ]);
    await expect(provider.searchImages('Park 2')).resolves.toEqual([
      image('https://commons/a'),
      image('https://upload.wikimedia.org/openverse/b'),
    ]);
  });

  it('returns an empty result when both providers fail', async () => {
    const provider = new LicensedImageProvider({
      commons: { searchImages: jest.fn().mockRejectedValue(new Error('commons')) },
      openverse: { searchImages: jest.fn().mockRejectedValue(new Error('openverse')) },
    });

    await expect(provider.searchImages('Park')).resolves.toEqual([]);
  });

  it('ranks and keeps only candidates matching every contextual query token', async () => {
    const provider = new LicensedImageProvider({
      commons: {
        searchImages: jest
          .fn()
          .mockResolvedValue([
            image('https://commons/unrelated', 'Magic Kingdom castle'),
            image('https://commons/relevant', 'Magic Kingdom Space Mountain'),
          ]),
      },
      openverse: { searchImages: jest.fn().mockResolvedValue([]) },
    });

    await expect(provider.searchImages('Magic Kingdom Space Mountain')).resolves.toEqual([
      image('https://commons/relevant', 'Magic Kingdom Space Mountain'),
    ]);
  });

  it('rejects candidates with no reliable title, attribution, or source-url match', async () => {
    const provider = new LicensedImageProvider({
      commons: {
        searchImages: jest
          .fn()
          .mockResolvedValue([image('https://commons/unrelated', 'Water park')]),
      },
      openverse: { searchImages: jest.fn().mockResolvedValue([]) },
    });

    await expect(provider.searchImages('Magic Kingdom Space Mountain')).resolves.toEqual([]);
  });
});
