import { getCurrentTournament, getApprovedTeams } from '@/lib/data/tournament';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SPORT_STATUS_LABELS } from '@/lib/format';

export default async function PublicTeamsPage() {
  const tournament = await getCurrentTournament();
  if (!tournament) {
    return <main className="flex-1 px-6 py-16 text-center text-muted-foreground">Aucun tournoi.</main>;
  }

  const teams = await getApprovedTeams(tournament.id);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold">Équipes engagées</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {teams.length} / {tournament.max_teams} équipes
      </p>
      {teams.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune équipe validée pour l&apos;instant.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardContent className="flex items-center justify-between gap-2 pt-6">
                <p className="font-medium">{team.name}</p>
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {SPORT_STATUS_LABELS[team.sport_status]}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
