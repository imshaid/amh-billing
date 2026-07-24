import { getAllPackages, deletePackage } from "../packages.repository.js";

/**
 * Deduplicates Packages by (name, rate) — keeps the most recently updated
 * copy of each group, deletes every other copy (locally AND on Supabase,
 * via `deletePackage` — see db/packages.repository.js). Fixes duplicate
 * packages that accumulated before this app had proper duplicate
 * prevention wired up (see this project's own history — a previous
 * localStorage-flag-based one-time migration attempt made this WORSE:
 * clearing browser cache on any device wiped the flag and re-ran the
 * migration, and concurrent delete+reseed across multiple devices raced
 * each other, producing more duplicates each time it ran).
 *
 * Deliberately NOT flag-gated — no localStorage check, no "run once"
 * marker of any kind. This function is naturally idempotent: if there are
 * no duplicates (the normal case, especially once
 * supabase_add_unique_constraint.sql's UNIQUE(name, rate) constraint is
 * in place preventing new ones from ever forming), every group has
 * exactly one member and nothing gets deleted. Safe and cheap to run on
 * every single app load — this replaces needing any flag/migration-marker
 * mechanism at all, which is what made the previous approach fragile.
 *
 * "Most recently updated" (by `updatedAt`) is kept rather than e.g. "first
 * created" — the most recent edit is the version most likely to reflect
 * what the person actually wants this package to look like right now.
 */
export async function dedupePackages() {
  try {
    const packages = await getAllPackages();

    /** @type {Map<string, import('../../domain/models/Package.js').Package[]>} */
    const groups = new Map();
    for (const pkg of packages) {
      const key = `${pkg.name}::${pkg.rate}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(pkg);
    }

    const toDelete = [];
    for (const group of groups.values()) {
      if (group.length <= 1) continue;
      const sorted = [...group].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      );
      // sorted[0] is the most recently updated — keep it, delete the rest.
      toDelete.push(...sorted.slice(1));
    }

    if (toDelete.length === 0) return;

    await Promise.all(toDelete.map((pkg) => deletePackage(pkg.id)));
    console.info(
      `[amh-billing] Deduplicated ${toDelete.length} duplicate package(s).`,
    );
  } catch (err) {
    console.warn("[amh-billing] Package deduplication failed:", err);
  }
}
