'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toggleCheckedIn, generateBracketAction } from '@/lib/actions/bracket';
import type { Database } from '@/types/database';

type Team = Database['public']['Tables']['teams']['Row'];

export function BracketPrep({
  tournamentId,
  teams,
  bracketExists,
}: {
  tournamentId: string;
  teams: Team[];
  bracketExists: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(teams.filter((t) => t.checked_in).map((t) => t.id))
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCheckIn(id: string, checked: boolean) {
    startTransition(async () => {
      await toggleCheckedIn(id, checked);
      if (checked) setSelected((prev) => new Set(prev).add(id));
      router.refresh();
    });
  }

  function handleGenerate() {
    startTransition(async () => {
      const res = await generateBracketAction(tournamentId, Array.from(selected));
      if (!res.success) {
        toast.error(res.error ?? 'Erreur lors de la génération du tirage');
        return;
      }
      toast.success('Bracket généré !');
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {teams.map((team) => (
          <div key={team.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Checkbox checked={selected.has(team.id)} onCheckedChange={() => toggleSelected(team.id)} />
              <span className="font-medium">{team.name}</span>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={team.checked_in} onCheckedChange={(v) => handleCheckIn(team.id, v === true)} />
              Présente
            </label>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="outline">{selected.size} équipe(s) sélectionnée(s) pour le tirage</Badge>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogTrigger
          render={
            <Button disabled={selected.size < 2 || pending}>
              {bracketExists ? 'Relancer le tirage' : 'Lancer le tirage'}
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le tirage ?</DialogTitle>
            <DialogDescription>
              {bracketExists
                ? "Le tableau actuel sera remplacé (impossible si des résultats ont déjà été saisis)."
                : `${selected.size} équipes seront réparties aléatoirement dans le tableau.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleGenerate} disabled={pending}>
              {pending ? 'Génération…' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
