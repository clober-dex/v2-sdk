import { defineConfig } from 'vitest/config'

export default defineConfig({
  envDir: '.',
  test: {
    disableConsoleIntercept: false,
    environment: 'node',
    include: ['*.test.ts'],
    alias: {
      '@clober-dex/v2-sdk': '../src/index.ts',
    },
    testTimeout: 40000000,
  },
})
