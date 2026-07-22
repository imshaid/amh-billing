import { useState } from "react";
import { useAppState } from "../../state/useAppState.js";
import { useSets } from "../../hooks/useSets.js";
import { useOrderedByPersons } from "../../hooks/useOrderedByPersons.js";
import FeatureCard from "./FeatureCard.jsx";
import NewSessionModal from "./NewSessionModal.jsx";
import styles from "./LandingPage.module.css";

/**
 * Home screen — the first thing the user sees, and where GlobalTopBar's
 * Home button always returns to. Purely a router: each card's only job is
 * to send the user to one of the other top-level views (workspace,
 * previousSessions, packages, analytics), never to show session data
 * itself. See docs/data-model.md for the underlying Set/Page shape that the
 * destination views operate on.
 *
 * "নতুন সেশন" opens NewSessionModal first (purchase date / ordered-by
 * person — both optional, see that component's own doc comment) rather
 * than creating the Set immediately. Only on the modal's "শুরু করুন" does
 * the Set actually get created — cancelling leaves the landing page
 * exactly as it was, no orphaned Set. `purchaseDate`/`orderedByPerson` are
 * stored on the Set as typed (including `null` if left blank); this
 * component does not invent a fallback date here — see Set.js's own doc
 * comment on why that guess is deferred to read-time (Previous Sessions/
 * month-grouping), not baked in at creation.
 *
 * Buyer name is deliberately NOT collected here — per a later design
 * change, it's typed directly into the Bill/Invoice page itself once the
 * workspace opens (the existing page-level EditableField), and syncs onto
 * the Set from there (see useSessionSummaries.js). Asking for it in this
 * modal too would just be a second, easy-to-desync copy of the same value.
 *
 * "আগের সেশনসমূহ" and "প্যাকেজ" route to features/session/ and a package
 * manager respectively — both still unbuilt, so for now they just switch
 * `currentView`; when their screens exist they'll read `state.currentView`
 * the same way WorkspaceView already does, no change needed here.
 */
export default function LandingPage() {
  const { dispatch } = useAppState();
  const { sets, createSet } = useSets();
  const previousPersons = useOrderedByPersons(sets);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);

  async function handleConfirmNewSession({ purchaseDate, orderedByPerson }) {
    const set = await createSet({
      name: `নতুন সেশন — ${new Date().toLocaleDateString("bn-BD")}`,
      purchaseDate,
      orderedByPerson,
    });
    setIsNewSessionModalOpen(false);
    dispatch({ type: "OPEN_SESSION", payload: set.id });
  }

  return (
    <div className={styles.landing}>
      <h2 className={styles.heading}>আপনি কী করতে চান?</h2>

      <div className={styles.grid}>
        <FeatureCard
          icon="📄"
          title="নতুন সেশন"
          description="নতুন বিল বা চালান তৈরি শুরু করুন"
          onClick={() => setIsNewSessionModalOpen(true)}
        />
        <FeatureCard
          icon="🕐"
          title="আগের সেশনসমূহ"
          description="পুরনো সেশন খুঁজুন ও চালিয়ে যান"
          onClick={() =>
            dispatch({ type: "SET_VIEW", payload: "previousSessions" })
          }
        />
        <FeatureCard
          icon="📦"
          title="প্যাকেজ"
          description="মেনু প্যাকেজ দেখুন ও এডিট করুন"
          onClick={() => dispatch({ type: "SET_VIEW", payload: "packages" })}
        />
        <FeatureCard
          icon="📊"
          title="অ্যানালিটিক্স"
          description="সেশন ও আয়ের সারসংক্ষেপ"
          onClick={() => dispatch({ type: "SET_VIEW", payload: "analytics" })}
        />
      </div>

      {isNewSessionModalOpen && (
        <NewSessionModal
          previousPersons={previousPersons}
          onConfirm={handleConfirmNewSession}
          onCancel={() => setIsNewSessionModalOpen(false)}
        />
      )}
    </div>
  );
}
