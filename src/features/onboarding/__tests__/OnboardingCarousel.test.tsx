import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { OnboardingCarousel } from '../OnboardingCarousel';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SLIDES = [
  { title: 'Welcome to OpenCoaster', body: 'Discover amazing amusement parks around the world.' },
  {
    title: 'Discover Parks',
    body: 'Browse parks near you, search by name, and explore what each park has to offer.',
  },
  {
    title: 'Save Your Favorites',
    body: 'Keep track of the parks you love and plan your next adventure.',
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OnboardingCarousel', () => {
  it('should render all 3 slides with titles and body text', () => {
    render(<OnboardingCarousel onComplete={() => {}} />);

    SLIDES.forEach((slide) => {
      expect(screen.getByText(slide.title)).toBeTruthy();
      expect(screen.getByText(slide.body)).toBeTruthy();
    });
  });

  it('should render Skip button', () => {
    render(<OnboardingCarousel onComplete={() => {}} />);
    expect(screen.getByTestId('onboarding-skip-button')).toBeTruthy();
  });

  it('should call onComplete when Skip is pressed', () => {
    const onComplete = jest.fn();
    render(<OnboardingCarousel onComplete={onComplete} />);

    fireEvent.press(screen.getByTestId('onboarding-skip-button'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('should show Next button on slide 0 and slide 1', () => {
    render(<OnboardingCarousel onComplete={() => {}} />);

    // Initially on slide 0 — "Next" should be visible, "Get Started" should not
    expect(screen.getByTestId('onboarding-next-button')).toBeTruthy();
    expect(screen.queryByTestId('onboarding-get-started-button')).toBeNull();
  });

  it('should advance to next slide when Next is pressed', () => {
    render(<OnboardingCarousel onComplete={() => {}} />);

    // Press Next to go to slide 1
    fireEvent.press(screen.getByTestId('onboarding-next-button'));

    // Slide 1 should show "Next", not "Get Started"
    expect(screen.getByTestId('onboarding-next-button')).toBeTruthy();
    expect(screen.queryByTestId('onboarding-get-started-button')).toBeNull();

    // Press Next to go to slide 2
    fireEvent.press(screen.getByTestId('onboarding-next-button'));

    // Slide 2 should show "Get Started", not "Next"
    expect(screen.getByTestId('onboarding-get-started-button')).toBeTruthy();
    expect(screen.queryByTestId('onboarding-next-button')).toBeNull();
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
