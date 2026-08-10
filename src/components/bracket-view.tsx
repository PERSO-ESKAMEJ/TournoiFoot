import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { formatTime, MATCH_STATUS_LABELS } from '@/lib/format';
import type { MatchStatus } from '@/types/database';

export interface BracketTeamRef {
  id: string;
  name: string;
  logo_url: string | null;
}

export interface BracketMatch {
  id: string;
  slot: number;
  team1: BracketTeamRef | null;
  team2: BracketTeamRef | null;
  team1_score: number | null;
  team2_score: number | null;
  team1_penalties: number | null;
  team2_penalties: number | null;
  winner: BracketTeamRef | null;
  status: MatchStatus;
  scheduled_start: string | null;
}

export interface BracketRound {
  id: string;
  round_number: number;
  name: string;
  matches: BracketMatch[];
}

function TeamRow({
  team,
  score,
  penalties,
  isWinner,
  decided,
}: {
  team: BracketTeamRef | null;
  score: number | null;
  penalties: number | null;
  isWinner: boolean;
  decided: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 px-3 py-1.5 text-sm',
        decided && !isWinner && 'text-muted-foreground'
      )}
    >
      <span className={cn('truncate', isWinner && 'font-semibold')}>{team?.name ?? 'À déterminer'}</span>
      {score != null && (
        <span className={cn('font-mono tabular-nums', isWinner && 'font-semibold')}>
          {score}
          {penalties != null && <span className="text-xs text-muted-foreground"> ({penalties})</span>}
        </span>
      )}
    </div>
  );
}

export function MatchCard({ match }: { match: BracketMatch }) {
  const decided = match.status === 'completed' || match.status === 'forfeit';
  return (
    <div className="w-64 rounded-lg border bg-card shadow-sm">
      <TeamRow
        team={match.team1}
        score={match.team1_score}
        penalties={match.team1_penalties}
        isWinner={decided && match.winner?.id === match.team1?.id}
        decided={decided}
      />
      <div className="border-t" />
      <TeamRow
        team={match.team2}
        score={match.team2_score}
        penalties={match.team2_penalties}
        isWinner={decided && match.winner?.id === match.team2?.id}
        decided={decided}
      />
      <div className="flex items-center justify-between border-t px-3 py-1 text-[11px] text-muted-foreground">
        <span>{match.scheduled_start ? formatTime(match.scheduled_start) : ''}</span>
        <Badge variant={decided ? 'secondary' : match.status === 'in_progress' ? 'default' : 'outline'} className="text-[10px]">
          {MATCH_STATUS_LABELS[match.status]}
        </Badge>
      </div>
    </div>
  );
}

/**
 * Arbre du tournoi — colonnes par round, scroll horizontal sur mobile plutôt
 * que de compresser le bracket jusqu'à le rendre illisible.
 */
export function BracketView({ rounds }: { rounds: BracketRound[] }) {
  if (rounds.length === 0) {
    return <p className="text-sm text-muted-foreground">Le tableau n&apos;a pas encore été généré.</p>;
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-8">
        {rounds.map((round) => (
          <div key={round.id} className="flex flex-col gap-6" style={{ justifyContent: 'space-around' }}>
            <h3 className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {round.name}
            </h3>
            <div className="flex flex-1 flex-col justify-around gap-6">
              {round.matches
                .filter((m) => m.team1 || m.team2)
                .map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
