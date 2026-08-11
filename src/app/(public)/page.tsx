import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCurrentTournament, getApprovedTeams } from '@/lib/data/tournament';
import { formatDateLong } from '@/lib/format';

export default async function HomePage() {
  const tournament = await getCurrentTournament();

  if (!tournament) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">Aucun tournoi configuré pour l&apos;instant</h1>
        <p className="max-w-md text-muted-foreground">
          Un administrateur doit d&apos;abord créer le tournoi depuis l&apos;espace admin.
        </p>
        <Button render={<Link href="/admin/login">Se connecter à l&apos;administration</Link>} />
      </main>
    );
  }

  const teams = await getApprovedTeams(tournament.id);
  const registrationsOpen = tournament.status === 'registrations_open';

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="border-b bg-muted/30 px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl space-y-4">
          {tournament.memorial_subtitle && (
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              {tournament.memorial_subtitle}
            </p>
          )}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{tournament.name}</h1>
          {tournament.description && (
            <p className="mx-auto max-w-xl text-muted-foreground">{tournament.description}</p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{formatDateLong(tournament.event_date)}</Badge>
            <Badge variant="secondary">
              {tournament.start_time.slice(0, 5)}–{tournament.end_time.slice(0, 5)}
            </Badge>
            <Badge variant="secondary">
              {tournament.venue_name}, {tournament.venue_city}
            </Badge>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 pt-6 sm:flex-row">
            <Button
              size="lg"
              disabled={!registrationsOpen}
              render={
                <Link href={registrationsOpen ? '/inscription' : '#'} aria-disabled={!registrationsOpen}>
                  Inscrire une équipe
                </Link>
              }
            />
            <Button size="lg" variant="outline" render={<Link href="/tournoi">Voir le tournoi</Link>} />
          </div>
          {!registrationsOpen && (
            <p className="text-xs text-muted-foreground">
              Les inscriptions ne sont pas ouvertes pour le moment.
            </p>
          )}
        </div>
      </section>

      {/* Infos pratiques + compteur */}
      <section className="grid gap-4 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-16">
        <Card>
          <CardContent className="space-y-1 pt-6">
            <p className="text-xs uppercase text-muted-foreground">Date</p>
            <p className="font-medium">{formatDateLong(tournament.event_date)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 pt-6">
            <p className="text-xs uppercase text-muted-foreground">Lieu</p>
            <p className="font-medium">
              {tournament.venue_name}, {tournament.venue_city}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 pt-6">
            <p className="text-xs uppercase text-muted-foreground">Équipes inscrites</p>
            <p className="font-medium">
              {teams.length} / {tournament.max_teams}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 pt-6">
            <p className="text-xs uppercase text-muted-foreground">Contact</p>
            <p className="font-medium">{tournament.contact_name ?? '—'}</p>
            {tournament.contact_phone && (
              <p className="text-sm text-muted-foreground">{tournament.contact_phone}</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Équipes */}
      {teams.length > 0 && (
        <section className="px-6 pb-16 lg:px-16">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Équipes engagées</h2>
            <Link href="/equipes" className="text-sm text-muted-foreground underline underline-offset-4">
              Voir toutes les équipes
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {teams.slice(0, 8).map((team) => (
              <Card key={team.id}>
                <CardContent className="pt-6">
                  <p className="font-medium">{team.name}</p>
                  {team.neighborhood && <p className="text-sm text-muted-foreground">{team.neighborhood}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t px-6 py-6 text-center text-xs text-muted-foreground">
        Organisation par la famille.
      </footer>
    </main>
  );
}
