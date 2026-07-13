import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { HoursCard } from '../HoursCard';

describe('HoursCard', () => {
  const mockHours = {
    opening: '09:00',
    closing: '18:00',
  };

  it('should render translated card title', () => {
    render(<HoursCard hours={mockHours} />);
    expect(screen.getByText('hours.title')).toBeTruthy();
  });

  it('should render translated opening and closing labels', () => {
    render(<HoursCard hours={mockHours} />);
    expect(screen.getByText('hours.opening')).toBeTruthy();
    expect(screen.getByText('hours.closing')).toBeTruthy();
  });
});
