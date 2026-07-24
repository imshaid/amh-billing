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
 * Supabase database has no packages until this runs once) and reads it
 * back to confirm Supabase is reachable before rendering the real app.
 * Once ready, renders AppRouter — the persistent GlobalTopBar plus
 * whichever top-level view is active (landing / workspace /
 * previousSessions / packages / analytics; see appReducer.js's
 * `currentView` and AppRouter.jsx).
 *
 * This app has no offline/local-cache layer — see this project's own
 * decision to remove IndexedDB entirely (the hotel has reliable wifi,
 * and the dual-storage sync layer that used to live here was the root
 * cause of recurring duplicate-record bugs). Every read/write in
 * db/*.repository.js now goes straight to Supabase, and every relevant
 * hook (usePackages, useSets, usePages) subscribes to Supabase Realtime
 * for row-level live updates across devices — see each hook's own doc
 * comment. This bootstrap step is now just "seed once, confirm
 * reachable" — no push queue, no pull-merge, no purge, no backfill, no
 * StrictMode-double-invocation concerns beyond what seedPackagesIfEmpty's
 * own `count`-based check already handles safely on its own.
 */
export default function App() {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await seedPackagesIfEmpty(defaultPackages);
        await getAllPackages(); // confirms Supabase is actually reachable, not just that the insert succeeded
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
        <p style={{ color: "crimson" }}>Supabase-এ সংযোগ করা যায়নি: {error}</p>
      </div>
    );
  }

  return <AppRouter />;
}
