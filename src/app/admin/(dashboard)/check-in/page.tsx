import { getCurrentTournament, getApprovedTeams } from '@/lib/data/tournament';
import { CheckInBoard } from '@/components/check-in-board';

export default async function CheckInPage() {
  const tournament = await getCurrentTournament();
  if (!tournament) return <p className="text-sm text-muted-foreground">Aucun tournoi.</p>;
  const teams = await getApprovedTeams(tournament.id);

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Check-in jour J</h1>
      <CheckInBoard teams={teams} />
    </div>
  );
}
