---
name: dush-storefront
description: Develop, diagnose, and verify the Dush.kz Next.js storefront. Use for changes to pages, components, catalog UX, search, cart, favorites, WhatsApp ordering, SEO, accessibility, responsiveness, performance, or other code under web/.
---

# Work on the Dush.kz storefront

## Orient

1. Work from `web/` for Node commands.
2. Read the repository `AGENTS.md` and `web/AGENTS.md`.
3. Inspect `package.json`, the affected route, and its shared components before editing.
4. For Next.js APIs or conventions, read the relevant guide under
   `node_modules/next/dist/docs/`; this repository uses Next.js 16.

## Respect the data boundary

- Use `@/lib/catalog` and `products-index.json` in client components.
- Keep `@/lib/products` and the full `products.json` on the server.
- Expect a fresh clone to have no `web/public/products/` directory even when every
  catalog item has an image path. Treat failed loads as missing media and render a
  deliberate fallback.
- Avoid multiplying missing-media requests. Bound the number of rendered cards and
  avoid eager image loading outside the viewport.
- Do not invent ratings, reviews, guarantees, delivery promises, or availability.
  Customer-facing evidence must come from a real source field.

## Implement safely

- Keep filtering and sorting reflected in the URL when users should be able to share
  or restore the view, but debounce free-text updates.
- Paginate, incrementally load, or virtualize product grids. The complete dataset has
  5,433 products and is not a safe single render.
- Preserve cart and favorite persistence contracts when changing product identity.
- Treat opening WhatsApp as a handoff attempt, not proof that the user sent the
  message. Preserve recoverable order state.
- Give dialogs an accessible name, focus trap, Escape handling, focus restoration,
  and appropriate `role`/`aria-modal` semantics.
- Support keyboard interaction, visible focus, reduced motion, and narrow mobile
  viewports for interactive UI.

## Verify

Run:

```bash
npm run build
npm run dev
```

Then inspect the changed path in a browser at desktop and mobile widths. Exercise the
actual interaction, check the dev-server output for runtime errors and missing assets,
and state explicitly that lint/tests were not run because this project currently has
no such scripts.

When the build fails only while fetching Geist from Google Fonts, distinguish that
network prerequisite from TypeScript or application-code failures. Prefer self-hosted
fonts when the task includes build reliability.
