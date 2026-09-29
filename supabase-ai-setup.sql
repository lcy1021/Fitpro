-- AI 估算热量：每日调用次数限制（配合 supabase/functions/meal-kcal 使用）
-- 用法：Supabase 控制台 → SQL Editor → New query → 粘贴全部 → Run。可重复执行。

create table if not exists public.ai_usage (
  family text    not null,
  day    date    not null,
  n      integer not null default 0,
  primary key (family, day)
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

-- 调用一次就 +1，返回是否还在当天限额内。只给 Edge Function（service role）用
create or replace function public.fl_ai_quota(p_family text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v integer;
begin
  insert into public.ai_usage (family, day, n) values (p_family, current_date, 1)
  on conflict (family, day) do update set n = public.ai_usage.n + 1
  returning n into v;
  return v <= p_limit;
end;
$$;

revoke all on function public.fl_ai_quota(text, integer) from public, anon, authenticated;
grant execute on function public.fl_ai_quota(text, integer) to service_role;
grant select on public.checkins, public.measures to service_role;
