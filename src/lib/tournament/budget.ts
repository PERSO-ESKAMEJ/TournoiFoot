// Calculs budgétaires — purs, testables indépendamment de l'UI/DB.

export interface ExpenseLine {
  plannedAmount: number;
  actualAmount: number | null;
  status: 'planned' | 'ordered' | 'paid' | 'cancelled';
}

export interface BudgetSummary {
  planned: number;
  engaged: number; // planned pour les lignes non annulées (ordered/paid/planned)
  paid: number;
  remaining: number; // engaged - paid
}

export function summarizeBudget(lines: ExpenseLine[]): BudgetSummary {
  const active = lines.filter((l) => l.status !== 'cancelled');
  const planned = active.reduce((sum, l) => sum + l.plannedAmount, 0);
  const engaged = active
    .filter((l) => l.status === 'ordered' || l.status === 'paid')
    .reduce((sum, l) => sum + (l.actualAmount ?? l.plannedAmount), 0);
  const paid = active
    .filter((l) => l.status === 'paid')
    .reduce((sum, l) => sum + (l.actualAmount ?? l.plannedAmount), 0);

  return { planned, engaged, paid, remaining: engaged - paid };
}
