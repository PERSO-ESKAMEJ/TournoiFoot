'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { approveApplication, setApplicationStatus } from '@/lib/actions/applications';
import type { ApplicationStatus } from '@/types/database';

export function CandidatureActions({ applicationId, status }: { applicationId: string; status: ApplicationStatus }) {
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const router = useRouter();

  if (status === 'approved') {
    return <p className="text-sm text-muted-foreground">Candidature déjà approuvée — équipe officielle créée.</p>;
  }
  if (status === 'rejected' || status === 'cancelled') {
    return <p className="text-sm text-muted-foreground">Candidature clôturée.</p>;
  }

  function handleApprove() {
    startTransition(async () => {
      const res = await approveApplication(applicationId);
      if (!res.success) {
        toast.error(res.error ?? 'Erreur');
        return;
      }
      toast.success('Équipe validée !');
      router.refresh();
    });
  }

  function handleStatus(next: 'needs_info' | 'rejected' | 'waitlisted') {
    startTransition(async () => {
      const res = await setApplicationStatus(applicationId, next, notes || undefined);
      if (!res.success) {
        toast.error(res.error ?? 'Erreur');
        return;
      }
      toast.success('Statut mis à jour');
      setRejectOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={handleApprove} disabled={pending}>
        Valider
      </Button>
      <Button variant="outline" onClick={() => handleStatus('waitlisted')} disabled={pending}>
        Liste d&apos;attente
      </Button>

      <Dialog>
        <DialogTrigger
          render={
            <Button variant="outline" disabled={pending}>
              Demander des infos
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander des informations</DialogTitle>
            <DialogDescription>Le capitaine verra ce message sur sa page de suivi.</DialogDescription>
          </DialogHeader>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ce qui manque…" />
          <DialogFooter>
            <Button onClick={() => handleStatus('needs_info')} disabled={pending || !notes}>
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger
          render={
            <Button variant="destructive" disabled={pending}>
              Refuser
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser cette candidature ?</DialogTitle>
            <DialogDescription>Cette action peut être annulée plus tard en changeant le statut.</DialogDescription>
          </DialogHeader>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Motif (optionnel)" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => handleStatus('rejected')} disabled={pending}>
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
