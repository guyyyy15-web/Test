import { describe, it, expect } from 'vitest'
import { cameraFor, tileSizeFor, viewportTiles } from './renderFloor.js'

/**
 * The camera is the one piece of the renderer with real logic in it: get the
 * clamp wrong and the player walks off screen or the view shows the void
 * beyond the map edge.
 */

const floor = (width, height) => ({ width, height })

describe('cameraFor', () => {
  it('centres on the party in the middle of a big floor', () => {
    const camera = cameraFor(floor(40, 40), { x: 20, y: 20 }, 11, 9)
    expect(camera.x).toBe(15)
    expect(camera.y).toBe(16)
  })

  it('stops at the top-left corner instead of showing the void', () => {
    const camera = cameraFor(floor(40, 40), { x: 0, y: 0 }, 11, 9)
    expect(camera.x).toBe(0)
    expect(camera.y).toBe(0)
  })

  it('stops at the bottom-right corner', () => {
    const camera = cameraFor(floor(40, 30), { x: 39, y: 29 }, 11, 9)
    expect(camera.x).toBe(29)
    expect(camera.y).toBe(21)
  })

  it('centres a floor smaller than the viewport', () => {
    const camera = cameraFor(floor(10, 8), { x: 5, y: 4 }, 20, 16)
    expect(camera.x).toBe(-5)
    expect(camera.y).toBe(-4)
  })

  it('follows a fractional position mid-step', () => {
    const camera = cameraFor(floor(40, 40), { x: 20.5, y: 20 }, 11, 9)
    expect(camera.x).toBeCloseTo(15.5)
  })
})

describe('viewport sizing', () => {
  it('uses smaller tiles on a phone than a desktop', () => {
    expect(tileSizeFor(390)).toBeLessThan(tileSizeFor(1200))
  })

  it('keeps tiles within a sane range at any width', () => {
    for (const width of [200, 390, 768, 1440, 4000]) {
      const size = tileSizeFor(width)
      expect(size).toBeGreaterThanOrEqual(22)
      expect(size).toBeLessThanOrEqual(64)
    }
  })

  it('derives enough rows and columns to cover the canvas', () => {
    const { cols, rows, size } = viewportTiles(390, 700)
    expect(cols * size).toBeGreaterThanOrEqual(390)
    expect(rows * size).toBeGreaterThanOrEqual(700)
  })
})
