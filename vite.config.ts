import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/devimuth/' : '/', // Use /devimuth/ for production builds, / for development
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}))

