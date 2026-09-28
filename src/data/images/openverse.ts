import { filterCompatibleImages, type ImageMetadata } from './imageMetadata';
import { AsyncStorageImageMetadataCache, type ImageMetadataCache } from './imageMetadataCache';

export const OPENVERSE_IMAGES_API = 'https://api.openverse.org/v1/images/';
const PAGE_SIZE = 20;
const DEFAULT_CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_USER_AGENT = 'OpenCoaster/0.1 (licensed image retrieval)';

interface OpenverseRecord {
  foreign_landing_url?: string;
  creator?: string | null;
  license?: string | null;
  license_version?: string | null;
  license_url?: string | null;
  thumbnail?: string | null;
  url?: string | null;
}

interface OpenverseResponse {
  results?: OpenverseRecord[];
}

export interface OpenverseOptions {
  cache?: ImageMetadataCache;
  fetcher?: (url: string, options?: RequestInit) => Promise<OpenverseResponse>;
  now?: () => number;
  cacheExpiryMs?: number;
  timeoutMs?: number;
  userAgent?: string;
}

function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ').toLowerCase();
}

function licenseName(record: OpenverseRecord): string {
  const version = record.license_version?.trim();
  switch (record.license?.toLowerCase()) {
    case 'cc0':
      return version ? `CC0 ${version}` : 'CC0';
    case 'pdm':
    case 'pd':
      return 'Public Domain';
    case 'by':
      return version ? `CC BY ${version}` : 'CC BY';
    case 'by-sa':
      return version ? `CC BY-SA ${version}` : 'CC BY-SA';
    default:
      return '';
  }
}

export class OpenverseProvider {
  private readonly cache: ImageMetadataCache;
  private readonly fetcher: NonNullable<OpenverseOptions['fetcher']>;
  private readonly now: () => number;
  private readonly cacheExpiryMs: number;
  private readonly timeoutMs: number;
  private readonly userAgent: string;
  private readonly inFlight = new Map<string, Promise<ImageMetadata[]>>();

  constructor(options: OpenverseOptions = {}) {
    this.cache = options.cache ?? new AsyncStorageImageMetadataCache();
    this.fetcher =
      options.fetcher ??
      ((url, requestOptions) =>
        fetch(url, requestOptions).then((response) => {
          if (!response.ok) {
            throw new Error(`Openverse API error: ${response.status} ${response.statusText}`);
          }
          return response.json() as Promise<OpenverseResponse>;
        }));
    this.now = options.now ?? Date.now;
    this.cacheExpiryMs = options.cacheExpiryMs ?? DEFAULT_CACHE_EXPIRY_MS;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  }

  async searchImages(query: string): Promise<ImageMetadata[]> {
    const normalizedQuery = normalizeQuery(query);
    if (!normalizedQuery) return [];

    const cacheKey = `openverse:${normalizedQuery}`;
    const cached = await this.cache.get(cacheKey, this.now());
    if (cached) return cached;

    const existingRequest = this.inFlight.get(normalizedQuery);
    if (existingRequest) return existingRequest;

    const request = this.fetchImages(normalizedQuery)
      .then((response) => this.mapResponse(response))
      .then((images) => filterCompatibleImages(images))
      .then(async (images) => {
        await this.cache.set(cacheKey, images, this.now() + this.cacheExpiryMs);
        return images;
      });
    this.inFlight.set(normalizedQuery, request);
    request.then(
      () => this.inFlight.delete(normalizedQuery),
      () => this.inFlight.delete(normalizedQuery),
    );
    return request;
  }

  private async fetchImages(query: string): Promise<OpenverseResponse> {
    const params = new URLSearchParams({
      q: query,
      license_type: 'commercial',
      page_size: String(PAGE_SIZE),
    });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.fetcher(`${OPENVERSE_IMAGES_API}?${params.toString()}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json', 'User-Agent': this.userAgent },
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private mapResponse(response: OpenverseResponse): ImageMetadata[] {
    const fetchedAt = new Date(this.now()).toISOString();
    return (response.results ?? []).flatMap((record) => {
      const sourceUrl = record.foreign_landing_url?.trim();
      const thumbnailUrl = record.thumbnail?.trim();
      const originalUrl = record.url?.trim();
      const creator = record.creator?.trim() ?? '';
      const name = licenseName(record);
      if (!sourceUrl || !thumbnailUrl || !originalUrl || !name || !record.license_url?.trim()) {
        return [];
      }
      return [
        {
          sourceUrl,
          creator,
          license: { name, url: record.license_url.trim() },
          attribution: creator,
          thumbnailUrl,
          originalUrl,
          fetchedAt,
        },
      ];
    });
  }
}

export { normalizeQuery };
