'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Minus, Plus } from 'lucide-react';
import { submitMatchResult, declareForfeitAction } from '@/lib/actions/matches';
import { determineWinner } from '@/lib/tournament/scoring';
import type { BracketTeamRef } from '@/components/bracket-view';

function Stepper({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="icon" onClick={() => onChange(Math.max(0, value - 1))}>
          <Minus className="size-4" />
        </Button>
        <span className="w-8 text-center text-2xl font-bold tabular-nums">{value}</span>
        <Button type="button" variant="outline" size="icon" onClick={() => onChange(value + 1)}>
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function MatchScoreDialog({
  matchId,
  team1,
  team2,
  open,
  onOpenChange,
}: {
  matchId: string;
  team1: BracketTeamRef;
  team2: BracketTeamRef;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [s1, setS1] = useState(0);
  const [s2, setS2] = useState(0);
  const [p1, setP1] = useState(0);
  const [p2, setP2] = useState(0);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const tied = s1 === s2;

  function reset() {
    setStep('input');
    setS1(0);
    setS2(0);
    setP1(0);
    setP2(0);
  }

  function handleConfirm() {
    try {
      determineWinner(team1.id, team2.id, {
        team1Score: s1,
        team2Score: s2,
        team1Penalties: tied ? p1 : undefined,
        team2Penalties: tied ? p2 : undefined,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Résultat invalide');
      return;
    }
    setStep('confirm');
  }

  function handleSubmit() {
    startTransition(async () => {
      const res = await submitMatchResult(matchId, {
        team1Score: s1,
        team2Score: s2,
        team1Penalties: tied ? p1 : undefined,
        team2Penalties: tied ? p2 : undefined,
      });
      if (!res.success) {
        toast.error(res.error ?? 'Erreur');
        return;
      }
      toast.success('Résultat enregistré !');
      reset();
      onOpenChange(false);
      router.refresh();
    });
  }

  function handleForfeit(teamId: string) {
    startTransition(async () => {
      const res = await declareForfeitAction(matchId, teamId);
      if (!res.success) {
        toast.error(res.error ?? 'Erreur');
        return;
      }
      toast.success('Forfait enregistré');
      reset();
      onOpenChange(false);
      router.refresh();
    });
  }

  const winnerName = tied
    ? p1 > p2
      ? team1.name
      : team2.name
    : s1 > s2
      ? team1.name
      : team2.name;
  const scoreLabel = tied ? `${s1}-${s2} (TAB ${p1}-${p2})` : `${s1}-${s2}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent>
        {step === 'input' ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {team1.name} vs {team2.name}
              </DialogTitle>
              <DialogDescription>Saisis le score du match.</DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center gap-8 py-4">
              <Stepper value={s1} onChange={setS1} label={team1.name} />
              <span className="text-muted-foreground">—</span>
              <Stepper value={s2} onChange={setS2} label={team2.name} />
            </div>
            {tied && (
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <p className="text-center text-xs text-muted-foreground">
                  Match nul : tirs au but requis pour désigner un vainqueur
                </p>
                <div className="flex items-center justify-center gap-8">
                  <Stepper value={p1} onChange={setP1} label={`TAB ${team1.name}`} />
                  <Stepper value={p2} onChange={setP2} label={`TAB ${team2.name}`} />
                </div>
              </div>
            )}
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleForfeit(team1.id)} disabled={pending}>
                  Forfait {team1.name}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleForfeit(team2.id)} disabled={pending}>
                  Forfait {team2.name}
                </Button>
              </div>
              <Button onClick={handleConfirm}>Valider le résultat</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirmer le résultat</DialogTitle>
              <DialogDescription>
                Confirmer la victoire de <strong className="text-foreground">{winnerName}</strong>, {scoreLabel} ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('input')} disabled={pending}>
                Retour
              </Button>
              <Button onClick={handleSubmit} disabled={pending}>
                {pending ? 'Enregistrement…' : 'Confirmer'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
