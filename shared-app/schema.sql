-- Vines Club Hub shared database. Run once in the Supabase SQL editor.
-- Supabase Auth signs in members by email; RLS matches the JWT email claim to members.email.
create extension if not exists pgcrypto;

create schema if not exists app_private;
revoke all on schema app_private from public;

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  head_member_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  club_role text not null default 'Member' check (club_role in ('Member','Department head','Project lead','Head','President','Vice President')),
  department_id uuid references public.departments(id) on delete restrict,
  is_club_admin boolean not null default false,
  status text not null default 'Pending invitation' check (status in ('Pending invitation','Active','On break','Alumni')),
  created_at timestamptz not null default now()
);

-- Email sign-in is matched case-insensitively to this roster.
create unique index if not exists members_email_lower_idx on public.members (lower(email));

create table if not exists public.member_departments (
  member_id uuid not null references public.members(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  assigned_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (member_id, department_id)
);

alter table public.departments drop constraint if exists departments_head_member_id_fkey;
alter table public.departments add constraint departments_head_member_id_fkey
  foreign key (head_member_id) references public.members(id) on delete set null;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  project_lead_id uuid references public.members(id) on delete set null,
  status text not null default 'Planning' check (status in ('Planning','Active','On hold','Wrapped')),
  created_at timestamptz not null default now()
);

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name in ('Member','Department Head','Project Head','Vice President','President')),
  scope_type text not null check (scope_type in ('None','Department','Project'))
);

