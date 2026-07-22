# Data Model

This document is the source of truth for how data is shaped and why. Code should match
this; if it drifts, this file is wrong and needs updating — not the other way around.

## Entities

### Package

A reusable "menu item" template (Biscuit, Snacks Basic 2, Lunch Premium 3, etc).

```ts
Package {
  id: string
  name: string
  category: "Snacks" | "Lunch" | "Iftar" | null
  items: { id: string, text: string }[]
  rate: number | null        // default rate, auto-fills into new line items
  seasonal?: "ramadan"
  createdAt: string
  updatedAt: string
}
```

Packages are user-editable (CRUD). Editing a Package only affects _future_ line items
created from it — see Snapshot Policy below.

### Page

A single Bill, Invoice, or Summary page.

```ts
Page {
  id: string
  setId: string
  type: "bill" | "invoice" | "summary"
  buyerName: string
  address: string
  date: string               // ISO date
  serialOrLogCode: string
  lineItems: LineItem[]
  total: number | null       // bill only; auto-calculated unless overridden
  totalIsOverridden: boolean
  note: string | null        // internal reminder, never printed on the PDF
  createdAt: string
  updatedAt: string
}

LineItem {
  id: string
  sl: number
  packageId: string | null   // reference only, for convenience when adding future rows
  packageName: string
  items: { id: string, text: string }[]   // snapshot copy, see Snapshot Policy
  quantity: number | null
  rate: number | null        // snapshot copy of Package.rate at creation time, overridable
  amount: number | null      // bill only; quantity × rate unless overridden
  amountIsOverridden: boolean
  quantityIsOverridden: boolean  // true only for Summary lines, see below
}
```

### Set

A working session: normally one Bill + several Invoices + one Summary, but any
combination/count is allowed. (Design decision as of the "নতুন সেশন"
redesign: a Set is meant to have exactly _one_ Bill page going forward,
though multiple Invoice/Summary pages are still fine — this is not yet
enforced in the UI, so existing/older Sets with multiple Bill pages can
still exist; enforcing the one-Bill-per-Set rule in CanvasArea/PageActionBar
is deferred to a later task.)

```ts
Set {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  defaults: {
    buyerName: string
    defaultPackages: string[]     // Package ids, session-wide
    rowTemplate: LineItem[]       // shape of the first page's rows, copied to new pages
  }
  purchaseDate: string | null     // ISO date, optional — see below
  orderedByPerson: string | null  // optional — see below
  pageIds: string[]               // ordered by date, see Page Ordering
}
```

`purchaseDate` and `orderedByPerson` are both collected (optionally — never
required) via a modal shown on "নতুন সেশন", before the Set is created.
Neither is ever backfilled/guessed at write time if left blank; `null` here
always means "the user didn't say". Read-time consumers (currently just the
Previous Sessions screen) apply their own fallback: `purchaseDate` falls
back to the Set's earliest Invoice page's own `date`, then to `createdAt`,
for month-grouping and display purposes — see
`hooks/useSessionSummaries.js`.

`orderedByPerson` names are stored only on the Set itself for now (no
separate store/index — see `db/schema.js`) and surfaced as a quick-select
list by scanning every Set's `orderedByPerson` in JS (see
`hooks/useOrderedByPersons.js`). This is local-only; Supabase sync for this
field isn't wired up yet (same as the rest of this app's data — see Local
Cache Policy below).

## Snapshot Policy

**Line items are frozen at creation time.** When a row is added to a Page from a
Package, `LineItem.items` is a full copy of `Package.items` at that moment — not a
live reference.

Why: a Bill or Invoice is effectively a historical document. If someone edits a
Package's item list next month, every already-generated page must keep showing
exactly what was printed on the day it was created. `packageId` is kept only so the
UI can offer "add another row like this" convenience later; it carries no live binding.

## Rate Handling

- `Package.rate` is a _default_ — set once per package, edited by the user like any
  other package field.
- When a line item is created from a Package, `LineItem.rate` is copied from
  `Package.rate` at that instant (same snapshot reasoning as above).
- The user can override `LineItem.rate` per row, per page, at any time (e.g. seasonal
  price change) without touching the Package default.
- `Amount = quantity × rate`, recomputed live unless `amountIsOverridden` is set. The
  same override flag pattern applies to `Page.total`.

## History Edit Policy — Duplicate, Never Mutate

**No historical Page is ever edited in place once it has been generated as a PDF and
shared.** If the user needs to change something on a page that already exists in
history, the app creates a duplicate:

- The original Page (and its parent Set snapshot, if relevant) stays byte-for-byte
  unchanged in both IndexedDB and Supabase.
- A new Page (new `id`, `createdAt`) is created with the edited content, referencing
  the same `setId`.
- Convention: the duplicate's `serialOrLogCode` or a `revisionOf` marker can note which
  page it replaces, but this is metadata only — it never rewrites the original row.

This guarantees a downloaded/shared PDF can never silently change after the fact.

## Summary Page

A Summary page is **not a distinct type conceptually** — mechanically it is a normal
Invoice page (`type: "summary"` only distinguishes it for aggregation logic and default
field visibility). Differences from a regular Invoice:

- `buyerName`, `address`, `date`, `serialOrLogCode` are blank by default, but the user
  can fill any of them in — nothing is locked.
- `LineItem.quantity` for each package equals the **sum of that package's quantity
  across every Invoice page in the same Set**. This is live-computed.
- If the user manually edits a Summary line's quantity, `quantityIsOverridden` is set
  to `true` for that line, and it stops auto-recomputing until the user resets it.

## Page Ordering

Pages within a Set are ordered **by `date`**, ascending, by default. This is a display/
export concern — `Set.pageIds` stores the current order, recalculated whenever a page's
date changes or a new page is added. No drag-and-drop reordering in MVP (future work).

## Local Cache Policy (IndexedDB)

- IndexedDB is the offline-first source of truth on-device.
- Supabase holds full permanent history.
- Any record with `synced_at` set and `age > 30 days` is purged from IndexedDB on the
  next sync cycle. It remains fully available in Supabase and will be re-fetched on
  demand if the user searches history older than 30 days.
