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
import { upsertExpense, deleteExpense } from '@/lib/actions/expenses';
import { summarizeBudget } from '@/lib/tournament/budget';
import { formatFcfa } from '@/lib/format';
import type { Database, ExpenseCategory, ExpenseStatus } from '@/types/database';

type Expense = Database['public']['Tables']['expenses']['Row'];

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  terrain: 'Terrain',
  chasubles: 'Chasubles',
  trophees: 'Trophées',
  medailles: 'Médailles',
  boissons: 'Boissons',
  restauration: 'Restauration',
  impressions: 'Impressions',
  communication: 'Communication',
  autre: 'Autre',
};
const STATUS_LABELS: Record<ExpenseStatus, string> = {
  planned: 'Prévu',
  ordered: 'Commandé',
  paid: 'Payé',
  cancelled: 'Annulé',
};
const STATUS_CYCLE: Record<ExpenseStatus, ExpenseStatus> = {
  planned: 'ordered',
  ordered: 'paid',
  paid: 'planned',
  cancelled: 'planned',
};

export function ExpensesManager({ tournamentId, expenses }: { tournamentId: string; expenses: Expense[] }) {
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('autre');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('0');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const summary = summarizeBudget(
    expenses.map((e) => ({ plannedAmount: e.planned_amount, actualAmount: e.actual_amount, status: e.status }))
  );

  function handleAdd() {
    if (!label.trim()) return;
    const q = Number(quantity) || 1;
    const p = Number(unitPrice) || 0;
    startTransition(async () => {
      const res = await upsertExpense(null, {
        tournament_id: tournamentId,
        category,
        label,
        quantity: q,
        unit_price: p,
        planned_amount: q * p,
        status: 'planned',
      });
      if (!res.success) {
        toast.error(res.error ?? 'Erreur');
        return;
      }
      setLabel('');
      setQuantity('1');
      setUnitPrice('0');
      router.refresh();
    });
  }

  function cycleStatus(expense: Expense) {
    startTransition(async () => {
      await upsertExpense(expense.id, {
        tournament_id: tournamentId,
        category: expense.category,
        label: expense.label,
        quantity: expense.quantity,
        unit_price: expense.unit_price,
        planned_amount: expense.planned_amount,
        actual_amount: expense.actual_amount ?? undefined,
        responsible: expense.responsible ?? undefined,
        status: STATUS_CYCLE[expense.status],
        notes: expense.notes ?? undefined,
      });
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteExpense(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-normal uppercase text-muted-foreground">Prévu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatFcfa(summary.planned)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-normal uppercase text-muted-foreground">Engagé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatFcfa(summary.engaged)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-normal uppercase text-muted-foreground">Payé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatFcfa(summary.paid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-normal uppercase text-muted-foreground">Reste à payer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatFcfa(summary.remaining)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouvelle ligne</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto]">
          <div className="space-y-1">
            <Label className="text-xs">Libellé</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Location terrain" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Catégorie</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Qté</Label>
            <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-20" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Prix unitaire</Label>
            <Input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="w-28" />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAdd} disabled={pending || !label.trim()}>
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune dépense enregistrée.</p>
        ) : (
          expenses.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{expense.label}</p>
                <p className="text-xs text-muted-foreground">
                  {CATEGORY_LABELS[expense.category]} · {expense.quantity} × {formatFcfa(expense.unit_price)} ={' '}
                  {formatFcfa(expense.planned_amount)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className="cursor-pointer"
                  variant={expense.status === 'paid' ? 'default' : 'secondary'}
                  onClick={() => cycleStatus(expense)}
                >
                  {STATUS_LABELS[expense.status]}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)} disabled={pending}>
                  Supprimer
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
