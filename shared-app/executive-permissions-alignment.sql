-- Executive (President / Vice President) permissions, kept separate from System Admin.
--
-- Executives (is_executive): view, create, manage, assign, delete and complete tasks across
-- the whole club, including club-wide tasks. They do NOT get: creating departments/projects,
-- member accounts, invitations, CSV import, department/project heads, department/project
-- membership, or system access. Those stay with the System Admin (and system access with the
-- club owner only: see access-and-visibility-update.sql).
--
-- Changes in this migration:
-- 1. Club-wide tasks (no project, no department) can be assigned to any active member. Before,
--    the assignee had to belong to one of the task's projects or departments, so a club-wide
--    task could be created but never assigned. Only an admin or executive can manage such a
--    task (can_manage_task), so heads still cannot assign it.
-- 2. Drops projects_lead_update, a redundant, misleadingly named copy of projects_admin_write
--    (same admin-only rule). Nothing else in the policies changes.

create or replace function app_private.enforce_task_assignment_workflow()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_can_assign boolean;
  v_matches_scope boolean;
  v_club_wide boolean;
begin
  if tg_op = 'INSERT' then
    if new.assignee_id is not null then
      raise exception 'Create tasks as unassigned, then assign them from the task list.';
    end if;
    new.status := 'Unassigned';
    return new;
  end if;

  if new.assignee_id is distinct from old.assignee_id then
    select app_private.is_admin() or app_private.is_executive() or exists (
      select 1 from public.task_projects tp
      where tp.task_id = old.id and app_private.leads_project(tp.project_id)
    ) or (
      not exists (select 1 from public.task_projects tp where tp.task_id = old.id)
      and exists (
        select 1 from public.task_departments td
        where td.task_id = old.id and app_private.manages_department(td.department_id)
      )
    ) into v_can_assign;

    if not coalesce(v_can_assign, false) then
      raise exception 'Only a global leader or a head in this task scope can assign it.';
    end if;

    if new.assignee_id is null then
      new.status := 'Unassigned';
    else
      v_club_wide := not exists (select 1 from public.task_projects tp where tp.task_id = old.id)
                 and not exists (select 1 from public.task_departments td where td.task_id = old.id);
      select exists (
        select 1 from public.members m
        where m.id = new.assignee_id and m.status = 'Active' and (
          v_club_wide
          or exists (
            select 1 from public.task_projects tp
            join public.project_assignments pa on pa.project_id = tp.project_id
            where tp.task_id = old.id and pa.member_id = m.id and pa.status = 'Active'
          ) or exists (
            select 1 from public.task_departments td
            join public.member_departments md on md.department_id = td.department_id
            where td.task_id = old.id and md.member_id = m.id
          )
        )
      ) into v_matches_scope;
      if not coalesce(v_matches_scope, false) then
        raise exception 'Choose an active member of at least one selected project or department.';
      end if;
      new.status := 'Pending';
    end if;
    new.assigned_by := app_private.current_member_id();
  elsif new.assigned_by is distinct from old.assigned_by then
    raise exception 'The task assigner changes only when its assignee changes.';
  end if;

  if new.status is distinct from old.status and new.status = 'Done' then
    select app_private.is_admin() or app_private.is_executive() or exists (
      select 1 from public.task_projects tp
      where tp.task_id = old.id and app_private.leads_project(tp.project_id)
    ) into v_can_assign;
    if not coalesce(v_can_assign, false) then
      raise exception 'Only the system admin, President, Vice President, or a linked project head can mark a task done.';
    end if;
  end if;

  return new;
end
$$;

drop policy if exists projects_lead_update on public.projects;
