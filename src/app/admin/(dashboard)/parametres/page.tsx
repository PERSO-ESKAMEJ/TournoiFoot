import { requireSession } from '@/lib/auth/dal';
import { getCurrentTournament } from '@/lib/data/tournament';
import { TournamentSettingsForm } from '@/components/tournament-settings-form';

export default async function ParametresPage() {
  await requireSession(['super_admin', 'tournament_manager']);
  const tournament = await getCurrentTournament();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Paramètres du tournoi</h1>
      <TournamentSettingsForm tournament={tournament} />
    </div>
  );
}
