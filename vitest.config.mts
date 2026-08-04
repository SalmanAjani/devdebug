import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolves the `@/*` alias straight from tsconfig.json, so tests import
  // modules by the same specifier the app does.
  resolve: { tsconfigPaths: true },
  test: {
    // Server actions and utilities only — components are out of scope, so
    // nothing here needs a DOM.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
