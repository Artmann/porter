import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    alias: {
      '@opentelemetry/api/build/esm/baggage/utils':
        '@opentelemetry/api/build/src/baggage/utils'
    }
  }
})
