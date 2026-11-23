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
shared-app/                 Supabase schema, migrations, and planning notes
run.py                      Local Flask entry point
requirements.txt            Python dependencies
package.json                TypeScript build scripts and dependency
tsconfig.json               TypeScript compiler settings
```

## Run locally

You need Python 3.10+ and Node.js/npm.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
npm install
npm run build
python run.py
```

Open <http://127.0.0.1:5000>.

While editing TypeScript, `npm run watch` rebuilds `app/static/js/app.js` as files change. Flask serves the compiled file; the browser does not run `.ts` directly.

## Current capabilities and limits

- The dashboard, member, task, department, and project screens are a local preview.
- Preview data is stored in that browser's local storage; it is not shared between members or browsers.
- The role picker previews interface states. It is not a real authentication or permission boundary.
- Supabase SQL files describe the intended database and row-level access rules. Flask routes do not yet read or write to Supabase.
- Password login, Google sign-in, invitation acceptance, server-side member provisioning, and live email invitations are not implemented.
- The member import preview accepts CSV files (including CSV exported from Excel); it does not import `.xlsx` workbooks directly.

Do not use this preview as a live member system until authentication, database reads/writes, and server-enforced permissions are connected.

## Environment and secrets

Copy `.env.example` to `.env` only for local development. `.env` is ignored by Git. Never commit Supabase secret keys, SMTP credentials, or other private keys. Browser configuration may contain the Supabase URL and publishable key; the Supabase secret key belongs only in a trusted server or encrypted hosting secret.

## Supabase reference files

The current database setup instructions are in [shared-app/README.md](shared-app/README.md). For an existing Supabase project, use the current `shared-app/schema.sql` and then `shared-app/matrix-roles-update.sql`. Keep `sources/` reference material out of this repository.

## Hosting

This project runs as a Flask app locally. Static hosting by itself cannot run its Flask routes. Choose a Python-capable host or adapt the project for Cloudflare Workers before deployment; the current local preview is not ready for member access.
