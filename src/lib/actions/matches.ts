'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/dal';
import { logAudit } from '@/lib/audit';
import { determineWinner, resolveForfeit } from '@/lib/tournament/scoring';
import { sportStatusForRound } from '@/lib/tournament/status';
import { matchResultSchema, type MatchResultInput } from '@/lib/validation/match';
import type { ActionResult } from './applications';
import type { Json } from '@/types/database';

async function advanceWinner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  matchId: string,
  winnerId: string,
  loserId: string,
  tournamentId: string,
  nextMatchId: string | null,
  nextMatchSlot: number | null
) {
  const { data: winnerTeam } = await supabase.from('teams').select('wins').eq('id', winnerId).single();
  const { data: loserTeam } = await supabase.from('teams').select('losses').eq('id', loserId).single();
  await supabase.from('teams').update({ wins: (winnerTeam?.wins ?? 0) + 1 }).eq('id', winnerId);
  await supabase.from('teams').update({ losses: (loserTeam?.losses ?? 0) + 1 }).eq('id', loserId);

  if (nextMatchId) {
    const advanceUpdate = nextMatchSlot === 2 ? { team2_id: winnerId } : { team1_id: winnerId };
    await supabase.from('matches').update(advanceUpdate).eq('id', nextMatchId);

    const { data: nextMatch } = await supabase
      .from('matches')
      .select('round_id, rounds(name)')
      .eq('id', nextMatchId)
      .single();
    const nextRoundName = (nextMatch as unknown as { rounds: { name: string } | null })?.rounds?.name;
    if (nextRoundName) {
      await supabase.from('teams').update({ sport_status: sportStatusForRound(nextRoundName) }).eq('id', winnerId);
    }
    await supabase.from('teams').update({ sport_status: 'eliminated' }).eq('id', loserId);
  } else {
    // C'était la finale.
    await supabase.from('teams').update({ sport_status: 'winner' }).eq('id', winnerId);
    await supabase.from('tournaments').update({ status: 'completed' }).eq('id', tournamentId);
  }
}

export async function submitMatchResult(matchId: string, input: MatchResultInput): Promise<ActionResult> {
  const session = await requireSession(['super_admin', 'tournament_manager']);
  const parsed = matchResultSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Résultat invalide' };
  }

  const supabase = await createClient();
  const { data: match, error: mError } = await supabase.from('matches').select('*').eq('id', matchId).single();
  if (mError || !match) return { success: false, error: 'Match introuvable' };
  if (!match.team1_id || !match.team2_id) return { success: false, error: 'Les deux équipes ne sont pas encore connues' };
  if (match.status === 'completed') return { success: false, error: 'Ce match est déjà validé' };

  let winnerId: string;
  try {
    winnerId = determineWinner(match.team1_id, match.team2_id, parsed.data);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Résultat invalide' };
  }
  const loserId = winnerId === match.team1_id ? match.team2_id : match.team1_id;

  const { error: uError } = await supabase
    .from('matches')
    .update({
      team1_score: parsed.data.team1Score,
      team2_score: parsed.data.team2Score,
      team1_penalties: parsed.data.team1Penalties ?? null,
      team2_penalties: parsed.data.team2Penalties ?? null,
      winner_id: winnerId,
      status: 'completed',
      actual_start: match.actual_start ?? new Date().toISOString(),
    })
    .eq('id', matchId);
  if (uError) return { success: false, error: uError.message };

  await advanceWinner(supabase, matchId, winnerId, loserId, match.tournament_id, match.next_match_id, match.next_match_slot);

  await logAudit(supabase, {
    tournamentId: match.tournament_id,
    actorId: session.userId,
    action: 'match_result_submitted',
    entityType: 'match',
    entityId: matchId,
    before: { status: match.status } as unknown as Json,
    after: { ...parsed.data, winnerId } as unknown as Json,
  });

  revalidatePath('/admin/tournoi/matchs');
  revalidatePath('/admin/tournoi/tableau');
  revalidatePath('/admin/live');
  revalidatePath('/tournoi');
  revalidatePath('/tournoi/tableau');
  revalidatePath('/tournoi/matchs');
  return { success: true };
}

export async function declareForfeitAction(matchId: string, forfeitingTeamId: string): Promise<ActionResult> {
  const session = await requireSession(['super_admin', 'tournament_manager']);
  const supabase = await createClient();
  const { data: match, error: mError } = await supabase.from('matches').select('*').eq('id', matchId).single();
  if (mError || !match) return { success: false, error: 'Match introuvable' };
  if (!match.team1_id || !match.team2_id) return { success: false, error: 'Les deux équipes ne sont pas encore connues' };

  let winnerId: string;
  try {
    winnerId = resolveForfeit(match.team1_id, match.team2_id, forfeitingTeamId);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Forfait invalide' };
  }

  const { error: uError } = await supabase
    .from('matches')
    .update({ status: 'forfeit', winner_id: winnerId, forfeit_team_id: forfeitingTeamId })
    .eq('id', matchId);
  if (uError) return { success: false, error: uError.message };

  await advanceWinner(supabase, matchId, winnerId, forfeitingTeamId, match.tournament_id, match.next_match_id, match.next_match_slot);
  // advanceWinner marque le perdant "eliminated" par défaut — on force "forfeit" qui est plus précis.
  await supabase.from('teams').update({ sport_status: 'forfeit' }).eq('id', forfeitingTeamId);

  await logAudit(supabase, {
    tournamentId: match.tournament_id,
    actorId: session.userId,
    action: 'match_forfeit',
    entityType: 'match',
    entityId: matchId,
    after: { forfeitingTeamId, winnerId } as unknown as Json,
  });

  revalidatePath('/admin/tournoi/matchs');
  revalidatePath('/admin/tournoi/tableau');
  revalidatePath('/admin/live');
  revalidatePath('/tournoi');
  revalidatePath('/tournoi/tableau');
  return { success: true };
}
