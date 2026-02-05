import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  shims: true,
  // Mark peer dependencies as external so they use the host app's versions
  // This prevents duplicate React contexts (QueryClient, wagmi, etc.)
  external: [
    'react',
    'react-dom',
    '@tanstack/react-query',
    'wagmi',
    'viem',
  ],
})
