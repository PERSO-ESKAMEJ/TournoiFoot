import { getCurrentTournament } from '@/lib/data/tournament';
import { ApplicationForm } from '@/components/application-form';
import { Card, CardContent } from '@/components/ui/card';

export default async function InscriptionPage() {
  const tournament = await getCurrentTournament();

  if (!tournament || tournament.status !== 'registrations_open') {
    return (
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <Card>
          <CardContent className="space-y-2 pt-6">
            <h1 className="text-xl font-semibold">Inscriptions fermées</h1>
            <p className="text-sm text-muted-foreground">
              Les inscriptions ne sont pas ouvertes pour le moment. Contacte l&apos;organisation pour plus
              d&apos;informations.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold">Inscrire une équipe</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {tournament.name} — {tournament.min_players_per_team} à {tournament.max_players_per_team} joueurs par
        équipe.
      </p>
      <ApplicationForm
        tournamentId={tournament.id}
        minPlayers={tournament.min_players_per_team}
        maxPlayers={tournament.max_players_per_team}
      />
    </main>
  );
}
