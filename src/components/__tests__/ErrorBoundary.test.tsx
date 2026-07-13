import React from 'react';
import { Text, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { captureException } from '@sentry/react-native';
import ErrorBoundary from '../ErrorBoundary';

// Helper component that throws during render
function ThrowOnRender({ message }: { message: string }): React.JSX.Element {
  throw new Error(message);
}

// Helper component that renders normally
function SafeComponent({ text }: { text: string }): React.JSX.Element {
  return (
    <View>
      <Text>{text}</Text>
    </View>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ErrorBoundary', () => {
  describe('when a child throws during render', () => {
    it('renders the fallback UI instead of crashing', () => {
      render(
        <ErrorBoundary>
          <ThrowOnRender message="Kaboom!" />
        </ErrorBoundary>,
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeOnTheScreen();
      expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
    });

    it('calls Sentry.captureException with the error', () => {
      render(
        <ErrorBoundary>
          <ThrowOnRender message="Kaboom!" />
        </ErrorBoundary>,
      );

      expect(captureException).toHaveBeenCalledTimes(1);
      expect(captureException).toHaveBeenCalledWith(expect.any(Error));
    });

    it('renders a retry button if onRetry is provided', () => {
      const onRetry = jest.fn();

      render(
        <ErrorBoundary onRetry={onRetry}>
          <ThrowOnRender message="Kaboom!" />
        </ErrorBoundary>,
      );

      expect(screen.getByTestId('error-boundary-retry')).toBeOnTheScreen();
    });

    it('does not render a retry button if onRetry is omitted', () => {
      render(
        <ErrorBoundary>
          <ThrowOnRender message="Kaboom!" />
        </ErrorBoundary>,
      );

      expect(screen.queryByTestId('error-boundary-retry')).toBeNull();
    });
  });

  describe('when no error occurs', () => {
    it('renders children normally', () => {
      render(
        <ErrorBoundary>
          <SafeComponent text="Hello World" />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Hello World')).toBeOnTheScreen();
    });

    it('does not call Sentry.captureException', () => {
      render(
        <ErrorBoundary>
          <SafeComponent text="All good" />
        </ErrorBoundary>,
      );

      expect(captureException).not.toHaveBeenCalled();
    });

    it('does not render the fallback UI', () => {
      render(
        <ErrorBoundary>
          <SafeComponent text="All good" />
        </ErrorBoundary>,
      );

      expect(screen.queryByTestId('error-boundary-fallback')).toBeNull();
    });
  });
});
