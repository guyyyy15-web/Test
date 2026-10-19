import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// The kalimba app is published under /Test/kalimba/ next to the game at /Test/.
// Local dev serves over self-signed HTTPS because the mic needs a secure context.
export default defineConfig({
  base: '/Test/kalimba/',
  plugins: [basicSsl()],
  test: {
    environment: 'node',
  },
})
