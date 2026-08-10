import { notFound } from 'next/navigation';
import { getApplicationByToken } from '@/lib/actions/applications';
import { getCurrentTournament } from '@/lib/data/tournament';
import { ApplicationForm } from '@/components/application-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { APPLICATION_STATUS_LABELS } from '@/lib/format';
import type { ApplicationStatus } from '@/types/database';

interface Application {
  id: string;
  reference: string;
  team_name: string;
  neighborhood: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  comment: string | null;
  contact_first_name: string;
  contact_last_name: string;
  contact_whatsapp: string;
  contact_phone: string | null;
  contact_email: string | null;
  status: ApplicationStatus;
  review_notes: string | null;
  players: { first_name: string; last_name: string; nickname: string | null; jersey_number: number | null; role: string | null }[];
}

const EDITABLE_STATUSES: ApplicationStatus[] = ['draft', 'submitted', 'needs_info'];

export default async function MyTeamPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const application = (await getApplicationByToken(token)) as Application | null;
  if (!application) notFound();

  const tournament = await getCurrentTournament();
  const editable = EDITABLE_STATUSES.includes(application.status);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{application.team_name}</h1>
          <p className="text-sm text-muted-foreground">Référence {application.reference}</p>
        </div>
        <Badge variant={application.status === 'approved' ? 'default' : 'secondary'}>
          {APPLICATION_STATUS_LABELS[application.status]}
        </Badge>
      </div>

      {application.status === 'needs_info' && application.review_notes && (
        <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base">Informations demandées par l&apos;organisation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{application.review_notes}</p>
          </CardContent>
        </Card>
      )}

      {!editable ? (
        <Card>
          <CardContent className="space-y-3 pt-6 text-sm">
            <p>
              Cette candidature n&apos;est plus modifiable
              {application.status === 'approved' && " — ton équipe est officiellement inscrite !"}
              {application.status === 'rejected' && '.'}
              {application.status === 'waitlisted' && ' — tu es en liste d\'attente.'}
            </p>
            <div>
              <p className="font-medium">Roster déclaré</p>
              <ul className="mt-1 list-inside list-disc text-muted-foreground">
                {application.players.map((p, i) => (
                  <li key={i}>
                    {p.first_name} {p.last_name}
                    {p.nickname ? ` "${p.nickname}"` : ''}
                    {p.jersey_number != null ? ` — #${p.jersey_number}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : tournament ? (
        <ApplicationForm
          mode="edit"
          accessToken={token}
          tournamentId={tournament.id}
          minPlayers={tournament.min_players_per_team}
          maxPlayers={tournament.max_players_per_team}
          defaultValues={{
            tournament_id: tournament.id,
            team_name: application.team_name,
            neighborhood: application.neighborhood ?? '',
            primary_color: application.primary_color ?? '',
            secondary_color: application.secondary_color ?? '',
            comment: application.comment ?? '',
            contact_first_name: application.contact_first_name,
            contact_last_name: application.contact_last_name,
            contact_whatsapp: application.contact_whatsapp,
            contact_phone: application.contact_phone ?? '',
            contact_email: application.contact_email ?? '',
            players: application.players.map((p) => ({
              first_name: p.first_name,
              last_name: p.last_name,
              nickname: p.nickname ?? '',
              jersey_number: p.jersey_number ?? undefined,
              role: p.role ?? '',
            })),
          }}
        />
      ) : null}
    </main>
  );
}
