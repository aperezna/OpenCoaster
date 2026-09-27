import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ImageMetadata } from './imageMetadata';

export const IMAGE_METADATA_CACHE_KEY = 'opencoaster:image-metadata-cache';

export interface ImageMetadataCache {
  get(query: string, now: number): Promise<ImageMetadata[] | undefined>;
  set(query: string, images: ImageMetadata[], expiresAt: number): Promise<void>;
}

interface CacheEntry {
  images: ImageMetadata[];
  expiresAt: number;
}

type CacheMap = Record<string, CacheEntry>;

export class AsyncStorageImageMetadataCache implements ImageMetadataCache {
  private entries: CacheMap | null = null;
  private loadPromise: Promise<CacheMap> | null = null;

  private async load(): Promise<CacheMap> {
    if (this.entries) return this.entries;
    if (!this.loadPromise) {
      this.loadPromise = AsyncStorage.getItem(IMAGE_METADATA_CACHE_KEY)
        .then((raw) => {
          try {
            const parsed: unknown = raw ? JSON.parse(raw) : {};
            this.entries =
              parsed && typeof parsed === 'object' && !Array.isArray(parsed)
                ? (parsed as CacheMap)
                : {};
          } catch {
            this.entries = {};
          }
          return this.entries;
        })
        .catch(() => {
          this.entries = {};
          return this.entries;
        });
    }
    return this.loadPromise;
  }

  async get(query: string, now: number): Promise<ImageMetadata[] | undefined> {
    const entry = (await this.load())[query];
    if (!entry || entry.expiresAt <= now) return undefined;
    return entry.images;
  }

  async set(query: string, images: ImageMetadata[], expiresAt: number): Promise<void> {
    const entries = await this.load();
    entries[query] = { images, expiresAt };
    try {
      await AsyncStorage.setItem(IMAGE_METADATA_CACHE_KEY, JSON.stringify(entries));
    } catch {
      // The in-memory entry remains usable even when persistence is unavailable.
    }
  }
}
