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
  it('has no mean offset and stays inside the pixel at every count from 1 to the largest a tier may take', () => {
    for (let n = 1; n <= Math.max(...named); n++) {
      const s = samplesFor(n)
      expect(Math.abs(mean(s.map((x) => x.jitterX)))).toBeLessThanOrEqual(1e-12)
      expect(Math.abs(mean(s.map((x) => x.jitterY)))).toBeLessThanOrEqual(1e-12)
      for (const x of s) {
        expect(Math.abs(x.jitterX)).toBeLessThan(0.5)
        expect(Math.abs(x.jitterY)).toBeLessThan(0.5)
      }
    }
  })
  it('keeps one sample at the middle of the pixel', () => {
    expect([...jitterOffsets(1)]).toEqual([0, 0])
    expect([samplesFor(1)[0]!.jitterX, samplesFor(1)[0]!.jitterY]).toEqual([0, 0])
  })
  it('keeps the order of the sequence it was on each axis', () => {
    for (const n of named.filter((c) => c > 1)) {
      const was = Array.from({ length: n }, (_, i) => [(0.5 + (i + 1) / G) % 1, (0.5 + (i + 1) / (G * G)) % 1] as const)
      const s = samplesFor(n)
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          expect(Math.sign(s[i]!.jitterX - s[j]!.jitterX)).toBe(Math.sign(was[i]![0] - was[j]![0]))
          expect(Math.sign(s[i]!.jitterY - s[j]!.jitterY)).toBe(Math.sign(was[i]![1] - was[j]![1]))
        }
      }
    }
  })
  it('puts one sample at the middle of each of n equal strips of the pixel on each axis, at every count', () => {
    for (let n = 2; n <= Math.max(...named); n++) {
      const s = samplesFor(n)
      const xs = s.map((x) => x.jitterX).sort((a, b) => a - b)
      const ys = s.map((x) => x.jitterY).sort((a, b) => a - b)
      for (let k = 0; k < n; k++) {
        expect(xs[k]!).toBeCloseTo((k + 0.5) / n - 0.5, 12)
        expect(ys[k]!).toBeCloseTo((k + 0.5) / n - 0.5, 12)
      }
    }
  })
  it('moves no sample further than 0.1 of a pixel from the place the sequence less its mean gave it', () => {
    for (const n of named.filter((c) => c > 1)) {
      const was = Array.from({ length: n }, (_, i) => [((0.5 + (i + 1) / G) % 1) - 0.5, ((0.5 + (i + 1) / (G * G)) % 1) - 0.5] as const)
      const mx = mean(was.map((w) => w[0]))
      const my = mean(was.map((w) => w[1]))
      samplesFor(n).forEach((x, i) => {
        expect(Math.abs(x.jitterX - (was[i]![0] - mx))).toBeLessThanOrEqual(0.1)
        expect(Math.abs(x.jitterY - (was[i]![1] - my))).toBeLessThanOrEqual(0.1)
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
