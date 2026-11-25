-- Member profile details: photo, faculty and year of study.
-- Additive and safe to run more than once. Run after matrix-roles-update.sql.

alter table public.members
  add column if not exists faculty text,
  add column if not exists study_year smallint,
  add column if not exists avatar_path text,
  add column if not exists profile_status text not null default 'Pending';

alter table public.members drop constraint if exists members_profile_status_check;
alter table public.members add constraint members_profile_status_check
  check (profile_status in ('Pending', 'Skipped', 'Complete'));

-- Every faculty is a 4-year programme except Engineering (5 years).
alter table public.members drop constraint if exists members_study_year_check;
alter table public.members add constraint members_study_year_check
  check (
    study_year is null
    or (study_year between 1 and 4)
    or (study_year = 5 and faculty = 'Engineering')
  );

-- A member edits only their own profile details, and only through this function.
-- Name, email, role, status and system access stay admin-only.
create or replace function public.update_own_profile(
  p_name text,
  p_faculty text,
  p_study_year integer,
  p_avatar_path text,
  p_profile_status text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := app_private.current_member_id();
  clean_name text := btrim(coalesce(p_name, ''));
  clean_faculty text := nullif(btrim(coalesce(p_faculty, '')), '');
begin
  if me is null then
    raise exception 'No active member profile is linked to this account';
  end if;
  if clean_name = '' or char_length(clean_name) > 120 then
    raise exception 'Enter your name (up to 120 characters)';
  end if;
  if clean_faculty is not null and char_length(clean_faculty) > 80 then
    raise exception 'Faculty name is too long';
  end if;
  if p_study_year is not null and (p_study_year < 1 or p_study_year > 5) then
    raise exception 'Year of study must be between 1 and 5';
  end if;
  if p_study_year = 5 and clean_faculty is distinct from 'Engineering' then
    raise exception 'Only Engineering has a fifth year';
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
end;
$$;

revoke all on function public.update_own_profile(text, text, integer, text, text) from public, anon;
grant execute on function public.update_own_profile(text, text, integer, text, text) to authenticated;

-- Profile photos: one folder per member, small images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_own_insert on storage.objects;
create policy avatars_own_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = app_private.current_member_id()::text);
drop policy if exists avatars_own_update on storage.objects;
create policy avatars_own_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = app_private.current_member_id()::text);
drop policy if exists avatars_own_delete on storage.objects;
create policy avatars_own_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = app_private.current_member_id()::text);
drop policy if exists avatars_own_select on storage.objects;
create policy avatars_own_select on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = app_private.current_member_id()::text);
