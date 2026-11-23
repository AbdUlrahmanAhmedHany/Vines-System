# Vines shared app setup

The Flask webpage at `../app/templates/index.html` uses Supabase Auth for password sign-in and reads/writes records through the database API. The database's row-level security controls those writes. The server handles admin-only invitation and invited-account activation using a protected secret key.

## Chosen stack

- **Supabase Auth** uses email and password. Sign-in, password reset, invite password setup, and the no-public-sign-up screen are implemented in the app.
- Supabase Database stores members, departments, projects, assignments, tasks, and updates. Browser writes use the signed-in member session and database RLS. The app does not store shared changes in local storage.
- The website runs locally through Flask, with TypeScript source compiled to browser JavaScript. The Cloudflare Python Worker adapter in `../worker.py` and `../wrangler.jsonc` serves the same app and invitation routes.

## Email delivery requirement

Invitations, email confirmation, and password reset all need email delivery. Supabase's default SMTP service is for development only: it sends only to addresses on the Supabase organization team and currently limits delivery to 2 emails per hour. For club members, configure custom SMTP in Supabase Auth. Your email provider may have free-tier limits or require a verified sender/domain; check before inviting the club.

## Supabase setup

1. In Authentication > Sign In / Providers > Email, enable email and password sign-in, keep email confirmation on, and turn **Allow new users to sign up** off. The app does not expose `signUp`.
2. After the Worker deploys, set its `workers.dev` address as the Site URL. Add the same origin with `/?flow=invite` and `/?flow=recovery` as allowed Redirect URLs. The app uses these paths for invitation password setup and password reset.
3. Configure custom SMTP before sending invitations or reset messages to club members. Supabase's default sender is for development and will not deliver to ordinary club addresses.
4. Run the current `schema.sql` in SQL Editor, then run `matrix-roles-update.sql`. The schema can be rerun safely: it replaces its named RLS policies before recreating them. Do not run the older `executive-roles-update.sql` after this migration.
5. Add the initial system-admin Auth user from Authentication > Users, then add that email to `members` with `status = 'Active'` and `is_club_admin = true`. This system permission is not a club position.

The global system admin is a permission on a member profile, not a club position; only the admin can create profiles or grant/revoke that permission. The position picker starts with Member, Department Head, Project Head, Vice President, or President. A head position is scoped to one department or one project. Members can be assigned to any number of departments and projects, or neither. President and Vice President positions can carry one additional position. Their access is global for club work, while only the admin and heads in scope can alter department/project assignments. Department membership is stored in `member_departments`; project membership is stored in `project_assignments` (the MemberProjects relation).

## Before deployment

- Apply `schema.sql` and `matrix-roles-update.sql` to the connected Supabase project before using the new write paths. Confirm the migrations complete successfully.
- Verify account activation, position combinations, and department/project access against the live database before members use the app.
- Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` as Cloudflare Worker variables. Add `SUPABASE_SECRET_KEY` as a protected Worker secret; it powers the server-side invitation and activation routes and must never be a public variable.
- Connect the GitHub repository to Cloudflare Workers Builds. Use `npm run build` as the build command and `uv run pywrangler deploy` as the deploy command. The Worker name in Cloudflare must match `vines-system` in `wrangler.jsonc`.
- Set the final `workers.dev` address as Supabase's Site URL and allow the exact invite and recovery URLs used by the app.
- The app supports individual profiles and CSV import (Excel files can be saved as CSV first), with duplicate email and assignment validation. Profile creation saves to Supabase and sends invitation emails; bulk invites depend on the configured SMTP provider's sending limits.
- Verify project members can see only their assigned project work, department heads are scoped to their department, and President/Vice President have global work access without assignment write access.

## Schema files

- `schema.sql`: full initial schema for a new project.
- `matrix-roles-update.sql`: required matrix/position migration after `schema.sql`; safe to rerun for its additive steps.
- `executive-roles-update.sql`: older migration retained for reference; do not run after the matrix migration.
- `.env.example`: public Supabase browser config plus a clearly marked server-only placeholder.
