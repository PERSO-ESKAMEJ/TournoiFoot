import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentTournament } from '@/lib/data/tournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DrinkOptionsManager } from '@/components/drink-options-manager';
import { formatFcfa } from '@/lib/format';

export default async function LogistiquePage() {
  const tournament = await getCurrentTournament();
  if (!tournament) return <p className="text-sm text-muted-foreground">Aucun tournoi.</p>;

  const supabase = await createClient();
  const { data: drinkOptions } = await supabase
    .from('drink_options')
    .select('*')
    .eq('tournament_id', tournament.id)
    .order('created_at');

  const fieldTotal = (tournament.field_price_per_hour ?? 0) * (tournament.field_hours_booked ?? 0);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Terrain & logistique</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Terrain</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Lieu</span>
          <span>
            {tournament.venue_name}, {tournament.venue_city}
          </span>
          <span className="text-muted-foreground">Prix / heure</span>
          <span>{formatFcfa(tournament.field_price_per_hour)}</span>
          <span className="text-muted-foreground">Heures réservées</span>
          <span>{tournament.field_hours_booked ?? '—'} h</span>
          <span className="text-muted-foreground">Budget terrain</span>
          <span className="font-medium">{formatFcfa(fieldTotal)}</span>
          <span className="text-muted-foreground">Prix chasuble</span>
          <span>{formatFcfa(tournament.jersey_unit_price)} / unité</span>
        </CardContent>
        <CardContent className="pt-0">
          <Link href="/admin/parametres" className="text-xs text-muted-foreground underline">
            Modifier ces valeurs dans Paramètres
          </Link>
        </CardContent>
      </Card>

      <DrinkOptionsManager tournamentId={tournament.id} options={drinkOptions ?? []} />
    </div>
  );
}
