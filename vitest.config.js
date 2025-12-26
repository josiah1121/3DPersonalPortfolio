// vite.config.js
import { defineConfig } from 'vite'; // Changed from 'vitest/config'

export default defineConfig({
  // 1. Set base to '/' for custom domains (josiahclark.com)
  base: '/', 
  
  build: {
    outDir: 'dist', // Ensure this matches the 'path' in your ci.yaml
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.js',
    // poolOptions is the preferred way for newer Vitest versions, 
    // but singleThread: true is fine if you are on an older v0.x or v1.x
    poolOptions: {
      threads: {
        singleThread: true,
      }
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