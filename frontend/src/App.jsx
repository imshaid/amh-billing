import { useEffect, useState } from "react";
import {
  seedPackagesIfEmpty,
  getAllPackages,
} from "./db/packages.repository.js";
import { defaultPackages } from "./db/seed/defaultPackages.js";
import BillPage from "./features/bill/BillPage.jsx";
import { sampleBillPage } from "./features/bill/sampleBillPage.js";
import InvoicePage from "./features/invoice/InvoicePage.jsx";
import { sampleInvoicePage } from "./features/invoice/sampleInvoicePage.js";

/**
 * Temporary bootstrap screen.
 *
 * This is not the real app UI yet — it exists purely to prove, inside an
 * actual browser, that the IndexedDB layer built so far (schema, packages
 * repository, seed data) genuinely works: it seeds the package list on
 * first run and reads it back. Once that's confirmed, this gets replaced
 * by the real layout (Sidebar + CanvasArea + BottomPanel) and the first
 * feature screen (Bill page preview).
 */
export default function App() {
  const [status, setStatus] = useState("loading");
  const [packages, setPackages] = useState([]);
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
        const all = await getAllPackages();
        if (!cancelled) {
          setPackages(all);
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

  return (
    <>
      <div
        style={{ padding: "var(--space-xl)", maxWidth: 720, margin: "0 auto" }}
      >
        <h1 style={{ color: "var(--brand-blue)" }}>
          AMH Billing — dev checkpoint
        </h1>

        {status === "loading" && <p>Loading IndexedDB…</p>}

        {status === "error" && (
          <p style={{ color: "crimson" }}>
            IndexedDB bootstrap failed: {error}
          </p>
        )}

        {status === "ready" && (
          <>
            <p>
              ✅ IndexedDB is working. <strong>{packages.length}</strong>{" "}
              packages seeded and loaded from the browser's local database.
            </p>
            <ul style={{ lineHeight: 1.8 }}>
              {packages.map((pkg) => (
                <li key={pkg.id}>
                  <strong>{pkg.name}</strong>
                  {pkg.category ? ` (${pkg.category})` : ""} — ৳
                  {pkg.rate ?? "—"}
                </li>
              ))}
            </ul>

            <hr style={{ margin: "32px 0" }} />

            <h2>Bill page preview (sample data)</h2>
            <p style={{ color: "var(--chrome-text-muted)" }}>
              Compare this against the original sample bill image to check
              visual fidelity.
            </p>
          </>
        )}
      </div>

      {status === "ready" && (
        <div style={{ background: "var(--chrome-border)", padding: "24px 0" }}>
          <BillPage page={sampleBillPage} />
        </div>
      )}

      {status === "ready" && (
        <div
          style={{
            padding: "var(--space-xl)",
            maxWidth: 720,
            margin: "0 auto",
          }}
        >
          <h2>Invoice page preview (sample data)</h2>
          <p style={{ color: "var(--chrome-text-muted)" }}>
            Compare this against the sample invoice image (Log Code 122.02.12).
          </p>
        </div>
      )}

      {status === "ready" && (
        <div style={{ background: "var(--chrome-border)", padding: "24px 0" }}>
          <InvoicePage page={sampleInvoicePage} />
        </div>
      )}
    </>
  );
}
