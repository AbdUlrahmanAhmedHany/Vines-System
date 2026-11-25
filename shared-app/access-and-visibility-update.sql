-- Owner-only admin control, pending members stay invisible, everyone sees the member list.
-- Run after profile-update.sql. Safe to run more than once.
--
-- AFTER RUNNING: mark exactly one account as the club owner (replace the email):
--   update public.members set is_club_owner = true, is_club_admin = true
--    where lower(email) = lower('owner@example.com');

-- 1. The club owner: the only account that can give or take away system admin access.
alter table public.members add column if not exists is_club_owner boolean not null default false;
create unique index if not exists members_single_owner on public.members (is_club_owner) where is_club_owner;

create or replace function app_private.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select m.is_club_owner from public.members m
                    where m.id = app_private.current_member_id()), false)
$$;

create or replace function app_private.protect_member_role_changes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Direct database / server-side (service role) work has no signed-in user.
  if auth.jwt() is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if tg_op = 'INSERT' then
    if new.is_club_owner then
      raise exception 'The club owner cannot be created here';
    end if;
    if new.is_club_admin and not app_private.is_owner() then
      raise exception 'Only the club owner can give system admin access';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.is_club_owner then
      raise exception 'The club owner cannot be removed';
    end if;
    if old.is_club_admin and not app_private.is_owner() then
      raise exception 'Only the club owner can remove a system admin';
    end if;
    return old;
  end if;

  if new.is_club_owner is distinct from old.is_club_owner then
    raise exception 'Club ownership cannot be changed here';
  end if;
  if new.is_club_admin is distinct from old.is_club_admin then
    if not app_private.is_owner() then
      raise exception 'Only the club owner can grant or revoke system admin access';
    end if;
    if old.is_club_owner then
      raise exception 'The club owner always keeps system admin access';
    end if;
  end if;
  if new.club_role is distinct from old.club_role and not app_private.is_admin() then
    raise exception 'Only the Club Admin can change club roles or system access';
  end if;
  return new;
end
$$;

drop trigger if exists protect_member_role_changes on public.members;
create trigger protect_member_role_changes
  before insert or update or delete on public.members
  for each row execute function app_private.protect_member_role_changes();

-- 2. Phone numbers get their own table so they can stay private while the member list is open.
create table if not exists public.member_contacts (
  member_id uuid primary key references public.members(id) on delete cascade,
  phone text check (phone is null or phone ~ '^\+[0-9]{8,15}$')
);
alter table public.member_contacts enable row level security;

-- Who may see a phone number: the member, admins, President/VP, their department head,
-- project leads and people on the same project (the previous member-visibility rule).
create or replace function app_private.can_view_member_contact(p_member_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive()
    or p_member_id = app_private.current_member_id()
    or exists (select 1 from public.member_departments md
      where md.member_id = p_member_id and app_private.manages_department(md.department_id))
    or exists (select 1 from public.project_assignments mine
      join public.project_assignments theirs on theirs.project_id = mine.project_id
      where mine.member_id = app_private.current_member_id() and mine.status = 'Active'
        and theirs.member_id = p_member_id and theirs.status = 'Active')
    or exists (select 1 from public.project_assignments a
      where a.member_id = p_member_id and a.status = 'Active' and app_private.leads_project(a.project_id))
$$;
drop policy if exists member_contacts_read on public.member_contacts;
create policy member_contacts_read on public.member_contacts for select to authenticated
  using (app_private.can_view_member_contact(member_id));
grant select on public.member_contacts to authenticated;

do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'members' and column_name = 'phone') then
    insert into public.member_contacts (member_id, phone)
      select id, phone from public.members where phone is not null
      on conflict (member_id) do nothing;
    alter table public.members drop constraint if exists members_phone_check;
    alter table public.members drop column phone;
  end if;
end $$;

create or replace function public.update_own_profile(
  p_name text,
  p_faculty text,
  p_study_year integer,
  p_avatar_path text,
  p_profile_status text,
  p_phone text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := app_private.current_member_id();
  clean_name text := btrim(coalesce(p_name, ''));
  clean_faculty text := nullif(btrim(coalesce(p_faculty, '')), '');
  clean_phone text := nullif(btrim(coalesce(p_phone, '')), '');
begin
  if me is null then
    raise exception 'No active member profile is linked to this account';
  end if;
  if clean_name = '' or char_length(clean_name) > 120 then
    raise exception 'Enter your name (up to 120 characters)';
  end if;
  if clean_faculty is not null and clean_faculty not in
     ('Engineering', 'Computer Science', 'Business Informatics', 'Digital Arts and Design') then
    raise exception 'Choose one of the listed faculties';
  end if;
  if p_study_year is not null and (p_study_year < 1 or p_study_year > 5) then
    raise exception 'Year of study must be between 1 and 5';
  end if;
  if p_study_year = 5 and clean_faculty is distinct from 'Engineering' then
    raise exception 'Only Engineering has a fifth year';
  end if;
  if clean_phone is not null and clean_phone !~ '^\+[0-9]{8,15}$' then
    raise exception 'Enter a valid phone number';
  end if;
  if p_profile_status not in ('Pending', 'Skipped', 'Complete') then
    raise exception 'Invalid profile status';
  end if;
  if p_avatar_path is not null and p_avatar_path not like me::text || '/%' then
    raise exception 'Photo does not belong to this profile';
  end if;

  update public.members
     set name = clean_name,
         faculty = clean_faculty,
         study_year = p_study_year,
         avatar_path = p_avatar_path,
         profile_status = p_profile_status
   where id = me;

  insert into public.member_contacts (member_id, phone) values (me, clean_phone)
    on conflict (member_id) do update set phone = excluded.phone;
end;
$$;
revoke all on function public.update_own_profile(text, text, integer, text, text, text) from public, anon;
grant execute on function public.update_own_profile(text, text, integer, text, text, text) to authenticated;

-- 3. Visibility. Any signed-in, registered member sees every registered member and the club
-- structure. People who have not created a password yet ("Pending invitation") are visible
-- to the system admin only.
create or replace function app_private.can_view_member(p_member_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app_private.is_admin()
    or (app_private.current_member_id() is not null
        and exists (select 1 from public.members m
                     where m.id = p_member_id and m.status = 'Active'))
$$;

create or replace function app_private.can_view_assignment(p_assignment_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app_private.is_admin()
    or (app_private.current_member_id() is not null
        and exists (select 1 from public.project_assignments a
                      join public.members m on m.id = a.member_id
                     where a.id = p_assignment_id and m.status = 'Active'))
$$;

drop policy if exists departments_read on public.departments;
create policy departments_read on public.departments for select to authenticated
  using (app_private.is_admin() or app_private.current_member_id() is not null);
drop policy if exists projects_read on public.projects;
create policy projects_read on public.projects for select to authenticated
  using (app_private.is_admin() or app_private.current_member_id() is not null);
