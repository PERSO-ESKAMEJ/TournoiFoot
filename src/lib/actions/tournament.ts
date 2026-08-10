'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/dal';
import { logAudit } from '@/lib/audit';
import { tournamentSettingsSchema, type TournamentSettingsInput } from '@/lib/validation/tournament';
import type { ActionResult } from './applications';
import type { Json } from '@/types/database';

function cleanPayload(input: TournamentSettingsInput) {
  return {
    ...input,
    memorial_subtitle: input.memorial_subtitle || null,
    description: input.description || null,
    registration_opens_at: input.registration_opens_at || null,
    registration_closes_at: input.registration_closes_at || null,
    contact_name: input.contact_name || null,
    contact_phone: input.contact_phone || null,
    father_name: input.father_name || null,
  };
}

export async function saveTournamentSettings(
  tournamentId: string | null,
  input: TournamentSettingsInput
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession(['super_admin', 'tournament_manager']);
  const parsed = tournamentSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Formulaire invalide' };
  }

  const supabase = await createClient();
  const payload = cleanPayload(parsed.data);

  if (tournamentId) {
    const { error } = await supabase.from('tournaments').update(payload).eq('id', tournamentId);
    if (error) return { success: false, error: error.message };
    await logAudit(supabase, {
      tournamentId,
      actorId: session.userId,
      action: 'tournament_updated',
      entityType: 'tournament',
      entityId: tournamentId,
      after: payload as unknown as Json,
    });
    revalidatePath('/', 'layout');
    return { success: true, data: { id: tournamentId } };
  }

  const { data, error } = await supabase.from('tournaments').insert(payload).select('id').single();
  if (error || !data) return { success: false, error: error?.message ?? 'Erreur création' };

  await logAudit(supabase, {
    tournamentId: data.id,
    actorId: session.userId,
    action: 'tournament_created',
    entityType: 'tournament',
    entityId: data.id,
    after: payload as unknown as Json,
  });
  revalidatePath('/', 'layout');
  return { success: true, data: { id: data.id } };
}
