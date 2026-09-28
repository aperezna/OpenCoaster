import type { ImageMetadata } from './imageMetadata';
import { OpenverseProvider } from './openverse';
import { WikimediaCommonsProvider } from './wikimediaCommons';

export interface ImageSearchProvider {
  searchImages(query: string): Promise<ImageMetadata[]>;
}

export interface LicensedImageProviderOptions {
  commons?: ImageSearchProvider;
  openverse?: ImageSearchProvider;
}

function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ').toLowerCase();
}

const RELEVANCE_STOP_WORDS = new Set(['and', 'at', 'for', 'in', 'of', 'on', 'the', 'to']);

function meaningfulTokens(value: string): string[] {
  return Array.from(
    new Set(
      value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .match(/[a-z0-9]+/g)
        ?.filter((token) => token.length > 2 && !RELEVANCE_STOP_WORDS.has(token)) ?? [],
    ),
  );
}

function relevanceText(image: ImageMetadata): string {
  return [image.title, image.attribution, image.sourceUrl].filter(Boolean).join(' ');
}

/**
 * Keep contextual searches conservative: every meaningful query token must be
 * present in provider metadata, while single-token legacy searches retain their
 * provider ordering. Matching candidates are ranked by token coverage.
 */
export function filterRelevantImages(
  query: string,
  images: readonly ImageMetadata[],
): ImageMetadata[] {
  const queryTokens = meaningfulTokens(query);
  if (queryTokens.length < 2) return [...images];

  return images
    .map((image, index) => {
      const candidateTokens = new Set(meaningfulTokens(relevanceText(image)));
      const matchedTokens = queryTokens.filter((token) => candidateTokens.has(token));
      return { image, index, matchedCount: matchedTokens.length };
    })
    .filter(({ matchedCount }) => matchedCount === queryTokens.length)
    .sort((left, right) => right.matchedCount - left.matchedCount || left.index - right.index)
    .map(({ image }) => image);
}

function deduplicateBySourceUrl(images: readonly ImageMetadata[]): ImageMetadata[] {
  const seen = new Set<string>();
  return images.filter((image) => {
    if (seen.has(image.sourceUrl)) return false;
    seen.add(image.sourceUrl);
    return true;
  });
}

function isWikimediaUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === 'wikimedia.org' || hostname.endsWith('.wikimedia.org');
  } catch {
    return false;
  }
}

function isDirectlyLoadableOpenverseImage(image: ImageMetadata): boolean {
  return !isWikimediaUrl(image.originalUrl ?? image.thumbnailUrl);
}

export class LicensedImageProvider implements ImageSearchProvider {
  private readonly commons: ImageSearchProvider;
  private readonly openverse: ImageSearchProvider;
  private readonly inFlight = new Map<string, Promise<ImageMetadata[]>>();

  constructor(options: LicensedImageProviderOptions = {}) {
    this.commons = options.commons ?? new WikimediaCommonsProvider();
    this.openverse = options.openverse ?? new OpenverseProvider();
  }

  async searchImages(query: string): Promise<ImageMetadata[]> {
    const normalizedQuery = normalizeQuery(query);
    if (!normalizedQuery) return [];

    const existingRequest = this.inFlight.get(normalizedQuery);
    if (existingRequest) return existingRequest;

    const request = this.searchWithFallback(normalizedQuery);
    this.inFlight.set(normalizedQuery, request);
    request.then(
      () => this.inFlight.delete(normalizedQuery),
      () => this.inFlight.delete(normalizedQuery),
    );
    return request;
  }

  private async searchWithFallback(query: string): Promise<ImageMetadata[]> {
    let commonsImages: ImageMetadata[] = [];
    try {
      commonsImages = await this.commons.searchImages(query);
    } catch {
      // A recoverable Commons error should not prevent the fallback provider.
    }
    let openverseImages: ImageMetadata[] = [];
    try {
      openverseImages = await this.openverse.searchImages(query);
    } catch {
      // Degrade to no images when both providers are unavailable.
    }
    const relevantCommonsImages = filterRelevantImages(query, commonsImages);
    const relevantOpenverseImages = filterRelevantImages(query, openverseImages);
    const directOpenverseImages = relevantOpenverseImages.filter(isDirectlyLoadableOpenverseImage);
    const fallbackOpenverseImages = relevantOpenverseImages.filter(
      (image) => !isDirectlyLoadableOpenverseImage(image),
    );
    return deduplicateBySourceUrl([
      ...directOpenverseImages,
      ...relevantCommonsImages,
      ...fallbackOpenverseImages,
    ]);
  }
}
