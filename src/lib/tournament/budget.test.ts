import { describe, it, expect } from 'vitest';
import { summarizeBudget } from './budget';

describe('summarizeBudget', () => {
  it('sums planned, engaged and paid amounts', () => {
    const summary = summarizeBudget([
      { plannedAmount: 40000, actualAmount: null, status: 'planned' },
      { plannedAmount: 9000, actualAmount: 9000, status: 'paid' },
      { plannedAmount: 5000, actualAmount: null, status: 'ordered' },
    ]);
    expect(summary.planned).toBe(54000);
    expect(summary.engaged).toBe(14000); // paid (9000) + ordered (5000, fallback to planned)
    expect(summary.paid).toBe(9000);
    expect(summary.remaining).toBe(5000);
  });

  it('excludes cancelled lines entirely', () => {
    const summary = summarizeBudget([
      { plannedAmount: 10000, actualAmount: null, status: 'cancelled' },
      { plannedAmount: 2000, actualAmount: 2000, status: 'paid' },
    ]);
    expect(summary.planned).toBe(2000);
    expect(summary.paid).toBe(2000);
  });
});
