// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';

// IMPORTANT: update `site` to your GitHub user/org and `base` to the repo name
// for project Pages (https://<user>.github.io/<repo>/). For a user/org page
// (https://<user>.github.io) set base to '/'.
export default defineConfig({
  site: 'https://your-username.github.io',
  base: '/AI-EDU',
  trailingSlash: 'ignore',
  integrations: [mdx(), preact()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
