import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { APPLICATION_STATUS_LABELS } from '@/lib/format';
import { CandidatureActions } from '@/components/candidature-actions';

export default async function CandidatureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: application }, { data: players }] = await Promise.all([
    supabase.from('team_applications').select('*').eq('id', id).single(),
    supabase.from('application_players').select('*').eq('application_id', id).order('jersey_number'),
  ]);

  if (!application) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{application.team_name}</h1>
          <p className="text-sm text-muted-foreground">{application.reference}</p>
        </div>
        <Badge>{APPLICATION_STATUS_LABELS[application.status]}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Équipe</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Quartier</span>
          <span>{application.neighborhood ?? '—'}</span>
          <span className="text-muted-foreground">Couleurs</span>
          <span>
            {[application.primary_color, application.secondary_color].filter(Boolean).join(' / ') || '—'}
          </span>
          {application.comment && (
            <>
              <span className="text-muted-foreground">Commentaire</span>
              <span>{application.comment}</span>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Responsable</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Nom</span>
          <span>
            {application.contact_first_name} {application.contact_last_name}
          </span>
          <span className="text-muted-foreground">WhatsApp</span>
          <span>{application.contact_whatsapp}</span>
          {application.contact_phone && (
            <>
              <span className="text-muted-foreground">Téléphone</span>
              <span>{application.contact_phone}</span>
            </>
          )}
          {application.contact_email && (
            <>
              <span className="text-muted-foreground">Email</span>
              <span>{application.contact_email}</span>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Joueurs ({players?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!players || players.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun joueur renseigné.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {players.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>
                    {p.first_name} {p.last_name} {p.nickname ? `"${p.nickname}"` : ''}
                  </span>
                  <span className="text-muted-foreground">{p.jersey_number != null ? `#${p.jersey_number}` : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <CandidatureActions applicationId={application.id} status={application.status} />
    </div>
  );
}
