import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

// cwd, not import.meta.url: Vite rewrites module URLs against the `/Test/`
// base path, which is not a filesystem path.
const ENGINE_DIR = join(process.cwd(), 'src', 'engine')

/** rng.js owns the single sanctioned seed source; nothing else may roll dice. */
const ALLOWED = new Set(['rng.js'])

function jsFilesUnder(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...jsFilesUnder(full))
    else if (entry.endsWith('.js') && !entry.endsWith('.test.js')) out.push(full)
  }
  return out
}

describe('engine determinism', () => {
  it('never calls Math.random outside rng.js', () => {
    const offenders = jsFilesUnder(ENGINE_DIR)
      .filter((file) => !ALLOWED.has(relative(ENGINE_DIR, file)))
      .filter((file) => /Math\s*\.\s*random/.test(readFileSync(file, 'utf8')))
      .map((file) => relative(ENGINE_DIR, file))

    expect(offenders).toEqual([])
  })

  it('never reaches for Date.now outside rng.js', () => {
    // Wall-clock time is as unreproducible as Math.random. Playtime is tracked
    // by the UI layer and handed to the engine as an explicit delta.
    const offenders = jsFilesUnder(ENGINE_DIR)
      .filter((file) => !ALLOWED.has(relative(ENGINE_DIR, file)))
      .filter((file) => /Date\s*\.\s*now|new\s+Date\s*\(/.test(readFileSync(file, 'utf8')))
      .map((file) => relative(ENGINE_DIR, file))

    expect(offenders).toEqual([])
  })

  it('never imports React into the engine', () => {
    const offenders = jsFilesUnder(ENGINE_DIR)
      .filter((file) => /from\s+['"]react/.test(readFileSync(file, 'utf8')))
      .map((file) => relative(ENGINE_DIR, file))

    expect(offenders).toEqual([])
  })
})
