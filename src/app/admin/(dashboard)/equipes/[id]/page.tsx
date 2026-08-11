import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import { formatTime, SPORT_STATUS_LABELS } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { SportStatus } from '@/types/database';

const JOURNEY: { status: SportStatus; label: string }[] = [
  { status: 'registered', label: 'Inscription' },
  { status: 'present', label: 'Présence confirmée' },
  { status: 'quarterfinalist', label: 'Quarts de finale' },
  { status: 'semifinalist', label: 'Demi-finale' },
  { status: 'finalist', label: 'Finale' },
  { status: 'winner', label: 'Vainqueur' },
];
const JOURNEY_ORDER = JOURNEY.map((j) => j.status);

interface TeamMatchHistoryRow {
  id: string;
  status: string;
  team1_score: number | null;
  team2_score: number | null;
  scheduled_start: string | null;
  team1: { id: string; name: string } | null;
  team2: { id: string; name: string } | null;
  rounds: { name: string } | null;
}

export default async function AdminTeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: team }, { data: members }, { data: matchesRaw }] = await Promise.all([
    supabase.from('teams').select('*').eq('id', id).single(),
    supabase.from('team_members').select('*').eq('team_id', id).order('name'),
    supabase
      .from('matches')
      .select('*, team1:team1_id(id, name), team2:team2_id(id, name), rounds(name)')
      .or(`team1_id.eq.${id},team2_id.eq.${id}`)
      .order('order_index'),
  ]);
  // Cf. src/lib/data/tournament.ts : les embeds ne sont pas typés automatiquement.
  const matches = matchesRaw as unknown as TeamMatchHistoryRow[] | null;

  if (!team) notFound();

  const eliminatedOrForfeit = team.sport_status === 'eliminated' || team.sport_status === 'forfeit';
  const reachedIndex = eliminatedOrForfeit
    ? -1 // on affichera un état "arrêté à" séparément
    : JOURNEY_ORDER.indexOf(team.sport_status);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
        </div>
        <Badge>{SPORT_STATUS_LABELS[team.sport_status]}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parcours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {eliminatedOrForfeit && (
            <p className="mb-2 flex items-center gap-2 text-sm text-destructive">
              <XCircle className="size-4" />
              Parcours arrêté ({SPORT_STATUS_LABELS[team.sport_status]})
            </p>
          )}
          {JOURNEY.map((step, i) => {
            const done = !eliminatedOrForfeit && i <= reachedIndex;
            return (
              <div key={step.status} className={cn('flex items-center gap-2 text-sm', !done && 'text-muted-foreground')}>
                {done ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Circle className="size-4" />}
                {step.label}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statistiques</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Victoires / Défaites</span>
          <span>
            {team.wins} / {team.losses}
          </span>
          <span className="text-muted-foreground">Buts marqués / encaissés</span>
          <span>
            {team.goals_for} / {team.goals_against}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Roster ({members?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!members || members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun joueur.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {members.map((m) => (
                <li key={m.id}>{m.name}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des matchs</CardTitle>
        </CardHeader>
        <CardContent>
          {!matches || matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun match programmé pour l&apos;instant.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {matches.map((m) => {
                const t1 = m.team1;
                const t2 = m.team2;
                const roundName = m.rounds?.name;
                return (
                  <li key={m.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span>
                      {roundName} — {t1?.name ?? '?'} vs {t2?.name ?? '?'}
                    </span>
                    <span className="text-muted-foreground">
                      {m.status === 'completed' || m.status === 'forfeit'
                        ? `${m.team1_score ?? ''}-${m.team2_score ?? ''}`
                        : formatTime(m.scheduled_start)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
