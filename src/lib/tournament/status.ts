import type { SportStatus } from '@/types/database';

// Traduit le nom d'un round en statut sportif d'équipe (section 15 du brief).
export function sportStatusForRound(roundName: string): SportStatus {
  switch (roundName) {
    case 'Finale':
      return 'finalist';
    case 'Demi-finales':
      return 'semifinalist';
    case 'Quarts de finale':
    case 'Huitièmes de finale':
      return 'quarterfinalist';
    default:
      return 'present';
  }
}
