-- 减脂打卡 App：Supabase 初始化脚本
-- 用法：Supabase 控制台 → SQL Editor → New query → 粘贴全部 → Run。可重复执行。
--
-- 安全模型：两张表开启 RLS 且不加任何策略，公开密钥无法直接读写表；
-- 只能通过下面三个 security definer 函数访问，并按"家庭口令"隔离数据。

-- ---------- 表 ----------
create table if not exists public.checkins (
  family     text        not null,
  id         text        not null,
  person     text        not null,
  date       date        not null,
  body       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (family, id)
);

create table if not exists public.measures (
  family     text        not null,
  id         text        not null,
  person     text        not null,
  date       date        not null,
  body       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (family, id)
);

create index if not exists checkins_family_date on public.checkins (family, date);

alter table public.checkins enable row level security;
alter table public.measures enable row level security;

-- 公开密钥（anon）不能直接碰表
revoke all on public.checkins from anon, authenticated;
revoke all on public.measures from anon, authenticated;

-- ---------- 参数校验 ----------
create or replace function public.fl_check(p_family text, p_id text, p_person text, p_date date, p_body jsonb)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_family is null or p_family !~ '^[A-Za-z0-9]{8,40}$' then
    raise exception 'invalid family';
  end if;
  if p_person not in ('hus', 'wife') then
    raise exception 'invalid person';
  end if;
  if p_date is null or p_id is distinct from (p_person || '_' || to_char(p_date, 'YYYY-MM-DD')) then
    raise exception 'invalid id';
  end if;
  if p_body is null or jsonb_typeof(p_body) <> 'object' or octet_length(p_body::text) > 8192 then
    raise exception 'invalid body';
  end if;
end;
$$;

-- ---------- 写入 ----------
create or replace function public.fl_put_checkin(p_family text, p_id text, p_person text, p_date date, p_body jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.fl_check(p_family, p_id, p_person, p_date, p_body);
  insert into public.checkins (family, id, person, date, body, updated_at)
  values (p_family, p_id, p_person, p_date, p_body, now())
  on conflict (family, id) do update
    set body = excluded.body, person = excluded.person, date = excluded.date, updated_at = now();
end;
$$;

create or replace function public.fl_put_measure(p_family text, p_id text, p_person text, p_date date, p_body jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.fl_check(p_family, p_id, p_person, p_date, p_body);
  insert into public.measures (family, id, person, date, body, updated_at)
  values (p_family, p_id, p_person, p_date, p_body, now())
  on conflict (family, id) do update
    set body = excluded.body, person = excluded.person, date = excluded.date, updated_at = now();
end;
$$;

-- ---------- 拉取 ----------
-- 返回 {checkins:[{id,body}], measures:[{id,body}]}：打卡取 p_since 之后，身体数据取全部
create or replace function public.fl_pull(p_family text, p_since date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_family is null or p_family !~ '^[A-Za-z0-9]{8,40}$' then
    raise exception 'invalid family';
  end if;
  return jsonb_build_object(
    'checkins', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'body', c.body))
      from public.checkins c
      where c.family = p_family and c.date >= coalesce(p_since, current_date - 120)
    ), '[]'::jsonb),
    'measures', coalesce((
      select jsonb_agg(jsonb_build_object('id', m.id, 'body', m.body))
      from public.measures m
      where m.family = p_family
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------- 权限 ----------
revoke all on function public.fl_check(text, text, text, date, jsonb) from public, anon, authenticated;
revoke all on function public.fl_put_checkin(text, text, text, date, jsonb) from public;
revoke all on function public.fl_put_measure(text, text, text, date, jsonb) from public;
revoke all on function public.fl_pull(text, date) from public;
-- A later re-run must not reopen the family-code endpoints after private migration.
do $$ begin
  if to_regclass('public.fl_members') is null then
    grant execute on function public.fl_put_checkin(text, text, text, date, jsonb) to anon, authenticated;
    grant execute on function public.fl_put_measure(text, text, text, date, jsonb) to anon, authenticated;
    grant execute on function public.fl_pull(text, date) to anon, authenticated;
  else
    revoke execute on function public.fl_put_checkin(text, text, text, date, jsonb),
      public.fl_put_measure(text, text, text, date, jsonb), public.fl_pull(text, date)
      from public, anon, authenticated;
  end if;
end $$;
