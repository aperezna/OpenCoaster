import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnboardingCarouselProps {
  onComplete: () => void;
}

interface Slide {
  title: string;
  body: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES: Slide[] = [
  {
    title: 'Welcome to OpenCoaster',
    body: 'Discover amazing amusement parks around the world.',
  },
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
// Component
// ---------------------------------------------------------------------------

export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps): React.JSX.Element {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const isLastSlide = currentSlide === SLIDES.length - 1;

  const handleMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentSlide(newIndex);
  }, []);

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      onComplete();
      return;
    }
    const nextIndex = currentSlide + 1;
    scrollViewRef.current?.scrollTo({
      x: nextIndex * SCREEN_WIDTH,
      animated: true,
    });
    setCurrentSlide(nextIndex);
  }, [currentSlide, isLastSlide, onComplete]);

  const handleGetStarted = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <View testID="onboarding-carousel" style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity
        testID="onboarding-skip-button"
        style={styles.skipButton}
        onPress={onComplete}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        testID="onboarding-scrollview"
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        style={styles.scrollView}
      >
        {SLIDES.map((slide, index) => (
          <View
            key={index}
            testID={`onboarding-slide-${index}`}
            style={[styles.slide, { width: SCREEN_WIDTH }]}
          >
            <View style={styles.illustrationPlaceholder}>
              <Text style={styles.illustrationEmoji}>
                {index === 0 ? '🎢' : index === 1 ? '🗺️' : '⭐'}
              </Text>
            </View>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideBody}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Footer: dots + buttons */}
      <View style={styles.footer}>
        {/* Dot indicators */}
        <View testID="onboarding-dots" style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              testID={index === currentSlide ? 'onboarding-dot-active' : 'onboarding-dot-inactive'}
              style={[styles.dot, index === currentSlide ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        {/* Action button */}
        {isLastSlide ? (
          <TouchableOpacity
            testID="onboarding-get-started-button"
            style={styles.actionButton}
            onPress={handleGetStarted}
          >
            <Text style={styles.actionButtonText}>Get Started</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            testID="onboarding-next-button"
            style={styles.actionButton}
            onPress={handleNext}
          >
            <Text style={styles.actionButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 120,
  },
  illustrationPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  illustrationEmoji: {
    fontSize: 48,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 12,
  },
  slideBody: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#4a6cf7',
    width: 24,
  },
  dotInactive: {
    backgroundColor: '#ccc',
  },
  actionButton: {
    backgroundColor: '#4a6cf7',
    paddingVertical: 14,
    paddingHorizontal: 80,
    borderRadius: 24,
    alignItems: 'center',
    minWidth: 200,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
