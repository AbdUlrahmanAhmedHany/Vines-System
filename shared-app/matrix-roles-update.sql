-- Matrix membership, position and scope rules.
-- Run after schema.sql (and instead of the older executive-roles-update.sql).

alter table public.members alter column department_id drop not null;
drop index if exists public.members_single_club_admin_idx;
alter table public.members drop constraint if exists members_status_check;
alter table public.members alter column status set default 'Pending invitation';
alter table public.members add constraint members_status_check
  check(status in ('Pending invitation','Active','On break','Alumni'));

create table if not exists public.member_departments (
  member_id uuid not null references public.members(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  assigned_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (member_id, department_id)
);

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name in ('Member','Department Head','Project Head','Vice President','President')),
  scope_type text not null check (scope_type in ('None','Department','Project'))
);
insert into public.positions(name,scope_type) values
  ('Member','None'),('Department Head','Department'),('Project Head','Project'),
  ('Vice President','None'),('President','None')
on conflict (name) do update set scope_type=excluded.scope_type;

create table if not exists public.member_positions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete restrict,
  department_id uuid references public.departments(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  assigned_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint member_position_scope check (
    not (department_id is not null and project_id is not null)
  )
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
create unique index if not exists member_positions_unique_scope_idx
  on public.member_positions(member_id, position_id, coalesce(department_id,'00000000-0000-0000-0000-000000000000'::uuid), coalesce(project_id,'00000000-0000-0000-0000-000000000000'::uuid));

-- Keep legacy single-department values while moving the canonical membership to joins.
insert into public.member_departments(member_id,department_id)
select id,department_id from public.members where department_id is not null
on conflict do nothing;

-- Migrate current role fields and department/project heads into independent positions.
insert into public.member_positions(member_id,position_id,department_id)
select m.id,p.id,
  case when m.club_role in ('Department head','Head') then m.department_id else null end
from public.members m cross join public.positions p
where (p.name='Member' and m.club_role='Member')
   or (p.name='Department Head' and m.club_role in ('Department head','Head') and m.department_id is not null)
   or (p.name='President' and m.club_role='President')
   or (p.name='Vice President' and m.club_role='Vice President')
on conflict do nothing;
insert into public.member_positions(member_id,position_id,department_id)
select d.head_member_id,p.id,d.id from public.departments d
join public.positions p on p.name='Department Head'
where d.head_member_id is not null on conflict do nothing;
insert into public.member_positions(member_id,position_id,project_id)
select pr.project_lead_id,p.id,pr.id from public.projects pr
join public.positions p on p.name='Project Head'
where pr.project_lead_id is not null on conflict do nothing;
insert into public.project_assignments(member_id,project_id,allocated_by,status,role_on_project)
select pr.project_lead_id,pr.id,pr.project_lead_id,'Active','Project Head'
from public.projects pr where pr.project_lead_id is not null
on conflict (member_id,project_id) do update set role_on_project='Project Head';

create or replace function app_private.validate_member_position_scope()
returns trigger language plpgsql set search_path = '' as $$
declare v_scope text;
begin
  select p.scope_type into v_scope from public.positions p where p.id=new.position_id;
  if v_scope='Department' and (new.department_id is null or new.project_id is not null) then
    raise exception 'Department Head must have exactly one department scope';
  elsif v_scope='Project' and (new.project_id is null or new.department_id is not null) then
    raise exception 'Project Head must have exactly one project scope';
  elsif v_scope='None' and (new.department_id is not null or new.project_id is not null) then
    raise exception 'This position does not take a department or project scope';
  end if;
  return new;
end
$$;
drop trigger if exists validate_member_position_scope on public.member_positions;
create trigger validate_member_position_scope before insert or update on public.member_positions
  for each row execute function app_private.validate_member_position_scope();

create or replace function app_private.is_executive()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.member_positions mp join public.positions p on p.id=mp.position_id
    where mp.member_id=app_private.current_member_id() and p.name in ('President','Vice President')
  )
