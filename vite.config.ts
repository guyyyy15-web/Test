import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

/** Emit sw.js with the build's file list baked in, so the app works offline after one visit. */
function serviceWorker(): Plugin {
  return {
    name: 'kalimba-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const publicFiles = ['manifest.webmanifest', ...readdirSync('public/icons').map((f) => `icons/${f}`)]
      const files = ['./', ...Object.keys(bundle), ...publicFiles]
      const version = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 10)
      const source = readFileSync('src/sw-template.js', 'utf8')
        .replace('__VERSION__', version)
        .replace('__PRECACHE__', JSON.stringify(files))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

// Published at /Test/ on GitHub Pages. Local dev serves over self-signed
// HTTPS because the mic needs a secure context.
export default defineConfig({
  base: '/Test/',
  plugins: [basicSsl(), serviceWorker()],
  test: {
    environment: 'node',
  },
})
