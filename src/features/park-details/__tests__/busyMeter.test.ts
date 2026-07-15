import { calculateBusyLevel } from '../calculateBusyLevel';
import type { Attraction } from '../../../data/models/Attraction';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const operatingAttraction = (overrides: Partial<Attraction> = {}): Attraction => ({
  id: 'test-id',
  name: 'Test Attraction',
  parkId: 'test-park',
  waitTime: 10,
  status: 'operating',
  type: 'family',
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('calculateBusyLevel', () => {
  // -- Level: low -----------------------------------------------------------

  it('should return "low" when average wait is less than 15 minutes', () => {
    const attractions: Attraction[] = [
      operatingAttraction({ waitTime: 5 }),
      operatingAttraction({ waitTime: 8 }),
      operatingAttraction({ waitTime: 10 }),
    ];
    const result = calculateBusyLevel(attractions, new Date());
    expect(result.level).toBe('low');
    expect(result.averageWait).toBeCloseTo(7.67, 1);
  });

  // -- Level: moderate ------------------------------------------------------

  it('should return "moderate" when average wait is between 15 and 30 minutes', () => {
    const attractions: Attraction[] = [
      operatingAttraction({ waitTime: 15 }),
      operatingAttraction({ waitTime: 20 }),
      operatingAttraction({ waitTime: 25 }),
    ];
    const result = calculateBusyLevel(attractions, new Date());
    expect(result.level).toBe('moderate');
    expect(result.averageWait).toBe(20);
  });

  // -- Level: busy ----------------------------------------------------------

  it('should return "busy" when average wait is greater than 30 minutes', () => {
    const attractions: Attraction[] = [
      operatingAttraction({ waitTime: 40 }),
      operatingAttraction({ waitTime: 50 }),
      operatingAttraction({ waitTime: 60 }),
    ];
    const result = calculateBusyLevel(attractions, new Date());
    expect(result.level).toBe('busy');
    expect(result.averageWait).toBe(50);
  });

  // -- Edge case: empty attractions ----------------------------------------

  it('should return "low" with 0 average when attractions array is empty', () => {
    const result = calculateBusyLevel([], new Date());
    expect(result.level).toBe('low');
    expect(result.averageWait).toBe(0);
  });

  // -- Edge case: no operating attractions ----------------------------------

  it('should return "low" with 0 average when no attractions are operating', () => {
    const attractions: Attraction[] = [
      operatingAttraction({ status: 'closed', waitTime: 20 }),
      operatingAttraction({ status: 'down', waitTime: 15 }),
    ];
    const result = calculateBusyLevel(attractions, new Date());
    expect(result.level).toBe('low');
    expect(result.averageWait).toBe(0);
  });

  // -- Stale age calculation ------------------------------------------------

  it('should include staleAge when data is older than 15 minutes', () => {
    const attractions: Attraction[] = [operatingAttraction({ waitTime: 5 })];
    const fetchedAt = new Date(Date.now() - 22 * 60 * 1000); // 22 minutes ago
    const result = calculateBusyLevel(attractions, fetchedAt);
    expect(result.staleAge).toBeGreaterThanOrEqual(22);
    expect(result.staleAge).toBeLessThanOrEqual(23);
  });

  it('should not include staleAge when data is 15 minutes or fresher', () => {
    const attractions: Attraction[] = [operatingAttraction({ waitTime: 5 })];
    const fetchedAt = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const result = calculateBusyLevel(attractions, fetchedAt);
    expect(result.staleAge).toBeUndefined();
  });

  it('should not include staleAge when data is exactly 15 minutes old', () => {
    const attractions: Attraction[] = [operatingAttraction({ waitTime: 5 })];
    const fetchedAt = new Date(Date.now() - 15 * 60 * 1000); // exactly 15 min ago
    const result = calculateBusyLevel(attractions, fetchedAt);
    expect(result.staleAge).toBeUndefined();
  });

  // -- Filtering: only operating attractions counted ------------------------

  it('should only count operating attractions in the average', () => {
    const attractions: Attraction[] = [
      operatingAttraction({ waitTime: 10 }),
      operatingAttraction({ status: 'closed', waitTime: 100 }),
      operatingAttraction({ status: 'down', waitTime: 100 }),
      operatingAttraction({ waitTime: 20 }),
    ];
    const result = calculateBusyLevel(attractions, new Date());
    expect(result.averageWait).toBe(15); // (10 + 20) / 2 = 15
    expect(result.level).toBe('moderate'); // boundary: 15 → moderate
  });
});
