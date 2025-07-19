import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // --- INSERT THE NEW LINES HERE ---
  build: {
    outDir: 'dist',
  },
  // ---------------------------------

  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
