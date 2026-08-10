import { getCurrentTournament, getRoundsWithMatches, getApprovedTeams } from '@/lib/data/tournament';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BracketView } from '@/components/bracket-view';
import { PipelineView, type PipelineStage } from '@/components/pipeline-view';

export default async function PublicBracketPage() {
  const tournament = await getCurrentTournament();
  if (!tournament) {
    return <main className="flex-1 px-6 py-16 text-center text-muted-foreground">Aucun tournoi.</main>;
  }

  const [rounds, teams] = await Promise.all([
    getRoundsWithMatches(tournament.id),
    getApprovedTeams(tournament.id),
  ]);

  const stages: PipelineStage[] = [
    { label: 'Inscrites', teamNames: teams.map((t) => t.name) },
    { label: 'Présentes', teamNames: teams.filter((t) => t.checked_in).map((t) => t.name) },
    ...rounds.map((r) => ({
      label: r.name,
      teamNames: Array.from(
        new Set(
          r.matches.flatMap((m) => [m.team1?.name, m.team2?.name].filter((n): n is string => !!n))
        )
      ),
    })),
  ];
  const winner = teams.find((t) => t.sport_status === 'winner');
  stages.push({ label: 'Vainqueur', teamNames: winner ? [winner.name] : [], highlight: !!winner });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold">Parcours du tournoi</h1>
      <Tabs defaultValue="bracket">
        <TabsList>
          <TabsTrigger value="bracket">Tableau</TabsTrigger>
          <TabsTrigger value="pipeline">Progression</TabsTrigger>
        </TabsList>
        <TabsContent value="bracket" className="pt-4">
          <BracketView rounds={rounds} />
        </TabsContent>
        <TabsContent value="pipeline" className="pt-4">
          <PipelineView stages={stages} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
