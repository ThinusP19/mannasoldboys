/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    hmr: {
      clientPort: 3000,
    },
    proxy: {
      '/api': 'http://127.0.0.1:3001',
      '/uploads': 'http://127.0.0.1:3001',
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "sw-push.js"],
      workbox: {
        // Don't precache the push service worker - it's handled separately
        navigateFallbackDenylist: [/^\/sw-push\.js$/],
        // Exclude push service worker from workbox
        globIgnores: ["**/sw-push.js"],
      },
      manifest: {
        name: "Potch Gim Alumni",
        short_name: "Potch Gim",
        description: "Connect with Potchefstroom Gymnasium alumni",
        theme_color: "#1a1a1a",
        background_color: "#f5f0e8",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/Logo.jpeg",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/Logo.jpeg",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@radix-ui/react-tooltip"],
    force: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "dist", "src/components/ui/**", "server/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "src/__tests__/",
        "src/components/ui/",
        "src/main.tsx",
        "vite.config.ts",
      ],
    },
    testTimeout: 10000,
  },
}));
