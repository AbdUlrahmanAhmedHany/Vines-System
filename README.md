# Vines Club Hub

A presentable local project for the Vines university media club. It uses Flask to serve the workspace, TypeScript for browser interactions, and separate HTML and CSS files. The design and club-management preview are carried forward from the existing Vines page.

## Project layout

```text
app/
  __init__.py              Flask app factory and routes
  templates/
    index.html             Jinja template for the club workspace
  static/
    css/styles.css         Extracted responsive styles
    ts/app.ts              Browser behavior source
    js/app.js              Compiled TypeScript served by Flask
worker.py                  Cloudflare Python Worker entry point
wrangler.jsonc             Cloudflare Worker and static asset configuration
pyproject.toml              Python Worker dependencies
shared-app/                 Supabase schema, migrations, and planning notes
run.py                      Local Flask entry point
package.json                TypeScript build scripts and dependency
tsconfig.json               TypeScript compiler settings
```

## Run locally

You need Python 3.13+ and Node.js/npm.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e .
npm install
npm run build
python run.py
```

Open <http://127.0.0.1:5000>.

While editing TypeScript, `npm run watch` rebuilds `app/static/js/app.js` as files change. Flask serves the compiled file; the browser does not run `.ts` directly.

## Cloudflare Workers preview

The repository includes a Cloudflare Python Worker adapter for the Flask preview. Cloudflare's Workers Builds screen should use:

- Project name: `vines-system` (must match `wrangler.jsonc`)
- Build command: `npm run build`
- Deploy command: `uv run pywrangler deploy`
- Preview command: `uv run pywrangler preview`
- Root directory: leave blank

For local Worker development, install [uv](https://docs.astral.sh/uv/) and Node.js, then run `npm install` and `uv run pywrangler dev`. The Worker serves the Flask app and its server-side Supabase invitation routes.

## Current capabilities and limits

- Email/password sign-in, password reset, invitation password setup, and profile matching use Supabase Auth. There is no public sign-up option.
- The app reads and writes member, department, project, assignment, task, and progress-update data through Supabase. Database Row Level Security remains the authority for each operation.
- Tasks can belong to multiple projects, multiple departments, or both. They start unassigned, then a global leader or head in scope assigns an active member. Assignees can update progress; only the system admin, President, Vice President, or a linked project head can mark a task Done. The system admin, President and Vice President can also delete tasks (this matches the `tasks_admin_delete` database policy; heads cannot).
- New member profiles are created by the system admin and an invitation is sent from the server. After the invited member chooses a password, the server activates the matching pending profile. There is no public sign-up option.
- Server-side invitation, activation and member-removal routes require a protected `SUPABASE_SECRET_KEY`; it is never returned to the browser.
- Only the system admin can remove a member (Members page, **Remove**). It deletes their Supabase login and profile, deletes tasks assigned to them and their progress updates, and hands tasks, project allocations and invitations they created to the admin. It refuses to remove the admin themselves or any other system admin.
- The Calendar view shows only tasks the current account may see and exports an `.ics` calendar file for import into Google Calendar or Apple Calendar. It is a manual export, not an automatic sync.
- The database permissions and invitation flow still need to be checked against the connected Supabase project before the club uses the site.
- Google sign-in is not configured.
- The member import preview accepts CSV files (including CSV exported from Excel); it does not import `.xlsx` workbooks directly.

Do not invite the club or use real member data until the required Supabase migrations and Worker secrets are configured and the role permissions have been verified.

## Environment and secrets

For local development, set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and (for invitations) `SUPABASE_SECRET_KEY` in the environment. Cloudflare Worker variables supply the public settings through `/api/config`; add the secret key only as a protected Worker secret. Never commit Supabase secret keys, SMTP credentials, or other private keys.

## Supabase reference files

The current database setup instructions are in [shared-app/README.md](shared-app/README.md). For an existing Supabase project, run `shared-app/schema.sql`, `shared-app/matrix-roles-update.sql`, then `shared-app/task-assignment-workflow.sql`. Keep `sources/` reference material out of this repository.

## Hosting

Cloudflare Workers can run the Flask app through Python Workers. The Worker configuration is in `wrangler.jsonc`. Do not invite members or store real club data until Supabase Auth, database access, and server-enforced permissions are implemented and verified.
