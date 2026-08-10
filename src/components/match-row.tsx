'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTime, MATCH_STATUS_LABELS } from '@/lib/format';
import { MatchScoreDialog } from '@/components/match-score-dialog';
import type { BracketMatch } from '@/components/bracket-view';

export function MatchRow({ match }: { match: BracketMatch & { roundName: string } }) {
  const [open, setOpen] = useState(false);
  const decided = match.status === 'completed' || match.status === 'forfeit';
  const canScore = !decided && match.team1 && match.team2;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
        <div>
          <p className="text-xs uppercase text-muted-foreground">{match.roundName}</p>
          <p className="font-medium">
            {match.team1?.name ?? 'À déterminer'} vs {match.team2?.name ?? 'À déterminer'}
          </p>
          <p className="text-xs text-muted-foreground">{formatTime(match.scheduled_start)}</p>
        </div>
        <div className="flex items-center gap-3">
          {decided && (
            <span className="font-mono text-sm">
              {match.team1_score}-{match.team2_score}
              {match.team1_penalties != null && ` (${match.team1_penalties}-${match.team2_penalties})`}
            </span>
          )}
          <Badge variant={decided ? 'secondary' : 'outline'}>{MATCH_STATUS_LABELS[match.status]}</Badge>
          {canScore && (
            <Button size="sm" onClick={() => setOpen(true)}>
              Saisir le score
            </Button>
          )}
        </div>
      </CardContent>
      {match.team1 && match.team2 && (
        <MatchScoreDialog matchId={match.id} team1={match.team1} team2={match.team2} open={open} onOpenChange={setOpen} />
      )}
    </Card>
  );
}
