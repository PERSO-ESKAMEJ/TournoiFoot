-- ============================================================
-- Tournoi commémoratif — schéma initial
-- À appliquer via `supabase db push` (CLI) ou en collant ce fichier
-- dans le SQL Editor d'un nouveau projet Supabase.
-- ============================================================

create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- Fonction utilitaire générique (ne dépend d'aucune table)
-- ────────────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- 1. profiles — comptes organisateurs (RBAC)
-- Doit être créée AVANT les fonctions fn_current_role() etc. ci-dessous :
-- une fonction "language sql" est résolue à sa création, elle exige donc que
-- les tables qu'elle référence existent déjà.
-- ────────────────────────────────────────────────────────────

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        text not null check (role in ('super_admin', 'tournament_manager', 'read_only')),
  created_at  timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_authenticated" on profiles
  for select to authenticated using (true);
-- Pas de policy insert/update/delete pour authenticated/anon : la gestion des comptes
-- organisateurs passe par le script scripts/create-admin.ts (clé service_role).

-- ────────────────────────────────────────────────────────────
-- Fonctions utilitaires RBAC (dépendent de profiles, doivent venir après)
-- ────────────────────────────────────────────────────────────

-- Rôle de l'utilisateur connecté (null si pas de profil / pas connecté)
create or replace function fn_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function fn_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select fn_current_role() in ('super_admin', 'tournament_manager', 'read_only');
$$;

create or replace function fn_can_manage()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select fn_current_role() in ('super_admin', 'tournament_manager');
$$;

create or replace function fn_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select fn_current_role() = 'super_admin';
$$;

-- ────────────────────────────────────────────────────────────
-- 2. tournaments — paramètres du tournoi
-- ────────────────────────────────────────────────────────────

create table tournaments (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null,
  memorial_subtitle         text,
  description               text,
  event_date                date not null,
  start_time                time not null,
  end_time                  time not null,
  venue_name                text not null,
  venue_city                text not null,
  max_teams                 int not null default 8,
  min_players_per_team      int not null default 5,
  max_players_per_team      int not null default 12,
  match_duration_minutes    int not null default 20,
  transition_minutes        int not null default 5,
  registration_opens_at     timestamptz,
  registration_closes_at    timestamptz,
  status                    text not null default 'preparation'
                              check (status in ('preparation','registrations_open','registrations_closed','bracket_ready','in_progress','completed')),
  contact_name              text,
  contact_phone             text,
  father_name               text,
  father_photo_url          text,
  tournament_logo_url       text,
  field_price_per_hour      numeric(10,2),
  field_hours_booked        numeric(4,1),
  jersey_unit_price         numeric(10,2),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create trigger trg_tournaments_updated_at before update on tournaments
  for each row execute function set_updated_at();

alter table tournaments enable row level security;

create policy "tournaments_select_public" on tournaments
  for select to anon, authenticated using (true);
create policy "tournaments_write_managers" on tournaments
  for all to authenticated using (fn_can_manage()) with check (fn_can_manage());

-- ────────────────────────────────────────────────────────────
-- 3. team_applications — candidatures (contient des données privées)
-- ────────────────────────────────────────────────────────────

create table team_applications (
  id                    uuid primary key default gen_random_uuid(),
  tournament_id         uuid not null references tournaments(id) on delete cascade,
  reference             text not null unique,
  access_token          uuid not null unique default gen_random_uuid(),
  team_name             text not null,
  neighborhood          text,
  primary_color         text,
  secondary_color       text,
  logo_url              text,
  comment               text,
  contact_first_name    text not null,
  contact_last_name     text not null,
  contact_whatsapp      text not null,
  contact_phone         text,
  contact_email         text,
  status                text not null default 'draft'
                          check (status in ('draft','submitted','pending','needs_info','approved','rejected','waitlisted','cancelled')),
  review_notes          text,
  submitted_at          timestamptz,
  reviewed_at           timestamptz,
  reviewed_by           uuid references profiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_team_applications_tournament on team_applications(tournament_id);
create index idx_team_applications_status on team_applications(tournament_id, status);

create trigger trg_team_applications_updated_at before update on team_applications
  for each row execute function set_updated_at();

alter table team_applications enable row level security;

-- Aucune lecture/écriture publique directe : tout passe par les fonctions
-- security definer ci-dessous (create_application / get_application_by_token /
-- update_application_by_token), qui vérifient le token elles-mêmes.
create policy "team_applications_staff_select" on team_applications
  for select to authenticated using (fn_is_staff());
create policy "team_applications_managers_write" on team_applications
  for update to authenticated using (fn_can_manage()) with check (fn_can_manage());
create policy "team_applications_super_admin_delete" on team_applications
  for delete to authenticated using (fn_is_super_admin());

-- ────────────────────────────────────────────────────────────
-- 4. application_players — roster déclaré dans la candidature
-- ────────────────────────────────────────────────────────────

create table application_players (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references team_applications(id) on delete cascade,
  first_name      text not null,
  last_name       text not null,
  nickname        text,
  jersey_number   int,
  role            text,
  created_at      timestamptz not null default now()
);

create index idx_application_players_application on application_players(application_id);

alter table application_players enable row level security;

create policy "application_players_staff_select" on application_players
  for select to authenticated using (fn_is_staff());
create policy "application_players_managers_write" on application_players
  for all to authenticated using (fn_can_manage()) with check (fn_can_manage());

-- ────────────────────────────────────────────────────────────
-- 5. teams — équipes officielles (créées à l'approbation)
-- ────────────────────────────────────────────────────────────

create table teams (
  id                uuid primary key default gen_random_uuid(),
  tournament_id     uuid not null references tournaments(id) on delete cascade,
  application_id    uuid references team_applications(id),
  name              text not null,
  neighborhood      text,
  primary_color     text,
  secondary_color   text,
  logo_url          text,
  seed              int,
  checked_in        boolean not null default false,
  checked_in_at     timestamptz,
  sport_status      text not null default 'registered'
                      check (sport_status in ('registered','present','quarterfinalist','semifinalist','finalist','winner','eliminated','forfeit')),
  wins              int not null default 0,
  losses            int not null default 0,
  goals_for         int not null default 0,
  goals_against     int not null default 0,
  created_at        timestamptz not null default now()
);

create index idx_teams_tournament on teams(tournament_id);

alter table teams enable row level security;

create policy "teams_select_public" on teams
  for select to anon, authenticated using (true);
create policy "teams_write_managers" on teams
  for all to authenticated using (fn_can_manage()) with check (fn_can_manage());

-- ────────────────────────────────────────────────────────────
-- 6. team_members — roster officiel (copié depuis application_players)
-- ────────────────────────────────────────────────────────────

create table team_members (
  id              uuid primary key default gen_random_uuid(),
  team_id         uuid not null references teams(id) on delete cascade,
  first_name      text not null,
  last_name       text not null,
  nickname        text,
  jersey_number   int,
  role            text,
  present         boolean not null default true
);

create index idx_team_members_team on team_members(team_id);

alter table team_members enable row level security;

create policy "team_members_select_public" on team_members
  for select to anon, authenticated using (true);
create policy "team_members_write_managers" on team_members
  for all to authenticated using (fn_can_manage()) with check (fn_can_manage());

-- ────────────────────────────────────────────────────────────
-- 7. rounds — libellés des rounds du bracket
-- ────────────────────────────────────────────────────────────

create table rounds (
  id              uuid primary key default gen_random_uuid(),
  tournament_id   uuid not null references tournaments(id) on delete cascade,
  round_number    int not null,
  name            text not null,
  created_at      timestamptz not null default now(),
  unique (tournament_id, round_number)
);

alter table rounds enable row level security;

create policy "rounds_select_public" on rounds
  for select to anon, authenticated using (true);
create policy "rounds_write_managers" on rounds
  for all to authenticated using (fn_can_manage()) with check (fn_can_manage());

-- ────────────────────────────────────────────────────────────
-- 8. matches
-- ────────────────────────────────────────────────────────────

create table matches (
  id                  uuid primary key default gen_random_uuid(),
  tournament_id       uuid not null references tournaments(id) on delete cascade,
  round_id            uuid not null references rounds(id) on delete cascade,
  slot                int not null,
  order_index         int not null default 0,
  team1_id            uuid references teams(id),
  team2_id            uuid references teams(id),
  team1_score         int,
  team2_score         int,
  team1_penalties     int,
  team2_penalties     int,
  winner_id           uuid references teams(id),
  scheduled_start     timestamptz,
  actual_start        timestamptz,
  venue_note          text,
  status              text not null default 'scheduled'
                        check (status in ('scheduled','next_up','in_progress','completed','cancelled','forfeit')),
  forfeit_team_id     uuid references teams(id),
  notes               text,
  next_match_id       uuid references matches(id),
  next_match_slot     int check (next_match_slot in (1,2)),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_matches_tournament on matches(tournament_id);
create index idx_matches_round on matches(round_id);

create trigger trg_matches_updated_at before update on matches
  for each row execute function set_updated_at();

alter table matches enable row level security;

create policy "matches_select_public" on matches
  for select to anon, authenticated using (true);
create policy "matches_write_managers" on matches
  for all to authenticated using (fn_can_manage()) with check (fn_can_manage());

-- ────────────────────────────────────────────────────────────
-- 9. audit_logs — timeline + audit (fusionnés)
-- ────────────────────────────────────────────────────────────

create table audit_logs (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  actor_id      uuid references profiles(id),
  action        text not null,
  entity_type   text not null,
  entity_id     uuid,
  before        jsonb,
  after         jsonb,
  created_at    timestamptz not null default now()
);

create index idx_audit_logs_tournament on audit_logs(tournament_id, created_at desc);

alter table audit_logs enable row level security;

create policy "audit_logs_staff_select" on audit_logs
  for select to authenticated using (fn_is_staff());
create policy "audit_logs_managers_insert" on audit_logs
  for insert to authenticated with check (fn_can_manage());
-- Pas de update/delete : journal immuable.

-- ────────────────────────────────────────────────────────────
-- 10. expenses — budget (couvre aussi terrain / chasubles / etc.)
-- ────────────────────────────────────────────────────────────

create table expenses (
  id                uuid primary key default gen_random_uuid(),
  tournament_id     uuid not null references tournaments(id) on delete cascade,
  category          text not null
                      check (category in ('terrain','chasubles','trophees','medailles','boissons','restauration','impressions','communication','autre')),
  label             text not null,
  quantity          numeric(10,2) not null default 1,
  unit_price        numeric(10,2) not null default 0,
  planned_amount    numeric(10,2) not null default 0,
  actual_amount     numeric(10,2),
  responsible       text,
  status            text not null default 'planned'
                      check (status in ('planned','ordered','paid','cancelled')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger trg_expenses_updated_at before update on expenses
  for each row execute function set_updated_at();

alter table expenses enable row level security;

create policy "expenses_staff_select" on expenses
  for select to authenticated using (fn_is_staff());
create policy "expenses_managers_write" on expenses
  for all to authenticated using (fn_can_manage()) with check (fn_can_manage());

-- ────────────────────────────────────────────────────────────
-- 11. drink_options — comparatif cannettes / pression
-- ────────────────────────────────────────────────────────────

create table drink_options (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references tournaments(id) on delete cascade,
  option_name    text not null,
  supplier       text,
  quantity       numeric(10,2),
  unit_price     numeric(10,2),
  extra_fees     numeric(10,2) default 0,
  notes          text,
  selected       boolean not null default false,
  created_at     timestamptz not null default now()
);

alter table drink_options enable row level security;

create policy "drink_options_staff_select" on drink_options
  for select to authenticated using (fn_is_staff());
create policy "drink_options_managers_write" on drink_options
  for all to authenticated using (fn_can_manage()) with check (fn_can_manage());

-- ────────────────────────────────────────────────────────────
-- 12. communication_assets — flyers / visuels
-- ────────────────────────────────────────────────────────────

create table communication_assets (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references tournaments(id) on delete cascade,
  name           text not null,
  type           text not null check (type in ('flyer_general','flyer_inscription','other')),
  status         text not null default 'todo' check (status in ('todo','done','published')),
  responsible    text,
  due_date       date,
  file_url       text,
  external_url   text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger trg_communication_assets_updated_at before update on communication_assets
  for each row execute function set_updated_at();

alter table communication_assets enable row level security;

create policy "communication_assets_staff_select" on communication_assets
  for select to authenticated using (fn_is_staff());
create policy "communication_assets_managers_write" on communication_assets
  for all to authenticated using (fn_can_manage()) with check (fn_can_manage());

-- ============================================================
-- Fonctions RPC publiques (SECURITY DEFINER) — flux candidature
-- par lien privé, sans authentification. Chaque fonction vérifie
-- elle-même le token / les règles métier avant de lire ou écrire.
-- ============================================================

-- Génère une référence lisible du type TEAM-2026-004
create or replace function fn_next_application_reference(p_tournament_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year text := to_char(now(), 'YYYY');
  v_count int;
begin
  select count(*) + 1 into v_count from team_applications where tournament_id = p_tournament_id;
  return 'TEAM-' || v_year || '-' || lpad(v_count::text, 3, '0');
end;
$$;

-- Crée une candidature + son roster, retourne la référence et le token d'accès.
create or replace function create_application(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament tournaments;
  v_app_id uuid;
  v_reference text;
  v_token uuid;
  v_player jsonb;
begin
  select * into v_tournament from tournaments where id = (payload->>'tournament_id')::uuid;
  if v_tournament is null then
    raise exception 'Tournoi introuvable';
  end if;
  if v_tournament.status not in ('registrations_open') then
    raise exception 'Les inscriptions ne sont pas ouvertes';
  end if;

  v_reference := fn_next_application_reference(v_tournament.id);

  insert into team_applications (
    tournament_id, reference, team_name, neighborhood, primary_color, secondary_color,
    logo_url, comment, contact_first_name, contact_last_name, contact_whatsapp,
    contact_phone, contact_email, status, submitted_at
  ) values (
    v_tournament.id, v_reference,
    payload->>'team_name', payload->>'neighborhood', payload->>'primary_color', payload->>'secondary_color',
    payload->>'logo_url', payload->>'comment',
    payload->>'contact_first_name', payload->>'contact_last_name', payload->>'contact_whatsapp',
    payload->>'contact_phone', payload->>'contact_email',
    'submitted', now()
  )
  returning id, access_token into v_app_id, v_token;

  for v_player in select * from jsonb_array_elements(coalesce(payload->'players', '[]'::jsonb))
  loop
    insert into application_players (application_id, first_name, last_name, nickname, jersey_number, role)
    values (
      v_app_id, v_player->>'first_name', v_player->>'last_name', v_player->>'nickname',
      nullif(v_player->>'jersey_number','')::int, v_player->>'role'
    );
  end loop;

  return jsonb_build_object('reference', v_reference, 'access_token', v_token);
end;
$$;

grant execute on function create_application(jsonb) to anon, authenticated;

-- Retourne la candidature + son roster pour un token donné (null si invalide).
create or replace function get_application_by_token(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app team_applications;
  v_players jsonb;
begin
  select * into v_app from team_applications where access_token = p_token;
  if v_app is null then
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'first_name', first_name, 'last_name', last_name,
    'nickname', nickname, 'jersey_number', jersey_number, 'role', role
  ) order by created_at), '[]'::jsonb)
  into v_players
  from application_players where application_id = v_app.id;

  return jsonb_build_object(
    'id', v_app.id,
    'reference', v_app.reference,
    'team_name', v_app.team_name,
    'neighborhood', v_app.neighborhood,
    'primary_color', v_app.primary_color,
    'secondary_color', v_app.secondary_color,
    'logo_url', v_app.logo_url,
    'comment', v_app.comment,
    'contact_first_name', v_app.contact_first_name,
    'contact_last_name', v_app.contact_last_name,
    'contact_whatsapp', v_app.contact_whatsapp,
    'contact_phone', v_app.contact_phone,
    'contact_email', v_app.contact_email,
    'status', v_app.status,
    'review_notes', v_app.review_notes,
    'players', v_players
  );
end;
$$;

grant execute on function get_application_by_token(uuid) to anon, authenticated;

-- Met à jour une candidature (équipe + responsable + roster complet) tant que
-- son statut est encore modifiable par le capitaine.
create or replace function update_application_by_token(p_token uuid, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app team_applications;
  v_player jsonb;
begin
  select * into v_app from team_applications where access_token = p_token;
  if v_app is null then
    raise exception 'Candidature introuvable';
  end if;
  if v_app.status not in ('draft','submitted','needs_info') then
    raise exception 'Cette candidature n''est plus modifiable';
  end if;

  update team_applications set
    team_name = payload->>'team_name',
    neighborhood = payload->>'neighborhood',
    primary_color = payload->>'primary_color',
    secondary_color = payload->>'secondary_color',
    logo_url = payload->>'logo_url',
    comment = payload->>'comment',
    contact_first_name = payload->>'contact_first_name',
    contact_last_name = payload->>'contact_last_name',
    contact_whatsapp = payload->>'contact_whatsapp',
    contact_phone = payload->>'contact_phone',
    contact_email = payload->>'contact_email',
    status = case when v_app.status = 'needs_info' then 'submitted' else v_app.status end,
    submitted_at = coalesce(v_app.submitted_at, now())
  where id = v_app.id;

  delete from application_players where application_id = v_app.id;
  for v_player in select * from jsonb_array_elements(coalesce(payload->'players', '[]'::jsonb))
  loop
    insert into application_players (application_id, first_name, last_name, nickname, jersey_number, role)
    values (
      v_app.id, v_player->>'first_name', v_player->>'last_name', v_player->>'nickname',
      nullif(v_player->>'jersey_number','')::int, v_player->>'role'
    );
  end loop;

  return get_application_by_token(p_token);
end;
$$;

grant execute on function update_application_by_token(uuid, jsonb) to anon, authenticated;
