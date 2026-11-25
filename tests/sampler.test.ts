import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { sampleCount, sampleOrder, samplesFor, shutterMid, shutterWeights, splitSides } from '../src/core/sampler'

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
        expect(Math.abs(x.jitterX)).toBeLessThanOrEqual(0.62)
        expect(Math.abs(x.jitterY)).toBeLessThanOrEqual(0.62)
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

const sum = (v: number[]): number => v.reduce((a, x) => a + x, 0)
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
// The weights of a frame: samples that weigh alike, and samples under a shutter that opens and closes (shutterWeights).
const lists = (n: number): number[][] => [Array.from({ length: n }, () => 1 / n), shutterWeights(n, 0.5), shutterWeights(n, 0.25), shutterWeights(n, 0.1)]
const sizes = [2, 3, 4, 7, 8, 16, 24, 26, 49, 53, 64, 70, 128, 256]

describe('the samples of a frame of two views, shared by their light', () => {
  it('gives the first view none of them at a share of 0 and all of them at 1', () => {
    for (const n of sizes) {
      for (const w of lists(n)) {
        expect(splitSides(w, 0).some((first) => first)).toBe(false)
        expect(splitSides(w, 1).every((first) => first)).toBe(true)
      }
    }
  })
  it('gives the first view its share of the light to half a sample, at the end and at every time before it', () => {
    for (const n of sizes) {
      for (const w of lists(n)) {
        const top = Math.max(...w)
        for (const share of [0.1, 0.25, 0.3, 0.5, 0.618, 0.75, 0.9]) {
          const first = splitSides(w, share)
          expect(first.length).toBe(n)
          let had = 0
          let whole = 0
          w.forEach((x, i) => {
            whole += x
            if (first[i]) had += x
            expect(Math.abs(had - share * whole), n + ' ' + share + ' ' + i).toBeLessThanOrEqual(top / 2 + 1e-12)
          })
        }
      }
    }
  })
  it('takes every other sample at a share of a half, the first view first', () => {
    for (const n of sizes) {
      const even = splitSides(Array.from({ length: n }, () => 1 / n), 0.5)
      even.forEach((first, i) => expect(first, n + ' ' + i).toBe(i % 2 === 0))
      if (n % 2 === 0) {
        // Under a shutter that opens and closes as well, and then each view has one half of the light.
        for (const ends of [0.5, 0.25, 0.1]) {
          const w = shutterWeights(n, ends)
          const first = splitSides(w, 0.5)
          first.forEach((f, i) => expect(f, n + ' ' + ends + ' ' + i).toBe(i % 2 === 0))
          expect(sum(w.filter((_, i) => first[i]))).toBeCloseTo(0.5, 12)
        }
      }
    }
  })
  it('gives a share of the count where the samples weigh alike', () => {
    for (const n of [4, 16, 24, 64]) {
      const w = Array.from({ length: n }, () => 1 / n)
      for (let k = 0; k <= n; k++) expect(splitSides(w, k / n).filter((first) => first).length, n + ' ' + k).toBe(k)
    }
  })
  it('comes closer to the share than the count of the samples does under a shutter that opens and closes', () => {
    // 16 samples and a share of a half under ends of a half: the first eight samples bring half of the light, but a view that has
    // eight samples that lie early or late has less. By the light the two views have 0.5 each.
    const w = shutterWeights(16, 0.5)
    const byLight = splitSides(w, 0.5)
    expect(sum(w.filter((_, i) => byLight[i]))).toBeCloseTo(0.5, 12)
    // A quarter of the light: the first four of the sixteen samples are a quarter of the count, and bring 0.09 of the light.
    expect(sum(w.slice(0, 4))).toBeCloseTo(0.0898, 4)
    const quarter = splitSides(w, 0.25)
    expect(Math.abs(sum(w.filter((_, i) => quarter[i])) - 0.25)).toBeLessThanOrEqual(Math.max(...w) / 2)
  })
  it('is the same list each time', () => {
    expect(splitSides(shutterWeights(24, 0.5), 0.5)).toEqual(splitSides(shutterWeights(24, 0.5), 0.5))
  })
})

describe('the order of a sample among the samples of its frame, by their light', () => {
  const strides = [1, 3, 5, 7, 11, 13]
  it('is the order by the count where the samples weigh alike', () => {
    for (const n of sizes) {
      const w = Array.from({ length: n }, () => 1 / n)
      for (const stride of strides.filter((s) => gcd(s, n) === 1)) for (let i = 0; i < n; i++) expect(sampleOrder(w, i, stride), n + ' ' + stride + ' ' + i).toBeCloseTo(((i * stride) % n + 0.5) / n, 12)
    }
  })
  it('puts every sample at the middle of its own piece of the light: the pieces lie end to end from 0 to 1 in the order of the stride', () => {
    for (const n of sizes) {
      for (const w of lists(n)) {
        for (const stride of strides.filter((s) => gcd(s, n) === 1)) {
          const order = Array.from({ length: n }, (_, i) => sampleOrder(w, i, stride))
          const rank = Array.from({ length: n }, (_, i) => (i * stride) % n)
          const byRank = Array.from({ length: n }, (_, r) => rank.indexOf(r))
          let from = 0
          for (const i of byRank) {
            expect(order[i]!, n + ' ' + stride + ' ' + i).toBeCloseTo(from + w[i]! / 2, 12)
            from += w[i]!
          }
          expect(from).toBeCloseTo(1, 12)
        }
      }
    }
  })
  it('gives what is shown under a share of the order that share of the light, to half a sample', () => {
    for (const n of sizes) {
      for (const w of lists(n)) {
        const top = Math.max(...w)
        for (const stride of strides.filter((s) => gcd(s, n) === 1)) {
          for (const share of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
            const light = sum(w.filter((_, i) => sampleOrder(w, i, stride) < share))
            expect(Math.abs(light - share), n + ' ' + stride + ' ' + share).toBeLessThanOrEqual(top / 2 + 1e-12)
          }
        }
      }
    }
  })
  it('is off the share by more where the order is by the count: the case the order by the light is for', () => {
    // 16 samples under ends of a half, a stride of 5, a share of 0.3: by the count 5 samples are shown.
    const w = shutterWeights(16, 0.5)
    const byCount = sum(w.filter((_, i) => ((i * 5) % 16 + 0.5) / 16 < 0.3))
    const byLight = sum(w.filter((_, i) => sampleOrder(w, i, 5) < 0.3))
    expect(Math.abs(byLight - 0.3)).toBeLessThanOrEqual(Math.max(...w) / 2)
    expect(Math.abs(byLight - 0.3)).toBeLessThanOrEqual(Math.abs(byCount - 0.3))
  })
})
