import type { Attraction } from '../../data/models/Attraction';
import type { BusyLevel, BusyMeterResult } from '../notifications/notificationTypes';

/**
 * Calculate the park busy level based on average wait time of operating attractions.
 *
 * @param attractions - List of all attractions (operating, closed, down).
 * @param fetchedAt   - Timestamp when the attractions data was fetched.
 * @returns A BusyMeterResult with level, averageWait, and optional staleAge.
 */
export function calculateBusyLevel(attractions: Attraction[], fetchedAt: Date): BusyMeterResult {
  const operating = attractions.filter((a) => a.status === 'operating');

  if (operating.length === 0) {
    return { level: 'low', averageWait: 0 };
  }

  const totalWait = operating.reduce((sum, a) => sum + a.waitTime, 0);
  const averageWait = totalWait / operating.length;

  let level: BusyLevel;
  if (averageWait < 15) {
    level = 'low';
  } else if (averageWait <= 30) {
    level = 'moderate';
  } else {
    level = 'busy';
  }

  // Calculate stale age in minutes
  const now = Date.now();
  const ageMs = now - fetchedAt.getTime();
  const ageMin = Math.floor(ageMs / 60000);

  const result: BusyMeterResult = {
    level,
    averageWait: Math.round(averageWait * 100) / 100,
  };

  if (ageMin > 15) {
    result.staleAge = ageMin;
  }

  return result;
}
