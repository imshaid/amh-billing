import express from "express";
import cors from "cors";
import { requireApiKey } from "./middleware/auth.js";
import generatePdfRouter from "./routes/generatePdf.js";
import { closeBrowser } from "./lib/pdfEngine.js";

const app = express();

// Large HTML documents (a full Bill/Invoice/Summary page's markup, times
// however many pages are in one request) comfortably exceed Express's
// 100kb JSON default — this app's own pages run to tens of KB each once
// styles are inlined, and a multi-page batch multiplies that.
app.use(express.json({ limit: "50mb" }));

// CORS is intentionally open here (not locked to a specific origin) —
// the real access control for this service is the API-key check in
// requireApiKey (see that file's own doc comment), not origin-based CORS,
// since a browser CORS check is trivially bypassed by anything that isn't
// a browser anyway (curl, another server, etc). Origin restriction would
// add a maintenance burden (keeping this in sync with the frontend's
// deployed URL/any preview URLs) without adding real security on top of
// the API key.
app.use(cors());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", requireApiKey, generatePdfRouter);

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`PDF service listening on port ${port}`);
});

// Cloud Run sends SIGTERM before stopping a container instance (e.g. on
// scale-down or redeploy) — closing the shared Chromium browser here
// avoids leaving an orphaned process mid-shutdown, even though the whole
// container disappearing would clean it up anyway. Being explicit here
// also means local `npm run dev` + Ctrl-C shuts down cleanly.
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  await closeBrowser();
  server.close(() => process.exit(0));
});
