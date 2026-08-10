import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { ProfileRole } from '@/types/database';

export interface Session {
  userId: string;
  email: string | null;
  fullName: string;
  role: ProfileRole;
}

/**
 * Session courante, mémoïsée pour la durée de la requête (React.cache). Utilise
 * `auth.getUser()` (et non `getSession()`) car il revalide le JWT auprès du
 * serveur Auth Supabase plutôt que de faire confiance au cookie tel quel.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();
  if (!profile) return null;

  return { userId: user.id, email: user.email ?? null, fullName: profile.full_name, role: profile.role };
});

/**
 * À appeler en haut de chaque page/Server Action admin. Redirige vers la
 * connexion si non authentifié, ou vers /admin si le rôle ne convient pas.
 * C'est la vérification qui fait autorité — proxy.ts n'est qu'un filtre optimiste.
 */
export async function requireSession(allowedRoles?: ProfileRole[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  if (allowedRoles && !allowedRoles.includes(session.role)) redirect('/admin');
  return session;
}

export function canManage(role: ProfileRole): boolean {
  return role === 'super_admin' || role === 'tournament_manager';
}
