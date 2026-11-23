-- Project tasks are created unassigned, then allocated by a global leader or
-- the lead of that project. Run after schema.sql and matrix-roles-update.sql.

alter table public.tasks alter column assignee_id drop not null;
alter table public.tasks drop constraint if exists tasks_status_check;
update public.tasks
set status = case when assignee_id is null then 'Unassigned' else 'Pending' end
where status in ('Backlog', 'To do');
alter table public.tasks alter column status set default 'Unassigned';
alter table public.tasks add constraint tasks_status_check
  check (status in ('Unassigned', 'Pending', 'In progress', 'In review', 'Done'));

create or replace function app_private.can_create_task(
  p_task_type text,
  p_project_id uuid,
  p_department_id uuid,
  p_assignee_id uuid
) returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive() or
    (p_task_type = 'Project task' and p_project_id is not null
      and p_assignee_id is null and app_private.leads_project(p_project_id)) or
    (p_task_type = 'Department task' and p_department_id is not null
      and p_assignee_id is not null and app_private.manages_department(p_department_id)
      and exists (
        select 1 from public.member_departments md
        where md.member_id = p_assignee_id and md.department_id = p_department_id
      ))
$$;

create or replace function app_private.can_manage_task(p_task_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive() or exists (
    select 1 from public.tasks t where t.id = p_task_id and (
      (t.task_type = 'Project task' and app_private.leads_project(t.project_id)) or
      (t.task_type <> 'Project task' and (
        t.assigned_by = app_private.current_member_id() or
        (t.department_id is not null and app_private.manages_department(t.department_id))
      ))
    )
  )
$$;

create or replace function app_private.enforce_task_assignment_workflow()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' and new.task_type = 'Project task' then
    if new.assignee_id is not null then
      raise exception 'Create project tasks as unassigned, then assign them from the task list.';
    end if;
    new.status := 'Unassigned';
    return new;
  end if;

  if tg_op = 'UPDATE' and new.task_type = 'Project task' then
    if new.assignee_id is distinct from old.assignee_id then
      if not (
        app_private.is_admin() or app_private.is_executive() or
        app_private.leads_project(old.project_id)
      ) then
        raise exception 'Only the system admin, President, Vice President, or this project head can assign this task.';
      end if;

      if new.assignee_id is null then
        new.status := 'Unassigned';
      else
        if not exists (
          select 1 from public.members m
          join public.project_assignments pa on pa.member_id = m.id
          where m.id = new.assignee_id and m.status = 'Active'
            and pa.project_id = old.project_id and pa.status = 'Active'
        ) then
          raise exception 'Choose an active member assigned to this project.';
        end if;
        new.status := 'Pending';
      end if;
      new.assigned_by := app_private.current_member_id();
    elsif new.assigned_by is distinct from old.assigned_by then
      raise exception 'The task assigner changes only when its assignee changes.';
    end if;
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status
    and new.status = 'Done'
    and not (
      app_private.is_admin() or app_private.is_executive() or
      (new.task_type = 'Project task' and app_private.leads_project(new.project_id))
    ) then
    raise exception 'Only the system admin, President, Vice President, or project head can mark a task done.';
  end if;

  return new;
end
$$;

drop trigger if exists enforce_task_assignment_workflow on public.tasks;
create trigger enforce_task_assignment_workflow
before insert or update on public.tasks
for each row execute function app_private.enforce_task_assignment_workflow();

drop policy if exists tasks_scoped_update on public.tasks;
create policy tasks_scoped_update on public.tasks for update to authenticated
  using (app_private.can_manage_task(id) or assignee_id = app_private.current_member_id())
  with check (app_private.can_manage_task(id) or assignee_id = app_private.current_member_id());

grant update (assignee_id, assigned_by, status, progress_update) on public.tasks to authenticated;
