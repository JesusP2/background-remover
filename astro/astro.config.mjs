// @ts-check
import { defineConfig, envField } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",

  vite: {
    plugins: [tailwindcss()],
  },

  env: {
    schema: {
      PYTHON_BACKEND_URL: envField.string({
        context: "client",
        access: "public",
      }),
    },
  },

  adapter: cloudflare(),
});
