# AWEARCHIVE · AWELIB

AWEARCHIVE is an AWEGame-style static library for archived files, media and web pages. The public UI is intentionally lightweight and deployable on Cloudflare Pages.

## Architecture

- `index.html` — public AWELIB search/library UI.
- `admin.html` — separate admin UI. Supabase Auth authenticates the operator and PostgreSQL RLS decides whether that user is actually an admin.
- `functions/media/[slug].js` — server-side media proxy; visitors receive an AWEARCHIVE URL rather than the original archive URL.
- `functions/download/[slug].js` — server-side download proxy.
- `functions/web/[slug].js` — webpage snapshot proxy for iframe viewing.
- `functions/_shared/archive.js` — proxy implementation.
- `supabase/migrations/...sql` — database schema and RLS.

## Important security rule

Do **not** put the admin username/password, Supabase secret key, service-role key, or any other private credential in `index.html`, `admin.html`, GitHub, or browser JavaScript.

Supabase's current security model recommends publishable keys for browser code and secret keys only on server-side code. RLS must remain enabled. The repository therefore stores only the schema and application code; credentials are configured outside Git.

## Supabase setup

1. Use the Supabase project `webarchive` (`pgjrqtctkvbymlprzngi`) if you want to use the existing project.
2. Wait until the project status is `ACTIVE`.
3. Apply `supabase/migrations/20260819220000_awearchive.sql`.
4. In Supabase Auth create exactly one operator account. If you want the initial login to be `ararat / 1111`, create that account yourself in the Auth dashboard; never paste that password into this repository.
5. Copy that user's UUID and insert it into `public.admins` in SQL Editor:

```sql
insert into public.admins(user_id) values ('YOUR_AUTH_USER_UUID');
```

Only a UUID present in `public.admins` can mutate archive records because all write policies call `is_archive_admin()`.

## Browser configuration

`index.html` and `admin.html` currently contain the placeholders `__SUPABASE_URL__` and `__SUPABASE_PUBLISHABLE_KEY__`. Replace only these two public configuration values with your Supabase project URL and **publishable** key. Never use a secret/service-role key there.

## Cloudflare Pages

Deploy the repository as a Cloudflare Pages project with the repository root as the build directory and no framework build command. The Functions directory is `functions/`.

Set the runtime variables needed by the Pages Functions:

- `SUPABASE_URL` = your Supabase project URL
- `SUPABASE_KEY` = Supabase publishable key (the proxy only reads public active rows)

If you later add a server-side admin function, put a Supabase **secret** key in the Cloudflare Pages/Workers secret store, never in source.

## Archive workflow

From the admin page you can add:

- file
- video
- image
- webpage
- other

Each item has a title, description, slug, source URL, optional thumbnail and tags.

For media, the public page uses `/media/<slug>` and downloads use `/download/<slug>`. The browser therefore addresses AWEARCHIVE instead of the original Archive.org URL. The original source URL remains server-side in the database.

For web pages, `/web/<slug>` fetches the current source and presents it inside the AWEARCHIVE viewer. Some modern sites intentionally block iframe/proxy rendering through CSP, X-Frame-Options, authentication, robots rules, JavaScript checks, or anti-bot systems; those pages cannot be made universally embeddable without bypassing their security controls.

## Durability

GitHub contains the application code. Supabase PostgreSQL contains the archive catalog and metadata. Cloudflare Pages serves the public application. This separation means a GitHub outage does not erase the database, and changing/redeploying the Pages site does not erase archive metadata.

For the strongest durability, keep periodic database backups/export snapshots in a second independent storage provider as well. No single hosting provider can honestly guarantee 100% uptime or zero data loss.