$$;

create or replace function app_private.manages_department(p_department_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or exists (
    select 1 from public.member_positions mp join public.positions p on p.id=mp.position_id
    where mp.member_id=app_private.current_member_id() and p.name='Department Head'
      and mp.department_id=p_department_id
  )
$$;

create or replace function app_private.leads_project(p_project_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or exists (
    select 1 from public.member_positions mp join public.positions p on p.id=mp.position_id
    where mp.member_id=app_private.current_member_id() and p.name='Project Head'
      and mp.project_id=p_project_id
  )
$$;

create or replace function app_private.can_view_member(p_member_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive()
    or p_member_id=app_private.current_member_id()
    or exists (select 1 from public.member_departments md
      where md.member_id=p_member_id and app_private.manages_department(md.department_id))
    or exists (select 1 from public.project_assignments mine
      join public.project_assignments theirs on theirs.project_id=mine.project_id
      where mine.member_id=app_private.current_member_id() and mine.status='Active'
        and theirs.member_id=p_member_id and theirs.status='Active')
    or exists (select 1 from public.project_assignments a
      where a.member_id=p_member_id and a.status='Active' and app_private.leads_project(a.project_id))
$$;

create or replace function app_private.can_view_assignment(p_assignment_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive() or exists (
    select 1 from public.project_assignments a where a.id=p_assignment_id and (
      a.member_id=app_private.current_member_id() or a.allocated_by=app_private.current_member_id()
      or app_private.leads_project(a.project_id)
      or exists(select 1 from public.member_departments md
        where md.member_id=a.member_id and app_private.manages_department(md.department_id))
    )
  )
$$;

create or replace function app_private.can_view_task(p_task_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive() or exists (
    select 1 from public.tasks t where t.id=p_task_id and (
      t.assignee_id=app_private.current_member_id() or t.assigned_by=app_private.current_member_id()
      or (t.project_id is not null and app_private.leads_project(t.project_id))
      or (t.department_id is not null and app_private.manages_department(t.department_id))
      or exists(select 1 from public.project_assignments a where a.member_id=app_private.current_member_id()
        and a.project_id=t.project_id and a.status='Active')
      or exists(select 1 from public.member_departments md where md.member_id=t.assignee_id
        and app_private.manages_department(md.department_id))
    )
  )
$$;

create or replace function app_private.can_create_task(
  p_task_type text,p_project_id uuid,p_department_id uuid,p_assignee_id uuid
) returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_admin() or app_private.is_executive() or
    (p_task_type='Department task' and app_private.manages_department(p_department_id)
      and exists(select 1 from public.member_departments md where md.member_id=p_assignee_id
        and md.department_id=p_department_id)) or
    (p_task_type='Project task' and app_private.leads_project(p_project_id)
      and exists(select 1 from public.project_assignments a where a.member_id=p_assignee_id
        and a.project_id=p_project_id and a.status='Active'))
$$;

-- The admin alone creates and edits central member profiles. Leadership scopes
-- do not grant broad member-record or system-access editing.
drop policy if exists members_manager_update on public.members;
drop policy if exists members_admin_write on public.members;
create policy members_admin_write on public.members for all to authenticated
  using(app_private.is_admin()) with check(app_private.is_admin());

-- Assignment write policies are scoped to the relevant head or global admin.
alter table public.member_departments enable row level security;
alter table public.member_positions enable row level security;
alter table public.invitations enable row level security;
drop policy if exists member_departments_read on public.member_departments;
create policy member_departments_read on public.member_departments for select to authenticated
  using(app_private.can_view_member(member_id));
drop policy if exists member_departments_scoped_insert on public.member_departments;
create policy member_departments_scoped_insert on public.member_departments for insert to authenticated
  with check(app_private.is_admin() or app_private.manages_department(department_id));
drop policy if exists member_departments_scoped_delete on public.member_departments;
create policy member_departments_scoped_delete on public.member_departments for delete to authenticated
  using(app_private.is_admin() or app_private.manages_department(department_id));
drop policy if exists member_positions_read on public.member_positions;
create policy member_positions_read on public.member_positions for select to authenticated
  using(app_private.can_view_member(member_id) or app_private.is_admin());
drop policy if exists member_positions_admin_write on public.member_positions;
create policy member_positions_admin_write on public.member_positions for all to authenticated
  using(app_private.is_admin()) with check(app_private.is_admin());
drop policy if exists invitations_admin_only on public.invitations;
create policy invitations_admin_only on public.invitations for all to authenticated
  using(app_private.is_admin()) with check(app_private.is_admin());

drop policy if exists assignments_department_head_insert on public.project_assignments;
drop policy if exists assignments_admin_or_head_update on public.project_assignments;
drop policy if exists assignments_admin_or_head_delete on public.project_assignments;
drop policy if exists assignments_scoped_insert on public.project_assignments;
drop policy if exists assignments_scoped_update on public.project_assignments;
drop policy if exists assignments_scoped_delete on public.project_assignments;
create policy assignments_scoped_insert on public.project_assignments for insert to authenticated
  with check(app_private.is_admin() or (allocated_by=app_private.current_member_id() and (
    app_private.leads_project(project_id) or exists(
      select 1 from public.member_departments md where md.member_id=project_assignments.member_id
        and app_private.manages_department(md.department_id)
    )
  )));
create policy assignments_scoped_update on public.project_assignments for update to authenticated
  using(app_private.is_admin() or app_private.leads_project(project_id) or exists(
    select 1 from public.member_departments md where md.member_id=project_assignments.member_id
      and app_private.manages_department(md.department_id)
  )) with check(app_private.is_admin() or app_private.leads_project(project_id) or exists(
    select 1 from public.member_departments md where md.member_id=project_assignments.member_id
      and app_private.manages_department(md.department_id)
  ));
create policy assignments_scoped_delete on public.project_assignments for delete to authenticated
  using(app_private.is_admin() or app_private.leads_project(project_id) or exists(
    select 1 from public.member_departments md where md.member_id=project_assignments.member_id
      and app_private.manages_department(md.department_id)
  ));

-- Executives can view club work, but only heads in scope and the admin can
-- change assignments. Department/project and task structure remains admin-led.
drop policy if exists departments_admin_write on public.departments;
create policy departments_admin_write on public.departments for all to authenticated
  using(app_private.is_admin()) with check(app_private.is_admin());
drop policy if exists departments_read on public.departments;
create policy departments_read on public.departments for select to authenticated
  using(app_private.is_admin() or app_private.is_executive()
    or app_private.manages_department(id)
    or exists(select 1 from public.member_departments md
      where md.department_id=departments.id and md.member_id=app_private.current_member_id()));
drop policy if exists projects_admin_write on public.projects;
create policy projects_admin_write on public.projects for all to authenticated
  using(app_private.is_admin()) with check(app_private.is_admin());
drop policy if exists projects_lead_update on public.projects;
create policy projects_lead_update on public.projects for update to authenticated
  using(app_private.is_admin()) with check(app_private.is_admin());

grant select on public.member_departments,public.member_positions,public.positions to authenticated;
grant select,insert,update,delete on public.invitations to authenticated;
grant insert,delete on public.member_departments to authenticated;
grant insert,update,delete on public.member_positions to authenticated;
grant insert,update,delete on public.project_assignments to authenticated;
grant execute on all functions in schema app_private to authenticated;

-- The app reads the positions catalogue to save President / Vice President / Department Head /
-- Project Head assignments into member_positions (which the permission functions rely on).
-- Without a read policy, RLS hides every row and those assignments are never saved.
drop policy if exists positions_read on public.positions;
create policy positions_read on public.positions for select to authenticated using (true);
