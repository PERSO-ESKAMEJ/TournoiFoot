// Moteur de génération de bracket à élimination directe.
// Fonctions pures, indépendantes de la base de données — testables isolément.

export interface BracketMatchPlan {
  round: number; // 1 = premier tour
  slot: number; // position 0-indexée dans le round
  team1Id: string | null;
  team2Id: string | null;
  isBye: boolean;
  winnerId: string | null; // renseigné uniquement pour les matchs à exemption (bye) auto-résolus
}

export interface BracketPlan {
  totalRounds: number;
  roundNames: string[]; // roundNames[0] = nom du round 1, etc.
  matches: BracketMatchPlan[];
}

export function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 1;
  return 2 ** Math.ceil(Math.log2(n));
}

// Nom du round selon le nombre de rounds restants jusqu'à la finale (incluse).
export function roundName(roundIndex: number, totalRounds: number): string {
  const remaining = totalRounds - roundIndex + 1;
  if (remaining === 1) return 'Finale';
  if (remaining === 2) return 'Demi-finales';
  if (remaining === 3) return 'Quarts de finale';
  if (remaining === 4) return 'Huitièmes de finale';
  return `Tour ${roundIndex}`;
}

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Génère un bracket à élimination directe à partir d'une liste d'IDs d'équipes.
 * Tirage aléatoire (via `rng`, injectable pour les tests). Les exemptions (byes)
 * sont réparties une par match maximum sur les premiers matchs du round 1 — le
 * nombre de byes est toujours strictement inférieur au nombre de matchs du
 * round 1, donc aucun match ne peut se retrouver avec deux byes.
 */
export function generateBracket(teamIds: string[], rng: () => number = Math.random): BracketPlan {
  if (teamIds.length < 2) {
    throw new Error('Il faut au moins 2 équipes pour générer un bracket');
  }

  const size = nextPowerOfTwo(teamIds.length);
  const totalRounds = Math.log2(size);
  const matchCount = size / 2;
  const byes = size - teamIds.length;

  const queue = shuffle(teamIds, rng);
  const matches: BracketMatchPlan[] = [];

  for (let i = 0; i < matchCount; i++) {
    const isBye = i < byes;
    const team1 = queue.pop() ?? null;
    const team2 = isBye ? null : (queue.pop() ?? null);
    matches.push({
      round: 1,
      slot: i,
      team1Id: team1,
      team2Id: team2,
      isBye,
      winnerId: isBye ? team1 : null,
    });
  }

  let prevRoundCount = matchCount;
  for (let r = 2; r <= totalRounds; r++) {
    const count = prevRoundCount / 2;
    for (let i = 0; i < count; i++) {
      matches.push({ round: r, slot: i, team1Id: null, team2Id: null, isBye: false, winnerId: null });
    }
    prevRoundCount = count;
  }

  const roundNames = Array.from({ length: totalRounds }, (_, i) => roundName(i + 1, totalRounds));

  return propagateWinners({ totalRounds, roundNames, matches });
}

/**
 * Propage les vainqueurs connus (issus des byes ou d'un score saisi) vers le
 * round suivant. Idempotent — peut être rappelée à chaque saisie de résultat.
 */
export function propagateWinners(plan: BracketPlan): BracketPlan {
  const matches = plan.matches.map((m) => ({ ...m }));
  for (let round = 1; round < plan.totalRounds; round++) {
    for (const m of matches.filter((x) => x.round === round)) {
      if (m.winnerId == null) continue;
      const nextSlot = Math.floor(m.slot / 2);
      const nextMatch = matches.find((nm) => nm.round === round + 1 && nm.slot === nextSlot);
      if (!nextMatch) continue;
      if (m.slot % 2 === 0) nextMatch.team1Id = m.winnerId;
      else nextMatch.team2Id = m.winnerId;
    }
  }
  return { ...plan, matches };
}
