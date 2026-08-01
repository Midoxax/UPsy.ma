import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Kept separate from vite.config.ts so the app build never carries test
// config, and so the PWA/tagger plugins do not run during tests.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/unit/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/contexts/**", "src/components/ProtectedRoute.tsx", "src/components/AdminRoute.tsx"],
      reporter: ["text-summary"],
    },
  },
});
