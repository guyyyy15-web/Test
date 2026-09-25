import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { configDefaults } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  base: '/Test/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
    // japan-companion/ is a separate app with its own package.json and tests.
    exclude: [...configDefaults.exclude, 'japan-companion/**'],
  },
})
