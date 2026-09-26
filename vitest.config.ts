import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },

  test: {
    globals: true,

    projects: [
      {
        test: {
          name: 'domain',
          include: ['packages/domain/**/*.test.ts'],
          environment: 'node',
        },
      },

      {
        test: {
          name: 'api',
          include: ['packages/api/tests/**/*.test.ts'],
          environment: 'node',
          setupFiles: ['packages/db/src/testing/setup.ts'],
          fileParallelism: false,
        },
      },

      {
        test: {
          name: 'db',
          include: ['packages/db/**/*.test.ts'],
          environment: 'node',
          setupFiles: ['packages/db/src/testing/setup.ts'],
          fileParallelism: false,
        },
      },

      {
        test: {
          name: 'scheduling',
          include: ['packages/scheduling/**/*.test.ts'],
          environment: 'node',
        },
      },

      {
        test: {
          name: 'web',
          include: ['apps/web/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
        },
      },
    ],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
})
