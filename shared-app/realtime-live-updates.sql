-- Live updates: let Supabase Realtime announce changes to the tables the app shows, so open pages
-- refresh by themselves. Row-level security still applies: a person only receives changes to rows
-- they are allowed to read. Safe to run more than once.
do $$
declare t text;
begin
  foreach t in array array['members','departments','projects','member_departments','member_positions',
    'project_assignments','tasks','task_projects','task_departments','task_dependencies',
    'task_requests','task_comments','notifications']
  loop
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
