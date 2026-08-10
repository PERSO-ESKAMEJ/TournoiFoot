import { describe, it, expect } from 'vitest';
import { generateSchedule } from './schedule';

describe('generateSchedule', () => {
  it('lays out sequential slots with transitions', () => {
    const result = generateSchedule({
      startTime: '13:00',
      endTime: '17:00',
      matchDurationMinutes: 20,
      transitionMinutes: 5,
      matchCount: 3,
    });
    expect(result.slots).toEqual([
      { start: '13:00', end: '13:20' },
      { start: '13:25', end: '13:45' },
      { start: '13:50', end: '14:10' },
    ]);
    expect(result.overflow).toBe(false);
  });

  it('flags overflow when the schedule exceeds the end time', () => {
    // 7 matchs (bracket 8 équipes) x 20+5 min = 175 min = 2h55, largement dans 4h,
    // donc on force un cas de dépassement avec un match plus long.
    const result = generateSchedule({
      startTime: '13:00',
      endTime: '14:00',
      matchDurationMinutes: 30,
      transitionMinutes: 10,
      matchCount: 3,
    });
    expect(result.overflow).toBe(true);
  });

  it('returns no slots for zero matches', () => {
    const result = generateSchedule({
      startTime: '13:00',
      endTime: '17:00',
      matchDurationMinutes: 20,
      transitionMinutes: 5,
      matchCount: 0,
    });
    expect(result.slots).toEqual([]);
    expect(result.overflow).toBe(false);
  });
});
