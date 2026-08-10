import { getCurrentTournament, getApprovedTeams, getRoundsWithMatches } from '@/lib/data/tournament';
import { BracketView } from '@/components/bracket-view';
import { BracketPrep } from '@/components/bracket-prep';

export default async function AdminBracketPage() {
  const tournament = await getCurrentTournament();
  if (!tournament) return <p className="text-sm text-muted-foreground">Aucun tournoi.</p>;

  const [teams, rounds] = await Promise.all([
    getApprovedTeams(tournament.id),
    getRoundsWithMatches(tournament.id),
  ]);

  const bracketExists = rounds.length > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tableau du tournoi</h1>

      <BracketPrep tournamentId={tournament.id} teams={teams} bracketExists={bracketExists} />

      {bracketExists && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Bracket actuel</h2>
          <BracketView rounds={rounds} />
        </div>
      )}
    </div>
  );
}
