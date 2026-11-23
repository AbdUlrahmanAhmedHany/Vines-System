-- Apply this update if schema.sql was already run before project-member visibility was added.
-- Project members can see the roster and task board for their own active projects only.
create or replace function app_private.can_view_member(p_member_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin()
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
$$;

create or replace function app_private.can_view_task(p_task_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or exists (
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
      (t.project_id is not null and app_private.leads_project(t.project_id))
    )
  )
$$;
