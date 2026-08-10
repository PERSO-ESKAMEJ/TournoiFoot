import { getCurrentTournament } from '@/lib/data/tournament';
import { Card, CardContent } from '@/components/ui/card';
import { formatDateLong, TOURNAMENT_STATUS_LABELS } from '@/lib/format';

export default async function InfosPage() {
  const tournament = await getCurrentTournament();
  if (!tournament) {
    return <main className="flex-1 px-6 py-16 text-center text-muted-foreground">Aucun tournoi.</main>;
  }

  const rows: [string, string][] = [
    ['Date', formatDateLong(tournament.event_date)],
    ['Horaires', `${tournament.start_time.slice(0, 5)} – ${tournament.end_time.slice(0, 5)}`],
    ['Lieu', `${tournament.venue_name}, ${tournament.venue_city}`],
    ['Nombre maximal d\'équipes', String(tournament.max_teams)],
    ['Statut des inscriptions', TOURNAMENT_STATUS_LABELS[tournament.status]],
    ...(tournament.registration_closes_at
      ? ([['Date limite d\'inscription', new Date(tournament.registration_closes_at).toLocaleDateString('fr-FR')]] as [string, string][])
      : []),
    ['Contact organisation', [tournament.contact_name, tournament.contact_phone].filter(Boolean).join(' — ') || '—'],
  ];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold">Informations pratiques</h1>
      <Card>
        <CardContent className="divide-y pt-6">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-right text-sm font-medium">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      {tournament.father_name && (
        <p className="mt-8 text-center text-sm italic text-muted-foreground">
          En mémoire de {tournament.father_name}.
        </p>
      )}
    </main>
  );
}
