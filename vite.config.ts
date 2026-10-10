import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { extractApi } from './server/extract-plugin.ts'

// base './' keeps the built site working from any sub-folder (XAMPP, GitHub Pages, a USB stick).
export default defineConfig(({ mode }) => ({
  base: './',
  // '' loads every variable (not only VITE_*) for the server side; nothing here reaches the browser bundle.
  plugins: [react(), tailwindcss(), extractApi(loadEnv(mode, process.cwd(), ''))],
  // Pre-bundle everything in one pass so React is never duplicated between dependency chunks.
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react-router', 'lucide-react', 'motion/react', 'maplibre-gl', 'clsx'],
  },
  resolve: { dedupe: ['react', 'react-dom'] },
  worker: { format: 'es' },
}))
