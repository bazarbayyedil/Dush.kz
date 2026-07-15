# Dush.kz repository guide

## Scope

These instructions apply to the whole repository. More specific instructions in
`web/AGENTS.md` also apply to files under `web/`.

## Repository map

- `web/`: Next.js 16 App Router storefront. Run Node commands from this folder.
- `backend/`: FastAPI API, PostgreSQL models, migrations, and import tooling.
- `web/src/data/`: generated catalog artifacts consumed by the storefront.
- `parser/`: Python scraper, source category JSON, image cleanup, and web-data build.
- `assets/`: source logo files. Runtime logos live in `web/public/`.
- `.agents/skills/`: project workflows for storefront and catalog work.

## Start here

1. Read this file and the closest nested `AGENTS.md`.
2. Inspect `git status --short` before editing and preserve unrelated changes.
3. Choose the matching project skill:
   - `$dush-storefront` for UI, UX, SEO, accessibility, cart, search, and Next.js work.
   - `$dush-catalog-pipeline` for scraper, catalog JSON, image, or data-build work.
   - `$dush-backend` for API, database, orders, migrations, Docker, and deployment.
4. Treat generated catalog JSON and product media as a coupled contract; do not
   hand-edit thousands of generated records when the builder should own the change.

## Commands

```bash
cd web
npm ci
npm run dev       # http://localhost:3000
npm run build     # production build and TypeScript validation
```

There is currently no lint or automated test script. Do not report those checks as
passing. Add focused tests when changing non-trivial business logic.

Catalog validation:

```bash
python3 .agents/skills/dush-catalog-pipeline/scripts/check_catalog.py
```

Backend validation:

```bash
cd backend
python -m ruff check .
python -m pytest
```

## Data and media constraints

- `web/src/data/products-index.json` is shipped to catalog/search clients; keep it
  thin and never import the full `products.json` into a client component.
- `web/src/data/products.json` is the full server-side product source.
- Product photos are intentionally ignored in Git under `parser/images/` and
  `web/public/products/`. A fresh clone can therefore contain valid-looking
  `/products/...` paths with no corresponding file.
- Never store image bytes, base64, blobs, or local filesystem paths in PostgreSQL.
  `products.images` contains public URL strings only. Production files live under
  `/var/www/dush.kz/shared/media/products/` and are served as `/media/products/...`.
- For a complete catalog + photo import, follow `docs/media-import.md` or run
  `deploy/sync-catalog-media.sh <ssh-user@host>` after rebuilding web data.
- Never assume a non-empty image URL means the asset exists. New UI must render a
  stable fallback for missing or failed images without producing an unbounded 404
  storm.
- Do not run the full scraper or overwrite the whole catalog unless the task
  explicitly calls for a refresh. Start with one category and a small limit.
- Preserve product slugs unless a migration updates URLs, cart/favorite persistence,
  catalog links, and generated artifacts together.

## Storefront guardrails

- Read the relevant bundled Next.js 16 guide from `web/node_modules/next/dist/docs/`
  before changing framework conventions or APIs.
- Keep claims such as ratings, review counts, stock, warranty, discounts, and
  delivery times backed by real data. Do not generate customer-facing proof from a
  slug or another pseudo-random value.
- The order flow opens WhatsApp and has no server-side confirmation. Do not label an
  order as sent or irreversibly clear the cart merely because a new tab was opened.
- Avoid rendering the entire 5,433-product catalog into one client DOM. Use bounded
  pagination, incremental loading, or virtualization for catalog work.
- Keep keyboard access, focus management, reduced-motion behavior, labels, dialog
  semantics, and mobile layouts in scope for interactive changes.

## Validation expectations

- For storefront changes, run `npm run build` and inspect the affected route in a
  browser at desktop and mobile widths.
- For catalog changes, run `check_catalog.py` before and after the edit, then build
  the web app when generated artifacts changed.
- Inspect the dev-server output for 404s and runtime errors; a visually rendered page
  is not sufficient evidence.
- Report external prerequisites separately. The production build currently fetches
  Geist from Google Fonts, so a network-restricted build can fail before code
  validation completes.
