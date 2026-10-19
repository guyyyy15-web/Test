import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Test/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
    // kalimba/ is a separate app with its own package and tests.
    exclude: [...configDefaults.exclude, 'kalimba/**'],
  },
})
