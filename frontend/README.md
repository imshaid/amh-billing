# AMH Billing — Frontend

React + Vite PWA. Offline-first: IndexedDB is the source of truth on-device;
Supabase holds permanent history.

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in Supabase + PDF service URLs
npm run dev
```

## Project structure

```
src/
├── db/            IndexedDB schema + one repository file per entity
│                   (packages / sets / pages). Nothing outside this folder
│                   should touch IndexedDB directly.
├── domain/         Pure business logic — models, aggregation math,
│                   number-to-words. No IndexedDB, no React, no DOM.
│                   Fully unit-testable in plain Node.
├── sync/           Supabase push/pull + 30-day local cache purge.
├── features/       One folder per feature (bill, invoice, summary,
│                   package-picker, bulk-import, analytics, session).
├── components/     Generic, reusable UI with no business logic
│                   (layout chrome, buttons, modals).
├── hooks/          Shared React hooks.
├── utils/          Small stateless helpers (dates, currency formatting).
└── styles/         Global CSS + design tokens (brand colors, fonts).
```

## Key architectural rules (see /docs/data-model.md for full reasoning)

1. **Snapshot policy** — a Page's line items are a frozen copy of a Package at
   the moment they were added. Editing a Package later never changes an
   already-created Page.
2. **Never mutate a shared/exported Page** — use `revisePage()` from
   `db/pages.repository.js`, which creates a new Page row and leaves the
   original untouched.
3. **Fonts must be loaded as explicit web fonts** (`@font-face` / Google
   Fonts), never assumed to be system-installed — the same HTML this app
   renders is also rendered headlessly by the PDF service.
