import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  html: {
    template: './index.html',
  },
  source: {
    entry: {
      index: './src/app/main.tsx',
    },
  },
});
