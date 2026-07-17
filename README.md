# AMH Billing

Bill / Invoice generation system for **আদর্শ মুন্সির হোটেল** (Adarsha Munshir Hotel), Thakurgaon.

Replaces the previous manual LaTeX workflow with an offline-first web app that generates
Bill, Invoice, and Summary Invoice pages, keeps history, and exports print-ready PDFs.

## Monorepo layout

```
amh-billing/
├── frontend/   → React + Vite PWA (deployed on Cloudflare Pages)
└── backend/    → Node + Puppeteer PDF service (deployed on Render)
```

See `frontend/README.md` and `backend/README.md` for per-app setup.

## Stack

| Layer            | Technology                          | Hosting            |
|-------------------|--------------------------------------|---------------------|
| Frontend          | React + Vite (PWA)                  | Cloudflare Pages    |
| Local storage     | IndexedDB (`idb`)                   | Browser             |
| Remote storage    | Supabase (Postgres, no auth)        | Supabase            |
| PDF generation    | Node + Puppeteer (self-hosted Chrome)| Render (Free)       |
| Keep-alive        | UptimeRobot ping                    | UptimeRobot         |

No paid services. No login/auth — single shared workspace for the hotel's own staff.

## Documentation

- `docs/data-model.md` — full data model and the reasoning behind it (snapshot policy,
  rate handling, summary aggregation, page ordering).
