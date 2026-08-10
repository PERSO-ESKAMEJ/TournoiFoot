import { describe, it, expect } from 'vitest';
import { generateBracket, nextPowerOfTwo, roundName } from './bracket';

function teams(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `team-${i + 1}`);
}

describe('nextPowerOfTwo', () => {
  it('returns the exact power of two when already one', () => {
    expect(nextPowerOfTwo(8)).toBe(8);
    expect(nextPowerOfTwo(4)).toBe(4);
  });
  it('rounds up otherwise', () => {
    expect(nextPowerOfTwo(5)).toBe(8);
    expect(nextPowerOfTwo(6)).toBe(8);
    expect(nextPowerOfTwo(7)).toBe(8);
    expect(nextPowerOfTwo(3)).toBe(4);
  });
});

describe('roundName', () => {
  it('labels rounds correctly for an 8-team bracket (3 rounds)', () => {
    expect(roundName(1, 3)).toBe('Quarts de finale');
    expect(roundName(2, 3)).toBe('Demi-finales');
    expect(roundName(3, 3)).toBe('Finale');
  });
  it('labels rounds correctly for a 4-team bracket (2 rounds)', () => {
    expect(roundName(1, 2)).toBe('Demi-finales');
    expect(roundName(2, 2)).toBe('Finale');
  });
});

describe('generateBracket', () => {
  it('throws with fewer than 2 teams', () => {
    expect(() => generateBracket(teams(1))).toThrow();
    expect(() => generateBracket(teams(0))).toThrow();
  });

  it('builds a clean bracket with no byes for 8 teams', () => {
    const plan = generateBracket(teams(8));
    expect(plan.totalRounds).toBe(3);
    expect(plan.roundNames).toEqual(['Quarts de finale', 'Demi-finales', 'Finale']);
    const round1 = plan.matches.filter((m) => m.round === 1);
    expect(round1).toHaveLength(4);
    expect(round1.every((m) => !m.isBye && m.team1Id && m.team2Id)).toBe(true);
    // Toutes les 8 équipes sont bien placées une seule fois
    const placed = round1.flatMap((m) => [m.team1Id, m.team2Id]);
    expect(new Set(placed).size).toBe(8);
  });

  it('handles 5 teams with exactly 3 byes, none doubled up', () => {
    const plan = generateBracket(teams(5));
    expect(plan.totalRounds).toBe(3); // size 8
    const round1 = plan.matches.filter((m) => m.round === 1);
    expect(round1).toHaveLength(4);
    const byeMatches = round1.filter((m) => m.isBye);
    expect(byeMatches).toHaveLength(3);
    // Aucun match n'a les deux équipes nulles (double bye)
    for (const m of round1) {
      expect(m.team1Id !== null || m.team2Id !== null).toBe(true);
    }
    // Les byes ont un vainqueur immédiat
    for (const m of byeMatches) {
      expect(m.winnerId).not.toBeNull();
    }
  });

  it('handles 6 and 7 teams without double byes', () => {
    for (const n of [6, 7]) {
      const plan = generateBracket(teams(n));
      const round1 = plan.matches.filter((m) => m.round === 1);
      for (const m of round1) {
        expect(m.team1Id !== null || m.team2Id !== null).toBe(true);
      }
    }
  });

  it('propagates bye winners into round 2 immediately', () => {
    const plan = generateBracket(teams(5));
    const round1Byes = plan.matches.filter((m) => m.round === 1 && m.isBye);
    for (const bye of round1Byes) {
      const nextSlot = Math.floor(bye.slot / 2);
      const nextMatch = plan.matches.find((m) => m.round === 2 && m.slot === nextSlot);
      expect(nextMatch).toBeDefined();
      const propagatedId = bye.slot % 2 === 0 ? nextMatch!.team1Id : nextMatch!.team2Id;
      expect(propagatedId).toBe(bye.winnerId);
    }
  });

  it('is deterministic given a fixed rng', () => {
    let calls = 0;
    const seq = [0.9, 0.1, 0.5, 0.3, 0.7, 0.2, 0.4, 0.6];
    const rng = () => seq[calls++ % seq.length];
    const planA = generateBracket(teams(8), rng);
    calls = 0;
    const planB = generateBracket(teams(8), rng);
    expect(planA.matches.map((m) => [m.team1Id, m.team2Id])).toEqual(
      planB.matches.map((m) => [m.team1Id, m.team2Id])
    );
  });
});
