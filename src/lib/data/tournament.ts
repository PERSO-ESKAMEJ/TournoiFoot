import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { BracketMatch } from '@/components/bracket-view';
import type { Database } from '@/types/database';

type RoundRow = Database['public']['Tables']['rounds']['Row'];

/**
 * Un seul tournoi actif à la fois (v1, cf. plan) : on prend le plus récent qui
 * n'est pas terminé, ou à défaut le plus récent tout court (pour pouvoir
 * encore consulter les résultats une fois le tournoi complété).
 */
export async function getCurrentTournament() {
  const supabase = await createClient();
  const { data: active } = await supabase
    .from('tournaments')
    .select('*')
    .neq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (active) return active;

  const { data: latest } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return latest;
}

export async function getApprovedTeams(tournamentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('teams')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('name');
  return data ?? [];
}

export async function getTeamMembers(teamId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('team_members').select('*').eq('team_id', teamId).order('jersey_number');
  return data ?? [];
}

export async function getRoundsWithMatches(tournamentId: string): Promise<(RoundRow & { matches: BracketMatch[] })[]> {
  const supabase = await createClient();
  const { data: rounds } = await supabase
    .from('rounds')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('round_number');
  const { data: matchesRaw } = await supabase
    .from('matches')
    .select('*, team1:team1_id(id, name, logo_url), team2:team2_id(id, name, logo_url), winner:winner_id(id, name)')
    .eq('tournament_id', tournamentId)
    .order('order_index');
  // Le client Supabase (types hand-roulés, pas de FK "Relationships" déclarées,
  // cf. src/types/database.ts) ne type pas les embeds automatiquement — la
  // requête est correcte à l'exécution, on l'annote manuellement ici.
  const matches = (matchesRaw ?? []) as unknown as BracketMatch[];

  return (rounds ?? []).map((round) => ({
    ...round,
    matches: matches.filter((m) => (m as unknown as { round_id: string }).round_id === round.id).sort((a, b) => a.slot - b.slot),
  }));
}

export async function getPendingApplicationsCount(tournamentId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from('team_applications')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)
    .in('status', ['submitted', 'pending']);
  return count ?? 0;
}
