// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mkcert from "vite-plugin-mkcert";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss(), mkcert()],
  },
});
