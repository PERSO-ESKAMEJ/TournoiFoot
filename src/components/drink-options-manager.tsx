'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { upsertDrinkOption, selectDrinkOption } from '@/lib/actions/expenses';
import { formatFcfa } from '@/lib/format';
import type { Database } from '@/types/database';

type DrinkOption = Database['public']['Tables']['drink_options']['Row'];

export function DrinkOptionsManager({ tournamentId, options }: { tournamentId: string; options: DrinkOption[] }) {
  const [name, setName] = useState('');
  const [supplier, setSupplier] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleAdd() {
    if (!name.trim()) return;
    startTransition(async () => {
      await upsertDrinkOption(null, {
        tournament_id: tournamentId,
        option_name: name,
        supplier: supplier || undefined,
        quantity: quantity ? Number(quantity) : undefined,
        unit_price: unitPrice ? Number(unitPrice) : undefined,
      });
      setName('');
      setSupplier('');
      setQuantity('');
      setUnitPrice('');
      router.refresh();
    });
  }

  function handleSelect(id: string) {
    startTransition(async () => {
      await selectDrinkOption(id, tournamentId);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Boissons — comparatif</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto_auto]">
          <div className="space-y-1">
            <Label className="text-xs">Option</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Cannettes" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fournisseur</Label>
            <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Ex: Mama" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Quantité</Label>
            <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-24" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Prix unitaire</Label>
            <Input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="w-28" />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAdd} disabled={pending || !name.trim()}>
              Ajouter
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune option chiffrée pour l&apos;instant.</p>
          ) : (
            options.map((opt) => {
              const total = (opt.quantity ?? 0) * (opt.unit_price ?? 0) + (opt.extra_fees ?? 0);
              return (
                <div key={opt.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {opt.option_name} {opt.supplier ? `— ${opt.supplier}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {opt.quantity ?? '?'} × {formatFcfa(opt.unit_price)} = {formatFcfa(total)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={opt.selected ? 'default' : 'outline'}
                    onClick={() => handleSelect(opt.id)}
                    disabled={pending}
                  >
                    {opt.selected ? <Badge variant="secondary">Retenue</Badge> : 'Retenir'}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
