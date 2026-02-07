import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: [path.resolve(__dirname, "src/test/setup.ts")],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/test/**",
        "src/main.tsx",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Polyfill Node.js globals for browser compatibility (needed by amazon-cognito-identity-js)
  define: {
    global: "globalThis",
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/agent": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/agent/, ""),
      },
    },
  },
});
