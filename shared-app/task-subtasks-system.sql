-- Task assignment & subtask management.
-- Run after executive-permissions-alignment.sql. Safe to run more than once.
--
-- Model: two task levels only. A main task has parent_task_id = null; a subtask points at exactly
-- one main task and can never be a parent. Division (creating subtasks) is granted by
-- app_private.can_divide_task(): President, Vice President and System Admin for any main task, and a
-- Project/Department Head only for a main task they created (created_by) or that an executive/admin
-- assigned straight to them (division_owner_id). Viewing a task never grants division, editing or
-- reassignment. Department heads change another head's subtask only through task_requests, which
-- the responsible head (assignee of the main task) or an executive/admin approves. The first
-- decision on a request wins: later approve/reject/cancel attempts are refused.
--
-- Statuses are renamed to: Unassigned, Not Started, In Progress, Under Review, Completed, Blocked.

-- ---------------------------------------------------------------------------------------------
-- 1. Columns and statuses
-- ---------------------------------------------------------------------------------------------
alter table public.tasks
  add column if not exists parent_task_id uuid references public.tasks(id) on delete cascade,
  add column if not exists created_by uuid references public.members(id) on delete set null,
  add column if not exists division_owner_id uuid references public.members(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.tasks disable trigger enforce_task_assignment_workflow;

update public.tasks set created_by = assigned_by where created_by is null;

alter table public.tasks drop constraint if exists tasks_status_check;
update public.tasks set status = case status
  when 'Pending' then 'Not Started'
  when 'In progress' then 'In Progress'
  when 'In review' then 'Under Review'
  when 'Done' then 'Completed'
  else status end;
alter table public.tasks add constraint tasks_status_check
  check (status in ('Unassigned', 'Not Started', 'In Progress', 'Under Review', 'Completed', 'Blocked'));

alter table public.tasks drop constraint if exists tasks_not_own_parent;
alter table public.tasks add constraint tasks_not_own_parent
  check (parent_task_id is null or parent_task_id <> id);
create index if not exists tasks_parent_idx on public.tasks(parent_task_id);
create index if not exists tasks_created_by_idx on public.tasks(created_by);

-- ---------------------------------------------------------------------------------------------
-- 2. New tables
-- ---------------------------------------------------------------------------------------------
create table if not exists public.task_dependencies (
  task_id uuid not null references public.tasks(id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, depends_on_task_id),
  check (task_id <> depends_on_task_id)
);

create table if not exists public.task_requests (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  request_type text not null check (request_type in ('Edit', 'Reassign')),
  requested_by uuid not null references public.members(id) on delete restrict,
  changes jsonb not null,
  reason text not null default '',
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected', 'Cancelled')),
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.members(id) on delete set null,
  reviewed_at timestamptz,
  review_note text not null default ''
);
create unique index if not exists task_requests_one_pending
  on public.task_requests(task_id, requested_by, request_type) where status = 'Pending';
create index if not exists task_requests_task_idx on public.task_requests(task_id, status);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references public.members(id) on delete restrict,
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists task_comments_task_idx on public.task_comments(task_id, created_at);

create table if not exists public.task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  actor_id uuid references public.members(id) on delete set null,
  event text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists task_activity_task_idx on public.task_activity(task_id, created_at);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  task_id uuid references public.tasks(id) on delete cascade,
  dedupe_key text unique,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists notifications_member_idx on public.notifications(member_id, read_at, created_at desc);

alter table public.task_dependencies enable row level security;
alter table public.task_requests enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_activity enable row level security;
alter table public.notifications enable row level security;

-- ---------------------------------------------------------------------------------------------
-- 3. Role and relationship helpers
-- ---------------------------------------------------------------------------------------------
create or replace function app_private.is_head()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.member_positions mp join public.positions p on p.id = mp.position_id
    where mp.member_id = app_private.current_member_id()
      and p.name in ('Project Head', 'Department Head')
  )
$$;

