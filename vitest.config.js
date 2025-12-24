// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.js',
    singleThread: true, // ← Vitest v4 replacement for poolOptions.threads.singleThread
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