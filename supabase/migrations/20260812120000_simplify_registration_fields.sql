-- ============================================================
-- Simplification du formulaire d'inscription
-- Retire quartier/couleurs/prénom-nom séparés/surnom/numéro de maillot.
-- Le responsable et chaque joueur n'ont plus qu'un seul champ "nom" libre.
-- ============================================================

-- team_applications : un seul champ nom pour le responsable
alter table team_applications drop column if exists neighborhood;
alter table team_applications drop column if exists primary_color;
alter table team_applications drop column if exists secondary_color;
alter table team_applications drop column if exists contact_phone;
alter table team_applications drop column if exists contact_email;
alter table team_applications drop column if exists contact_first_name;
alter table team_applications rename column contact_last_name to contact_name;

-- application_players : un seul champ nom libre par joueur
alter table application_players drop column if exists nickname;
alter table application_players drop column if exists jersey_number;
alter table application_players drop column if exists first_name;
alter table application_players rename column last_name to name;

-- teams : mêmes retraits (copiés depuis team_applications à l'approbation)
alter table teams drop column if exists neighborhood;
alter table teams drop column if exists primary_color;
alter table teams drop column if exists secondary_color;

-- team_members : mêmes retraits (copiés depuis application_players)
alter table team_members drop column if exists nickname;
alter table team_members drop column if exists jersey_number;
alter table team_members drop column if exists first_name;
alter table team_members rename column last_name to name;

-- ────────────────────────────────────────────────────────────
-- Fonctions RPC — mises à jour pour le nouveau schéma
-- ────────────────────────────────────────────────────────────

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
    tournament_id, reference, team_name, comment, contact_name, contact_whatsapp, status, submitted_at
  ) values (
    v_tournament.id, v_reference,
    payload->>'team_name', payload->>'comment',
    payload->>'contact_name', payload->>'contact_whatsapp',
    'submitted', now()
  )
  returning id, access_token into v_app_id, v_token;

  for v_player in select * from jsonb_array_elements(coalesce(payload->'players', '[]'::jsonb))
  loop
    insert into application_players (application_id, name)
    values (v_app_id, v_player->>'name');
  end loop;

  return jsonb_build_object('reference', v_reference, 'access_token', v_token);
end;
$$;

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

  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name) order by created_at), '[]'::jsonb)
  into v_players
  from application_players where application_id = v_app.id;

  return jsonb_build_object(
    'id', v_app.id,
    'reference', v_app.reference,
    'team_name', v_app.team_name,
    'comment', v_app.comment,
    'contact_name', v_app.contact_name,
    'contact_whatsapp', v_app.contact_whatsapp,
    'status', v_app.status,
    'review_notes', v_app.review_notes,
    'players', v_players
  );
end;
$$;

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
    comment = payload->>'comment',
    contact_name = payload->>'contact_name',
    contact_whatsapp = payload->>'contact_whatsapp',
    status = case when v_app.status = 'needs_info' then 'submitted' else v_app.status end,
    submitted_at = coalesce(v_app.submitted_at, now())
  where id = v_app.id;

  delete from application_players where application_id = v_app.id;
  for v_player in select * from jsonb_array_elements(coalesce(payload->'players', '[]'::jsonb))
  loop
    insert into application_players (application_id, name)
    values (v_app.id, v_player->>'name');
  end loop;

  return get_application_by_token(p_token);
end;
$$;
