import { createClient } from '@/lib/supabase/server';
import { getCurrentTournament } from '@/lib/data/tournament';
import { ExpensesManager } from '@/components/expenses-manager';

export default async function BudgetPage() {
  const tournament = await getCurrentTournament();
  if (!tournament) return <p className="text-sm text-muted-foreground">Aucun tournoi.</p>;

  const supabase = await createClient();
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('tournament_id', tournament.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Budget</h1>
      <ExpensesManager tournamentId={tournament.id} expenses={expenses ?? []} />
    </div>
  );
}
