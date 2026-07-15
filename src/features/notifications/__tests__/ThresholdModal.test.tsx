import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ThresholdModal } from '../ThresholdModal';

describe('ThresholdModal', () => {
  it('should render with the attraction name', () => {
    render(
      <ThresholdModal
        visible={true}
        attractionName="Space Mountain"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByText('Space Mountain')).toBeTruthy();
  });

  it('should call onCancel when cancel is pressed', () => {
    const onCancel = jest.fn();
    render(
      <ThresholdModal
        visible={true}
        attractionName="Space Mountain"
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.press(screen.getByText('common.cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirm with the selected threshold when confirm is pressed', () => {
    const onConfirm = jest.fn();
    render(
      <ThresholdModal
        visible={true}
        attractionName="Space Mountain"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />,
    );

    // Default is 30 min — confirm fires with 30
    fireEvent.press(screen.getByText('notifications.setThreshold'));
    expect(onConfirm).toHaveBeenCalledWith(30);
  });

  it('should display the current threshold value', () => {
    render(
      <ThresholdModal
        visible={true}
        attractionName="Space Mountain"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    // Shows "30 min" as the initial value
    expect(screen.getByText('notifications.threshold')).toBeTruthy();
    expect(screen.getByText(/30/)).toBeTruthy();
    expect(screen.getByText('notifications.minutes')).toBeTruthy();
  });
});
