-- Bounded partner activity history for streaks. No private meal or health data is shared.
-- Replaces only the authenticated read RPC; preserves existing rows and access grants.
begin;

create or replace function public.fl_private_pull(p_since date default null)
returns jsonb language plpgsql security definer stable set search_path = '' as $$
declare v_user uuid := auth.uid(); v_family text; v_person text;
  v_today date := (now() at time zone 'Asia/Shanghai')::date;
  v_activity_since date := greatest(coalesce(p_since,v_today-119),v_today-119);
begin
  select family,person into v_family,v_person from public.fl_members where user_id=v_user;
  if v_family is null then raise exception 'pairing_required'; end if;
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
    'partnerTrend', coalesce((select jsonb_agg(jsonb_build_object('date',date,'changeKg',change_kg))
      from public.fl_partner_weight_trend where family=v_family and person<>v_person),'[]'::jsonb)
  );
end; $$;

-- Validate every paired scope without returning identities or private records.
do $$
declare v_member record; v_result jsonb; v_item jsonb; v_today date := (now() at time zone 'Asia/Shanghai')::date;
begin
  for v_member in select user_id from public.fl_members loop
    perform set_config('request.jwt.claim.sub',v_member.user_id::text,true);
    v_result := public.fl_private_pull(v_today-119);
    if (v_result->>'partnerActivitySince')::date <> v_today-119
      or (v_result->>'partnerActivityUntil')::date <> v_today
      or jsonb_array_length(v_result->'partnerActivity') > 120 then
      raise exception 'partner_history_range_validation_failed';
    end if;
    for v_item in select value from jsonb_array_elements(v_result->'partnerActivity') loop
      if (v_item->>'date')::date not between v_today-119 and v_today
        or jsonb_typeof(v_item->'checked') <> 'boolean'
        or v_item - 'date' - 'checked' <> '{}'::jsonb then
        raise exception 'partner_history_privacy_validation_failed';
      end if;
    end loop;
  end loop;
  perform set_config('request.jwt.claim.sub','',true);
end; $$;

commit;
select 'partner_history_ready' as deployment, md5(prosrc) as source_checksum,
  prosecdef as security_definer from pg_proc where oid='public.fl_private_pull(date)'::regprocedure;
