import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: [resolve(__dirname, "src/test/setup.ts")],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/test/**",
        "src/styles/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@repo/ui": resolve(__dirname, "./src"),
      "@repo/ui/lib/utils": resolve(__dirname, "./src/lib/utils.ts"),
    },
  },
});
