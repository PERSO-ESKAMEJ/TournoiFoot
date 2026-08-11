import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentTournament } from '@/lib/data/tournament';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { APPLICATION_STATUS_LABELS } from '@/lib/format';
import type { ApplicationStatus } from '@/types/database';
import { cn } from '@/lib/utils';

const FILTERS: { key: string; label: string; statuses?: ApplicationStatus[] }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'todo', label: 'À traiter', statuses: ['submitted', 'pending', 'needs_info'] },
  { key: 'approved', label: 'Validées', statuses: ['approved'] },
  { key: 'rejected', label: 'Refusées', statuses: ['rejected'] },
  { key: 'waitlisted', label: "Liste d'attente", statuses: ['waitlisted'] },
];

export default async function CandidaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const { filter = 'all', q = '' } = await searchParams;
  const tournament = await getCurrentTournament();
  if (!tournament) return <p className="text-sm text-muted-foreground">Aucun tournoi.</p>;

  const supabase = await createClient();
  let query = supabase
    .from('team_applications')
    .select('id, reference, team_name, contact_name, contact_whatsapp, status, created_at')
    .eq('tournament_id', tournament.id)
    .order('created_at', { ascending: false });

  const activeFilter = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  if (activeFilter.statuses) query = query.in('status', activeFilter.statuses);
  if (q) query = query.ilike('team_name', `%${q}%`);

  const { data: applications } = await query;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Candidatures</h1>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/candidatures?filter=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
            className={cn(
              'rounded-full border px-3 py-1 text-xs',
              f.key === activeFilter.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <form method="get" className="max-w-xs">
        <input type="hidden" name="filter" value={activeFilter.key} />
        <Input name="q" placeholder="Rechercher une équipe…" defaultValue={q} />
      </form>

      {!applications || applications.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune candidature dans ce filtre.</p>
      ) : (
        <div className="space-y-2">
          {applications.map((app) => (
            <Link key={app.id} href={`/admin/candidatures/${app.id}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center justify-between gap-4 pt-6">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{app.team_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {app.reference} · {app.contact_name} · {app.contact_whatsapp}
                    </p>
                  </div>
                  <Badge variant={app.status === 'approved' ? 'default' : 'secondary'} className="shrink-0">
                    {APPLICATION_STATUS_LABELS[app.status]}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
