import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  output: 'static',
  site: 'https://artemiopadilla.github.io',
  base: '/iran-conflict-tracker',
  vite: {
    define: {
      CESIUM_BASE_URL: JSON.stringify('/iran-conflict-tracker/cesium/'),
    },
  },
});
