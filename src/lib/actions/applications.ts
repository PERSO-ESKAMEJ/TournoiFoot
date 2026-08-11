'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/dal';
import { logAudit } from '@/lib/audit';
import { buildApplicationSchema, type ApplicationInput } from '@/lib/validation/application';
import type { Json } from '@/types/database';

export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

// ── Public : soumission d'une candidature ──────────────────────────────────

export async function submitApplication(
  minPlayers: number,
  maxPlayers: number,
  input: ApplicationInput
): Promise<ActionResult<{ reference: string; access_token: string }>> {
  const schema = buildApplicationSchema(minPlayers, maxPlayers);
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Formulaire invalide' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_application', {
    payload: parsed.data as unknown as Json,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data: data as { reference: string; access_token: string } };
}

// ── Public : consultation / édition via lien privé ─────────────────────────

export async function getApplicationByToken(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_application_by_token', { p_token: token });
  if (error) return null;
  return data;
}

export async function updateApplicationByToken(
  token: string,
  minPlayers: number,
  maxPlayers: number,
  input: ApplicationInput
): Promise<ActionResult> {
  const schema = buildApplicationSchema(minPlayers, maxPlayers);
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Formulaire invalide' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('update_application_by_token', {
    p_token: token,
    payload: parsed.data as unknown as Json,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath('/admin/candidatures');
  return { success: true };
}

// ── Admin : traitement des candidatures ─────────────────────────────────────

export async function setApplicationStatus(
  applicationId: string,
  status: 'pending' | 'needs_info' | 'rejected' | 'waitlisted' | 'cancelled',
  reviewNotes?: string
): Promise<ActionResult> {
  const session = await requireSession(['super_admin', 'tournament_manager']);
  const supabase = await createClient();

  const { data: before } = await supabase.from('team_applications').select('*').eq('id', applicationId).single();

  const { error } = await supabase
    .from('team_applications')
    .update({ status, review_notes: reviewNotes ?? null, reviewed_at: new Date().toISOString(), reviewed_by: session.userId })
    .eq('id', applicationId);
  if (error) return { success: false, error: error.message };

  await logAudit(supabase, {
    tournamentId: before?.tournament_id ?? null,
    actorId: session.userId,
    action: `application_${status}`,
    entityType: 'team_application',
    entityId: applicationId,
    before: before as unknown as Json,
    after: { status } as unknown as Json,
  });

  revalidatePath('/admin/candidatures');
  return { success: true };
}

/**
 * Approuve une candidature : crée l'équipe officielle + copie le roster.
 * Vérifie la capacité maximale du tournoi avant de valider.
 */
export async function approveApplication(applicationId: string): Promise<ActionResult<{ teamId: string }>> {
  const session = await requireSession(['super_admin', 'tournament_manager']);
  const supabase = await createClient();

  const { data: application, error: appError } = await supabase
    .from('team_applications')
    .select('*, tournament:tournaments(id, max_teams)')
    .eq('id', applicationId)
    .single();
  if (appError || !application) return { success: false, error: 'Candidature introuvable' };
  if (application.status === 'approved') return { success: false, error: 'Déjà approuvée' };

  const tournament = application.tournament as unknown as { id: string; max_teams: number };

  const { count } = await supabase
    .from('teams')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', tournament.id);
  if ((count ?? 0) >= tournament.max_teams) {
    return { success: false, error: `Capacité maximale atteinte (${tournament.max_teams} équipes)` };
  }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      tournament_id: tournament.id,
      application_id: application.id,
      name: application.team_name,
      logo_url: application.logo_url,
    })
    .select('id')
    .single();
  if (teamError || !team) return { success: false, error: teamError?.message ?? 'Erreur création équipe' };

  const { data: players } = await supabase
    .from('application_players')
    .select('name, role')
    .eq('application_id', application.id);

  if (players && players.length > 0) {
    await supabase.from('team_members').insert(
      players.map((p) => ({ team_id: team.id, ...p }))
    );
  }

  await supabase
    .from('team_applications')
    .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: session.userId })
    .eq('id', application.id);

  await logAudit(supabase, {
    tournamentId: tournament.id,
    actorId: session.userId,
    action: 'application_approved',
    entityType: 'team_application',
    entityId: application.id,
    after: { team_id: team.id } as unknown as Json,
  });

  revalidatePath('/admin/candidatures');
  revalidatePath('/admin/equipes');
  revalidatePath('/equipes');
  revalidatePath('/');
  return { success: true, data: { teamId: team.id } };
}
