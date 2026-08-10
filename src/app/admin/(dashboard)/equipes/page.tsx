import Link from 'next/link';
import { getCurrentTournament, getApprovedTeams } from '@/lib/data/tournament';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SPORT_STATUS_LABELS } from '@/lib/format';

export default async function AdminTeamsPage() {
  const tournament = await getCurrentTournament();
  if (!tournament) return <p className="text-sm text-muted-foreground">Aucun tournoi.</p>;
  const teams = await getApprovedTeams(tournament.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Équipes</h1>
        <p className="text-sm text-muted-foreground">
          {teams.length} / {tournament.max_teams}
        </p>
      </div>
      {teams.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune équipe validée pour l&apos;instant.</p>
      ) : (
        <div className="space-y-2">
          {teams.map((team) => (
            <Link key={team.id} href={`/admin/equipes/${team.id}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center justify-between gap-4 pt-6">
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {team.wins}V — {team.losses}D · {team.goals_for} buts marqués / {team.goals_against} encaissés
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {team.checked_in && (
                      <Badge variant="outline" className="text-[10px]">
                        Présente
                      </Badge>
                    )}
                    <Badge variant="secondary">{SPORT_STATUS_LABELS[team.sport_status]}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
