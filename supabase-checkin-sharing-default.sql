-- Run after supabase-checkin-sharing.sql. Only meal/activity details become shared by default.
-- Preserve every explicit opt-out and all private profiles/measures.
begin;
do $$ begin
  if (select md5(prosrc) from pg_proc where oid='public.fl_private_pull(date)'::regprocedure) <> 'bcf77d1e16d4a6789506185c59f3fd04' then
    raise exception 'unexpected_private_pull_version';
  end if;
end; $$;
alter table public.fl_checkin_sharing alter column enabled set default true;

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

-- Validate defaults and explicit opt-outs without returning identities or details.
do $$
declare v_member record; v_result jsonb; v_own boolean; v_peer boolean; v_day jsonb; v_recipient uuid;
begin
  for v_member in select user_id,family,person from public.fl_members loop
    select coalesce((select enabled from public.fl_checkin_sharing where family=v_member.family and person=v_member.person),true) into v_own;
    select coalesce(s.enabled,true) into v_peer from public.fl_members m left join public.fl_checkin_sharing s on s.family=m.family and s.person=m.person
      where m.family=v_member.family and m.person<>v_member.person;
    perform set_config('request.jwt.claim.sub',v_member.user_id::text,true);
    v_result := public.fl_private_pull(null);
    if jsonb_array_length(v_result->'partnerCheckins')<>0 then raise exception 'sync_must_not_download_details'; end if;
    v_day := public.fl_partner_checkin_get((now() at time zone 'Asia/Shanghai')::date);
    if v_day->>'partnerRecordSharing' is distinct from v_result->>'partnerRecordSharing' then raise exception 'selected_day_scope_failed'; end if;
    if v_day->>'partnerRecordSharing'<>'on' and v_day->'body'<>'null'::jsonb then raise exception 'closed_details_leaked'; end if;
    if v_day->'body'<>'null'::jsonb and (v_day->'body') - 'meals' - 'food' - 'workout' - 'stand' - 'extraMoves' <> '{}'::jsonb then raise exception 'selected_day_whitelist_failed'; end if;
    if (v_result->>'recordSharing')::boolean is distinct from v_own then raise exception 'own_sharing_preference_failed'; end if;
    if v_peer is null and v_result->>'partnerRecordSharing'<>'unpaired' then raise exception 'unpaired_sharing_failed'; end if;
    if v_peer=true and v_result->>'partnerRecordSharing'<>'on' then raise exception 'default_sharing_failed'; end if;
    if v_peer=false and (v_result->>'partnerRecordSharing'<>'off' or jsonb_array_length(v_result->'partnerCheckins')<>0) then raise exception 'opt_out_failed'; end if;
  end loop;
  -- Exercise manual opt-out inside a rolled-back subtransaction, preserving all real preferences.
  select m.user_id into v_recipient from public.fl_members m where exists(select 1 from public.fl_members p where p.family=m.family and p.person<>m.person) limit 1;
  if v_recipient is not null then
    begin
      insert into public.fl_checkin_sharing(family,person,enabled)
        select p.family,p.person,false from public.fl_members m join public.fl_members p on p.family=m.family and p.person<>m.person where m.user_id=v_recipient
        on conflict(family,person) do update set enabled=false;
      perform set_config('request.jwt.claim.sub',v_recipient::text,true);
      v_day := public.fl_partner_checkin_get((now() at time zone 'Asia/Shanghai')::date);
      if v_day->>'partnerRecordSharing'<>'off' or v_day->'body'<>'null'::jsonb then raise exception 'manual_opt_out_failed'; end if;
      raise exception using errcode='Z0001',message='rollback_test_preference';
    exception when sqlstate 'Z0001' then null;
    end;
  end if;
  perform set_config('request.jwt.claim.sub','',true);
  begin
    perform public.fl_partner_checkin_get((now() at time zone 'Asia/Shanghai')::date);
    raise exception 'unauthenticated_details_were_allowed';
  exception when others then if sqlerrm<>'pairing_required' then raise; end if;
  end;
  if has_table_privilege('anon','public.fl_checkin_sharing','SELECT') or has_table_privilege('authenticated','public.fl_checkin_sharing','SELECT')
    or has_function_privilege('authenticated','public.fl_shared_checkin_body(jsonb)','EXECUTE') then raise exception 'direct_access_must_remain_blocked'; end if;
end; $$;
commit;
select 'default_sharing_ready' as deployment,md5(prosrc) as source_checksum
  from pg_proc where oid='public.fl_private_pull(date)'::regprocedure;
