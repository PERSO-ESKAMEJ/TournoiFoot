import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentTournament } from '@/lib/data/tournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TOURNAMENT_STATUS_LABELS } from '@/lib/format';

export default async function AdminDashboardPage() {
  const tournament = await getCurrentTournament();
  if (!tournament) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">
          Aucun tournoi configuré. Commence par le créer dans{' '}
          <Link href="/admin/parametres" className="underline">
            Paramètres
          </Link>
          .
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ count: applicationsCount }, { count: teamsCount }, { count: playersCount }, { data: matches }] =
    await Promise.all([
      supabase.from('team_applications').select('id', { count: 'exact', head: true }).eq('tournament_id', tournament.id),
      supabase.from('teams').select('id', { count: 'exact', head: true }).eq('tournament_id', tournament.id),
      supabase
        .from('team_members')
        .select('id, teams!inner(tournament_id)', { count: 'exact', head: true })
        .eq('teams.tournament_id', tournament.id),
      supabase.from('matches').select('status').eq('tournament_id', tournament.id),
    ]);

  const playedCount = (matches ?? []).filter((m) => m.status === 'completed' || m.status === 'forfeit').length;
  const remainingCount = (matches ?? []).filter((m) => m.status === 'scheduled' || m.status === 'in_progress').length;

  const kpis = [
    { label: 'Candidatures reçues', value: applicationsCount ?? 0 },
    { label: 'Équipes validées', value: `${teamsCount ?? 0} / ${tournament.max_teams}` },
    { label: 'Places restantes', value: Math.max(0, tournament.max_teams - (teamsCount ?? 0)) },
    { label: 'Joueurs enregistrés', value: playersCount ?? 0 },
    { label: 'Matchs joués', value: playedCount },
    { label: 'Matchs restants', value: remainingCount },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <Badge>{TOURNAMENT_STATUS_LABELS[tournament.status]}</Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal uppercase text-muted-foreground">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
