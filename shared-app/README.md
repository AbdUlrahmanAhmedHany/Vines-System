# Vines shared app setup

The current Flask webpage at `../app/templates/index.html` is a local preview using browser storage. It is not yet connected to Supabase Auth or shared database reads/writes.

## Chosen stack

- **Supabase Auth** will use email and password; Supabase Database stores members, departments, projects, assignments, tasks, and updates.
- There will be no public sign-up page. The app will use `signInWithPassword`; the admin-only server function will invite pre-created roster members through Supabase Auth. The invitation email lets each member verify their email and set a password. A password reset email handles forgotten passwords. These app flows are not implemented yet.
- The website runs locally through Flask, with TypeScript source compiled to browser JavaScript. A Cloudflare Python Worker adapter is now included in `../worker.py` and `../wrangler.jsonc`; the Worker still serves only the local-storage preview until Supabase integration is implemented.

## Email delivery requirement

Invitations, email confirmation, and password reset all need email delivery. Supabase's default SMTP service is for development only: it sends only to addresses on the Supabase organization team and currently limits delivery to 2 emails per hour. For club members, configure custom SMTP in Supabase Auth. Your email provider may have free-tier limits or require a verified sender/domain; check before inviting the club.

## Supabase setup

1. In Authentication > Sign In / Providers > Email, enable email and password sign-in, keep email confirmation on, and turn **Allow new users to sign up** off. The website will not expose `signUp`; the trusted server will use Supabase's Admin API to invite only rostered emails.
2. In Authentication > URL Configuration, set the production Site URL to the Cloudflare `pages.dev` URL after the first deploy. Add the local test URL and the production invite, password reset, and auth callback paths to Redirect URLs. Use the exact paths the app implements; an unapproved redirect can send invite emails to the wrong page.
3. In Authentication > Email Templates, customize **Invite user** and **Reset password** so the user understands that the invite is for setting their password. The site needs an invite acceptance page that handles the returned auth session and calls `updateUser({ password })`.
4. Configure custom SMTP before emailing club members. The default Supabase sender will not deliver to ordinary club addresses.
5. Run the current `schema.sql` in SQL Editor, then run `matrix-roles-update.sql`. The schema can be rerun safely: it replaces its named RLS policies before recreating them. Do not run the older `executive-roles-update.sql` after this migration.
6. Create the initial system-admin Auth user from Authentication > Users (send an invitation), then add that email to `members` with `status = 'Active'` and `is_club_admin = true`. This system permission is not a club position.

The global system admin is a permission on a member profile, not a club position; only the admin can create profiles or grant/revoke that permission. The position picker starts with Member, Department Head, Project Head, Vice President, or President. A head position is scoped to one department or one project. Members can be assigned to any number of departments and projects, or neither. President and Vice President positions can carry one additional position. Their access is global for club work, while only the admin and heads in scope can alter department/project assignments. Department membership is stored in `member_departments`; project membership is stored in `project_assignments` (the MemberProjects relation).

## Before deployment

- Add the email/password sign-in, invite acceptance/password setup, password reset, and shared data loading/saving. The current webpage still stores preview data in this browser only.
- Add Flask routes that verify the signed-in admin session, create the roster profile, and call Supabase Auth's `inviteUserByEmail`. Keep Supabase's secret key server-side; never put it in browser code or commit it.
- Add the Supabase project URL and publishable key as public app configuration; add the Supabase secret key only as a protected environment variable on the selected host.
- Connect the GitHub repository to Cloudflare Workers Builds. Use `npm run build` as the build command and `uv run pywrangler deploy` as the deploy command. The Worker name in Cloudflare must match `vines-system` in `wrangler.jsonc`.
- After the app implements its real auth routes, set the final `workers.dev` address as Supabase's Site URL and allow only the exact invite/reset/callback URLs it uses.
- The webpage preview supports individual profiles and CSV import (Excel files can be saved as CSV first), with duplicate email and assignment validation. Connect those actions to the secured invitation and database flow before opening the site to members.
- Verify project members can see only their assigned project work, department heads are scoped to their department, and President/Vice President have global work access without assignment write access.

## Schema files

- `schema.sql`: full initial schema for a new project.
- `matrix-roles-update.sql`: required matrix/position migration after `schema.sql`; safe to rerun for its additive steps.
- `executive-roles-update.sql`: older migration retained for reference; do not run after the matrix migration.
- `.env.example`: public Supabase browser config plus a clearly marked server-only placeholder.
