// eslint-disable-next-line import/no-unresolved
import { defineConfig } from 'vitest/config'

export default defineConfig({
  envDir: '.',
  test: {
    disableConsoleIntercept: false,
    environment: 'node',
    include: ['src/tests/*.test.ts'],
  },
})
