-- Opt-in meal and activity detail sharing. Existing accounts remain private.
begin;
-- Stop instead of overwriting a different production version.
do $$ begin
  if (select md5(prosrc) from pg_proc where oid='public.fl_private_pull(date)'::regprocedure) <> '85577bb0a9c605c9db0fdacd8aebd5d2' then
    raise exception 'unexpected_private_pull_version';
  end if;
end; $$;

-- Sharing is opt-in per paired person; recovery retains the same consent.
create table if not exists public.fl_checkin_sharing (
  family text not null,
  person text not null,
  enabled boolean not null default false,
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

create or replace function public.fl_private_pull(p_since date default null)
returns jsonb language plpgsql security definer stable set search_path = '' as $$
declare v_user uuid := auth.uid(); v_family text; v_person text; v_partner uuid; v_partner_sharing boolean := false;
  v_today date := (now() at time zone 'Asia/Shanghai')::date;
  v_activity_since date := greatest(coalesce(p_since,v_today-119),v_today-119);
begin
  select family,person into v_family,v_person from public.fl_members where user_id=v_user;
  if v_family is null then raise exception 'pairing_required'; end if;
  select m.user_id,coalesce(s.enabled,false) into v_partner,v_partner_sharing
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
    'recordSharing', coalesce((select enabled from public.fl_checkin_sharing where family=v_family and person=v_person),false),
    'partnerRecordSharing', case when v_partner is null then 'unpaired' when v_partner_sharing then 'on' else 'off' end,
    'partnerCheckins', case when v_partner_sharing then coalesce((select jsonb_agg(jsonb_build_object('date',date,'body',public.fl_shared_checkin_body(body)) order by date)
      from public.fl_private_checkins where user_id=v_partner and date between v_activity_since and v_today),'[]'::jsonb) else '[]'::jsonb end,
    'partnerTrend', coalesce((select jsonb_agg(jsonb_build_object('date',date,'changeKg',change_kg))
      from public.fl_partner_weight_trend where family=v_family and person<>v_person),'[]'::jsonb)
  );
end; $$;

-- Validate opt-in defaults and the whitelist without exposing any private records.
do $$
declare v_member record; v_result jsonb; v_sample jsonb;
begin
  v_sample := public.fl_shared_checkin_body('{"meals":{"breakfast":"plan","secret":"PRIVATE"},"food":{"breakfast":{"text":"PRIVATE","kcal":280,"notes":"PRIVATE","items":[{"n":"包子","q":"1 个","k":210,"secret":"PRIVATE"}]}},"workout":"done","stand":3,"extraMoves":["warm-march"],"dailyState":"PRIVATE","dailyChoice":"PRIVATE","weight":77,"health":"PRIVATE","goal":"PRIVATE"}'::jsonb);
  if v_sample::text like '%PRIVATE%' or v_sample ? 'weight' or v_sample->'food'->'breakfast'->>'kcal' <> '280'
    or v_sample->>'workout' <> 'done' then raise exception 'sharing_whitelist_failed'; end if;
  for v_member in select user_id from public.fl_members loop
    perform set_config('request.jwt.claim.sub',v_member.user_id::text,true);
    v_result := public.fl_private_pull(null);
    if (v_result->>'recordSharing')::boolean or v_result->>'partnerRecordSharing'='on'
      or jsonb_array_length(v_result->'partnerCheckins') <> 0 then raise exception 'sharing_must_default_off'; end if;
  end loop;
  perform set_config('request.jwt.claim.sub','',true);
  begin
    perform public.fl_checkin_sharing_set(true);
    raise exception 'unauthenticated_sharing_was_allowed';
  exception when others then
    if sqlerrm <> 'pairing_required' then raise; end if;
  end;
end; $$;
commit;
select 'opt_in_sharing_ready' as deployment,md5(prosrc) as source_checksum
  from pg_proc where oid='public.fl_private_pull(date)'::regprocedure;
