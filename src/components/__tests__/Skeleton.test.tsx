import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SkeletonBlock, ParkDetailSkeleton } from '../Skeleton';

describe('SkeletonBlock', () => {
  it('renders with given dimensions and testID', () => {
    render(<SkeletonBlock width={100} height={20} testID="test-skeleton" />);
    expect(screen.getByTestId('test-skeleton')).toBeOnTheScreen();
  });
});

describe('ParkDetailSkeleton', () => {
  it('renders without error', () => {
    render(<ParkDetailSkeleton />);
    expect(screen.getByTestId('park-detail-skeleton')).toBeOnTheScreen();
  });
});
