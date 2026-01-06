import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(
        env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY
      ),
      "process.env.GEMINI_API_KEY": JSON.stringify(
        env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY
      ),
      "process.env.VITE_UNSPLASH_ACCESS_KEY": JSON.stringify(
        env.VITE_UNSPLASH_ACCESS_KEY
      ),
      // Force the VITE_ prefix variables to be available if Vite is being picky
      "import.meta.env.VITE_UNSPLASH_ACCESS_KEY": JSON.stringify(
        env.VITE_UNSPLASH_ACCESS_KEY
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
