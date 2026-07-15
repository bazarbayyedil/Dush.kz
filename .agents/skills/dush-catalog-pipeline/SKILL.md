---
name: dush-catalog-pipeline
description: Validate, refresh, transform, and diagnose the Dush.kz product catalog and media pipeline. Use for parser changes, category scraping, product JSON updates, slug or schema migrations, missing images, image cleanup, and rebuilding web/src/data artifacts.
---

# Maintain the Dush.kz catalog pipeline

## Establish the current state

Run from the repository root:

```bash
python3 .agents/skills/dush-catalog-pipeline/scripts/check_catalog.py
```

Read `parser/scrape.py` and `parser/build_web_data.py` before changing their outputs.
Treat `parser/data/*.json` as scraped source records, `parser/images/` as local source
media, and `web/src/data/*.json` plus `web/public/products/` as generated outputs.

## Choose the narrowest workflow

- For schema or transform changes, edit `build_web_data.py` and rebuild from the
  existing source JSON.
- For scraper-selector changes, test one category with a small `--limit` first.
- For a data refresh, refresh one requested category before considering `--all`.
- Run the full scraper only when the user explicitly requests a full refresh; it is
  long-running, network-dependent, and reads a third-party catalog.

Example narrow scrape:

```bash
cd parser
python3 scrape.py --category <category-slug> --limit 20
python3 build_web_data.py
```

## Preserve contracts

- Keep slugs unique and stable. They are URLs and persistence keys.
- Keep `products-index.json` aligned with `products.json`; the index image must equal
  the first full-data image or be empty.
- Keep prices positive and preserve `null` semantics rather than converting missing
  values to customer-visible zeroes.
- Do not hand-edit generated web JSON for broad changes.
- Do not commit `parser/images/` or `web/public/products/`; both are intentionally
  ignored. Use object storage or a documented deployment media step for production.
- Never insert image bytes/base64 into PostgreSQL. Import only public URL strings.
  The production mapping is source `/products/<slug>/<file>` to database URL
  `/media/products/<slug>/<file>`, backed by persistent server files under
  `/var/www/dush.kz/shared/media/products/`.
- A non-empty `/products/...` value does not prove that a local image exists. Missing
  media is a warning in a fresh clone and an error only when the workflow promises a
  complete media package.

## Verify outputs

After rebuilding, run:

```bash
python3 .agents/skills/dush-catalog-pipeline/scripts/check_catalog.py
python3 .agents/skills/dush-catalog-pipeline/scripts/check_catalog.py --require-images
cd web && npm run build
```

Use `--require-images` only when the media package should be complete. Compare product
and category counts before and after. Investigate unexpected drops, duplicate slugs,
index/full mismatches, or new empty fields before accepting the generated diff. Inspect
representative product, catalog, search, and category routes when web artifacts change.

## Import a complete photo package

Read `docs/media-import.md`, then run from the repository root:

```bash
python3 parser/build_web_data.py
python3 .agents/skills/dush-catalog-pipeline/scripts/check_catalog.py --require-images
deploy/sync-catalog-media.sh <ssh-user@host>
```

The sync script uploads files first and imports catalog links second, so the API never
publishes links to a package that has not reached persistent media storage. It does not
delete old remote files; clean them only after comparing active database URLs.
