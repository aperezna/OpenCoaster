import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useLicensedImage } from '../useLicensedImage';
import type { ImageMetadata } from '../imageMetadata';

const image: ImageMetadata = {
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:Park.jpg',
  creator: 'Creator',
  license: { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
  attribution: 'Creator',
  thumbnailUrl: 'https://commons.wikimedia.org/thumb.jpg',
  fetchedAt: '2026-09-27T12:00:00.000Z',
};

describe('useLicensedImage', () => {
  it('uses the image provider through the query cache and selects the first match', async () => {
    const provider = { searchImages: jest.fn().mockResolvedValue([image]) };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useLicensedImage('Magic Kingdom', provider), { wrapper });

    await waitFor(() => expect(result.current.image).toEqual(image));
    expect(provider.searchImages).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(result.current.image).toEqual(image));
    expect(provider.searchImages).toHaveBeenCalledTimes(1);
  });

  it('degrades to no image when lookup fails', async () => {
    const provider = { searchImages: jest.fn().mockRejectedValue(new Error('offline')) };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useLicensedImage('Magic Kingdom', provider), { wrapper });

    await waitFor(() => expect(result.current.isResolved).toBe(true));
    expect(result.current.image).toBeUndefined();
  });
});
