import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Allows frontend to import from the root-level artifacts/ts without
      // relative path crawling — e.g.: import { HackathonEscrow } from '@artifacts'
      '@artifacts': path.resolve(__dirname, '../artifacts/ts'),

      // The artifact files live outside /frontend and have no local node_modules.
      // This alias ensures Vite always resolves @alephium/web3 (and its sub-modules)
      // from the frontend's own node_modules, regardless of where the importing
      // file is located in the monorepo.
      '@alephium/web3': path.resolve(__dirname, 'node_modules/@alephium/web3'),
    },
  },
})
