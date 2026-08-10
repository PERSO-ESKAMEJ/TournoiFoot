import { getCurrentTournament, getRoundsWithMatches } from '@/lib/data/tournament';
import { Badge } from '@/components/ui/badge';
import { formatTime, MATCH_STATUS_LABELS } from '@/lib/format';

export default async function PublicSchedulePage() {
  const tournament = await getCurrentTournament();
  if (!tournament) {
    return <main className="flex-1 px-6 py-16 text-center text-muted-foreground">Aucun tournoi.</main>;
  }

  const rounds = await getRoundsWithMatches(tournament.id);
  const allMatches = rounds
    .flatMap((r) => r.matches.map((m) => ({ ...m, roundName: r.name })))
    .filter((m) => m.team1 || m.team2)
    .sort((a, b) => (a.scheduled_start ?? '').localeCompare(b.scheduled_start ?? ''));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold">Programme</h1>
      {allMatches.length === 0 ? (
        <p className="text-sm text-muted-foreground">Le planning n&apos;est pas encore disponible.</p>
      ) : (
        <div className="space-y-2">
          {allMatches.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-xs uppercase text-muted-foreground">{m.roundName}</p>
                <p className="font-medium">
                  {m.team1?.name ?? 'À déterminer'} vs {m.team2?.name ?? 'À déterminer'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm">{formatTime(m.scheduled_start)}</p>
                <Badge variant="outline" className="text-[10px]">
                  {MATCH_STATUS_LABELS[m.status]}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
