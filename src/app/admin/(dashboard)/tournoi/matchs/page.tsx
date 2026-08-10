import { getCurrentTournament, getRoundsWithMatches } from '@/lib/data/tournament';
import { MatchRow } from '@/components/match-row';

export default async function AdminMatchesPage() {
  const tournament = await getCurrentTournament();
  if (!tournament) return <p className="text-sm text-muted-foreground">Aucun tournoi.</p>;

  const rounds = await getRoundsWithMatches(tournament.id);
  const matches = rounds
    .flatMap((r) => r.matches.map((m) => ({ ...m, roundName: r.name })))
    .filter((m) => m.team1 || m.team2)
    .sort((a, b) => (a.scheduled_start ?? '').localeCompare(b.scheduled_start ?? ''));

  if (matches.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun match — génère d&apos;abord le tirage.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Matchs</h1>
      <div className="space-y-2">
        {matches.map((match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}