create table if not exists public.member_positions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete restrict,
  department_id uuid references public.departments(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  assigned_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint member_position_scope check (
    (department_id is not null and project_id is null) or
    (department_id is null and project_id is not null) or
    (department_id is null and project_id is null)
  ),
  unique (member_id, position_id, department_id, project_id)
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_by uuid not null references public.members(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.project_assignments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  allocated_by uuid not null references public.members(id) on delete restrict,
  status text not null default 'Active' check (status in ('Active','Paused','Ended')),
  role_on_project text not null default 'Core' check (role_on_project in ('Project Head','Core','Support','Guest')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (member_id, project_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  task_type text not null default 'Project task' check (task_type in ('Project task','Department task','Club-wide')),
  project_id uuid references public.projects(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  assignee_id uuid not null references public.members(id) on delete restrict,
  assigned_by uuid not null references public.members(id) on delete restrict,
  status text not null default 'To do' check (status in ('Backlog','To do','In progress','In review','Done')),
  priority text not null default 'Medium' check (priority in ('Urgent','High','Medium','Low')),
  due_at timestamptz,
  progress_update text not null default '',
  created_at timestamptz not null default now(),
  constraint task_type_scope check (
    (task_type = 'Project task' and project_id is not null) or
    (task_type = 'Department task' and department_id is not null) or
    task_type = 'Club-wide'
  )
);

create table if not exists public.task_updates (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references public.members(id) on delete restrict,
  note text not null check (length(trim(note)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists project_assignments_member_idx on public.project_assignments(member_id, status);
create index if not exists project_assignments_project_idx on public.project_assignments(project_id, status);
create index if not exists tasks_assignee_due_idx on public.tasks(assignee_id, due_at);
create index if not exists tasks_project_due_idx on public.tasks(project_id, due_at);
create index if not exists tasks_department_due_idx on public.tasks(department_id, due_at);

-- Helpers run as the table owner so row-level checks can safely inspect related rows.
create or replace function app_private.current_member_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select m.id from public.members m
  where lower(m.email) = lower(coalesce(auth.jwt() ->> 'email','')) and m.status = 'Active'
  limit 1
$$;

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
      join public.projects p on p.id = mine.project_id
      join public.project_assignments theirs on theirs.project_id = p.id
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

grant usage on schema app_private to authenticated;
grant execute on all functions in schema app_private to authenticated;
grant usage on schema public to authenticated;

alter table public.departments enable row level security;
alter table public.members enable row level security;
alter table public.invitations enable row level security;
alter table public.projects enable row level security;
alter table public.project_assignments enable row level security;
alter table public.tasks enable row level security;
alter table public.task_updates enable row level security;

drop policy if exists departments_read on public.departments;
create policy departments_read on public.departments for select to authenticated
  using (
    app_private.is_admin() or app_private.is_executive() or
    head_member_id = app_private.current_member_id() or
    exists (select 1 from public.members self_member
      where self_member.id = app_private.current_member_id()
        and self_member.department_id = departments.id)
  );
drop policy if exists departments_admin_write on public.departments;
create policy departments_admin_write on public.departments for all to authenticated
  using (app_private.is_admin() or app_private.is_executive())
  with check (app_private.is_admin() or app_private.is_executive());

drop policy if exists members_scoped_read on public.members;
create policy members_scoped_read on public.members for select to authenticated
  using (app_private.can_view_member(id));
drop policy if exists members_admin_write on public.members;
create policy members_admin_write on public.members for all to authenticated
  using (app_private.is_admin()) with check (app_private.is_admin());
drop policy if exists invitations_admin_only on public.invitations;
create policy invitations_admin_only on public.invitations for all to authenticated
  using (app_private.is_admin()) with check (app_private.is_admin());
drop policy if exists members_manager_update on public.members;
create policy members_manager_update on public.members for update to authenticated
  using (app_private.is_executive() or app_private.manages_department(department_id))
  with check (app_private.is_executive() or app_private.manages_department(department_id));

drop policy if exists projects_read on public.projects;
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
drop policy if exists projects_admin_write on public.projects;
create policy projects_admin_write on public.projects for all to authenticated
  using (app_private.is_admin() or app_private.is_executive())
  with check (app_private.is_admin() or app_private.is_executive());
drop policy if exists projects_lead_update on public.projects;
create policy projects_lead_update on public.projects for update to authenticated
  using (app_private.leads_project(id)) with check (app_private.leads_project(id));

drop policy if exists assignments_scoped_read on public.project_assignments;
create policy assignments_scoped_read on public.project_assignments for select to authenticated
  using (app_private.can_view_assignment(id));
drop policy if exists assignments_department_head_insert on public.project_assignments;
create policy assignments_department_head_insert on public.project_assignments for insert to authenticated
  with check (app_private.is_admin() or (
    allocated_by = app_private.current_member_id() and exists (
      select 1 from public.members m where m.id = member_id
        and app_private.manages_department(m.department_id)
    )
  ));
drop policy if exists assignments_admin_or_head_update on public.project_assignments;
create policy assignments_admin_or_head_update on public.project_assignments for update to authenticated
  using (app_private.is_admin() or exists (
    select 1 from public.members m where m.id = member_id and app_private.manages_department(m.department_id)
  ))
  with check (app_private.is_admin() or exists (
    select 1 from public.members m where m.id = member_id and app_private.manages_department(m.department_id)
  ));
drop policy if exists assignments_admin_or_head_delete on public.project_assignments;
create policy assignments_admin_or_head_delete on public.project_assignments for delete to authenticated
  using (app_private.is_admin() or exists (
    select 1 from public.members m where m.id = member_id and app_private.manages_department(m.department_id)
  ));

drop policy if exists tasks_scoped_read on public.tasks;
create policy tasks_scoped_read on public.tasks for select to authenticated
  using (app_private.can_view_task(id));
drop policy if exists tasks_scoped_insert on public.tasks;
create policy tasks_scoped_insert on public.tasks for insert to authenticated
  with check (assigned_by = app_private.current_member_id() and
    app_private.can_create_task(task_type, project_id, department_id, assignee_id));
drop policy if exists tasks_scoped_update on public.tasks;
create policy tasks_scoped_update on public.tasks for update to authenticated
  using (app_private.can_manage_task(id) or assignee_id = app_private.current_member_id())
  with check (app_private.can_manage_task(id) or assignee_id = app_private.current_member_id());
drop policy if exists tasks_admin_delete on public.tasks;
create policy tasks_admin_delete on public.tasks for delete to authenticated
  using (app_private.is_admin() or app_private.is_executive());

drop policy if exists task_updates_scoped_read on public.task_updates;
create policy task_updates_scoped_read on public.task_updates for select to authenticated
  using (app_private.can_view_task(task_id));
drop policy if exists task_updates_scoped_insert on public.task_updates;
create policy task_updates_scoped_insert on public.task_updates for insert to authenticated
  with check (author_id = app_private.current_member_id() and app_private.can_view_task(task_id));

-- Members may update task progress only. Leads/admins can manage task fields and deadlines.
revoke update on public.tasks from authenticated;
grant update (status, progress_update) on public.tasks to authenticated;

-- SQL grants make the Data API reachable; the policies above still decide each row/action.
revoke all on public.departments, public.members, public.projects,
  public.project_assignments, public.tasks, public.task_updates, public.invitations from anon;
grant select on public.departments, public.members, public.projects,
  public.project_assignments, public.tasks, public.task_updates to authenticated;
grant select, insert, update, delete on public.invitations to authenticated;
grant insert, update, delete on public.departments, public.members, public.projects to authenticated;
grant insert, update, delete on public.project_assignments to authenticated;
grant insert on public.tasks to authenticated;
grant insert on public.task_updates to authenticated;

-- Initial catalogue. These inserts are safe to re-run and create no member accounts.
insert into public.departments(name, description) values
 ('Marketing','Campaigns, promotion and audience growth.'),
 ('HR','Recruitment, onboarding and member care.'),
 ('PR','University, guest and partner relations.'),
 ('Editing','Editing guidance, feedback and quality.'),
 ('Designing','Visual identity, thumbnails and graphics.'),
 ('Videography','Camera, lighting, sound and filming.'),
 ('Educational','Workshop planning and learning.'),
 ('Actors','On-camera talent and performance.'),
 ('Researchers','Research, scripts and fact checking.'),
 ('OC','Event logistics and club operations.')
on conflict (name) do nothing;

insert into public.projects(name, description) values
 ('Podcasts','Conversations worth listening to.'),
 ('Workshops','Learn it, try it, teach it.'),
 ('Game Show','Big energy, friendly competition.'),
 ('Reels','Short stories with a quick spark.'),
 ('Sarcastic Shows','Satire and campus stories.')
on conflict (name) do nothing;
