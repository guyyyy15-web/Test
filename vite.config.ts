import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// The kalimba app is published at /Test/ on GitHub Pages.
// Local dev serves over self-signed HTTPS because the mic needs a secure context.
export default defineConfig({
  base: '/Test/',
  plugins: [basicSsl()],
  test: {
    environment: 'node',
  },
})
