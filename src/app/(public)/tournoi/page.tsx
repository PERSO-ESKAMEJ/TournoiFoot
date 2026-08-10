import Link from 'next/link';
import { getCurrentTournament, getRoundsWithMatches, getApprovedTeams } from '@/lib/data/tournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchCard, type BracketMatch } from '@/components/bracket-view';
import { formatDateLong } from '@/lib/format';
import { Trophy } from 'lucide-react';

export default async function TournamentLivePage() {
  const tournament = await getCurrentTournament();
  if (!tournament) {
    return <main className="flex-1 px-6 py-16 text-center text-muted-foreground">Aucun tournoi.</main>;
  }

  const [rounds, teams] = await Promise.all([
    getRoundsWithMatches(tournament.id),
    getApprovedTeams(tournament.id),
  ]);
  const allMatches: BracketMatch[] = rounds.flatMap((r) => r.matches).filter((m) => m.team1 || m.team2);

  const inProgress = allMatches.filter((m) => m.status === 'in_progress');
  const upcoming = allMatches
    .filter((m) => m.status === 'scheduled')
    .sort((a, b) => (a.scheduled_start ?? '').localeCompare(b.scheduled_start ?? ''));
  const recent = allMatches
    .filter((m) => m.status === 'completed' || m.status === 'forfeit')
    .sort((a, b) => (b.scheduled_start ?? '').localeCompare(a.scheduled_start ?? ''));

  const winner = teams.find((t) => t.sport_status === 'winner');
  const stillIn = teams.filter((t) => !['eliminated', 'forfeit'].includes(t.sport_status));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold">{tournament.name}</h1>
        <p className="text-sm text-muted-foreground">{formatDateLong(tournament.event_date)}</p>
      </div>

      {winner && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 pt-6">
            <Trophy className="size-8 text-amber-500" />
            <div>
              <p className="text-xs uppercase text-muted-foreground">Vainqueur du tournoi</p>
              <p className="text-xl font-bold">{winner.name}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {inProgress.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">Match en cours</h2>
          <div className="flex flex-wrap gap-4">
            {inProgress.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">Prochain match</h2>
          <MatchCard match={upcoming[0]} />
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">Derniers résultats</h2>
          <div className="flex flex-wrap gap-4">
            {recent.slice(0, 4).map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          Équipes encore en compétition ({stillIn.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {stillIn.map((t) => (
            <span key={t.id} className="rounded-full border px-3 py-1 text-sm">
              {t.name}
            </span>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Voir le tableau complet</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/tournoi/tableau" className="text-sm underline underline-offset-4">
            Consulter le bracket et la progression →
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
