-- Project/department tasks can cover multiple scopes. Tasks start unassigned;
-- run after schema.sql and matrix-roles-update.sql.

alter table public.tasks alter column assignee_id drop not null;
alter table public.tasks drop constraint if exists tasks_status_check;
update public.tasks
set status = case when assignee_id is null then 'Unassigned' else 'Pending' end
where status in ('Backlog', 'To do');
alter table public.tasks alter column status set default 'Unassigned';
alter table public.tasks add constraint tasks_status_check
  check (status in ('Unassigned', 'Pending', 'In progress', 'In review', 'Done'));

alter table public.tasks drop constraint if exists task_type_scope;
alter table public.tasks add constraint task_type_scope check (
  (task_type = 'Project task' and project_id is not null) or
  (task_type = 'Department task' and department_id is not null and project_id is null) or
  (task_type = 'Club-wide' and project_id is null and department_id is null)
);

create table if not exists public.task_projects (
  task_id uuid not null references public.tasks(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, project_id)
);
create table if not exists public.task_departments (
  task_id uuid not null references public.tasks(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, department_id)
);

insert into public.task_projects(task_id, project_id)
select id, project_id from public.tasks where project_id is not null
on conflict do nothing;
insert into public.task_departments(task_id, department_id)
select id, department_id from public.tasks where department_id is not null
on conflict do nothing;

alter table public.task_projects enable row level security;
alter table public.task_departments enable row level security;

create or replace function app_private.can_view_task(p_task_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive() or exists (
    select 1 from public.tasks t where t.id = p_task_id and (
      t.assignee_id = app_private.current_member_id() or
      t.assigned_by = app_private.current_member_id() or
      exists (
        select 1 from public.task_projects tp
        join public.project_assignments pa on pa.project_id = tp.project_id
        where tp.task_id = t.id and pa.member_id = app_private.current_member_id()
          and pa.status = 'Active'
      ) or exists (
        select 1 from public.task_projects tp
        where tp.task_id = t.id and app_private.leads_project(tp.project_id)
      ) or exists (
        select 1 from public.task_departments td
        join public.member_departments md on md.department_id = td.department_id
        where td.task_id = t.id and md.member_id = app_private.current_member_id()
      ) or exists (
        select 1 from public.task_departments td
        where td.task_id = t.id and app_private.manages_department(td.department_id)
      )
    )
  )
$$;

create or replace function app_private.can_create_task(
  p_task_type text,
  p_project_id uuid,
  p_department_id uuid,
  p_assignee_id uuid
) returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive() or
    (p_task_type = 'Project task' and p_project_id is not null
      and p_assignee_id is null
      and (p_department_id is null or app_private.manages_department(p_department_id))
      and app_private.leads_project(p_project_id)) or
    (p_task_type = 'Department task' and p_project_id is null
      and p_department_id is not null and p_assignee_id is null
      and app_private.manages_department(p_department_id))
$$;

create or replace function app_private.can_manage_task(p_task_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive() or exists (
    select 1 from public.task_projects tp
    where tp.task_id = p_task_id and app_private.leads_project(tp.project_id)
  ) or (
    not exists (select 1 from public.task_projects tp where tp.task_id = p_task_id)
    and exists (
      select 1 from public.task_departments td
      where td.task_id = p_task_id and app_private.manages_department(td.department_id)
    )
  )
$$;

create or replace function app_private.enforce_task_assignment_workflow()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_can_assign boolean;
  v_matches_scope boolean;
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
      select exists (
        select 1 from public.members m
        where m.id = new.assignee_id and m.status = 'Active' and (
          exists (
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

drop trigger if exists enforce_task_assignment_workflow on public.tasks;
create trigger enforce_task_assignment_workflow
before insert or update on public.tasks
for each row execute function app_private.enforce_task_assignment_workflow();

drop policy if exists tasks_scoped_read on public.tasks;
create policy tasks_scoped_read on public.tasks for select to authenticated
  using (app_private.can_view_task(id));
drop policy if exists tasks_scoped_update on public.tasks;
create policy tasks_scoped_update on public.tasks for update to authenticated
  using (app_private.can_manage_task(id) or assignee_id = app_private.current_member_id())
  with check (app_private.can_manage_task(id) or assignee_id = app_private.current_member_id());

drop policy if exists task_projects_scoped_read on public.task_projects;
create policy task_projects_scoped_read on public.task_projects for select to authenticated
  using (app_private.can_view_task(task_id));
drop policy if exists task_projects_scoped_insert on public.task_projects;
create policy task_projects_scoped_insert on public.task_projects for insert to authenticated
  with check (app_private.is_admin() or app_private.is_executive() or
    (app_private.leads_project(project_id) and exists (
      select 1 from public.tasks t
      where t.id = task_projects.task_id and t.task_type = 'Project task'
    )));
drop policy if exists task_projects_scoped_delete on public.task_projects;
create policy task_projects_scoped_delete on public.task_projects for delete to authenticated
  using (app_private.is_admin() or app_private.is_executive() or
    (app_private.leads_project(project_id) and exists (
      select 1 from public.tasks t
      where t.id = task_projects.task_id and t.task_type = 'Project task'
    )));

drop policy if exists task_departments_scoped_read on public.task_departments;
create policy task_departments_scoped_read on public.task_departments for select to authenticated
  using (app_private.can_view_task(task_id));
drop policy if exists task_departments_scoped_insert on public.task_departments;
create policy task_departments_scoped_insert on public.task_departments for insert to authenticated
  with check (app_private.is_admin() or app_private.is_executive() or (
    app_private.manages_department(department_id) and exists (
      select 1 from public.tasks t
      where t.id = task_departments.task_id and (
        (t.task_type = 'Department task' and not exists (
          select 1 from public.task_projects tp where tp.task_id = t.id
        )) or (t.task_type = 'Project task' and not exists (
          select 1 from public.task_projects tp
          where tp.task_id = t.id and not app_private.leads_project(tp.project_id)
        ))
      )
    )
  ));
drop policy if exists task_departments_scoped_delete on public.task_departments;
create policy task_departments_scoped_delete on public.task_departments for delete to authenticated
  using (app_private.is_admin() or app_private.is_executive() or (
    app_private.manages_department(department_id) and exists (
      select 1 from public.tasks t
      where t.id = task_departments.task_id and (
        (t.task_type = 'Department task' and not exists (
          select 1 from public.task_projects tp where tp.task_id = t.id
        )) or (t.task_type = 'Project task' and not exists (
          select 1 from public.task_projects tp
          where tp.task_id = t.id and not app_private.leads_project(tp.project_id)
        ))
      )
    )
  ));

grant select, insert, delete on public.task_projects, public.task_departments to authenticated;
grant update (assignee_id, assigned_by, status, progress_update) on public.tasks to authenticated;
