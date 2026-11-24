import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { jitterOffsets } from '../src/core/jitter'
import { samplesFor } from '../src/core/sampler'

const G = 1.32471795724474602596
const named = [...new Set([1, 4, 16, 64, ...Object.values(config.tiers).flatMap((t) => [t.samplesPerFrame, t.fastSamplesPerFrame, t.maxSamplesPerFrame])])].sort((a, b) => a - b)
const mean = (v: number[]): number => v.reduce((a, x) => a + x, 0) / v.length

describe('the place of the samples inside a pixel', () => {
  it('has no mean offset at any count the tiers name, so the picture does not step where the count changes', () => {
    for (const n of named) {
      const s = samplesFor(n)
      expect(s.length).toBe(n)
      expect(Math.abs(mean(s.map((x) => x.jitterX)))).toBeLessThanOrEqual(1e-12)
      expect(Math.abs(mean(s.map((x) => x.jitterY)))).toBeLessThanOrEqual(1e-12)
    }
  })
  it('has no mean offset and stays near the pixel at every count from 1 to the largest a tier may take', () => {
    for (let n = 1; n <= Math.max(...named); n++) {
      const s = samplesFor(n)
      expect(Math.abs(mean(s.map((x) => x.jitterX)))).toBeLessThanOrEqual(1e-12)
      expect(Math.abs(mean(s.map((x) => x.jitterY)))).toBeLessThanOrEqual(1e-12)
      for (const x of s) {
        expect(Math.abs(x.jitterX)).toBeLessThanOrEqual(0.62)
        expect(Math.abs(x.jitterY)).toBeLessThanOrEqual(0.62)
      }
    }
  })
  it('keeps one sample at the middle of the pixel', () => {
    expect([...jitterOffsets(1)]).toEqual([0, 0])
    expect([samplesFor(1)[0]!.jitterX, samplesFor(1)[0]!.jitterY]).toEqual([0, 0])
  })
  it('is the sequence it was, each count less its own mean, in the order it was', () => {
    for (const n of named.filter((c) => c > 1)) {
      const was = Array.from({ length: n }, (_, i) => [((0.5 + (i + 1) / G) % 1) - 0.5, ((0.5 + (i + 1) / (G * G)) % 1) - 0.5] as const)
      const mx = mean(was.map((w) => w[0]))
      const my = mean(was.map((w) => w[1]))
      samplesFor(n).forEach((x, i) => {
        expect(x.jitterX).toBeCloseTo(was[i]![0] - mx, 12)
        expect(x.jitterY).toBeCloseTo(was[i]![1] - my, 12)
      })
    }
  })
  it('does not touch the times, the weights or the share of the shutter', () => {
    for (const n of named) {
      samplesFor(n).forEach((x, i) => {
        expect(x.timeOffset).toBe(n === 1 ? samplesFor(1)[0]!.timeOffset : ((i + 0.5) / n) * config.shutterFraction)
        expect(x.weight).toBe(1 / n)
      })
      for (const share of [0.25, 0.5]) samplesFor(n, share).forEach((x, i) => expect([x.jitterX, x.jitterY]).toEqual([samplesFor(n)[i]!.jitterX, samplesFor(n)[i]!.jitterY]))
    }
  })
  it('is the same list each time', () => {
    expect([...jitterOffsets(16)]).toEqual([...jitterOffsets(16)])
    expect(samplesFor(64)).toEqual(samplesFor(64))
  })
})
