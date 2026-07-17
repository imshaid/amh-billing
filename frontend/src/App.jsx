import { useEffect, useState } from "react";
import {
  seedPackagesIfEmpty,
  getAllPackages,
} from "./db/packages.repository.js";
import { defaultPackages } from "./db/seed/defaultPackages.js";
import AppRouter from "./components/layout/AppRouter.jsx";

/**
 * Bootstrap gate.
 *
 * Seeds the package list on first run (still genuinely needed — a fresh
 * IndexedDB has no packages until this runs once) and reads it back to
 * confirm the DB is reachable before rendering the real app. Once ready,
 * renders AppRouter — the persistent GlobalTopBar plus whichever top-level
 * view is active (landing / workspace / previousSessions / packages /
 * analytics; see appReducer.js's `currentView` and AppRouter.jsx). This
 * file used to render BillPage/InvoicePage sample previews directly as a
 * temporary scaffold for visually verifying those components against the
 * hotel's sample images; that scaffold is superseded now that real Pages
 * render inside WorkspaceView. The sample data files (sampleBillPage.js /
 * sampleInvoicePage.js) are left in place for that component-level visual
 * check — see BillPage/InvoicePage — they're just no longer wired into the
 * main render path.
 */
export default function App() {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  // React 18 StrictMode deliberately mounts -> runs effect -> runs its
  // cleanup -> mounts again -> runs effect again, in dev only, to surface
  // effects that aren't safe to run twice. That means `cancelled` below can
  // flip to true *while the first run's bootstrap() is still awaiting
  // IndexedDB* — which is fine and expected, as long as the *second* run is
  // still allowed to finish and apply its own state update. (An earlier
  // version of this file additionally gated bootstrap() itself behind a ref
  // so it could only ever run once — combined with `cancelled` that caused
  // a deadlock: the first run got cancelled before finishing, and the
  // second run never started, so no state update ever landed and the
  // screen was stuck on "Loading…" forever.)
  //
  // Duplicate seeding across the two StrictMode runs is prevented at the
  // data layer instead (packages.repository.js uses a single atomic
  // transaction for the read-then-write), so it's safe to simply let both
  // effect runs call bootstrap() here.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await seedPackagesIfEmpty(defaultPackages);
        await getAllPackages(); // confirms the store is actually readable, not just written to
        if (!cancelled) {
          setStatus("ready");
        }
      } catch (err) {
        console.error("[amh-billing] bootstrap failed:", err);
        if (!cancelled) {
          setError(err.message);
          setStatus("error");
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <div style={{ padding: "var(--space-xl)", textAlign: "center" }}>
        <p style={{ color: "var(--chrome-text-muted)" }}>লোড হচ্ছে…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ padding: "var(--space-xl)", textAlign: "center" }}>
        <p style={{ color: "crimson" }}>ডাটাবেস চালু করা যায়নি: {error}</p>
      </div>
    );
  }

  return <AppRouter />;
}
