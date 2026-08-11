import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getCurrentTournament, getApprovedTeams } from '@/lib/data/tournament';
import { formatDateLong } from '@/lib/format';
import { Calendar, MapPin, Users, Phone } from 'lucide-react';

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
      {/* Hero — traitement sombre charbon + or, comme les flyers */}
      <section className="relative overflow-hidden bg-[#17130e] px-6 py-20 text-center text-[#f3eedf] sm:py-28">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--gold-gradient-from)_0%,transparent_70%)] opacity-25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,var(--gold-gradient-from)_0%,transparent_70%)] opacity-10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,var(--gold-gradient-from)_0%,transparent_70%)] opacity-10 blur-3xl" />

        <div className="relative mx-auto max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-5">
          <div className="mx-auto size-28 rounded-full bg-[linear-gradient(135deg,var(--gold-gradient-from),var(--gold-gradient-to))] p-1 shadow-lg shadow-black/30 sm:size-32">
            <div className="relative h-full w-full overflow-hidden rounded-full ring-2 ring-[#17130e]">
              <Image
                src="/papa.png"
                alt={tournament.father_name ?? 'Photo commémorative'}
                fill
                sizes="128px"
                className="object-cover"
                priority
              />
            </div>
          </div>
          {tournament.memorial_subtitle && (
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gold-gradient-from)] sm:text-sm">
              {tournament.memorial_subtitle}
            </p>
          )}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">{tournament.name}</h1>
          {tournament.description && (
            <p className="mx-auto max-w-xl text-white/70">{tournament.description}</p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-sm">
            <span className="rounded-full border border-[var(--gold-gradient-from)]/30 bg-white/5 px-3 py-1 text-white/80">
              {formatDateLong(tournament.event_date)}
            </span>
            <span className="rounded-full border border-[var(--gold-gradient-from)]/30 bg-white/5 px-3 py-1 text-white/80">
              {tournament.start_time.slice(0, 5)}–{tournament.end_time.slice(0, 5)}
            </span>
            <span className="rounded-full border border-[var(--gold-gradient-from)]/30 bg-white/5 px-3 py-1 text-white/80">
              {tournament.venue_name}, {tournament.venue_city}
            </span>
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
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              render={<Link href="/tournoi">Voir le tournoi</Link>}
            />
          </div>
          {!registrationsOpen && (
            <p className="text-xs text-white/50">Les inscriptions ne sont pas ouvertes pour le moment.</p>
          )}
        </div>
      </section>
      <div className="gold-hairline" />

      {/* Infos pratiques + compteur */}
      <section className="grid gap-4 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-16">
        <Card>
          <CardContent className="space-y-1 pt-6">
            <Calendar className="size-4 text-primary" />
            <p className="text-xs uppercase text-muted-foreground">Date</p>
            <p className="font-medium">{formatDateLong(tournament.event_date)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 pt-6">
            <MapPin className="size-4 text-primary" />
            <p className="text-xs uppercase text-muted-foreground">Lieu</p>
            <p className="font-medium">
              {tournament.venue_name}, {tournament.venue_city}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 pt-6">
            <Users className="size-4 text-primary" />
            <p className="text-xs uppercase text-muted-foreground">Équipes inscrites</p>
            <p className="font-medium">
              {teams.length} / {tournament.max_teams}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 pt-6">
            <Phone className="size-4 text-primary" />
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
            <Link
              href="/equipes"
              className="text-sm text-muted-foreground underline decoration-primary/50 underline-offset-4 transition-colors hover:text-primary"
            >
              Voir toutes les équipes
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {teams.slice(0, 8).map((team) => (
              <Card key={team.id} className="transition-transform duration-200 hover:-translate-y-1">
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
