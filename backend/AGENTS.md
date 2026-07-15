# Backend rules

- Keep PostgreSQL as the source of truth for products, categories, and orders.
- Store only public URL strings in `products.images`. Never store image bytes,
  base64 values, blobs, or machine-local paths in PostgreSQL.
- Change the schema through Alembic migrations; never edit production tables by hand.
- Prices received from browsers are untrusted. Resolve products and prices from the database when creating an order.
- Keep public order creation separate from admin order access. Admin endpoints require a server-side token until role-based accounts are introduced.
- Do not log customer phone numbers, names, comments, tokens, or database URLs.
- Run `python -m ruff check .` and `python -m pytest` after backend changes.
