/**
 * Minimal shared-secret auth for this service — per an explicit design
 * decision, the PDF endpoint should not be a fully open public endpoint
 * (anyone with the Cloud Run URL could otherwise trigger renders and burn
 * through the free tier / rack up cost). This is NOT full user auth or a
 * per-user API key system — there is exactly one shared secret
 * (PDF_API_KEY, set as a Cloud Run environment variable / secret), known
 * only to this backend and the frontend that calls it.
 *
 * The frontend sends it as `Authorization: Bearer <key>`. Requests without
 * a matching key get 401 before any Playwright work starts, so an
 * unauthenticated request never costs any Cloud Run CPU/memory time beyond
 * this one string comparison.
 *
 * This is deliberately simple (no per-client keys, no rotation, no OAuth)
 * because there is exactly one legitimate caller — the AMH Billing
 * frontend — not a multi-tenant API with many different clients needing
 * their own credentials. If that ever changes, this is the file to
 * replace, not extend.
 */
export function requireApiKey(req, res, next) {
  const expected = process.env.PDF_API_KEY;

  if (!expected) {
    // Fail closed, not open — a missing server-side secret is a
    // misconfiguration, not "no auth required". Better to 500 loudly at
    // deploy time than silently run wide open in production.
    console.error(
      "[auth] PDF_API_KEY is not set on the server — refusing all requests.",
    );
    return res.status(500).json({ error: "সার্ভার কনফিগারেশন ত্রুটি" });
  }

  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || token !== expected) {
    return res.status(401).json({ error: "অননুমোদিত অনুরোধ" });
  }

  next();
}
