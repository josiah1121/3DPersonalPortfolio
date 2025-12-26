// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/', 
  
  build: {
    outDir: 'dist',
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.js',
    
    threads: {
      singleThread: true,
    },

    deps: {
      inline: ['vitest-canvas-mock'],
    },
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
  },
});