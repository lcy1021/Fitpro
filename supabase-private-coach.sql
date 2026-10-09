-- DuoFit personal accounts and private coaching migration.
-- Run once after supabase-setup.sql and supabase-ai-setup.sql.
-- The legacy family-code RPCs are revoked at the end: old cached clients must reload.

create table if not exists public.fl_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  family text not null check (family ~ '^[A-Za-z0-9]{8,40}$'),
  person text not null check (person in ('hus','wife')),
  created_at timestamptz not null default now(),
  unique (family, person)
);
create table if not exists public.fl_private_checkins (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  body jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);
create table if not exists public.fl_private_measures (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  body jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);
create table if not exists public.fl_coach_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  body jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.fl_coach_weeks (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  body jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);
create table if not exists public.fl_partner_activity (
  family text not null,
  person text not null,
  date date not null,
  checked boolean not null default true,
  primary key (family, person, date)
);
create table if not exists public.fl_partner_weight_trend (
  family text not null,
  person text not null,
  date date not null,
  change_kg numeric(7,2) not null,
  primary key (family, person, date)
);
create table if not exists public.fl_push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null,
  auth_secret text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists fl_partner_activity_lookup on public.fl_partner_activity(family, person, date);
create index if not exists fl_partner_weight_lookup on public.fl_partner_weight_trend(family, person, date);
create index if not exists fl_push_user_lookup on public.fl_push_subscriptions(user_id);

alter table public.fl_members enable row level security;
alter table public.fl_private_checkins enable row level security;
alter table public.fl_private_measures enable row level security;
alter table public.fl_coach_profiles enable row level security;
alter table public.fl_coach_weeks enable row level security;
alter table public.fl_partner_activity enable row level security;
alter table public.fl_partner_weight_trend enable row level security;
alter table public.fl_push_subscriptions enable row level security;
revoke all on public.fl_members, public.fl_private_checkins, public.fl_private_measures,
  public.fl_coach_profiles, public.fl_coach_weeks, public.fl_partner_activity,
  public.fl_partner_weight_trend, public.fl_push_subscriptions from anon, authenticated;

