import SessionDetailsModal from "../shared/SessionDetailsModal.jsx";

/**
 * Modal shown on "নতুন সেশন" click (see LandingPage.jsx) — a thin wrapper
 * around the shared SessionDetailsModal (purchaseDate + orderedByPerson;
 * see that component's own doc comment for the full field-by-field
 * rationale), fixing the title/button label for the "creating" case.
 *
 * Buyer name was dropped from this flow entirely per an explicit design
 * change: buyer name is always typed directly into the Bill/Invoice page
 * itself (via the existing page-level EditableField,
 * autocompleteField="buyerName"), which already syncs onto the Set for
 * Previous Sessions to read (see useSessionSummaries.js). Asking for it a
 * second time here would just be a duplicate, easy-to-desync input.
 *
 * @param {{
 *   previousPersons: string[],
 *   onConfirm: (input: { purchaseDate: string|null, orderedByPerson: string|null }) => void,
 *   onCancel: () => void,
 * }} props
 */
export default function NewSessionModal({
  previousPersons,
  onConfirm,
  onCancel,
}) {
  return (
    <SessionDetailsModal
      title="নতুন সেশন"
      confirmLabel="শুরু করুন"
      previousPersons={previousPersons}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
