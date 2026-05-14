import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  envDir: "..",
  test: {
    environment: "jsdom",
    globals: true,
  },
  server: {
    host: true,
    allowedHosts: [
      "frontend-development-f04a.up.railway.app",
      "frontend-stag-staging.up.railway.app",
      "frontend-prod-production-3da1.up.railway.app",
    ],
  },
});
