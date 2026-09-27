import { LicensedImageProvider } from '../licensedImageProvider';
import type { ImageMetadata } from '../imageMetadata';

const image = (sourceUrl: string): ImageMetadata => ({
  sourceUrl,
  creator: 'Creator',
  license: { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
  attribution: 'Creator',
  thumbnailUrl: `${sourceUrl}/thumb.jpg`,
  fetchedAt: '2026-09-27T12:00:00.000Z',
});

describe('LicensedImageProvider', () => {
  it('returns Commons results first without calling Openverse', async () => {
    const commons = { searchImages: jest.fn().mockResolvedValue([image('https://commons/a')]) };
    const openverse = { searchImages: jest.fn() };
    const provider = new LicensedImageProvider({ commons, openverse });

    await expect(provider.searchImages('Park')).resolves.toEqual([image('https://commons/a')]);
    expect(openverse.searchImages).not.toHaveBeenCalled();
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
          image('https://openverse/b'),
          image('https://openverse/b'),
        ]),
    };
    const provider = new LicensedImageProvider({ commons, openverse });

    await expect(provider.searchImages('Park')).resolves.toEqual([
      image('https://commons/a'),
      image('https://openverse/b'),
    ]);
    await expect(provider.searchImages('Park 2')).resolves.toEqual([
      image('https://commons/a'),
      image('https://openverse/b'),
    ]);
  });

  it('returns an empty result when both providers fail', async () => {
    const provider = new LicensedImageProvider({
      commons: { searchImages: jest.fn().mockRejectedValue(new Error('commons')) },
      openverse: { searchImages: jest.fn().mockRejectedValue(new Error('openverse')) },
    });

    await expect(provider.searchImages('Park')).resolves.toEqual([]);
  });
});
