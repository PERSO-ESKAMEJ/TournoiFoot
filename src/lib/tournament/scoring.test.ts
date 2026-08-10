import { describe, it, expect } from 'vitest';
import { determineWinner, resolveForfeit, InvalidMatchResultError } from './scoring';

describe('determineWinner', () => {
  it('picks the team with the higher score', () => {
    expect(determineWinner('A', 'B', { team1Score: 3, team2Score: 1 })).toBe('A');
    expect(determineWinner('A', 'B', { team1Score: 0, team2Score: 2 })).toBe('B');
  });

  it('requires penalties on a draw', () => {
    expect(() => determineWinner('A', 'B', { team1Score: 1, team2Score: 1 })).toThrow(
      InvalidMatchResultError
    );
  });

  it('uses penalties to break a draw', () => {
    expect(
      determineWinner('A', 'B', { team1Score: 1, team2Score: 1, team1Penalties: 5, team2Penalties: 4 })
    ).toBe('A');
    expect(
      determineWinner('A', 'B', { team1Score: 2, team2Score: 2, team1Penalties: 3, team2Penalties: 4 })
    ).toBe('B');
  });

  it('rejects a penalty shootout that is itself tied', () => {
    expect(() =>
      determineWinner('A', 'B', { team1Score: 1, team2Score: 1, team1Penalties: 4, team2Penalties: 4 })
    ).toThrow(InvalidMatchResultError);
  });

  it('rejects negative scores', () => {
    expect(() => determineWinner('A', 'B', { team1Score: -1, team2Score: 0 })).toThrow(
      InvalidMatchResultError
    );
  });
});

describe('resolveForfeit', () => {
  it('qualifies the opponent of the forfeiting team', () => {
    expect(resolveForfeit('A', 'B', 'A')).toBe('B');
    expect(resolveForfeit('A', 'B', 'B')).toBe('A');
  });

  it('rejects a team not part of the match', () => {
    expect(() => resolveForfeit('A', 'B', 'C')).toThrow();
  });
});
