// Seed de démonstration — DONNÉES FICTIVES clairement labellisées.
// Crée un tournoi "DEMO" avec 8 équipes, un bracket complet, des quarts joués,
// une demi-finale jouée, une demi-finale en cours, une finale à venir — pour
// pouvoir tester l'app immédiatement sans attendre de vraies inscriptions.
//
// Usage : npm run seed  (nécessite NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY dans .env.local)

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database';
import { persistBracket } from '../src/lib/tournament/persist-bracket';
import { determineWinner } from '../src/lib/tournament/scoring';
import { sportStatusForRound } from '../src/lib/tournament/status';

config({ path: '.env.local' });

const DEMO_TEAMS = [
  { name: 'DEMO — Lions de Deido', neighborhood: 'Deido' },
  { name: 'DEMO — Aigles de Bonabéri', neighborhood: 'Bonabéri' },
  { name: 'DEMO — Étoile de Bépanda', neighborhood: 'Bépanda' },
  { name: 'DEMO — Panthères de Bonanjo', neighborhood: 'Bonanjo' },
  { name: 'DEMO — Requins de Akwa', neighborhood: 'Akwa' },
  { name: 'DEMO — Tonnerre de Ndogbong', neighborhood: 'Ndogbong' },
  { name: 'DEMO — Éclair de Makepe', neighborhood: 'Makepe' },
  { name: 'DEMO — Vautours de Logbaba', neighborhood: 'Logbaba' },
];

