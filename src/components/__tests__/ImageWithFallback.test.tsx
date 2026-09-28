import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ImageWithFallback } from '../ImageWithFallback';

describe('ImageWithFallback', () => {
  it('renders the first valid URL and keeps it after a successful load', () => {
    render(
      <ImageWithFallback testID="park-image" sources={['https://cdn.example/thumbnail.jpg']} />,
    );

    const image = screen.getByTestId('park-image');
    expect(image.props.source).toEqual({ uri: 'https://cdn.example/thumbnail.jpg' });
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
