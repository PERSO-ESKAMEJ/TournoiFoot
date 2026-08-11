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
    supabase.from('application_players').select('*').eq('application_id', id).order('name'),
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

      {application.comment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commentaire</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{application.comment}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Responsable</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Nom</span>
          <span>{application.contact_name}</span>
          <span className="text-muted-foreground">WhatsApp</span>
          <span>{application.contact_whatsapp}</span>
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
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <CandidatureActions applicationId={application.id} status={application.status} />
    </div>
  );
}
