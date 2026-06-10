// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import node from '@astrojs/node';
import react from '@astrojs/react';

const isNetlify = process.env.NETLIFY === 'true';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: isNetlify
    ? netlify({ edgeMiddleware: false })
    : node({ mode: 'standalone' }),
  integrations: [react()],
  vite: {
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  }
});
