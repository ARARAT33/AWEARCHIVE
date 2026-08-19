# AWEARCHIVE · AWELIB

AWEGame-style archive library for files, media and web pages, deployable as a static Cloudflare Pages site with Pages Functions.

## Architecture

- `index.html` — public AWELIB UI; no admin link is exposed.
- `admin.html` — private control panel, protected by a server-side secret-backed session.
- `data/archive.json` — durable archive catalog. Admin writes go through a Pages Function to the GitHub Contents API; the browser never receives the GitHub token.
- `functions/api/archive.js` — public catalog/search API.
- `functions/api/admin/[[path]].js` — authenticated archive CRUD API.
- `functions/api/analytics.js` — first-party analytics collector.
- `functions/api/admin/analytics.js` — authenticated analytics dashboard API.
- `functions/_shared/github.js` — server-side GitHub storage helper.
- `functions/_shared/auth.js` — HMAC-signed admin session cookies.
- `functions/media/[slug].js` — media proxy using AWEARCHIVE URLs.
- `functions/download/[slug].js` — download proxy.
- `functions/web/[slug].js` — current webpage proxy/viewer.

## Cloudflare Secrets

Create these **as encrypted Secrets**, not ordinary public variables:

- `ADMIN_USERNAME` — your chosen admin username.
- `ADMIN_PASSWORD` — your chosen strong admin password.
- `ADMIN_SESSION_SECRET` — a long random secret used to sign sessions.
- `GITHUB_TOKEN` — a fine-grained GitHub token limited to this repository with Contents read/write access.

Optional ordinary variables:

- `GITHUB_REPO` = `ARARAT33/AWEARCHIVE`
- `GITHUB_BRANCH` = `main`

Never put any of these secrets in HTML, JavaScript, GitHub source, or browser storage.

## Admin

There is intentionally no Admin button or admin link on the public UI. Visit the private admin URL directly. The admin UI is `noindex,nofollow` and the API requires an HttpOnly, Secure, SameSite=Strict signed session cookie.

A custom subdomain such as `admin.example.com` can be attached in Cloudflare when you own a domain. A `*.pages.dev` project cannot arbitrarily create another child subdomain under `pages.dev`; without a custom domain use the private admin path directly.

## Archive workflow

Admin can add/edit/delete:

- video
- image
- file
- webpage
- other

Every item contains a title, description, slug, tags and URL, plus optional thumbnail and status. The actual file bytes are not copied into GitHub; only the source URL and metadata are stored.

A successful admin save creates a Git commit in `data/archive.json`. Cloudflare Pages can then redeploy the updated catalog. Because the catalog is versioned in Git, normal code deployments do not erase archive entries.

Public media and downloads are served through AWEARCHIVE paths (`/media/<slug>` and `/download/<slug>`) so the original source URL is not shown in the public UI.

## Analytics

The public site sends first-party events for page views, item views and downloads. Pages Functions records the request IP, Cloudflare country/colo, referrer, landing path, search query, item and user-agent into daily `data/analytics/YYYY-MM-DD.json` files. The private dashboard aggregates:

- unique visitors
- total events
- countries
- viewed/downloaded items
- entry paths
- IP addresses
- referrers
- recent/live activity

Analytics commits use Cloudflare's `[CF-Pages-Skip]` commit marker so they do not trigger normal Pages deployments. Cloudflare documents this skip mechanism for Git-integrated Pages. Treat IP/user-agent data as personal data and keep an appropriate retention/privacy policy for your visitors.

## Cloudflare Pages

Connect `ARARAT33/AWEARCHIVE` through Cloudflare Pages Git integration, production branch `main`, root directory `/`, no build command, output directory `.`. The Functions directory is automatically deployed with the Pages project.

The public application needs no Supabase configuration. The only runtime secrets are the Cloudflare Secrets listed above.

## Durability

GitHub stores the application and archive catalog. Cloudflare Pages serves it. The archive catalog is therefore independent of a Pages deployment: a new deployment replaces the site code but does not remove `data/archive.json`. GitHub history also provides a versioned recovery path for accidental catalog changes.

No hosted service can honestly promise literal 100% uptime or zero data loss, so keep GitHub repository protection/backups enabled for the strongest recovery posture.
