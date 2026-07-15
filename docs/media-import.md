# Catalog and product photo import

This runbook is intended for Edil or an agent working from a clone that contains the
untracked photo package.

## Storage contract

- Source photos: `parser/images/<product-slug>/...` (not committed to Git).
- Generated upload package: `web/public/products/<product-slug>/...` (not committed).
- Production files: `/var/www/dush.kz/shared/media/products/...` (persistent across releases).
- PostgreSQL: `products.images` is a JSON array of URL strings such as
  `/media/products/<product-slug>/front.webp`. It must never contain image bytes,
  base64, blobs, or `file://` paths.

## Agent procedure

1. Read `AGENTS.md`, `backend/AGENTS.md`, and `$dush-catalog-pipeline`.
2. Put the photo folders under `parser/images/`; each folder name must match the
   product slug used by the parser data.
3. Build and validate the package:

   ```bash
   python3 parser/build_web_data.py
   python3 .agents/skills/dush-catalog-pipeline/scripts/check_catalog.py --require-images
   ```

4. Upload files and then import their links:

   ```bash
   deploy/sync-catalog-media.sh ubuntu@194.238.42.119
   ```

   The script intentionally uses the validated generated outputs
   `web/src/data/products.json` and `web/public/products`.

5. Verify the API and representative media URL:

   ```bash
   curl --fail 'https://dush.194-238-42-119.sslip.io/api/v1/products?page_size=1'
   curl --head --fail 'https://dush.194-238-42-119.sslip.io/media/products/<slug>/<file>'
   ```

The sync is additive and deliberately does not use `rsync --delete`. Do not delete
old files until active database URLs have been compared with the media directory.

## Prompt for Edil's agent

> Read AGENTS.md and use $dush-catalog-pipeline. Import the complete local product
> photo package by following docs/media-import.md. Keep photo files outside
> PostgreSQL; store only `/media/products/...` URL strings in `products.images`.
> Validate all referenced files before uploading, run the sync script, and verify
> both the API and representative public image URLs. Do not use `--delete`.
