// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: netlify({
    edgeMiddleware: false
  }),
  integrations: [react()],
  vite: {
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  }
});
