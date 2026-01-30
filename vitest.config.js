import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "edge-runtime",
    typecheck: {
      tsconfig: "./tsconfig.test.json",
    },
  },
  resolve: {
    alias: {
      "@hamzasaleemorg/convex-comments/test": path.resolve(__dirname, "./src/test.ts"),
      "@hamzasaleemorg/convex-comments/react": path.resolve(__dirname, "./src/react/index.ts"),
      "@hamzasaleemorg/convex-comments": path.resolve(__dirname, "./src/client/index.ts"),
    },
  },
});
