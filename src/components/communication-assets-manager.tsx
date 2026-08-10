'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { upsertCommunicationAsset, deleteCommunicationAsset } from '@/lib/actions/communication';
import type { Database, CommunicationAssetStatus, CommunicationAssetType } from '@/types/database';

type Asset = Database['public']['Tables']['communication_assets']['Row'];

const TYPE_LABELS: Record<CommunicationAssetType, string> = {
  flyer_general: 'Flyer général',
  flyer_inscription: 'Flyer inscription',
  other: 'Autre',
};
const STATUS_LABELS: Record<CommunicationAssetStatus, string> = {
  todo: 'À réaliser',
  done: 'Réalisé',
  published: 'Diffusé',
};
const STATUS_CYCLE: Record<CommunicationAssetStatus, CommunicationAssetStatus> = {
  todo: 'done',
  done: 'published',
  published: 'todo',
};

export function CommunicationAssetsManager({ tournamentId, assets }: { tournamentId: string; assets: Asset[] }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<CommunicationAssetType>('flyer_inscription');
  const [responsible, setResponsible] = useState('Mike');
  const [dueDate, setDueDate] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleAdd() {
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await upsertCommunicationAsset(null, {
        tournament_id: tournamentId,
        name,
        type,
        status: 'todo',
        responsible,
        due_date: dueDate || undefined,
      });
      if (!res.success) {
        toast.error(res.error ?? 'Erreur');
        return;
      }
      setName('');
      router.refresh();
    });
  }

  function cycleStatus(asset: Asset) {
    startTransition(async () => {
      await upsertCommunicationAsset(asset.id, {
        tournament_id: tournamentId,
        name: asset.name,
        type: asset.type,
        status: STATUS_CYCLE[asset.status],
        responsible: asset.responsible ?? undefined,
        due_date: asset.due_date ?? undefined,
        external_url: asset.external_url ?? undefined,
        notes: asset.notes ?? undefined,
      });
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteCommunicationAsset(id);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Supports de communication</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto]">
          <div className="space-y-1">
            <Label className="text-xs">Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Flyer appel à candidatures" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as CommunicationAssetType)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Responsable</Label>
            <Input value={responsible} onChange={(e) => setResponsible(e.target.value)} className="w-32" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Échéance</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-40" />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAdd} disabled={pending || !name.trim()}>
              Ajouter
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun support pour l&apos;instant.</p>
          ) : (
            assets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{asset.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABELS[asset.type]} · {asset.responsible ?? '—'}
                    {asset.due_date ? ` · échéance ${asset.due_date}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className="cursor-pointer"
                    variant={asset.status === 'published' ? 'default' : 'secondary'}
                    onClick={() => cycleStatus(asset)}
                  >
                    {STATUS_LABELS[asset.status]}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(asset.id)} disabled={pending}>
                    Supprimer
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
