import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react-router')) return 'react-router'
          if (id.includes('framer-motion')) return 'framer-motion'
          if (id.includes('react-dom') || id.includes('/react/') || id.endsWith('/react')) {
            return 'react-vendor'
          }
        },
      },
    },
  },
})
