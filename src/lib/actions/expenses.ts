'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/dal';
import type { ActionResult } from './applications';
import type { ExpenseCategory, ExpenseStatus } from '@/types/database';

export interface ExpenseInput {
  tournament_id: string;
  category: ExpenseCategory;
  label: string;
  quantity: number;
  unit_price: number;
  planned_amount: number;
  actual_amount?: number;
  responsible?: string;
  status: ExpenseStatus;
  notes?: string;
}

export async function upsertExpense(id: string | null, input: ExpenseInput): Promise<ActionResult> {
  await requireSession(['super_admin', 'tournament_manager']);
  const supabase = await createClient();
  const payload = {
    ...input,
    actual_amount: input.actual_amount ?? null,
    responsible: input.responsible || null,
    notes: input.notes || null,
  };
  const { error } = id
    ? await supabase.from('expenses').update(payload).eq('id', id)
    : await supabase.from('expenses').insert(payload);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/budget');
  revalidatePath('/admin/logistique');
  return { success: true };
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  await requireSession(['super_admin', 'tournament_manager']);
  const supabase = await createClient();
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/budget');
  revalidatePath('/admin/logistique');
  return { success: true };
}

export interface DrinkOptionInput {
  tournament_id: string;
  option_name: string;
  supplier?: string;
  quantity?: number;
  unit_price?: number;
  extra_fees?: number;
  notes?: string;
}

export async function upsertDrinkOption(id: string | null, input: DrinkOptionInput): Promise<ActionResult> {
  await requireSession(['super_admin', 'tournament_manager']);
  const supabase = await createClient();
  const payload = {
    ...input,
    supplier: input.supplier || null,
    notes: input.notes || null,
  };
  const { error } = id
    ? await supabase.from('drink_options').update(payload).eq('id', id)
    : await supabase.from('drink_options').insert(payload);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/logistique');
  return { success: true };
}

export async function selectDrinkOption(id: string, tournamentId: string): Promise<ActionResult> {
  await requireSession(['super_admin', 'tournament_manager']);
  const supabase = await createClient();
  await supabase.from('drink_options').update({ selected: false }).eq('tournament_id', tournamentId);
  const { error } = await supabase.from('drink_options').update({ selected: true }).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/logistique');
  return { success: true };
}