-- The person answerable for a main task: its assignee. A subtask answers to its parent's assignee.
create or replace function app_private.responsible_member(p_task_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select case when t.parent_task_id is null then t.assignee_id
    else (select p.assignee_id from public.tasks p where p.id = t.parent_task_id) end
  from public.tasks t where t.id = p_task_id
$$;

-- Active President / Vice President / System Admin members, used to route work with no head.
create or replace function app_private.leadership_ids()
returns uuid[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(distinct m.id), '{}') from public.members m
  where m.status = 'Active' and (
    m.is_club_admin or exists (
      select 1 from public.member_positions mp join public.positions p on p.id = mp.position_id
      where mp.member_id = m.id and p.name in ('President', 'Vice President')
    )
  )
$$;

-- Division authority (see header). Only main tasks can be divided, and never once completed.
create or replace function app_private.can_divide_task(p_task_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.tasks t
    where t.id = p_task_id and t.parent_task_id is null and t.status <> 'Completed'
      and (
        app_private.is_admin() or app_private.is_executive()
        or (app_private.is_head() and (
          t.created_by = app_private.current_member_id()
          or t.division_owner_id = app_private.current_member_id()
        ))
      )
  )
$$;

-- Who may change a task's own details (title, description, deadline, priority) directly.
create or replace function app_private.can_edit_task_details(p_task_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive() or exists (
    select 1 from public.tasks t where t.id = p_task_id and (
      t.created_by = app_private.current_member_id()
      or (t.parent_task_id is not null
          and app_private.responsible_member(t.id) = app_private.current_member_id())
    )
  )
$$;

-- Who may mark a task Completed (or reopen it).
create or replace function app_private.can_complete_task(p_task_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive() or exists (
    select 1 from public.tasks t where t.id = p_task_id and (
      (t.parent_task_id is null and t.assignee_id = app_private.current_member_id())
      or (t.parent_task_id is not null and (
        t.created_by = app_private.current_member_id()
        or app_private.responsible_member(t.id) = app_private.current_member_id()))
    )
  ) or exists (
    select 1 from public.task_projects tp
    where tp.task_id = p_task_id and app_private.leads_project(tp.project_id)
  )
$$;

-- Assignment authority: existing project/department rules for main tasks; for a subtask, only the
-- person who created it, the responsible head, or an executive/admin.
create or replace function app_private.can_assign_task(p_task_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive() or exists (
    select 1 from public.tasks t where t.id = p_task_id and (
      (t.parent_task_id is not null and (
        t.created_by = app_private.current_member_id()
        or app_private.responsible_member(t.id) = app_private.current_member_id()))
      or (t.parent_task_id is null and (
        exists (select 1 from public.task_projects tp
                where tp.task_id = t.id and app_private.leads_project(tp.project_id))
        or (not exists (select 1 from public.task_projects tp where tp.task_id = t.id)
            and exists (select 1 from public.task_departments td
                        where td.task_id = t.id and app_private.manages_department(td.department_id)))
      ))
    )
  )
$$;

-- Is the member active and inside at least one project/department of the scope (anyone if no scope)?
create or replace function app_private.member_in_scope(p_projects uuid[], p_departments uuid[], p_member_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.members m
    where m.id = p_member_id and m.status = 'Active' and (
      (coalesce(cardinality(p_projects), 0) = 0 and coalesce(cardinality(p_departments), 0) = 0)
      or exists (select 1 from public.project_assignments pa
                 where pa.member_id = m.id and pa.status = 'Active' and pa.project_id = any (coalesce(p_projects, '{}')))
      or exists (select 1 from public.member_departments md
                 where md.member_id = m.id and md.department_id = any (coalesce(p_departments, '{}')))
    )
  )
$$;

-- Keeps a head inside their existing assignment scope: the member must belong to a project the
-- head leads or a department the head manages (executives/admin: anywhere).
create or replace function app_private.assigner_covers_member(p_projects uuid[], p_departments uuid[], p_member_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive()
    or exists (select 1 from public.project_assignments pa
               where pa.member_id = p_member_id and pa.status = 'Active'
                 and pa.project_id = any (coalesce(p_projects, '{}'))
                 and app_private.leads_project(pa.project_id))
    or exists (select 1 from public.member_departments md
               where md.member_id = p_member_id
                 and md.department_id = any (coalesce(p_departments, '{}'))
                 and app_private.manages_department(md.department_id))
$$;

create or replace function app_private.task_projects_of(p_task_id uuid)
returns uuid[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(project_id), '{}') from public.task_projects where task_id = p_task_id
$$;
create or replace function app_private.task_departments_of(p_task_id uuid)
returns uuid[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(department_id), '{}') from public.task_departments where task_id = p_task_id
$$;

-- ---------------------------------------------------------------------------------------------
-- 4. Visibility and management (visibility never implies authority)
-- ---------------------------------------------------------------------------------------------
create or replace function app_private.task_visible_directly(p_task_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive() or exists (
    select 1 from public.tasks t where t.id = p_task_id and (
      t.assignee_id = app_private.current_member_id() or
      t.assigned_by = app_private.current_member_id() or
      t.created_by = app_private.current_member_id() or
      (t.parent_task_id is not null and exists (
        select 1 from public.tasks p where p.id = t.parent_task_id
          and (p.assignee_id = app_private.current_member_id() or p.created_by = app_private.current_member_id())
      )) or
      exists (
        select 1 from public.task_projects tp
        join public.project_assignments pa on pa.project_id = tp.project_id
        where tp.task_id = t.id and pa.member_id = app_private.current_member_id() and pa.status = 'Active'
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
      ) or (
        -- Department heads can monitor subtasks given to members of their department.
        t.parent_task_id is not null and exists (
          select 1 from public.member_departments md
          where md.member_id = t.assignee_id and app_private.manages_department(md.department_id)
        )
      )
    )
  )
$$;

-- A main task is also visible (read-only context) to anyone who can see one of its subtasks.
create or replace function app_private.can_view_task(p_task_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.task_visible_directly(p_task_id) or exists (
    select 1 from public.tasks c
    where c.parent_task_id = p_task_id and app_private.task_visible_directly(c.id)
  )
$$;

create or replace function app_private.can_manage_task(p_task_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive() or exists (
    select 1 from public.tasks t where t.id = p_task_id and (
      (t.parent_task_id is not null and (
        t.created_by = app_private.current_member_id()
        or app_private.responsible_member(t.id) = app_private.current_member_id()))
      or (t.parent_task_id is null and (
        exists (select 1 from public.task_projects tp
                where tp.task_id = t.id and app_private.leads_project(tp.project_id))
        or (not exists (select 1 from public.task_projects tp where tp.task_id = t.id)
            and exists (select 1 from public.task_departments td
                        where td.task_id = t.id and app_private.manages_department(td.department_id)))
      ))
    )
  )
$$;

-- ---------------------------------------------------------------------------------------------
-- 5. Activity log and notifications (written only by the database)
-- ---------------------------------------------------------------------------------------------
create or replace function app_private.log_activity(p_task_id uuid, p_event text, p_detail jsonb default '{}')
returns void language sql security definer set search_path = '' as $$
  insert into public.task_activity(task_id, actor_id, event, detail)
  values (p_task_id, app_private.current_member_id(), p_event, coalesce(p_detail, '{}'::jsonb))
$$;

create or replace function app_private.notify(
  p_members uuid[], p_kind text, p_title text, p_body text, p_task_id uuid
) returns void language sql security definer set search_path = '' as $$
  insert into public.notifications(member_id, kind, title, body, task_id)
  select distinct m.id, p_kind, p_title, coalesce(p_body, ''), p_task_id
  from public.members m
  where m.id = any (coalesce(p_members, '{}')) and m.status = 'Active'
    and m.id is distinct from app_private.current_member_id()
$$;

-- Everyone who should hear about a task: assignee, creator, and whoever answers for it.
create or replace function app_private.task_people(p_task_id uuid)
returns uuid[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(distinct x) filter (where x is not null), '{}') from (
    select t.assignee_id x from public.tasks t where t.id = p_task_id
    union all select t.created_by from public.tasks t where t.id = p_task_id
    union all select app_private.responsible_member(p_task_id)
  ) s
$$;

create or replace function app_private.task_heads(p_task_id uuid)
returns uuid[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(distinct mp.member_id), '{}') from public.member_positions mp
  join public.positions p on p.id = mp.position_id
  where (p.name = 'Project Head' and mp.project_id in (select project_id from public.task_projects where task_id = p_task_id))
     or (p.name = 'Department Head' and mp.department_id in (select department_id from public.task_departments where task_id = p_task_id))
$$;

-- ---------------------------------------------------------------------------------------------
-- 6. Task triggers: workflow, hierarchy, activity, notifications
-- ---------------------------------------------------------------------------------------------
create or replace function app_private.enforce_task_assignment_workflow()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_me uuid := app_private.current_member_id();
  v_internal boolean := coalesce(current_setting('app.internal', true), '') = 'on';
  v_ok boolean;
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(v_me, new.created_by, new.assigned_by);
    new.updated_at := now();
    if v_internal then
      return new;
    end if;
    if new.parent_task_id is not null then
      raise exception 'Subtasks are created by dividing a main task.';
    end if;
    if new.assignee_id is not null then
      raise exception 'Create tasks as unassigned, then assign them from the task list.';
    end if;
    new.status := 'Unassigned';
    return new;
  end if;

  if new.parent_task_id is distinct from old.parent_task_id then
    raise exception 'A task cannot be moved between main tasks.';
  end if;
  if new.created_by is distinct from old.created_by and new.created_by is not null then
    raise exception 'The task creator cannot be changed.';
  end if;
  new.updated_at := now();

  if new.assignee_id is distinct from old.assignee_id then
    v_ok := v_internal or app_private.can_assign_task(old.id);
    if not coalesce(v_ok, false) then
      raise exception 'Only a global leader or a head in this task scope can assign it.';
    end if;

    if new.assignee_id is null then
      new.status := 'Unassigned';
      new.division_owner_id := null;
    else
      if not v_internal and not app_private.member_in_scope(
           app_private.task_projects_of(old.id), app_private.task_departments_of(old.id), new.assignee_id) then
        raise exception 'Choose an active member of at least one selected project or department.';
      end if;
      if old.parent_task_id is not null and not v_internal
         and not app_private.assigner_covers_member(
           app_private.task_projects_of(old.id), app_private.task_departments_of(old.id), new.assignee_id) then
        raise exception 'You can only assign work to members of a project you lead or a department you manage.';
      end if;
      new.status := 'Not Started';
      -- Direct assignment by an executive/admin to a head is what lets that head divide the task.
      new.division_owner_id := case
        when old.parent_task_id is null and not v_internal
             and (app_private.is_admin() or app_private.is_executive())
             and exists (
               select 1 from public.member_positions mp join public.positions p on p.id = mp.position_id
               where mp.member_id = new.assignee_id and p.name in ('Project Head', 'Department Head'))
        then new.assignee_id else null end;
    end if;
    new.assigned_by := coalesce(v_me, old.assigned_by);
  elsif new.assigned_by is distinct from old.assigned_by then
    raise exception 'The task assigner changes only when its assignee changes.';
  end if;

  if new.status is distinct from old.status
     and (new.status = 'Completed' or old.status = 'Completed')
     and not v_internal and not app_private.can_complete_task(old.id) then
    raise exception 'Only the system admin, President, Vice President, the responsible head, or a linked project head can complete or reopen this task.';
  end if;

  return new;
end
$$;

create or replace function app_private.enforce_task_hierarchy()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.parent_task_id is not null then
    if not exists (select 1 from public.tasks p where p.id = new.parent_task_id and p.parent_task_id is null) then
      raise exception 'A subtask cannot be divided into further subtasks.';
    end if;
    if exists (select 1 from public.tasks c where c.parent_task_id = new.id) then
      raise exception 'A task that has subtasks cannot become a subtask.';
    end if;
  end if;
  return new;
end
$$;

drop trigger if exists enforce_task_hierarchy on public.tasks;
create trigger enforce_task_hierarchy
before insert or update of parent_task_id on public.tasks
for each row execute function app_private.enforce_task_hierarchy();

drop trigger if exists enforce_task_assignment_workflow on public.tasks;
create trigger enforce_task_assignment_workflow
before insert or update on public.tasks
for each row execute function app_private.enforce_task_assignment_workflow();

create or replace function app_private.task_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.parent_task_id is null then
    perform app_private.log_activity(new.id, 'Task created', jsonb_build_object('title', new.title));
  end if;
  return null;
end
$$;

create or replace function app_private.task_after_update()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_what text := case when new.parent_task_id is null then 'task' else 'subtask' end;
  v_kind_prefix text := case when new.parent_task_id is null then 'Task' else 'Subtask' end;
begin
  if new.assignee_id is distinct from old.assignee_id then
    perform app_private.log_activity(
      new.id,
      case when new.assignee_id is null then 'Unassigned'
           when old.assignee_id is null then 'Assigned' else 'Reassigned' end,
      jsonb_build_object('from', old.assignee_id, 'to', new.assignee_id));
    if new.assignee_id is not null then
      perform app_private.notify(array[new.assignee_id],
        case when old.assignee_id is null then v_kind_prefix || ' assigned' else v_kind_prefix || ' reassigned' end,
        'You were given a ' || v_what || ': ' || new.title, '', new.id);
    end if;
    if old.assignee_id is not null then
      perform app_private.notify(array[old.assignee_id], v_kind_prefix || ' reassigned',
        'A ' || v_what || ' was moved to someone else: ' || new.title, '', new.id);
    end if;
  end if;

  if new.status is distinct from old.status then
    perform app_private.log_activity(new.id,
      case when new.status = 'Completed' then 'Completed' else 'Status changed' end,
      jsonb_build_object('from', old.status, 'to', new.status));
    if new.assignee_id is not distinct from old.assignee_id then
      perform app_private.notify(
        app_private.task_people(new.id) ||
          case when new.status = 'Blocked' then app_private.task_heads(new.id) else '{}'::uuid[] end,
        case new.status when 'Completed' then v_kind_prefix || ' completed'
                        when 'Blocked' then v_kind_prefix || ' blocked'
                        else 'Status changed' end,
        initcap(v_what) || ' "' || new.title || '" is now ' || new.status, '', new.id);
    end if;
  end if;

  if new.due_at is distinct from old.due_at then
    perform app_private.log_activity(new.id, 'Deadline changed',
      jsonb_build_object('from', old.due_at, 'to', new.due_at));
    perform app_private.notify(app_private.task_people(new.id), 'Task updated',
      'The deadline of "' || new.title || '" changed', '', new.id);
  end if;
  if new.priority is distinct from old.priority then
    perform app_private.log_activity(new.id, 'Priority changed',
      jsonb_build_object('from', old.priority, 'to', new.priority));
    perform app_private.notify(app_private.task_people(new.id), 'Task updated',
      'The priority of "' || new.title || '" is now ' || new.priority, '', new.id);
  end if;
  if new.title is distinct from old.title or new.description is distinct from old.description then
    perform app_private.log_activity(new.id, 'Details edited',
      jsonb_build_object('title', new.title));
  end if;
  return null;
end
$$;

drop trigger if exists task_after_insert on public.tasks;
create trigger task_after_insert after insert on public.tasks
for each row execute function app_private.task_after_insert();
drop trigger if exists task_after_update on public.tasks;
create trigger task_after_update after update on public.tasks
for each row execute function app_private.task_after_update();

alter table public.tasks enable trigger enforce_task_assignment_workflow;

create or replace function app_private.comment_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_title text;
begin
  select title into v_title from public.tasks where id = new.task_id;
  perform app_private.log_activity(new.task_id, 'Comment', jsonb_build_object('text', left(new.body, 140)));
  perform app_private.notify(
    app_private.task_people(new.task_id) || coalesce(
      (select array_agg(distinct c.author_id) from public.task_comments c where c.task_id = new.task_id), '{}'),
    'New comment', 'New comment on "' || v_title || '"', left(new.body, 140), new.task_id);
  return null;
end
$$;
drop trigger if exists comment_after_insert on public.task_comments;
create trigger comment_after_insert after insert on public.task_comments
for each row execute function app_private.comment_after_insert();

-- Dependencies may only link sibling subtasks and may not loop.
create or replace function app_private.enforce_dependency_rules()
returns trigger language plpgsql set search_path = '' as $$
declare
  a public.tasks;
  b public.tasks;
begin
  select * into a from public.tasks where id = new.task_id;
  select * into b from public.tasks where id = new.depends_on_task_id;
  if a.parent_task_id is null or b.parent_task_id is null or a.parent_task_id <> b.parent_task_id then
    raise exception 'Dependencies connect subtasks of the same main task only.';
  end if;
  if exists (
    with recursive walk(id) as (
      select new.depends_on_task_id
      union
      select d.depends_on_task_id from public.task_dependencies d join walk w on d.task_id = w.id
    ) select 1 from walk where id = new.task_id
  ) then
    raise exception 'That dependency would create a loop.';
  end if;
  return new;
end
$$;
drop trigger if exists enforce_dependency_rules on public.task_dependencies;
create trigger enforce_dependency_rules before insert on public.task_dependencies
for each row execute function app_private.enforce_dependency_rules();

-- ---------------------------------------------------------------------------------------------
-- 7. Row-level security
-- ---------------------------------------------------------------------------------------------
drop policy if exists tasks_scoped_insert on public.tasks;
create policy tasks_scoped_insert on public.tasks for insert to authenticated
  with check (assigned_by = app_private.current_member_id()
    and parent_task_id is null
    and app_private.can_create_task(task_type, project_id, department_id, assignee_id));

drop policy if exists tasks_admin_delete on public.tasks;
create policy tasks_admin_delete on public.tasks for delete to authenticated
  using (app_private.is_admin() or app_private.is_executive() or (
    parent_task_id is not null and (
      created_by = app_private.current_member_id()
      or app_private.responsible_member(id) = app_private.current_member_id())));

drop policy if exists task_dependencies_read on public.task_dependencies;
create policy task_dependencies_read on public.task_dependencies for select to authenticated
  using (app_private.can_view_task(task_id));

drop policy if exists task_requests_read on public.task_requests;
create policy task_requests_read on public.task_requests for select to authenticated
  using (requested_by = app_private.current_member_id()
    or app_private.is_admin() or app_private.is_executive()
    or app_private.responsible_member(task_id) = app_private.current_member_id());

drop policy if exists task_comments_read on public.task_comments;
create policy task_comments_read on public.task_comments for select to authenticated
  using (app_private.can_view_task(task_id));
drop policy if exists task_comments_insert on public.task_comments;
create policy task_comments_insert on public.task_comments for insert to authenticated
  with check (author_id = app_private.current_member_id() and app_private.can_view_task(task_id));

drop policy if exists task_activity_read on public.task_activity;
create policy task_activity_read on public.task_activity for select to authenticated
  using (app_private.can_view_task(task_id));

drop policy if exists notifications_own_read on public.notifications;
create policy notifications_own_read on public.notifications for select to authenticated
  using (member_id = app_private.current_member_id());
drop policy if exists notifications_own_update on public.notifications;
create policy notifications_own_update on public.notifications for update to authenticated
  using (member_id = app_private.current_member_id())
  with check (member_id = app_private.current_member_id());

revoke all on public.task_dependencies, public.task_requests, public.task_comments,
  public.task_activity, public.notifications from anon, authenticated;
grant select on public.task_dependencies, public.task_requests, public.task_activity to authenticated;
grant select, insert on public.task_comments to authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- ---------------------------------------------------------------------------------------------
-- 8. Operations exposed to the app (all checks run inside the database)
-- ---------------------------------------------------------------------------------------------
create or replace function public.create_subtask(
  p_parent uuid, p_title text, p_description text, p_assignee uuid, p_due timestamptz,
  p_priority text, p_project_ids uuid[], p_department_ids uuid[]
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := app_private.current_member_id();
  v_parent public.tasks;
  v_projects uuid[] := coalesce(p_project_ids, '{}');
  v_departments uuid[] := coalesce(p_department_ids, '{}');
  v_id uuid;
  v_type text;
  v_project uuid;
  v_dept uuid;
begin
  if v_me is null then raise exception 'Sign in first.'; end if;
  select * into v_parent from public.tasks where id = p_parent for update;
  if not found or not app_private.can_divide_task(p_parent) then
    raise exception 'You cannot divide this task. Only its creator, a head it was assigned to directly by the President, Vice President or System Admin, or an executive/admin can.';
  end if;
  if length(trim(coalesce(p_title, ''))) = 0 then raise exception 'A subtask needs a title.'; end if;
  if coalesce(p_priority, 'Medium') not in ('Urgent', 'High', 'Medium', 'Low') then
    raise exception 'Priority must be Urgent, High, Medium or Low.';
  end if;
  if p_assignee is null then raise exception 'Choose who the subtask is assigned to.'; end if;

  -- Subtasks stay inside the parent's projects. Only when the parent has none can a lead add their own.
  foreach v_project in array v_projects loop
    if not (v_project = any (app_private.task_projects_of(p_parent))) and not (
         cardinality(app_private.task_projects_of(p_parent)) = 0
         and (app_private.is_admin() or app_private.is_executive() or app_private.leads_project(v_project))) then
      raise exception 'A subtask can only belong to projects of its main task.';
    end if;
  end loop;
  if cardinality(v_departments) > 0 and (select count(*) from public.departments d where d.id = any (v_departments)) <> cardinality(v_departments) then
    raise exception 'Unknown department.';
  end if;
  if cardinality(v_projects) = 0 and cardinality(v_departments) = 0 and not (app_private.is_admin() or app_private.is_executive()) then
    raise exception 'Choose at least one project or department for the subtask.';
  end if;

  if not app_private.member_in_scope(v_projects, v_departments, p_assignee) then
    raise exception 'Choose an active member of at least one selected project or department.';
  end if;
  if not app_private.assigner_covers_member(v_projects, v_departments, p_assignee) then
    raise exception 'You can only assign work to members of a project you lead or a department you manage.';
  end if;

  v_type := case when cardinality(v_projects) > 0 then 'Project task'
                 when cardinality(v_departments) > 0 then 'Department task' else 'Club-wide' end;
  v_project := case when v_type = 'Project task' then v_projects[1] end;
  v_dept := case when v_type = 'Department task' then v_departments[1] end;

  perform set_config('app.internal', 'on', true);
  insert into public.tasks(title, description, task_type, project_id, department_id, assignee_id, assigned_by,
                           status, priority, due_at, parent_task_id, created_by)
  values (trim(p_title), coalesce(p_description, ''), v_type, v_project, v_dept, p_assignee, v_me,
          'Not Started', coalesce(p_priority, 'Medium'), p_due, p_parent, v_me)
  returning id into v_id;
  insert into public.task_projects(task_id, project_id) select v_id, unnest(v_projects);
  insert into public.task_departments(task_id, department_id) select v_id, unnest(v_departments);
  perform set_config('app.internal', 'off', true);

  perform app_private.log_activity(p_parent, 'Task divided',
    jsonb_build_object('subtask_id', v_id, 'title', trim(p_title), 'assignee', p_assignee));
  perform app_private.log_activity(v_id, 'Subtask created',
    jsonb_build_object('title', trim(p_title), 'parent', p_parent, 'assignee', p_assignee));
  perform app_private.notify(array[p_assignee], 'Subtask assigned',
    'You were given a subtask: ' || trim(p_title), 'Part of "' || v_parent.title || '"', v_id);
  perform app_private.notify(array[v_parent.assignee_id], 'Subtask assigned',
    'A subtask was added to "' || v_parent.title || '"', trim(p_title), v_id);
  return v_id;
end
$$;

create or replace function public.update_task_details(
  p_task uuid, p_title text, p_description text, p_due timestamptz, p_clear_due boolean, p_priority text
) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not app_private.can_edit_task_details(p_task) then
    raise exception 'You cannot edit this task directly. Department heads can send an edit request instead.';
  end if;
  if p_priority is not null and p_priority not in ('Urgent', 'High', 'Medium', 'Low') then
    raise exception 'Priority must be Urgent, High, Medium or Low.';
  end if;
  update public.tasks set
    title = coalesce(nullif(trim(p_title), ''), title),
    description = coalesce(p_description, description),
    due_at = case when p_clear_due then null else coalesce(p_due, due_at) end,
    priority = coalesce(p_priority, priority)
  where id = p_task;
end
$$;

create or replace function public.set_subtask_dependencies(p_task uuid, p_depends_on uuid[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.tasks where id = p_task and parent_task_id is not null) then
    raise exception 'Only subtasks can depend on other subtasks.';
  end if;
  if not app_private.can_edit_task_details(p_task) then
    raise exception 'Only the person who created this subtask, the responsible head or an executive can change its dependencies.';
  end if;
  delete from public.task_dependencies where task_id = p_task;
  insert into public.task_dependencies(task_id, depends_on_task_id)
  select p_task, d from unnest(coalesce(p_depends_on, '{}')) d;
  perform app_private.log_activity(p_task, 'Dependencies changed',
    jsonb_build_object('depends_on', coalesce(p_depends_on, '{}')));
end
$$;

create or replace function public.submit_task_request(
  p_task uuid, p_type text, p_changes jsonb, p_reason text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := app_private.current_member_id();
  v_task public.tasks;
  v_id uuid;
  v_key text;
  v_target uuid;
  v_responsible uuid;
begin
  if v_me is null then raise exception 'Sign in first.'; end if;
  select * into v_task from public.tasks where id = p_task;
  if not found or v_task.parent_task_id is null then
    raise exception 'Requests are made on subtasks.';
  end if;
  if v_task.status = 'Completed' then raise exception 'This subtask is already completed.'; end if;
  if p_type not in ('Edit', 'Reassign') then raise exception 'Request type must be Edit or Reassign.'; end if;
  if app_private.can_edit_task_details(p_task) then
    raise exception 'You can change this subtask directly; no request is needed.';
  end if;
  if v_task.assignee_id is null or not exists (
    select 1 from public.member_departments md
    where md.member_id = v_task.assignee_id and app_private.manages_department(md.department_id)
  ) then
    raise exception 'You can only send requests about subtasks assigned to members of a department you head.';
  end if;

  if p_type = 'Edit' then
    if p_changes is null or p_changes = '{}'::jsonb then raise exception 'Say what you want changed.'; end if;
    for v_key in select jsonb_object_keys(p_changes) loop
      if v_key not in ('title', 'description', 'due_at', 'priority') then
        raise exception 'Requests can change the title, description, deadline or priority.';
      end if;
    end loop;
    if p_changes ? 'priority' and (p_changes ->> 'priority') not in ('Urgent', 'High', 'Medium', 'Low') then
      raise exception 'Priority must be Urgent, High, Medium or Low.';
    end if;
  else
    v_target := nullif(p_changes ->> 'assignee_id', '')::uuid;
    if v_target is null then raise exception 'Choose the member to reassign the subtask to.'; end if;
    if v_target = v_task.assignee_id then raise exception 'That member already has this subtask.'; end if;
    if not exists (
      select 1 from public.members m join public.member_departments md on md.member_id = m.id
      where m.id = v_target and m.status = 'Active' and app_private.manages_department(md.department_id)
    ) then
      raise exception 'Choose an active member of a department you head.';
    end if;
    p_changes := jsonb_build_object('assignee_id', v_target);
  end if;

  begin
    insert into public.task_requests(task_id, request_type, requested_by, changes, reason)
    values (p_task, p_type, v_me, p_changes, coalesce(trim(p_reason), ''))
    returning id into v_id;
  exception when unique_violation then
    raise exception 'You already have a pending % request on this subtask.', lower(p_type);
  end;

  perform app_private.log_activity(p_task,
    case p_type when 'Edit' then 'Edit requested' else 'Reassignment requested' end,
    jsonb_build_object('request_id', v_id, 'changes', p_changes, 'reason', coalesce(trim(p_reason), '')));
  v_responsible := app_private.responsible_member(p_task);
  perform app_private.notify(
    case when v_responsible is null then app_private.leadership_ids() else array[v_responsible] end,
    case p_type when 'Edit' then 'Edit request' else 'Reassignment request' end,
    'A department head asked to ' || case p_type when 'Edit' then 'edit' else 'reassign' end || ' "' || v_task.title || '"',
    coalesce(trim(p_reason), ''), p_task);
  return v_id;
end
$$;

-- First decision wins: the request row is locked, so a second reviewer who clicked at the same
-- moment waits, then sees it is no longer Pending and is refused without changing anything.
create or replace function public.review_task_request(p_request uuid, p_decision text, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := app_private.current_member_id();
  r public.task_requests;
  v_task public.tasks;
  v_name text;
begin
  if v_me is null then raise exception 'Sign in first.'; end if;
  if p_decision not in ('Approve', 'Reject') then raise exception 'Decision must be Approve or Reject.'; end if;
  select * into r from public.task_requests where id = p_request for update;
  if not found then raise exception 'Request not found.'; end if;
  if r.status <> 'Pending' then
    select name into v_name from public.members where id = coalesce(r.reviewed_by, r.requested_by);
    raise exception 'This request was already % %. Nothing was changed.', lower(r.status),
      case when r.status = 'Cancelled' then 'by its sender'
           else 'by ' || coalesce(v_name, 'someone') || ' at ' || to_char(r.reviewed_at at time zone 'UTC', 'DD Mon YYYY HH24:MI') || ' UTC' end;
  end if;
  select * into v_task from public.tasks where id = r.task_id;
  if not (app_private.is_admin() or app_private.is_executive()
          or app_private.responsible_member(r.task_id) = v_me) then
    raise exception 'Only the head responsible for the main task, or an executive or admin, can decide this request.';
  end if;

  if p_decision = 'Approve' then
    if v_task.status = 'Completed' then
      raise exception 'The subtask was completed meanwhile, so this request can no longer be applied.';
    end if;
    perform set_config('app.internal', 'on', true);
    if r.request_type = 'Edit' then
      update public.tasks set
        title = coalesce(nullif(trim(r.changes ->> 'title'), ''), title),
        description = case when r.changes ? 'description' then r.changes ->> 'description' else description end,
        due_at = case when r.changes ? 'due_at' then nullif(r.changes ->> 'due_at', '')::timestamptz else due_at end,
        priority = coalesce(r.changes ->> 'priority', priority)
      where id = r.task_id;
    else
      if not exists (select 1 from public.members m where m.id = (r.changes ->> 'assignee_id')::uuid and m.status = 'Active') then
        perform set_config('app.internal', 'off', true);
        raise exception 'The member this request names is no longer active.';
      end if;
      update public.tasks set assignee_id = (r.changes ->> 'assignee_id')::uuid where id = r.task_id;
    end if;
    perform set_config('app.internal', 'off', true);
  end if;

  update public.task_requests set
    status = case p_decision when 'Approve' then 'Approved' else 'Rejected' end,
    reviewed_by = v_me, reviewed_at = now(), review_note = coalesce(trim(p_note), '')
  where id = r.id;

  perform app_private.log_activity(r.task_id,
    case p_decision when 'Approve' then 'Request approved' else 'Request rejected' end,
    jsonb_build_object('request_id', r.id, 'type', r.request_type, 'note', coalesce(trim(p_note), '')));
  perform app_private.notify(array[r.requested_by],
    case p_decision when 'Approve' then 'Request approved' else 'Request rejected' end,
    'Your ' || lower(r.request_type) || ' request on "' || v_task.title || '" was ' ||
      case p_decision when 'Approve' then 'approved' else 'rejected' end,
    coalesce(trim(p_note), ''), r.task_id);
end
$$;

create or replace function public.cancel_task_request(p_request uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  r public.task_requests;
begin
  select * into r from public.task_requests where id = p_request for update;
  if not found or r.requested_by is distinct from app_private.current_member_id() then
    raise exception 'Only the person who sent a request can cancel it.';
  end if;
  if r.status <> 'Pending' then
    raise exception 'This request was already %. Nothing was changed.', lower(r.status);
  end if;
  update public.task_requests set status = 'Cancelled', reviewed_at = now() where id = r.id;
  perform app_private.log_activity(r.task_id, 'Request cancelled', jsonb_build_object('request_id', r.id));
end
$$;

-- Counts for progress bars. Computed in the database so a head who can see only some subtasks
-- still gets the true totals for a main task they can see.
create or replace function public.get_task_progress(p_task_ids uuid[])
returns table(task_id uuid, total integer, completed integer, blocked integer)
language sql stable security definer set search_path = '' as $$
  select t.id, count(c.id)::int,
         count(c.id) filter (where c.status = 'Completed')::int,
         count(c.id) filter (where c.status = 'Blocked')::int
  from public.tasks t
  left join public.tasks c on c.parent_task_id = t.id
  where t.id = any (p_task_ids) and app_private.can_view_task(t.id)
  group by t.id
$$;

-- Deadline reminders: one per task and deadline, for the assignee (and the responsible head when overdue).
create or replace function public.generate_deadline_notifications()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  n integer := 0;
  r integer;
  t record;
begin
  for t in
    select * from public.tasks
    where assignee_id is not null and status not in ('Completed', 'Unassigned') and due_at is not null
      and due_at < now() + interval '24 hours'
  loop
    if t.due_at > now() then
      insert into public.notifications(member_id, kind, title, body, task_id, dedupe_key)
      values (t.assignee_id, 'Deadline approaching', '"' || t.title || '" is due within 24 hours', '', t.id,
              'approach:' || t.id || ':' || t.due_at)
      on conflict (dedupe_key) do nothing;
    else
      insert into public.notifications(member_id, kind, title, body, task_id, dedupe_key)
      select m, 'Task overdue', '"' || t.title || '" is overdue', '', t.id, 'overdue:' || t.id || ':' || t.due_at || ':' || m
      from unnest(array[t.assignee_id, app_private.responsible_member(t.id)]) m
      where m is not null
      on conflict (dedupe_key) do nothing;
    end if;
    get diagnostics r = row_count;
    n := n + r;
  end loop;
  return n;
end
$$;

revoke all on function
  public.create_subtask(uuid, text, text, uuid, timestamptz, text, uuid[], uuid[]),
  public.update_task_details(uuid, text, text, timestamptz, boolean, text),
  public.set_subtask_dependencies(uuid, uuid[]),
  public.submit_task_request(uuid, text, jsonb, text),
  public.review_task_request(uuid, text, text),
  public.cancel_task_request(uuid),
  public.get_task_progress(uuid[]),
  public.generate_deadline_notifications()
from public, anon, authenticated;
grant execute on function
  public.create_subtask(uuid, text, text, uuid, timestamptz, text, uuid[], uuid[]),
  public.update_task_details(uuid, text, text, timestamptz, boolean, text),
  public.set_subtask_dependencies(uuid, uuid[]),
  public.submit_task_request(uuid, text, jsonb, text),
  public.review_task_request(uuid, text, text),
  public.cancel_task_request(uuid),
  public.get_task_progress(uuid[])
to authenticated;
grant execute on function public.generate_deadline_notifications() to service_role;

grant execute on all functions in schema app_private to authenticated;

create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'task-deadline-notifications';
select cron.schedule('task-deadline-notifications', '7 * * * *', 'select public.generate_deadline_notifications()');
