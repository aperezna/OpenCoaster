import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ErrorState from '../ErrorState';

// react-i18next is auto-mocked via jest.config.js moduleNameMapper
// t(key) returns the key itself, so we assert key names directly

describe('ErrorState', () => {
  it('should render the default translated error message', () => {
    render(<ErrorState />);
    expect(screen.getByText('common.error')).toBeOnTheScreen();
  });

  it('should render the retry button with translated text when onRetry is provided', () => {
    const onRetry = jest.fn();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByText('common.retry')).toBeOnTheScreen();
  });

  it('should not render retry button when onRetry is omitted', () => {
    render(<ErrorState />);
    expect(screen.queryByText('common.retry')).toBeNull();
  });

  it('should use a custom message when provided', () => {
    render(<ErrorState message="Custom error" />);
    expect(screen.getByText('Custom error')).toBeOnTheScreen();
  });
});
