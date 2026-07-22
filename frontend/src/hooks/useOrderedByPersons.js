import { useMemo } from "react";

/**
 * Derives the list of unique `orderedByPerson` names seen across every Set,
 * most-recently-used first — feeds the new-session modal's quick-select
 * (see NewSessionModal.jsx). There's no dedicated store for these names;
 * per the design decision behind this feature, `Set.orderedByPerson` is
 * still the only place a name lives (Supabase sync isn't wired up yet — see
 * Set.js's own doc comment), so this hook just scans the Sets already
 * loaded by `useSets` rather than adding a second IndexedDB store to keep in
 * sync with the first.
 *
 * Takes `sets` as a parameter (rather than calling `useSets` itself) so it
 * never triggers a second, redundant IndexedDB load — NewSessionModal is
 * opened from LandingPage, which already has `sets` from its own `useSets`
 * call.
 *
 * @param {import('../domain/models/Set.js').Set[]} sets
 * @returns {string[]}
 */
export function useOrderedByPersons(sets) {
  return useMemo(() => {
    const seen = new Set();
    const names = [];
    // `sets` is already sorted most-recently-updated-first (see useSets),
    // so a simple first-occurrence dedupe naturally keeps that recency
    // order for the quick-select list.
    for (const set of sets) {
      const name = set.orderedByPerson?.trim();
      if (name && !seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
    return names;
  }, [sets]);
}
