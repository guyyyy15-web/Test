import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base './' so the build works from any sub-path (GitHub Pages serves /<repo>/).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Japan Companion · יפן בכיס',
        short_name: 'יפן בכיס',
        description: 'Phrases, show-cards and a yen converter for travelers in Japan.',
        lang: 'he',
        dir: 'rtl',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        background_color: '#faf8f4',
        theme_color: '#faf8f4',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