function randomScore(): [number, number] {
  const a = Math.floor(Math.random() * 4);
  let b = Math.floor(Math.random() * 4);
  if (a === b) b = a === 0 ? 1 : a - 1; // évite les nuls pour la démo
  return [a, b];
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis (.env.local).');
    process.exit(1);
  }
  const supabase = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('→ Création du tournoi de démonstration…');
  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 14);
  const eventDateStr = eventDate.toISOString().slice(0, 10);

  const { data: tournament, error: tError } = await supabase
    .from('tournaments')
    .insert({
      name: 'DEMO — Tournoi commémoratif',
      memorial_subtitle: 'Données de démonstration — à supprimer avant le vrai tournoi',
      description: "Jeu de données fictif pour tester l'application de bout en bout.",
      event_date: eventDateStr,
      start_time: '13:00',
      end_time: '17:00',
      venue_name: 'Stade de Deido',
      venue_city: 'Douala',
      max_teams: 8,
      min_players_per_team: 5,
      max_players_per_team: 12,
      match_duration_minutes: 20,
      transition_minutes: 5,
      status: 'registrations_open',
      contact_name: 'Jean-Raymond',
      contact_phone: '+237 6 00 00 00 00',
      father_name: 'Papa',
    })
    .select('id')
    .single();
  if (tError || !tournament) throw new Error(tError?.message ?? 'Erreur création tournoi');
  const tournamentId = tournament.id;

  console.log('→ Création des candidatures et équipes…');
  const teamIds: string[] = [];
  for (let i = 0; i < DEMO_TEAMS.length; i++) {
    const demo = DEMO_TEAMS[i];
    const { data: application, error: appError } = await supabase
      .from('team_applications')
      .insert({
        tournament_id: tournamentId,
        reference: `DEMO-${String(i + 1).padStart(3, '0')}`,
        team_name: demo.name,
        contact_name: `Capitaine ${demo.neighborhood}`,
        contact_whatsapp: '+237 6 90 00 00 0' + i,
        status: 'approved',
        submitted_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (appError || !application) throw new Error(appError?.message ?? 'Erreur candidature');

    const players = Array.from({ length: 7 }, (_, p) => ({
      application_id: application.id,
      name: `Joueur${p + 1} ${demo.neighborhood}`,
    }));
    await supabase.from('application_players').insert(players);

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        tournament_id: tournamentId,
        application_id: application.id,
        name: demo.name,
      })
      .select('id')
      .single();
    if (teamError || !team) throw new Error(teamError?.message ?? 'Erreur équipe');

    await supabase
      .from('team_members')
      .insert(players.map((p) => ({ team_id: team.id, name: p.name })));

    teamIds.push(team.id);
  }

  // Une candidature encore en attente + une refusée, pour peupler l'écran Candidatures.
  await supabase.from('team_applications').insert([
    {
      tournament_id: tournamentId,
      reference: 'DEMO-009',
      team_name: 'DEMO — FC Nouveaux Inscrits',
      contact_name: 'Capitaine Neuf',
      contact_whatsapp: '+237 6 90 00 00 09',
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    },
    {
      tournament_id: tournamentId,
      reference: 'DEMO-010',
      team_name: 'DEMO — FC Hors Délai',
      contact_name: 'Capitaine Dix',
      contact_whatsapp: '+237 6 90 00 00 10',
      status: 'rejected',
      review_notes: 'Inscription hors délai (donnée de démonstration)',
      submitted_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
    },
  ]);

  console.log('→ Génération du bracket…');
  await persistBracket(supabase, {
    tournamentId,
    teamIds,
    eventDate: eventDateStr,
    startTime: '13:00',
    endTime: '17:00',
    matchDurationMinutes: 20,
    transitionMinutes: 5,
  });
  await supabase.from('tournaments').update({ status: 'bracket_ready' }).eq('id', tournamentId);

  console.log('→ Simulation des résultats (quarts + 1 demi jouée, 1 demi en cours)…');

  async function playMatch(matchId: string) {
    const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).single();
    if (!match || !match.team1_id || !match.team2_id) return;
    const [s1, s2] = randomScore();
    const winnerId = determineWinner(match.team1_id, match.team2_id, { team1Score: s1, team2Score: s2 });
    const loserId = winnerId === match.team1_id ? match.team2_id : match.team1_id;

    await supabase
      .from('matches')
      .update({ team1_score: s1, team2_score: s2, winner_id: winnerId, status: 'completed', actual_start: new Date().toISOString() })
      .eq('id', matchId);

    const { data: winnerTeam } = await supabase.from('teams').select('wins, goals_for, goals_against').eq('id', winnerId).single();
    const { data: loserTeam } = await supabase.from('teams').select('losses, goals_for, goals_against').eq('id', loserId).single();
    const winnerGoalsFor = winnerId === match.team1_id ? s1 : s2;
    const winnerGoalsAgainst = winnerId === match.team1_id ? s2 : s1;
    await supabase
      .from('teams')
      .update({
        wins: (winnerTeam?.wins ?? 0) + 1,
        goals_for: (winnerTeam?.goals_for ?? 0) + winnerGoalsFor,
        goals_against: (winnerTeam?.goals_against ?? 0) + winnerGoalsAgainst,
      })
      .eq('id', winnerId);
    await supabase
      .from('teams')
      .update({
        losses: (loserTeam?.losses ?? 0) + 1,
        goals_for: (loserTeam?.goals_for ?? 0) + winnerGoalsAgainst,
        goals_against: (loserTeam?.goals_against ?? 0) + winnerGoalsFor,
      })
      .eq('id', loserId);

    if (match.next_match_id) {
      const advanceUpdate = match.next_match_slot === 2 ? { team2_id: winnerId } : { team1_id: winnerId };
      await supabase.from('matches').update(advanceUpdate).eq('id', match.next_match_id);
      const { data: nextMatch } = await supabase.from('matches').select('round_id, rounds(name)').eq('id', match.next_match_id).single();
      const nextRoundName = (nextMatch as unknown as { rounds: { name: string } | null })?.rounds?.name;
      if (nextRoundName) {
        await supabase.from('teams').update({ sport_status: sportStatusForRound(nextRoundName) }).eq('id', winnerId);
      }
      await supabase.from('teams').update({ sport_status: 'eliminated' }).eq('id', loserId);
    } else {
      await supabase.from('teams').update({ sport_status: 'winner' }).eq('id', winnerId);
    }
  }

  const { data: rounds } = await supabase.from('rounds').select('*').eq('tournament_id', tournamentId).order('round_number');
  const { data: matches } = await supabase.from('matches').select('*').eq('tournament_id', tournamentId).order('order_index');
  const quarterRound = rounds?.[0];
  const semiRound = rounds?.[1];
  const quarterMatches = (matches ?? []).filter((m) => m.round_id === quarterRound?.id && m.team1_id && m.team2_id);
  for (const m of quarterMatches) {
    await playMatch(m.id);
  }

  const { data: semiMatches } = await supabase
    .from('matches')
    .select('*')
    .eq('round_id', semiRound?.id ?? '')
    .order('order_index');
  if (semiMatches && semiMatches[0]?.team1_id && semiMatches[0]?.team2_id) {
    await playMatch(semiMatches[0].id);
  }
  if (semiMatches && semiMatches[1]?.team1_id && semiMatches[1]?.team2_id) {
    await supabase.from('matches').update({ status: 'in_progress', actual_start: new Date().toISOString() }).eq('id', semiMatches[1].id);
  }

  await supabase.from('tournaments').update({ status: 'in_progress' }).eq('id', tournamentId);

  console.log(`\n✓ Tournoi de démonstration créé (id: ${tournamentId})`);
  console.log('  8 équipes, quarts joués, 1 demi jouée, 1 demi en cours, finale à venir.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
