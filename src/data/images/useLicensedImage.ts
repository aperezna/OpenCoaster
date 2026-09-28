import { useQueries, useQuery } from '@tanstack/react-query';
import { OPENCOASTER_KEY_PREFIX } from '../cache/queryClient';
import type { ImageMetadata } from './imageMetadata';
import { LicensedImageProvider, type ImageSearchProvider } from './licensedImageProvider';

const defaultProvider = new LicensedImageProvider();
const LICENSED_IMAGE_QUERY_KEY_SEGMENT = 'licensedImage-v3';

function licensedImageQueryKey(normalizedQuery: string): readonly string[] {
  return [...OPENCOASTER_KEY_PREFIX, LICENSED_IMAGE_QUERY_KEY_SEGMENT, normalizedQuery];
}

export function useLicensedImage(
  query: string,
  provider: ImageSearchProvider = defaultProvider,
  enabled = true,
): {
  image: ImageMetadata | undefined;
  isLoading: boolean;
  isResolved: boolean;
  refetch: () => void;
} {
  const normalizedQuery = query.trim().replace(/\s+/g, ' ').toLowerCase();
  const imageQuery = useQuery({
    queryKey: licensedImageQueryKey(normalizedQuery),
    queryFn: async () => {
      try {
        return (await provider.searchImages(query))[0] ?? null;
      } catch {
        return null;
      }
    },
    enabled: enabled && normalizedQuery.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
  });

  return {
    image: imageQuery.data ?? undefined,
    isLoading: imageQuery.isLoading,
    isResolved: !enabled || imageQuery.isFetched,
    refetch: () => {
      void imageQuery.refetch();
    },
  };
}

export function useLicensedImages(
  items: readonly { query: string; image?: ImageMetadata }[],
  provider: ImageSearchProvider = defaultProvider,
): (ImageMetadata | undefined)[] {
  const queries = useQueries({
    queries: items.map((item) => {
      const normalizedQuery = item.query.trim().replace(/\s+/g, ' ').toLowerCase();
      return {
        queryKey: licensedImageQueryKey(normalizedQuery),
        queryFn: async () => {
          try {
            return (await provider.searchImages(item.query))[0] ?? null;
          } catch {
            return null;
          }
        },
        enabled: !item.image && normalizedQuery.length > 0,
        staleTime: 24 * 60 * 60 * 1000,
      };
    }),
  });

  return items.map((item, index) => item.image ?? queries[index]?.data ?? undefined);
}
