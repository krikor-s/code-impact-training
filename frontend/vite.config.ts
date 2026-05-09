import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    host: true,
    allowedHosts: [
      "frontend-development-f04a.up.railway.app",
      "frontend-stag-staging.up.railway.app",
    ],
  },
});
