-- Run once in Supabase SQL Editor after schema.sql. Re-running is safe.
-- Club Admin is the system manager. President and Vice President have global
-- club-work permissions; Heads are limited through their department assignment.
alter table public.members drop constraint if exists members_club_role_check;
alter table public.members alter column department_id drop not null;
update public.members set club_role = 'Member' where club_role = 'Club admin';
alter table public.members add constraint members_club_role_check
  check (club_role in ('Member','Department head','Project lead','Head','President','Vice President'));

create unique index if not exists members_single_club_admin_idx
  on public.members ((is_club_admin)) where is_club_admin;

create or replace function app_private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select m.is_club_admin
    from public.members m where m.id = app_private.current_member_id()), false)
$$;

create or replace function app_private.is_executive()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select m.club_role in ('President','Vice President')
    from public.members m where m.id = app_private.current_member_id()), false)
$$;

create or replace function app_private.protect_member_role_changes()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (new.club_role is distinct from old.club_role or
      new.is_club_admin is distinct from old.is_club_admin) and not app_private.is_admin() then
    raise exception 'Only the Club Admin can change club roles or system access';
  end if;
  return new;
end
$$;

drop trigger if exists protect_member_role_changes on public.members;
create trigger protect_member_role_changes before update on public.members
  for each row execute function app_private.protect_member_role_changes();

create or replace function app_private.manages_department(p_department_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive() or exists (
    select 1 from public.departments d
    where d.id = p_department_id and d.head_member_id = app_private.current_member_id()
  )
$$;

create or replace function app_private.leads_project(p_project_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive() or exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.project_lead_id = app_private.current_member_id()
  )
$$;

create or replace function app_private.can_view_member(p_member_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive()
    or p_member_id = app_private.current_member_id()
    or exists (
      select 1 from public.members target
      where target.id = p_member_id and app_private.manages_department(target.department_id)
    )
    or exists (
      select 1 from public.project_assignments mine
      join public.project_assignments theirs on theirs.project_id = mine.project_id
      where mine.member_id = app_private.current_member_id()
        and mine.status = 'Active'
        and theirs.member_id = p_member_id and theirs.status = 'Active'
    )
    or exists (
      select 1 from public.projects p
      join public.project_assignments team on team.project_id = p.id
      where p.project_lead_id = app_private.current_member_id()
        and team.member_id = p_member_id and team.status = 'Active'
    )
$$;

create or replace function app_private.can_view_assignment(p_assignment_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive() or exists (
    select 1 from public.project_assignments a
    join public.members m on m.id = a.member_id
    where a.id = p_assignment_id and (
      a.member_id = app_private.current_member_id() or
      a.allocated_by = app_private.current_member_id() or
      app_private.manages_department(m.department_id) or
      app_private.leads_project(a.project_id)
    )
  )
$$;

create or replace function app_private.can_view_task(p_task_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive() or exists (
    select 1 from public.tasks t
    where t.id = p_task_id and (
      t.assignee_id = app_private.current_member_id() or
      t.assigned_by = app_private.current_member_id() or
      exists (
        select 1 from public.project_assignments a
        where a.member_id = app_private.current_member_id()
          and a.project_id = t.project_id and a.status = 'Active'
      ) or
      (t.department_id is not null and app_private.manages_department(t.department_id)) or
      exists (
        select 1 from public.members assigned_member
        where assigned_member.id = t.assignee_id
          and app_private.manages_department(assigned_member.department_id)
      ) or
      (t.project_id is not null and app_private.leads_project(t.project_id))
    )
  )
$$;

create or replace function app_private.can_manage_task(p_task_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive() or exists (
    select 1 from public.tasks t
    where t.id = p_task_id and (
      t.assigned_by = app_private.current_member_id() or
      (t.department_id is not null and app_private.manages_department(t.department_id)) or
      (t.project_id is not null and app_private.leads_project(t.project_id))
    )
  )
$$;

create or replace function app_private.can_create_task(
  p_task_type text, p_project_id uuid, p_department_id uuid, p_assignee_id uuid
)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive() or exists (
    select 1 from public.members assignee
    where assignee.id = p_assignee_id and assignee.status = 'Active' and (
      (p_task_type = 'Department task' and p_department_id = assignee.department_id
        and app_private.manages_department(p_department_id)) or
      (p_task_type = 'Project task' and p_project_id is not null
        and app_private.leads_project(p_project_id)
        and exists (select 1 from public.project_assignments a
          where a.member_id = assignee.id and a.project_id = p_project_id and a.status = 'Active'))
    )
  )
$$;

drop policy if exists projects_read on public.projects;
drop policy if exists departments_read on public.departments;
create policy departments_read on public.departments for select to authenticated
  using (
    app_private.is_admin() or app_private.is_executive() or
    head_member_id = app_private.current_member_id() or
    exists (select 1 from public.members self_member
      where self_member.id = app_private.current_member_id()
        and self_member.department_id = departments.id)
  );

create policy projects_read on public.projects for select to authenticated
  using (
    app_private.is_admin() or app_private.is_executive() or app_private.leads_project(id) or
    exists (select 1 from public.project_assignments mine
      where mine.project_id = projects.id and mine.member_id = app_private.current_member_id()
        and mine.status = 'Active') or
    exists (select 1 from public.project_assignments team
      join public.members team_member on team_member.id = team.member_id
      where team.project_id = projects.id and team.status = 'Active'
        and app_private.manages_department(team_member.department_id))
  );

drop policy if exists departments_admin_write on public.departments;
create policy departments_admin_write on public.departments for all to authenticated
  using (app_private.is_admin() or app_private.is_executive())
  with check (app_private.is_admin() or app_private.is_executive());

drop policy if exists members_manager_update on public.members;
create policy members_manager_update on public.members for update to authenticated
  using (app_private.is_executive() or app_private.manages_department(department_id))
  with check (app_private.is_executive() or app_private.manages_department(department_id));

drop policy if exists projects_admin_write on public.projects;
create policy projects_admin_write on public.projects for all to authenticated
  using (app_private.is_admin() or app_private.is_executive())
  with check (app_private.is_admin() or app_private.is_executive());

drop policy if exists tasks_admin_delete on public.tasks;
create policy tasks_admin_delete on public.tasks for delete to authenticated
  using (app_private.is_admin() or app_private.is_executive());

grant execute on all functions in schema app_private to authenticated;
