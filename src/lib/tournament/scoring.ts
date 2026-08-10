// Détermination du vainqueur d'un match — élimination directe, jamais de match nul.

export interface MatchResultInput {
  team1Score: number;
  team2Score: number;
  team1Penalties?: number | null;
  team2Penalties?: number | null;
}

export class InvalidMatchResultError extends Error {}

/**
 * Détermine le vainqueur. En cas d'égalité au temps réglementaire, les tirs
 * au but sont obligatoires (une élimination directe ne peut jamais se
 * terminer sur un match nul).
 */
export function determineWinner(
  team1Id: string,
  team2Id: string,
  result: MatchResultInput
): string {
  if (result.team1Score < 0 || result.team2Score < 0) {
    throw new InvalidMatchResultError('Les scores ne peuvent pas être négatifs');
  }

  if (result.team1Score !== result.team2Score) {
    return result.team1Score > result.team2Score ? team1Id : team2Id;
  }

  const { team1Penalties, team2Penalties } = result;
  if (team1Penalties == null || team2Penalties == null) {
    throw new InvalidMatchResultError(
      'Match nul au temps réglementaire : les tirs au but sont requis pour désigner un vainqueur'
    );
  }
  if (team1Penalties === team2Penalties) {
    throw new InvalidMatchResultError('Les tirs au but ne peuvent pas se terminer à égalité');
  }
  return team1Penalties > team2Penalties ? team1Id : team2Id;
}

/**
 * Résultat d'un forfait : l'adversaire est automatiquement qualifié.
 */
export function resolveForfeit(team1Id: string, team2Id: string, forfeitingTeamId: string): string {
  if (forfeitingTeamId !== team1Id && forfeitingTeamId !== team2Id) {
    throw new InvalidMatchResultError('L\'équipe forfait ne fait pas partie de ce match');
  }
  return forfeitingTeamId === team1Id ? team2Id : team1Id;
}
