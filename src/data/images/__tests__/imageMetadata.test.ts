import {
  filterCompatibleImages,
  isCompatibleLicense,
  sanitizeAttribution,
  type ImageMetadata,
} from '../imageMetadata';

const image = (licenseName: string): ImageMetadata => ({
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:Park.jpg',
  creator: 'A. Creator',
  license: {
    name: licenseName,
    url: 'https://creativecommons.org/licenses/by/4.0/',
  },
  attribution: 'A. Creator, CC BY 4.0',
  thumbnailUrl: 'https://example.com/thumbnail.jpg',
  fetchedAt: '2026-09-27T12:00:00.000Z',
});

describe('image metadata contracts', () => {
  it('preserves source, creator, license, attribution, thumbnail, and fetched timestamp', () => {
    const metadata = image('CC BY 4.0');

    expect(metadata).toEqual({
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Park.jpg',
      creator: 'A. Creator',
      license: {
        name: 'CC BY 4.0',
        url: 'https://creativecommons.org/licenses/by/4.0/',
      },
      attribution: 'A. Creator, CC BY 4.0',
      thumbnailUrl: 'https://example.com/thumbnail.jpg',
      fetchedAt: '2026-09-27T12:00:00.000Z',
    });
  });

  it('sanitizes provider HTML and common entities while preserving readable attribution', () => {
    expect(
      sanitizeAttribution('<a href="https://example.com">A. Creator</a> &amp; <b>OpenCoaster</b>'),
    ).toBe('A. Creator & OpenCoaster');
    expect(sanitizeAttribution('A. Creator, CC BY 4.0')).toBe('A. Creator, CC BY 4.0');
    expect(sanitizeAttribution('Line one<br />Line two&nbsp;&mdash; 2026')).toBe(
      'Line one Line two — 2026',
    );
  });
});

describe('compatible image licenses', () => {
  it.each(['CC0 1.0', 'Public Domain', 'CC BY 4.0', 'CC BY-SA 4.0'])(
    'accepts %s',
    (licenseName) => {
      expect(isCompatibleLicense({ name: licenseName, url: 'https://example.com/license' })).toBe(
        true,
      );
    },
  );

  it.each(['CC BY-NC 4.0', 'CC BY-ND 4.0', 'All Rights Reserved', 'Some Unknown License'])(
    'rejects %s',
    (licenseName) => {
      expect(isCompatibleLicense({ name: licenseName, url: 'https://example.com/license' })).toBe(
        false,
      );
    },
  );

  it('rejects missing licenses', () => {
    expect(isCompatibleLicense(undefined)).toBe(false);
    expect(isCompatibleLicense(null)).toBe(false);
  });

  it('filters a collection without changing compatible metadata', () => {
    const compatible = image('CC BY-SA 4.0');
    const images = [compatible, image('CC BY-NC 4.0'), image('All Rights Reserved')];

    expect(filterCompatibleImages(images)).toEqual([compatible]);
  });
});
