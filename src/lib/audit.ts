import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database';

interface LogParams {
  tournamentId: string | null;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: Json | null;
  after?: Json | null;
}

/**
 * Trace une action critique (validation de candidature, verrouillage du
 * bracket, modification de score, forfait, ...). Échoue silencieusement —
 * l'audit ne doit jamais bloquer l'action métier elle-même.
 */
export async function logAudit(supabase: SupabaseClient<Database>, params: LogParams): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      tournament_id: params.tournamentId,
      actor_id: params.actorId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      before: params.before ?? null,
      after: params.after ?? null,
    });
  } catch (err) {
    console.error('[audit] échec de journalisation', err);
  }
}
