import { describe, expect, it } from 'vitest'
import { hash01, stream } from '../src/core/random'

describe('seeded random', () => {
  it('gives the same values for the same stream', () => {
    const a = stream('stars')
    const b = stream('stars')
    const xs = Array.from({ length: 64 }, () => a.next())
    const ys = Array.from({ length: 64 }, () => b.next())
    expect(xs).toEqual(ys)
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })
  it('gives different values for different streams', () => {
    expect(stream('stars').next()).not.toBe(stream('dust').next())
  })
  it('hash01 is stable', () => {
    expect(hash01(12, 7)).toBe(hash01(12, 7))
    expect(hash01(12, 7)).not.toBe(hash01(12, 8))
  })
})
