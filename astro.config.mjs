import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

import vercel from '@astrojs/vercel';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react', 'react-dom/client']
    }
  },

  output: 'server',
  integrations: [react()],
  adapter: vercel()
});