-- Fix for: column "date" is of type date but expression is of type text.
-- Run this entire file once in the same Supabase project's SQL Editor.
-- This replaces only the role-claim function and preserves private record access.

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

revoke all on function public.fl_claim_role(text,text) from public,anon,authenticated;
grant execute on function public.fl_claim_role(text,text) to authenticated;
