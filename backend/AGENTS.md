# Backend rules

- Keep PostgreSQL as the source of truth for products, categories, and orders.
- Store only public URL strings in `products.images`. Never store image bytes,
  base64 values, blobs, or machine-local paths in PostgreSQL.
- Change the schema through Alembic migrations; never edit production tables by hand.
- Prices received from browsers are untrusted. Resolve products and prices from the database when creating an order.
- Keep public order creation separate from admin order access. Admin endpoints authenticate a session cookie and declare their permission through `Depends(require(...))` — never rely on the interface hiding a control.
- Add new permissions to `app/permissions.py` only; the owner role picks them up automatically on the next `setup_admin.py` run.
- Schema changes that `create_all` cannot apply (new columns, enum values) go into `scripts/migrate_cms.py`, which runs on every release.
- Do not log customer phone numbers, names, comments, tokens, or database URLs.
- Run `python -m ruff check .` and `python -m pytest` after backend changes.
