# Dush.kz API contract

Base path: `/api/v1`.

- `GET /health`: database-backed readiness.
- `GET /products`: paginated catalog and filters.
- `GET /products/{slug}`: product details or 404.
- `GET /catalog/facets`: brand/category counts and price range.
- `POST /orders`: customer fields plus `{slug, quantity}` items; server computes totals.
- `GET /admin/orders`: requires `Authorization: Bearer <ADMIN_TOKEN>`.

Money is serialized as decimal strings. Product slugs are stable public identifiers. Order IDs are UUIDs.
`image` and `images` contain public URL strings only; they never contain binary or base64 data.
