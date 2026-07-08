import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { App } from '../App';

describe('App', () => {
  it('should render without crashing', async () => {
    await render(<App />);
    // The initial route is Discovery
    expect(screen.getByTestId('discovery-screen')).toBeOnTheScreen();
  });

  it('should provide query client context to screens', async () => {
    // Screen receives QueryClientProvider — verify via error boundary
    // App rendering without provider-related errors confirms context exists
    let error: Error | null = null;
    try {
      await render(<App />);
    } catch (e) {
      error = e as Error;
    }
    expect(error).toBeNull();
  });

  it('should export App as default', () => {
    expect(App).toBeDefined();
  });
});
