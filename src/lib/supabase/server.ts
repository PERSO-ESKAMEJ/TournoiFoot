import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import type { Database } from '@/types/database';

/**
 * Client Supabase côté serveur, lié à la session de l'utilisateur courant via
 * les cookies. À utiliser dans les Server Components, Server Actions et Route
 * Handlers. Les écritures sont de toute façon protégées par les policies RLS
 * (voir supabase/migrations/) — ce client n'a que les droits `anon`/`authenticated`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Appelé depuis un Server Component (pas une Server Action / Route Handler) :
          // l'écriture de cookie est ignorée, le proxy.ts se charge de rafraîchir la session.
        }
      },
    },
  });
}

/**
 * Client Supabase avec la clé service_role — contourne RLS. Réservé aux
 * scripts serveur de confiance (scripts/), jamais utilisé dans une route
 * accessible aux utilisateurs.
 */
export function createServiceRoleClient() {
  return createSupabaseClient<Database>(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
