-- The ensure_rls event trigger calls this function after every CREATE TABLE in public to
-- turn on Row Level Security. Keep it, but stop the public API roles calling it directly.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
