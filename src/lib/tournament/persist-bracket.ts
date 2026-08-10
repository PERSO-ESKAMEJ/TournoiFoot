import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { generateBracket, type BracketPlan } from './bracket';
import { generateSchedule } from './schedule';
import { sportStatusForRound } from './status';

export interface PersistBracketParams {
  tournamentId: string;
  teamIds: string[];
  eventDate: string; // 'YYYY-MM-DD'
  startTime: string; // 'HH:mm' ou 'HH:mm:ss'
  endTime: string;
  matchDurationMinutes: number;
  transitionMinutes: number;
}

/**
 * Écrit en base un bracket généré (rounds + matchs + wiring next_match_id +
 * planning + statut sportif initial des équipes). Partagé entre le Server
 * Action de génération du tirage et le script de seed de démonstration —
 * garantit que les deux produisent des données structurellement identiques.
 */
export async function persistBracket(
  supabase: SupabaseClient<Database>,
  params: PersistBracketParams
): Promise<BracketPlan> {
  const { tournamentId, teamIds, eventDate, startTime, endTime, matchDurationMinutes, transitionMinutes } = params;

  const plan = generateBracket(teamIds);

  const roundIdByNumber = new Map<number, string>();
  for (let i = 0; i < plan.totalRounds; i++) {
    const { data: round, error } = await supabase
      .from('rounds')
      .insert({ tournament_id: tournamentId, round_number: i + 1, name: plan.roundNames[i] })
      .select('id')
      .single();
    if (error || !round) throw new Error(error?.message ?? 'Erreur création round');
    roundIdByNumber.set(i + 1, round.id);
  }

  const realMatches = plan.matches.filter((m) => !m.isBye);
  const schedule = generateSchedule({
    startTime: startTime.slice(0, 5),
    endTime: endTime.slice(0, 5),
    matchDurationMinutes,
    transitionMinutes,
    matchCount: realMatches.length,
  });
  const scheduleByMatch = new Map(realMatches.map((m, i) => [`${m.round}-${m.slot}`, schedule.slots[i]]));

  const idByRoundSlot = new Map<string, string>();
  let orderIndex = 0;
  for (const m of plan.matches) {
    const slotTime = scheduleByMatch.get(`${m.round}-${m.slot}`);
    const scheduledStart = slotTime ? `${eventDate}T${slotTime.start}:00` : null;
    const { data: match, error } = await supabase
      .from('matches')
      .insert({
        tournament_id: tournamentId,
        round_id: roundIdByNumber.get(m.round)!,
        slot: m.slot,
        order_index: orderIndex++,
        team1_id: m.team1Id,
        team2_id: m.team2Id,
        winner_id: m.winnerId,
        status: m.isBye ? 'completed' : 'scheduled',
        notes: m.isBye ? 'Exemption (bye)' : null,
        scheduled_start: scheduledStart,
      })
      .select('id')
      .single();
    if (error || !match) throw new Error(error?.message ?? 'Erreur création match');
    idByRoundSlot.set(`${m.round}-${m.slot}`, match.id);
  }

  for (const m of plan.matches) {
    if (m.round === plan.totalRounds) continue;
    const nextSlot = Math.floor(m.slot / 2);
    const nextMatchId = idByRoundSlot.get(`${m.round + 1}-${nextSlot}`);
    const currentId = idByRoundSlot.get(`${m.round}-${m.slot}`);
    if (!nextMatchId || !currentId) continue;
    await supabase
      .from('matches')
      .update({ next_match_id: nextMatchId, next_match_slot: m.slot % 2 === 0 ? 1 : 2 })
      .eq('id', currentId);
  }

  const initialStatus = sportStatusForRound(plan.roundNames[0]);
  await supabase.from('teams').update({ sport_status: initialStatus }).in('id', teamIds);

  return plan;
}
