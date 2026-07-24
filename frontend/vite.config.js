import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// AMH Billing — single-tenant offline-first billing app for Adarsha Munshir Hotel.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "AMH Billing",
        short_name: "AMH Billing",
        description: "Bill / Invoice generator for Adarsha Munshir Hotel",
        theme_color: "#285AA0",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        // App shell + assets are cached for fast loads / installability;
        // Supabase (not Cache Storage, and no local IndexedDB) is the
        // source of truth for actual billing data — see this project's
        // own decision to remove the IndexedDB caching layer entirely.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
    }),
  ],
});
