import react from "@vitejs/plugin-react-swc";
import * as path from "path";
import glsl from "vite-plugin-glsl";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), glsl()],
  resolve: {
    extensions: [
      ".js",
      ".ts",
      ".jsx",
      ".tsx",
      ".json",
      ".png",
      ".svg",
      ".jpg",
      ".jpeg",
      ".glb",
    ],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
