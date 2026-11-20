import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { sampleCount, samplesFor, shutterMid } from '../src/core/sampler'

describe('sampler', () => {
  it('is deterministic', () => {
    expect(samplesFor(16)).toEqual(samplesFor(16))
  })
  it('covers the shutter and the pixel', () => {
    for (const n of [4, 16, 64]) {
      const s = samplesFor(n)
      expect(s.length).toBe(n)
      const total = s.reduce((a, x) => a + x.weight, 0)
      expect(total).toBeCloseTo(1, 6)
      const ts = s.map((x) => x.timeOffset).sort((a, b) => a - b)
      expect(ts[0]!).toBeGreaterThanOrEqual(0)
      expect(ts[n - 1]!).toBeLessThanOrEqual(config.shutterFraction)
      for (let i = 0; i < n; i++) {
        expect(ts[i]!).toBeGreaterThanOrEqual((i / n) * config.shutterFraction - 1e-9)
        expect(ts[i]!).toBeLessThanOrEqual(((i + 1) / n) * config.shutterFraction + 1e-9)
      }
      for (const q of [[-0.5, 0], [0, 0.5]] as const) {
        expect(s.some((x) => x.jitterX >= q[0] && x.jitterX < q[1])).toBe(true)
        expect(s.some((x) => x.jitterY >= q[0] && x.jitterY < q[1])).toBe(true)
      }
      for (const x of s) {
        expect(Math.abs(x.jitterX)).toBeLessThanOrEqual(0.5)
        expect(Math.abs(x.jitterY)).toBeLessThanOrEqual(0.5)
      }
    }
  })
  it('places a single sample at the middle of the shutter with no jitter', () => {
    const s = samplesFor(1)
    expect(s[0]!.timeOffset).toBeCloseTo(shutterMid(), 9)
    expect(s[0]!.jitterX).toBe(0)
    expect(s[0]!.jitterY).toBe(0)
  })
  it('chooses the count by segment kind', () => {
    for (const [id, t] of Object.entries(config.tiers)) {
      for (const kind of ['hold', 'dive', 'terrain', 'rise', 'travel', 'retreat', 'lookback', 'fade'] as const) {
        expect(sampleCount(id, kind)).toBe(config.fastKinds.includes(kind) ? t.fastSamplesPerFrame : t.samplesPerFrame)
      }
    }
  })
})
