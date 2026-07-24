import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const pagesBase = repositoryName ? `/${repositoryName}/` : '/';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || pagesBase,
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('three/examples/jsm/postprocessing')) return 'three-postprocessing';
          if (id.includes('node_modules/three')) return 'three-runtime';
          if (id.includes('node_modules/gsap')) return 'motion-runtime';
          if (id.includes('node_modules/react')) return 'react-runtime';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
