import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { BusyMeter } from '../BusyMeter';
import type { BusyMeterResult } from '../../notifications/notificationTypes';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BusyMeter', () => {
  it('should show "Low" text and green color for low busy level', () => {
    const result: BusyMeterResult = { level: 'low', averageWait: 8 };
    render(<BusyMeter result={result} />);
    expect(screen.getByText('busyMeter.low')).toBeTruthy();
    expect(screen.getByTestId('busy-meter-chip')).toBeTruthy();
  });

  it('should show "Moderate" text for moderate busy level', () => {
    const result: BusyMeterResult = { level: 'moderate', averageWait: 20 };
    render(<BusyMeter result={result} />);
    expect(screen.getByText('busyMeter.moderate')).toBeTruthy();
  });

  it('should show "Busy" text for busy busy level', () => {
    const result: BusyMeterResult = { level: 'busy', averageWait: 50 };
    render(<BusyMeter result={result} />);
    expect(screen.getByText('busyMeter.busy')).toBeTruthy();
  });

  it('should show stale indicator when staleAge is provided', () => {
    const result: BusyMeterResult = { level: 'low', averageWait: 5, staleAge: 22 };
    render(<BusyMeter result={result} />);
    expect(screen.getByText('busyMeter.cachedAgo')).toBeTruthy();
    expect(screen.getByTestId('busy-meter-stale')).toBeTruthy();
  });

  it('should not show stale indicator when staleAge is not provided', () => {
    const result: BusyMeterResult = { level: 'low', averageWait: 5 };
    render(<BusyMeter result={result} />);
    expect(screen.queryByTestId('busy-meter-stale')).toBeNull();
  });
});