-- The family code only pairs two accounts; it never authorizes reading private rows.
create or replace function public.fl_claim_role(p_family text, p_person text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_old public.fl_members%rowtype;
begin
  if v_user is null then raise exception 'sign_in_required'; end if;
  if p_family !~ '^[A-Za-z0-9]{8,40}$' or p_person not in ('hus','wife') then
    raise exception 'invalid_pairing';
  end if;
  select * into v_old from public.fl_members where user_id = v_user;
  if found then
    if v_old.family <> p_family or v_old.person <> p_person then raise exception 'account_already_paired'; end if;
    return jsonb_build_object('family', v_old.family, 'person', v_old.person);
  end if;
  insert into public.fl_members(user_id,family,person) values(v_user,p_family,p_person);
  -- Import only the claimed person's legacy records. Their old goal remains private.
  insert into public.fl_private_checkins(user_id,date,body)
    select v_user,c.date::date,c.body from public.checkins c where c.family=p_family and c.person=p_person
    on conflict (user_id,date) do nothing;
  insert into public.fl_private_measures(user_id,date,body)
    select v_user,m.date::date,m.body from public.measures m where m.family=p_family and m.person=p_person
    on conflict (user_id,date) do nothing;
  insert into public.fl_partner_activity(family,person,date,checked)
    select p_family,p_person,c.date,true from public.fl_private_checkins c where c.user_id=v_user
    on conflict (family,person,date) do update set checked=true;
  perform public.fl_refresh_weight_trend(v_user);
  return jsonb_build_object('family', p_family, 'person', p_person);
end; $$;

create or replace function public.fl_refresh_weight_trend(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_family text; v_person text; v_start numeric;
begin
  select family,person into v_family,v_person from public.fl_members where user_id=p_user;
  if v_family is null then return; end if;
  delete from public.fl_partner_weight_trend where family=v_family and person=v_person;
  select (body->>'weight')::numeric into v_start
    from public.fl_private_measures where user_id=p_user and body ? 'weight'
    and (body->>'weight') ~ '^[0-9]+(\.[0-9]+)?$' order by date limit 1;
  if v_start is null then return; end if;
  insert into public.fl_partner_weight_trend(family,person,date,change_kg)
    select v_family,v_person,date,round((body->>'weight')::numeric-v_start,2)
    from public.fl_private_measures where user_id=p_user and body ? 'weight'
    and (body->>'weight') ~ '^[0-9]+(\.[0-9]+)?$';
end; $$;

-- Share meal/activity details by default; an explicit personal opt-out always wins.
create table if not exists public.fl_checkin_sharing (
  family text not null,
  person text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (family,person),
  foreign key (family,person) references public.fl_members(family,person) on delete cascade
);
alter table public.fl_checkin_sharing enable row level security;
revoke all on public.fl_checkin_sharing from public,anon,authenticated;

-- Select nested fields explicitly; never forward the private body or free-form text.
create or replace function public.fl_shared_checkin_body(p_body jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare v_result jsonb := jsonb_build_object('meals','{}'::jsonb,'food','{}'::jsonb);
  v_meal text; v_food jsonb; v_item jsonb; v_items jsonb; v_clean jsonb; v_extra jsonb;
begin
  foreach v_meal in array array['breakfast','lunch','snack','dinner'] loop
    if p_body->'meals'->>v_meal in ('plan','over','skip') then
      v_result := jsonb_set(v_result,array['meals',v_meal],p_body->'meals'->v_meal);
    end if;
    v_food := p_body->'food'->v_meal;
    if jsonb_typeof(v_food) = 'object' then
      v_items := '[]'::jsonb;
      for v_item in select value from jsonb_array_elements(case when jsonb_typeof(v_food->'items')='array' then v_food->'items' else '[]'::jsonb end) limit 30 loop
        if jsonb_typeof(v_item->'n')='string' then
          v_clean := jsonb_build_object('n',left(v_item->>'n',100),'q',case when jsonb_typeof(v_item->'q')='string' then left(v_item->>'q',100) else '' end);
          if jsonb_typeof(v_item->'k')='number' and (case when jsonb_typeof(v_item->'k')='number' then (v_item->>'k')::numeric end) between 0 and 20000 then v_clean := v_clean || jsonb_build_object('k',v_item->'k'); end if;
          v_items := v_items || jsonb_build_array(v_clean);
        end if;
      end loop;
      v_clean := jsonb_build_object('items',v_items);
      if jsonb_typeof(v_food->'kcal')='number' and (case when jsonb_typeof(v_food->'kcal')='number' then (v_food->>'kcal')::numeric end) between 0 and 20000 then v_clean := v_clean || jsonb_build_object('kcal',v_food->'kcal'); end if;
      v_result := jsonb_set(v_result,array['food',v_meal],v_clean);
    end if;
  end loop;
  v_result := v_result || jsonb_build_object('workout',case when p_body->>'workout'='done' then 'done' else null end,'stand',0);
  if jsonb_typeof(p_body->'stand')='number' and (case when jsonb_typeof(p_body->'stand')='number' then (p_body->>'stand')::numeric end) between 0 and 10000 then v_result := v_result || jsonb_build_object('stand',p_body->'stand'); end if;
  select coalesce(jsonb_agg(value),'[]'::jsonb) into v_extra from
    (select value from jsonb_array_elements(case when jsonb_typeof(p_body->'extraMoves')='array' then p_body->'extraMoves' else '[]'::jsonb end)
      where jsonb_typeof(value)='string' and value #>> '{}' ~ '^[a-z0-9-]{1,64}$' limit 60) x;
  return v_result || jsonb_build_object('extraMoves',v_extra);
end; $$;
revoke all on function public.fl_shared_checkin_body(jsonb) from public,anon,authenticated;

create or replace function public.fl_checkin_sharing_set(p_enabled boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_family text; v_person text;
begin
  select family,person into v_family,v_person from public.fl_members where user_id=auth.uid();
  if v_family is null then raise exception 'pairing_required'; end if;
  if p_enabled is null then raise exception 'invalid_sharing_preference'; end if;
  insert into public.fl_checkin_sharing(family,person,enabled) values(v_family,v_person,p_enabled)
    on conflict(family,person) do update set enabled=excluded.enabled,updated_at=now();
  return p_enabled;
end; $$;
revoke all on function public.fl_checkin_sharing_set(boolean) from public,anon,authenticated;
grant execute on function public.fl_checkin_sharing_set(boolean) to authenticated;

-- Read only the selected day's meal/activity details, after checking the partner's preference.
create or replace function public.fl_partner_checkin_get(p_date date)
returns jsonb language plpgsql security definer stable set search_path = '' as $$
declare v_family text; v_person text; v_partner uuid; v_enabled boolean; v_body jsonb;
  v_today date := (now() at time zone 'Asia/Shanghai')::date;
begin
  select family,person into v_family,v_person from public.fl_members where user_id=auth.uid();
  if v_family is null then raise exception 'pairing_required'; end if;
  if p_date is null or p_date not between v_today-119 and v_today then raise exception 'date_out_of_range'; end if;
  select m.user_id,coalesce(s.enabled,true) into v_partner,v_enabled from public.fl_members m
    left join public.fl_checkin_sharing s on s.family=m.family and s.person=m.person
    where m.family=v_family and m.person<>v_person;
  if v_enabled then select public.fl_shared_checkin_body(body) into v_body from public.fl_private_checkins where user_id=v_partner and date=p_date; end if;
  return jsonb_build_object('date',p_date,'partnerRecordSharing',case when v_partner is null then 'unpaired' when v_enabled then 'on' else 'off' end,'body',v_body);
end; $$;
revoke all on function public.fl_partner_checkin_get(date) from public,anon,authenticated;
grant execute on function public.fl_partner_checkin_get(date) to authenticated;

create or replace function public.fl_private_pull(p_since date default null)
returns jsonb language plpgsql security definer stable set search_path = '' as $$
declare v_user uuid := auth.uid(); v_family text; v_person text; v_partner uuid; v_partner_sharing boolean := true;
  v_today date := (now() at time zone 'Asia/Shanghai')::date;
  v_activity_since date := greatest(coalesce(p_since,v_today-119),v_today-119);
begin
  select family,person into v_family,v_person from public.fl_members where user_id=v_user;
  if v_family is null then raise exception 'pairing_required'; end if;
  select m.user_id,coalesce(s.enabled,true) into v_partner,v_partner_sharing
    from public.fl_members m left join public.fl_checkin_sharing s on s.family=m.family and s.person=m.person
    where m.family=v_family and m.person<>v_person;
  return jsonb_build_object(
    'member', jsonb_build_object('family',v_family,'person',v_person),
    'checkins', coalesce((select jsonb_agg(jsonb_build_object('date',date,'body',body))
      from public.fl_private_checkins where user_id=v_user and date>=coalesce(p_since,current_date-120)),'[]'::jsonb),
    'measures', coalesce((select jsonb_agg(jsonb_build_object('date',date,'body',body))
      from public.fl_private_measures where user_id=v_user),'[]'::jsonb),
    'profile', (select body from public.fl_coach_profiles where user_id=v_user),
    'weeks', coalesce((select jsonb_agg(jsonb_build_object('weekStart',week_start,'body',body))
      from public.fl_coach_weeks where user_id=v_user and week_start>=current_date-120),'[]'::jsonb),
    'partnerActivity', coalesce((select jsonb_agg(jsonb_build_object('date',date,'checked',checked))
      from public.fl_partner_activity where family=v_family and person<>v_person
        and date between v_activity_since and v_today),'[]'::jsonb),
    'partnerActivitySince', v_activity_since,
    'partnerActivityUntil', v_today,
    'recordSharing', coalesce((select enabled from public.fl_checkin_sharing where family=v_family and person=v_person),true),
    'partnerRecordSharing', case when v_partner is null then 'unpaired' when v_partner_sharing then 'on' else 'off' end,
    'partnerCheckins', '[]'::jsonb, -- details are fetched by date, not during every sync
    'partnerTrend', coalesce((select jsonb_agg(jsonb_build_object('date',date,'changeKg',change_kg))
      from public.fl_partner_weight_trend where family=v_family and person<>v_person),'[]'::jsonb)
  );
end; $$;

create or replace function public.fl_private_put_checkin(p_date date,p_body jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_family text; v_person text;
begin
  select family,person into v_family,v_person from public.fl_members where user_id=v_user;
  if v_family is null then raise exception 'pairing_required'; end if;
  if p_body is null or jsonb_typeof(p_body)<>'object' or octet_length(p_body::text)>8192
    or p_date is null or p_body->>'person' is distinct from v_person
    or p_body->>'date' is distinct from p_date::text then raise exception 'invalid_body'; end if;
  insert into public.fl_private_checkins(user_id,date,body) values(v_user,p_date,p_body)
    on conflict(user_id,date) do update set body=excluded.body,updated_at=now();
  insert into public.fl_partner_activity(family,person,date,checked) values(v_family,v_person,p_date,true)
    on conflict(family,person,date) do update set checked=true;
end; $$;

create or replace function public.fl_private_put_measure(p_date date,p_body jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_person text;
begin
  select person into v_person from public.fl_members where user_id=v_user;
  if v_person is null then raise exception 'pairing_required'; end if;
  if p_body is null or jsonb_typeof(p_body)<>'object' or octet_length(p_body::text)>8192
    or p_date is null or p_body->>'person' is distinct from v_person
    or p_body->>'date' is distinct from p_date::text then raise exception 'invalid_body'; end if;
  insert into public.fl_private_measures(user_id,date,body) values(v_user,p_date,p_body)
    on conflict(user_id,date) do update set body=excluded.body,updated_at=now();
  perform public.fl_refresh_weight_trend(v_user);
end; $$;

create or replace function public.fl_private_put_profile(p_body jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid();
begin
  if not exists(select 1 from public.fl_members where user_id=v_user) then raise exception 'pairing_required'; end if;
  if p_body is null or jsonb_typeof(p_body)<>'object' or octet_length(p_body::text)>8192 then raise exception 'invalid_body'; end if;
  insert into public.fl_coach_profiles(user_id,body) values(v_user,p_body)
    on conflict(user_id) do update set body=excluded.body,updated_at=now();
end; $$;

create or replace function public.fl_private_put_week(p_week_start date,p_body jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid();
begin
  if not exists(select 1 from public.fl_members where user_id=v_user) then raise exception 'pairing_required'; end if;
  if extract(isodow from p_week_start)<>1 or p_body is null or jsonb_typeof(p_body)<>'object'
    or octet_length(p_body::text)>16384 then raise exception 'invalid_week'; end if;
  insert into public.fl_coach_weeks(user_id,week_start,body) values(v_user,p_week_start,p_body)
    on conflict(user_id,week_start) do update set body=excluded.body,updated_at=now();
end; $$;

create or replace function public.fl_push_save(p_endpoint text,p_p256dh text,p_auth text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid();
begin
  if not exists(select 1 from public.fl_members where user_id=v_user) then raise exception 'pairing_required'; end if;
  if p_endpoint !~ '^https://' or length(p_endpoint)>2048 or length(p_p256dh)>256 or length(p_auth)>256
    or length(p_p256dh)<20 or length(p_auth)<8 then raise exception 'invalid_subscription'; end if;
  insert into public.fl_push_subscriptions(endpoint,user_id,p256dh,auth_secret)
    values(p_endpoint,v_user,p_p256dh,p_auth)
    on conflict(endpoint) do update set user_id=excluded.user_id,p256dh=excluded.p256dh,auth_secret=excluded.auth_secret,enabled=true;
end; $$;
create or replace function public.fl_push_remove(p_endpoint text)
returns void language sql security definer set search_path = '' as $$
  delete from public.fl_push_subscriptions where endpoint=p_endpoint and user_id=auth.uid();
$$;

revoke all on function public.fl_claim_role(text,text),public.fl_refresh_weight_trend(uuid),
 public.fl_private_pull(date),public.fl_private_put_checkin(date,jsonb),
 public.fl_private_put_measure(date,jsonb),public.fl_private_put_profile(jsonb),
 public.fl_private_put_week(date,jsonb),public.fl_push_save(text,text,text),
 public.fl_push_remove(text) from public,anon,authenticated;
grant execute on function public.fl_claim_role(text,text),public.fl_private_pull(date),
 public.fl_private_put_checkin(date,jsonb),public.fl_private_put_measure(date,jsonb),
 public.fl_private_put_profile(jsonb),public.fl_private_put_week(date,jsonb),
 public.fl_push_save(text,text,text),public.fl_push_remove(text) to authenticated;

-- Critical: the old family-code functions expose both people's raw measures/goals.
revoke execute on function public.fl_pull(text,date),public.fl_put_checkin(text,text,text,date,jsonb),
 public.fl_put_measure(text,text,text,date,jsonb) from public,anon,authenticated;

-- Per-account AI request quota. Only the Edge Function's service role can call it.
create table if not exists public.fl_coach_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  n integer not null default 0,
  primary key(user_id,day)
);
alter table public.fl_coach_usage enable row level security;
revoke all on public.fl_coach_usage from anon, authenticated;
create or replace function public.fl_coach_quota(p_user uuid,p_limit integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  if p_limit<1 or p_limit>100 then raise exception 'invalid_limit'; end if;
  insert into public.fl_coach_usage(user_id,day,n) values(p_user,current_date,1)
    on conflict(user_id,day) do update set n=public.fl_coach_usage.n+1 returning n into v_count;
  return v_count<=p_limit;
end; $$;
revoke all on function public.fl_coach_quota(uuid,integer) from public,anon,authenticated;
grant execute on function public.fl_coach_quota(uuid,integer) to service_role;

-- A personal recovery code replaces email when moving a private profile to a new device.
-- Clients send only SHA-256(token); the random token itself is never stored in Postgres.
create table if not exists public.fl_recovery_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code_hash text not null unique check (code_hash ~ '^[a-f0-9]{64}$'),
  updated_at timestamptz not null default now()
);
alter table public.fl_recovery_codes enable row level security;
revoke all on public.fl_recovery_codes from anon, authenticated;

create or replace function public.fl_recovery_set(p_hash text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null or not exists(select 1 from public.fl_members where user_id=v_user) then
    raise exception 'pairing_required';
  end if;
  if p_hash is null or p_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_recovery_hash'; end if;
  insert into public.fl_recovery_codes(user_id,code_hash) values(v_user,p_hash)
    on conflict(user_id) do update set code_hash=excluded.code_hash,updated_at=now();
end; $$;

create or replace function public.fl_recover_role(p_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_old uuid; v_family text; v_person text;
begin
  if v_user is null then raise exception 'sign_in_required'; end if;
  if p_hash is null or p_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_recovery_code'; end if;
  if exists(select 1 from public.fl_members where user_id=v_user) then raise exception 'account_already_paired'; end if;
  select user_id into v_old from public.fl_recovery_codes where code_hash=p_hash for update;
  if v_old is null then raise exception 'invalid_recovery_code'; end if;
  select family,person into v_family,v_person from public.fl_members where user_id=v_old for update;
  if v_family is null then raise exception 'invalid_recovery_code'; end if;
  update public.fl_members set user_id=v_user where user_id=v_old;
  update public.fl_private_checkins set user_id=v_user where user_id=v_old;
  update public.fl_private_measures set user_id=v_user where user_id=v_old;
  update public.fl_coach_profiles set user_id=v_user where user_id=v_old;
  update public.fl_coach_weeks set user_id=v_user where user_id=v_old;
  delete from public.fl_push_subscriptions where user_id=v_old;
  delete from public.fl_recovery_codes where user_id=v_old; -- one-time code; create a new one after recovery
  return jsonb_build_object('family',v_family,'person',v_person);
end; $$;

revoke all on function public.fl_recovery_set(text),public.fl_recover_role(text) from public,anon,authenticated;
grant execute on function public.fl_recovery_set(text),public.fl_recover_role(text) to authenticated;
