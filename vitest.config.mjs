import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'https://ga.jspm.io/npm:textarea-caret@3.1.0/index.js': fileURLToPath(new URL('./test/stubs/textarea-caret.js', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['**/*.test.js'],
    setupFiles: ['./test/setup.js'],
  },
});
