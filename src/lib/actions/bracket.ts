'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/dal';
import { logAudit } from '@/lib/audit';
import { persistBracket } from '@/lib/tournament/persist-bracket';
import type { ActionResult } from './applications';
import type { Json } from '@/types/database';

export async function toggleCheckedIn(teamId: string, checkedIn: boolean): Promise<ActionResult> {
  await requireSession(['super_admin', 'tournament_manager']);
  const supabase = await createClient();
  const { error } = await supabase
    .from('teams')
    .update({
      checked_in: checkedIn,
      checked_in_at: checkedIn ? new Date().toISOString() : null,
      sport_status: checkedIn ? 'present' : 'registered',
    })
    .eq('id', teamId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/tournoi/tableau');
  revalidatePath('/admin/check-in');
  return { success: true };
}

/**
 * Génère le bracket : crée les rounds + tous les matchs (byes auto-résolus et
 * propagés), calcule le planning des matchs réels sur le créneau du tournoi,
 * puis passe le tournoi en statut "bracket_ready". Action irréversible tant
 * qu'aucun résultat n'a été saisi (voir garde-fou ci-dessous).
 */
export async function generateBracketAction(tournamentId: string, teamIds: string[]): Promise<ActionResult> {
  const session = await requireSession(['super_admin', 'tournament_manager']);
  if (teamIds.length < 2) return { success: false, error: 'Il faut au moins 2 équipes' };

  const supabase = await createClient();
  const { data: tournament, error: tError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();
  if (tError || !tournament) return { success: false, error: 'Tournoi introuvable' };

  // Repart de zéro si un bracket existait déjà (relance du tirage), mais jamais
  // si un vrai résultat a déjà été saisi (les byes auto-résolus ne comptent
  // pas) — casser un bracket en cours serait une perte de données silencieuse.
  const { data: existingMatches } = await supabase
    .from('matches')
    .select('status, notes')
    .eq('tournament_id', tournamentId);
  const hasRealResult = (existingMatches ?? []).some(
    (m) =>
      m.status === 'in_progress' ||
      m.status === 'forfeit' ||
      (m.status === 'completed' && m.notes !== 'Exemption (bye)')
  );
  if (hasRealResult) {
    return { success: false, error: 'Impossible de relancer le tirage : des résultats ont déjà été saisis.' };
  }

  await supabase.from('matches').delete().eq('tournament_id', tournamentId);
  await supabase.from('rounds').delete().eq('tournament_id', tournamentId);

  let plan;
  try {
    plan = await persistBracket(supabase, {
      tournamentId,
      teamIds,
      eventDate: tournament.event_date,
      startTime: tournament.start_time,
      endTime: tournament.end_time,
      matchDurationMinutes: tournament.match_duration_minutes,
      transitionMinutes: tournament.transition_minutes,
    });
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erreur génération bracket' };
  }

  await supabase.from('tournaments').update({ status: 'bracket_ready' }).eq('id', tournamentId);

  await logAudit(supabase, {
    tournamentId,
    actorId: session.userId,
    action: 'bracket_generated',
    entityType: 'tournament',
    entityId: tournamentId,
    after: { teamCount: teamIds.length, rounds: plan.totalRounds } as unknown as Json,
  });

  revalidatePath('/admin/tournoi/tableau');
  revalidatePath('/admin/tournoi/matchs');
  revalidatePath('/tournoi');
  revalidatePath('/tournoi/tableau');
  return { success: true };
}
