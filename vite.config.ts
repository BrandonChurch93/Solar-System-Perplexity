import { defineConfig } from 'vite'
import { computeHashes } from './tools/lib/hashes.ts'

export default defineConfig(() => {
  const h = computeHashes(process.cwd())
  return {
    base: './',
    define: {
      __ENGINE_HASH__: JSON.stringify(h.engine),
      __STOP_HASHES__: JSON.stringify(h.stops),
      __VERSIONS__: JSON.stringify(h.versions),
    },
    build: { target: 'es2022', chunkSizeWarningLimit: 2000, assetsInlineLimit: 0 },
    server: { host: '127.0.0.1' },
    test: { include: ['tests/**/*.test.ts'] },
  }
})
