-- Plan a person's position, departments and projects before they accept their invitation.
-- Nothing in the plan is visible anywhere (no head, no member lists, no counts) until they
-- create a password: the plan lives in an admin-only table and is applied at activation.
-- Unaccepted invitations are removed after 14 days.

create table if not exists public.pending_plans (
  member_id  uuid primary key references public.members(id) on delete cascade,
  plan       jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null default (now() + interval '14 days')
);
alter table public.pending_plans enable row level security;
drop policy if exists pending_plans_admin on public.pending_plans;
create policy pending_plans_admin on public.pending_plans for all to authenticated
  using (app_private.is_admin()) with check (app_private.is_admin());
grant select, insert, update, delete on public.pending_plans to authenticated;

-- People who are already pending get an empty plan and the same 14-day window.
insert into public.pending_plans (member_id)
  select id from public.members where status = 'Pending invitation'
  on conflict (member_id) do nothing;

-- Called by the server when the invited person creates their password. Applies the plan
-- and activates the member in one transaction, with the same rows the Members page writes.
create or replace function public.activate_pending_member(p_member_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  pl jsonb; prim text; extra text; scope text; nm text; admin_id uuid;
  dept_id uuid; proj_id uuid; pos_id uuid; item text; role_db text;
begin
  perform 1 from public.members where id = p_member_id and status = 'Pending invitation' for update;
  if not found then raise exception 'No pending member with this id'; end if;

  select plan into pl from public.pending_plans where member_id = p_member_id;
  pl := coalesce(pl, '{}'::jsonb);
  prim := coalesce(nullif(pl->>'clubRole', ''), 'Member');
  if prim not in ('Member','Department Head','Project Head','Vice President','President') then prim := 'Member'; end if;
  extra := coalesce(pl->>'extraRole', '');
  if extra not in ('Member','Department Head','Project Head') or prim not in ('President','Vice President') then extra := ''; end if;
  scope := coalesce(pl->>'headScope', '');

  select created_by into admin_id from public.invitations
    where member_id = p_member_id order by created_at desc limit 1;
  if admin_id is null then
    select id into admin_id from public.members where is_club_admin order by created_at limit 1;
  end if;

  -- Positions (and the department head / project lead pointers), as the Members page writes them.
  foreach nm in array array_remove(array[prim, extra], '') loop
    select id into pos_id from public.positions where name = nm;
    dept_id := null; proj_id := null;
    if nm = 'Department Head' then
      select id into dept_id from public.departments where name = scope;
      if dept_id is not null then
        update public.departments set head_member_id = p_member_id where id = dept_id;
        insert into public.member_departments (member_id, department_id, assigned_by)
          values (p_member_id, dept_id, admin_id) on conflict do nothing;
      end if;
    elsif nm = 'Project Head' then
      select id into proj_id from public.projects where name = scope;
      if proj_id is not null then
        update public.projects set project_lead_id = p_member_id where id = proj_id;
        insert into public.project_assignments (member_id, project_id, allocated_by, status, role_on_project)
          values (p_member_id, proj_id, admin_id, 'Active', 'Core') on conflict do nothing;
      end if;
    end if;
    if pos_id is not null and not (nm = 'Department Head' and dept_id is null) and not (nm = 'Project Head' and proj_id is null) then
      insert into public.member_positions (member_id, position_id, department_id, project_id, assigned_by)
        values (p_member_id, pos_id, dept_id, proj_id, admin_id) on conflict do nothing;
    end if;
  end loop;

  -- Planned departments and projects.
  for item in select jsonb_array_elements_text(coalesce(pl->'departments', '[]'::jsonb)) loop
    select id into dept_id from public.departments where name = item;
    if dept_id is not null then
      insert into public.member_departments (member_id, department_id, assigned_by)
        values (p_member_id, dept_id, admin_id) on conflict do nothing;
    end if;
  end loop;
  for item in select jsonb_array_elements_text(coalesce(pl->'projects', '[]'::jsonb)) loop
    select id into proj_id from public.projects where name = item;
    if proj_id is not null then
      insert into public.project_assignments (member_id, project_id, allocated_by, status, role_on_project)
        values (p_member_id, proj_id, admin_id, 'Active', 'Core') on conflict do nothing;
    end if;
  end loop;

  role_db := case prim when 'Department Head' then 'Department head' when 'Project Head' then 'Project lead' else prim end;
  update public.members set club_role = role_db, status = 'Active' where id = p_member_id;
  delete from public.pending_plans where member_id = p_member_id;
end $$;
revoke execute on function public.activate_pending_member(uuid) from public, anon, authenticated;
grant execute on function public.activate_pending_member(uuid) to service_role;

-- Removes invitations nobody accepted within their 14 days, with the unused login.
create or replace function public.purge_expired_pending_members() returns integer
language plpgsql security definer set search_path = '' as $$
declare r record; n integer := 0;
begin
  for r in
    select m.id, m.email from public.members m
      join public.pending_plans p on p.member_id = m.id
     where m.status = 'Pending invitation' and p.expires_at < now()
  loop
    delete from auth.users where lower(email) = lower(r.email);
    delete from public.members where id = r.id and status = 'Pending invitation';
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public.purge_expired_pending_members() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'purge-expired-pending-members';
select cron.schedule('purge-expired-pending-members', '17 3 * * *', 'select public.purge_expired_pending_members()');
