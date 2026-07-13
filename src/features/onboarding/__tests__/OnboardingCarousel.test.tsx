import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { OnboardingCarousel } from '../OnboardingCarousel';

// react-i18next is auto-mocked via jest.config.js moduleNameMapper
// t(key) returns the key itself, so we assert key names directly

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OnboardingCarousel', () => {
  it('should render all 3 slides with translated titles and body text', () => {
    render(<OnboardingCarousel onComplete={() => {}} />);

    const expectedKeys = [
      { title: 'onboarding.welcomeTitle', body: 'onboarding.welcomeBody' },
      { title: 'onboarding.discoverTitle', body: 'onboarding.discoverBody' },
      { title: 'onboarding.favoritesTitle', body: 'onboarding.favoritesBody' },
    ];

    expectedKeys.forEach(({ title, body }) => {
      expect(screen.getByText(title)).toBeTruthy();
      expect(screen.getByText(body)).toBeTruthy();
    });
  });

  it('should render Skip button with translated text', () => {
    render(<OnboardingCarousel onComplete={() => {}} />);
    expect(screen.getByTestId('onboarding-skip-button')).toBeTruthy();
    expect(screen.getByText('onboarding.skip')).toBeTruthy();
  });

  it('should call onComplete when Skip is pressed', () => {
    const onComplete = jest.fn();
    render(<OnboardingCarousel onComplete={onComplete} />);

    fireEvent.press(screen.getByTestId('onboarding-skip-button'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('should show Next button text on slide 0 and slide 1, and Get Started on slide 2', () => {
    render(<OnboardingCarousel onComplete={() => {}} />);

    // Initially on slide 0 — "Next" should be visible, "Get Started" should not
    expect(screen.getByText('onboarding.next')).toBeTruthy();
    expect(screen.queryByText('onboarding.getStarted')).toBeNull();

    // Press Next to go to slide 1
    fireEvent.press(screen.getByTestId('onboarding-next-button'));

    // Slide 1 should show "Next", not "Get Started"
    expect(screen.getByText('onboarding.next')).toBeTruthy();
    expect(screen.queryByText('onboarding.getStarted')).toBeNull();

    // Press Next to go to slide 2
    fireEvent.press(screen.getByTestId('onboarding-next-button'));

    // Slide 2 should show "Get Started", not "Next"
    expect(screen.getByText('onboarding.getStarted')).toBeTruthy();
    expect(screen.queryByText('onboarding.next')).toBeNull();
  });

  it('should call onComplete when Get Started is pressed', () => {
    const onComplete = jest.fn();
    render(<OnboardingCarousel onComplete={onComplete} />);

    // Advance to last slide
    fireEvent.press(screen.getByTestId('onboarding-next-button'));
    fireEvent.press(screen.getByTestId('onboarding-next-button'));

    // Tap Get Started
    fireEvent.press(screen.getByTestId('onboarding-get-started-button'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('should render dot indicators', () => {
    render(<OnboardingCarousel onComplete={() => {}} />);
    expect(screen.getByTestId('onboarding-dots')).toBeTruthy();
  });

  it('should render the carousel scrollview', () => {
    render(<OnboardingCarousel onComplete={() => {}} />);
    expect(screen.getByTestId('onboarding-scrollview')).toBeTruthy();
  });
});
