'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/dal';
import type { ActionResult } from './applications';
import type { CommunicationAssetStatus, CommunicationAssetType } from '@/types/database';

export interface CommunicationAssetInput {
  tournament_id: string;
  name: string;
  type: CommunicationAssetType;
  status: CommunicationAssetStatus;
  responsible?: string;
  due_date?: string;
  external_url?: string;
  notes?: string;
}

export async function upsertCommunicationAsset(
  id: string | null,
  input: CommunicationAssetInput
): Promise<ActionResult> {
  await requireSession(['super_admin', 'tournament_manager']);
  const supabase = await createClient();
  const payload = {
    ...input,
    responsible: input.responsible || null,
    due_date: input.due_date || null,
    external_url: input.external_url || null,
    notes: input.notes || null,
  };

  const { error } = id
    ? await supabase.from('communication_assets').update(payload).eq('id', id)
    : await supabase.from('communication_assets').insert(payload);
  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/communication');
  return { success: true };
}

export async function deleteCommunicationAsset(id: string): Promise<ActionResult> {
  await requireSession(['super_admin', 'tournament_manager']);
  const supabase = await createClient();
  const { error } = await supabase.from('communication_assets').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/communication');
  return { success: true };
}
