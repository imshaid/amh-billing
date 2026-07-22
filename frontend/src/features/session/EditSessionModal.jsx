import SessionDetailsModal from "../shared/SessionDetailsModal.jsx";

/**
 * Modal for editing an existing session's purchaseDate/orderedByPerson —
 * opened from PreviousSessionsScreen's per-card overflow menu. A thin
 * wrapper around the shared SessionDetailsModal (see that component's own
 * doc comment), pre-filled with the Set's current values and labeled for
 * the "editing" case.
 *
 * Per an explicit design decision, only purchaseDate and orderedByPerson
 * are editable here — not the session's name (Set.name) and not buyer name
 * (which lives on the Bill/Invoice page itself, not the Set — see
 * NewSessionModal.jsx's doc comment).
 *
 * @param {{
 *   set: import('../../domain/models/Set.js').Set,
 *   previousPersons: string[],
 *   onConfirm: (input: { purchaseDate: string|null, orderedByPerson: string|null }) => void,
 *   onCancel: () => void,
 * }} props
 */
export default function EditSessionModal({
  set,
  previousPersons,
  onConfirm,
  onCancel,
}) {
  return (
    <SessionDetailsModal
      title="সেশন সম্পাদনা"
      confirmLabel="সংরক্ষণ করুন"
      initialPurchaseDate={set.purchaseDate}
      initialOrderedByPerson={set.orderedByPerson}
      previousPersons={previousPersons}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
