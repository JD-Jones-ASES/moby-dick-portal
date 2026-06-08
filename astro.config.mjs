import { defineConfig } from "astro/config";

// Deployed to GitHub Pages as a project site:
//   https://jd-jones-ases.github.io/moby-dick-portal/
// `base` is applied to all built asset URLs; in-app links use import.meta.env.BASE_URL.
// Override locally with PAGES_BASE="" for root-path previews if ever needed.
const base = process.env.PAGES_BASE ?? "/moby-dick-portal";

export default defineConfig({
  site: "https://jd-jones-ases.github.io",
  base,
  output: "static",
  trailingSlash: "always"
});
