import { describe, it, expect } from 'vitest'
import { makeRng, randomSeed } from './rng.js'

describe('makeRng', () => {
  it('produces the same stream for the same seed', () => {
    const a = makeRng(12345)
    const b = makeRng(12345)
    const streamA = Array.from({ length: 20 }, () => a.float())
    const streamB = Array.from({ length: 20 }, () => b.float())
    expect(streamA).toEqual(streamB)
  })

  it('produces different streams for different seeds', () => {
    const a = makeRng(1)
    const b = makeRng(2)
    expect(a.float()).not.toEqual(b.float())
  })

  it('stays within [0, 1)', () => {
    const rng = makeRng(99)
    for (let i = 0; i < 500; i++) {
      const value = rng.float()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('int is inclusive on both ends and never escapes the range', () => {
    const rng = makeRng(7)
    const seen = new Set()
    for (let i = 0; i < 1000; i++) seen.add(rng.int(1, 6))
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('int collapses an inverted or empty range to min', () => {
    const rng = makeRng(7)
    expect(rng.int(5, 5)).toBe(5)
    expect(rng.int(5, 2)).toBe(5)
  })

  it('chance saturates at the extremes', () => {
    const rng = makeRng(3)
    for (let i = 0; i < 50; i++) {
      expect(rng.chance(0)).toBe(false)
      expect(rng.chance(100)).toBe(true)
    }
  })

  it('chance is roughly calibrated', () => {
    const rng = makeRng(4)
    let hits = 0
    for (let i = 0; i < 10000; i++) if (rng.chance(25)) hits++
    expect(hits / 10000).toBeGreaterThan(0.22)
    expect(hits / 10000).toBeLessThan(0.28)
  })

  it('pick returns undefined for an empty list', () => {
    const rng = makeRng(5)
    expect(rng.pick([])).toBeUndefined()
    expect(rng.pick(undefined)).toBeUndefined()
  })

  it('weighted respects the weights', () => {
    const rng = makeRng(6)
    const entries = [
      { weight: 9, value: 'common' },
      { weight: 1, value: 'rare' },
    ]
    let rares = 0
    for (let i = 0; i < 5000; i++) if (rng.weighted(entries) === 'rare') rares++
    expect(rares / 5000).toBeGreaterThan(0.07)
    expect(rares / 5000).toBeLessThan(0.13)
  })

  it('weighted never returns a zero-weight entry', () => {
    const rng = makeRng(8)
    const entries = [
      { weight: 0, value: 'never' },
      { weight: 5, value: 'always' },
    ]
    for (let i = 0; i < 200; i++) expect(rng.weighted(entries)).toBe('always')
  })

  it('shuffle keeps every element and does not mutate the input', () => {
    const rng = makeRng(11)
    const source = [1, 2, 3, 4, 5, 6, 7, 8]
    const shuffled = rng.shuffle(source)
    expect(source).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(shuffled.slice().sort((a, b) => a - b)).toEqual(source)
  })

  it('resumes an identical stream from a saved state', () => {
    const rng = makeRng(4242)
    for (let i = 0; i < 10; i++) rng.float()
    const saved = rng.state

    const expected = Array.from({ length: 10 }, () => rng.float())
    const resumed = makeRng(saved)
    expect(Array.from({ length: 10 }, () => resumed.float())).toEqual(expected)
  })

  it('clone advances independently of the original', () => {
    const rng = makeRng(777)
    const copy = rng.clone()
    expect(copy.float()).toBe(rng.clone().float())
    copy.float()
    expect(copy.state).not.toBe(rng.state)
  })

  it('randomSeed returns a 32-bit unsigned integer', () => {
    for (let i = 0; i < 50; i++) {
      const seed = randomSeed()
      expect(Number.isInteger(seed)).toBe(true)
      expect(seed).toBeGreaterThanOrEqual(0)
      expect(seed).toBeLessThanOrEqual(0xffffffff)
    }
  })
})
