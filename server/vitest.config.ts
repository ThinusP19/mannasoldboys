import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [resolve(__dirname, './src/__tests__/setup.ts')],
    include: ['./src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        'src/__tests__/',
        'src/__mocks__/',
        'src/sync-database.ts',
        'src/test-connection.ts',
        'src/create-admin.ts',
        'src/add-*.ts',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
