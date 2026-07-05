import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/testSetup.ts"],
  },
} as Record<string, unknown>);
