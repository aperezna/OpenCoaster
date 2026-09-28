import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ImageWithFallback } from '../ImageWithFallback';

describe('ImageWithFallback', () => {
  const expectedHeaders = {
    'User-Agent': 'OpenCoaster/0.1 (https://github.com/aperezna/OpenCoaster)',
  };

  it('renders the first valid URL and keeps it after a successful load', () => {
    render(
      <ImageWithFallback testID="park-image" sources={['https://cdn.example/thumbnail.jpg']} />,
    );

    const image = screen.getByTestId('park-image');
    expect(image.props.source).toEqual({
      uri: 'https://cdn.example/thumbnail.jpg',
      headers: expectedHeaders,
    });
    fireEvent(image, 'onLoad');
    expect(screen.getByTestId('park-image')).toBeTruthy();
  });

  it('tries the next valid URL after an image failure', () => {
    render(
      <ImageWithFallback
        testID="park-image"
        sources={['https://cdn.example/thumbnail.jpg', 'https://cdn.example/original.jpg']}
      />,
    );

    fireEvent(screen.getByTestId('park-image'), 'onError');
    expect(screen.getByTestId('park-image').props.source).toEqual({
      uri: 'https://cdn.example/original.jpg',
      headers: expectedHeaders,
    });
  });

  it('normalizes Wikimedia image URLs and sends compatible request headers', () => {
    render(
      <ImageWithFallback
        testID="wikimedia-image"
        sources={[
          'https://thumb.wikimedia.org/example.jpg?width=640&utm_source=commons&utm_campaign=api',
        ]}
      />,
    );

    expect(screen.getByTestId('wikimedia-image').props.source).toEqual({
      uri: 'https://thumb.wikimedia.org/example.jpg?width=640',
      headers: {
        ...expectedHeaders,
        Referer: 'https://commons.wikimedia.org/',
      },
    });
  });

  it('preserves non-tracking query parameters and does not alter non-Wikimedia URLs', () => {
    render(
      <ImageWithFallback
        testID="external-image"
        sources={['https://cdn.example/thumbnail.jpg?width=640&utm_source=keep-this-external-url']}
      />,
    );

    expect(screen.getByTestId('external-image').props.source).toEqual({
      uri: 'https://cdn.example/thumbnail.jpg?width=640&utm_source=keep-this-external-url',
      headers: expectedHeaders,
    });
  });

  it('does not pass invalid URLs to Image and shows a truthful placeholder when exhausted', () => {
    render(
      <ImageWithFallback
        testID="park-image"
        sources={['file:///unsafe.jpg', 'javascript:alert(1)', 'not a URL']}
      />,
    );

    expect(screen.queryByTestId('park-image')).toBeNull();
    expect(screen.getByTestId('park-image-placeholder')).toBeTruthy();
    expect(screen.getByText('images.unavailable')).toBeTruthy();
  });
});
