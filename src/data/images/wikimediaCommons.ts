import { filterCompatibleImages, type ImageMetadata } from './imageMetadata';
import { AsyncStorageImageMetadataCache, type ImageMetadataCache } from './imageMetadataCache';

export const WIKIMEDIA_COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const THUMBNAIL_WIDTH = 800;
const DEFAULT_CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_THROTTLE_MS = 1000;
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_USER_AGENT = 'OpenCoaster/0.1 (licensed image retrieval)';

interface ExtMetadataValue {
  value?: unknown;
}

interface WikimediaImageInfo {
  descriptionurl?: string;
  thumburl?: string;
  url?: string;
  extmetadata?: Record<string, ExtMetadataValue>;
}

interface WikimediaResponse {
  query?: { pages?: Record<string, { imageinfo?: WikimediaImageInfo[] }> };
}

export interface WikimediaCommonsOptions {
  cache?: ImageMetadataCache;
  fetcher?: (url: string, options?: RequestInit) => Promise<WikimediaResponse>;
  now?: () => number;
  cacheExpiryMs?: number;
  throttleMs?: number;
  timeoutMs?: number;
  userAgent?: string;
}

function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ').toLowerCase();
}

function metadataText(metadata: Record<string, ExtMetadataValue>, key: string): string {
  const value = metadata[key]?.value;
  return typeof value === 'string' ? value.trim() : '';
}

export class WikimediaCommonsProvider {
  private readonly cache: ImageMetadataCache;
  private readonly fetcher: NonNullable<WikimediaCommonsOptions['fetcher']>;
  private readonly now: () => number;
  private readonly cacheExpiryMs: number;
  private readonly throttleMs: number;
  private readonly timeoutMs: number;
  private readonly userAgent: string;
  private requestQueue: Promise<void> = Promise.resolve();
  private readonly inFlight = new Map<string, Promise<ImageMetadata[]>>();
  private lastRequestAt = -Infinity;

  constructor(options: WikimediaCommonsOptions = {}) {
    this.cache = options.cache ?? new AsyncStorageImageMetadataCache();
    this.fetcher =
      options.fetcher ??
      ((url, requestOptions) =>
        fetch(url, requestOptions).then((response) => {
          if (!response.ok) {
            throw new Error(
              `Wikimedia Commons API error: ${response.status} ${response.statusText}`,
            );
          }
          return response.json() as Promise<WikimediaResponse>;
        }));
    this.now = options.now ?? Date.now;
    this.cacheExpiryMs = options.cacheExpiryMs ?? DEFAULT_CACHE_EXPIRY_MS;
    this.throttleMs = options.throttleMs ?? DEFAULT_THROTTLE_MS;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  }

  async searchImages(query: string): Promise<ImageMetadata[]> {
    const normalizedQuery = normalizeQuery(query);
    if (!normalizedQuery) return [];

    const cached = await this.cache.get(normalizedQuery, this.now());
    if (cached) return cached;

    const existingRequest = this.inFlight.get(normalizedQuery);
    if (existingRequest) return existingRequest;

    const request = this.enqueueRequest(() => this.fetchImages(normalizedQuery))
      .then((images) => filterCompatibleImages(images))
      .then(async (compatibleImages) => {
        await this.cache.set(normalizedQuery, compatibleImages, this.now() + this.cacheExpiryMs);
        return compatibleImages;
      });
    this.inFlight.set(normalizedQuery, request);
    request.then(
      () => this.inFlight.delete(normalizedQuery),
      () => this.inFlight.delete(normalizedQuery),
    );
    return request;
  }

  private enqueueRequest<T>(request: () => Promise<T>): Promise<T> {
    const run = this.requestQueue.then(async () => {
      const waitMs = Math.max(0, this.lastRequestAt + this.throttleMs - this.now());
      if (waitMs > 0) await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
      this.lastRequestAt = this.now();
      return request();
    });
    this.requestQueue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async fetchImages(query: string): Promise<ImageMetadata[]> {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      generator: 'search',
      gsrnamespace: '6',
      gsrsearch: query,
      gsrlimit: '20',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: String(THUMBNAIL_WIDTH),
    });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(`${WIKIMEDIA_COMMONS_API}?${params.toString()}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json', 'User-Agent': this.userAgent },
      });
      return this.mapResponse(response);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private mapResponse(response: WikimediaResponse): ImageMetadata[] {
    const fetchedAt = new Date(this.now()).toISOString();
    const pages = Object.values(response.query?.pages ?? {});
    return pages.flatMap((page) => {
      const info = page.imageinfo?.[0];
      if (!info) return [];
      const metadata = info.extmetadata ?? {};
      const sourceUrl = info.descriptionurl;
      const thumbnailUrl = info.thumburl ?? info.url;
      const licenseName = metadataText(metadata, 'LicenseShortName');
      if (!sourceUrl || !thumbnailUrl || !licenseName) return [];
      const creator = metadataText(metadata, 'Artist') || metadataText(metadata, 'Creator');
      const licenseUrl = metadataText(metadata, 'LicenseUrl');
      const attribution = metadataText(metadata, 'Credit') || creator;
      return [
        {
          sourceUrl,
          creator,
          license: { name: licenseName, url: licenseUrl },
          attribution,
          thumbnailUrl,
          fetchedAt,
        },
      ];
    });
  }
}

export { normalizeQuery };
