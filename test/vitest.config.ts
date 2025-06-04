import * as path from 'path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  envDir: '.',
  test: {
    globalSetup: ['./setup.ts'],
    disableConsoleIntercept: false,
    environment: 'node',
    include: ['**/*.test.ts'],
    alias: {
      '@clober/v2-sdk': path.resolve(__dirname, '../src/index.ts'),
    },
    testTimeout: 40000000,
    hookTimeout: 40000000,
  },
})
