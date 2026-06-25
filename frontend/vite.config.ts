import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: process.env.NODE_ENV !== 'production',
  },
})
