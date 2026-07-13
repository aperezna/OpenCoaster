import { formatDate, formatDistance, formatWait } from '../formatters';

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe('formatDate', () => {
  it('should format a date in en locale as M/D/YYYY', () => {
    const date = new Date(2026, 6, 13); // July 13, 2026
    const result = formatDate(date, 'en');
    expect(result).toBe('7/13/2026');
  });

  it('should format a date in es locale as D/M/YYYY', () => {
    const date = new Date(2026, 6, 13); // July 13, 2026
    const result = formatDate(date, 'es');
    expect(result).toBe('13/7/2026');
  });

  it('should use a different date and verify the numeric format', () => {
    const date = new Date(2025, 0, 5); // January 5, 2025
    expect(formatDate(date, 'en')).toBe('1/5/2025');
    expect(formatDate(date, 'es')).toBe('5/1/2025');
  });
});

// ---------------------------------------------------------------------------
// formatDistance
// ---------------------------------------------------------------------------

describe('formatDistance', () => {
  it('should show meters for distances under 1000m', () => {
    expect(formatDistance(500, 'en')).toBe('500 m');
    expect(formatDistance(500, 'es')).toBe('500 m');
  });

  it('should show kilometers for distances 1000m or more', () => {
    expect(formatDistance(1500, 'en')).toBe('1.5 km');
    expect(formatDistance(1500, 'es')).toBe('1.5 km');
  });

  it('should handle exact 1000m boundary', () => {
    expect(formatDistance(1000, 'en')).toBe('1 km');
  });

  it('should handle zero meters', () => {
    expect(formatDistance(0, 'en')).toBe('0 m');
  });

  it('should handle large distances', () => {
    expect(formatDistance(12345, 'en')).toBe('12.3 km');
  });
});

// ---------------------------------------------------------------------------
// formatWait
// ---------------------------------------------------------------------------

describe('formatWait', () => {
  it('should format singular minute in en', () => {
    expect(formatWait(1, 'en')).toBe('1 min');
  });

  it('should format plural minutes in en', () => {
    expect(formatWait(5, 'en')).toBe('5 mins');
  });

  it('should format singular minute in es', () => {
    expect(formatWait(1, 'es')).toBe('1 min');
  });

  it('should format plural minutes in es', () => {
    expect(formatWait(5, 'es')).toBe('5 mins');
  });

  it('should handle zero minutes', () => {
    expect(formatWait(0, 'en')).toBe('0 mins');
  });

  it('should handle large wait times', () => {
    expect(formatWait(120, 'en')).toBe('120 mins');
  });
});
