import { formatInTimeZone } from 'date-fns-tz';
import type {
  ApplicationStatus,
  SportStatus,
  MatchStatus,
  TournamentStatus,
} from '@/types/database';

export const TOURNAMENT_TZ = 'Africa/Douala';

export function formatFcfa(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA';
}

export function formatDateLong(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return formatInTimeZone(new Date(iso), TOURNAMENT_TZ, 'HH:mm');
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Brouillon',
  submitted: 'Soumise',
  pending: 'En attente',
  needs_info: 'Infos manquantes',
  approved: 'Approuvée',
  rejected: 'Refusée',
  waitlisted: "Liste d'attente",
  cancelled: 'Annulée',
};

export const SPORT_STATUS_LABELS: Record<SportStatus, string> = {
  registered: 'Inscrite',
  present: 'Présente',
  quarterfinalist: 'Quart de finaliste',
  semifinalist: 'Demi-finaliste',
  finalist: 'Finaliste',
  winner: 'Vainqueur',
  eliminated: 'Éliminée',
  forfeit: 'Forfait',
};

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: 'Planifié',
  next_up: 'Prochain',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
  forfeit: 'Forfait',
};

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  preparation: 'Préparation',
  registrations_open: 'Inscriptions ouvertes',
  registrations_closed: 'Inscriptions fermées',
  bracket_ready: 'Tableau prêt',
  in_progress: 'En cours',
  completed: 'Terminé',
};
