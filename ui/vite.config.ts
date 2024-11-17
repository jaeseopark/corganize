import preact from "@preact/preset-vite";
import { defineConfig } from "vite";
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), tsconfigPaths()],
  server: {
    host: "0.0.0.0",
    port: 80,
  }
});
