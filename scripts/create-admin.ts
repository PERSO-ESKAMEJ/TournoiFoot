// Crée le premier compte administrateur (auth.users + profiles).
// Usage :
//   npm run create-admin -- --email=jean@example.com --password=xxxxxxxx --name="Jean-Raymond" --role=super_admin
//
// Rôles possibles : super_admin | tournament_manager | read_only

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { Database, ProfileRole } from '../src/types/database';

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  for (const raw of process.argv.slice(2)) {
    const match = raw.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

async function main() {
  const args = parseArgs();
  const email = args.email;
  const password = args.password;
  const fullName = args.name;
  const role = (args.role ?? 'super_admin') as ProfileRole;

  if (!email || !password || !fullName) {
    console.error(
      'Usage: npm run create-admin -- --email=... --password=... --name="..." [--role=super_admin|tournament_manager|read_only]'
    );
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis (.env.local).');
    process.exit(1);
  }

  const supabase = createClient<Database>(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    console.error('Échec de la création du compte auth :', createError?.message);
    process.exit(1);
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: created.user.id, full_name: fullName, role });
  if (profileError) {
    console.error('Échec de la création du profil :', profileError.message);
    process.exit(1);
  }

  console.log(`✓ Compte admin créé : ${email} (${role})`);
}

main();
