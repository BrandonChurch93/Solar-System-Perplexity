import { describe, expect, it } from 'vitest'
import { config } from '../src/config'

const CORE = (config.raw.travel.sky.flightStrip.stop as { core: number }).core

const read = (core: number, px: number, py: number): { sum: number; peak: number } => {
  let sum = 0
  let peak = 0
  for (let j = -8; j <= 8; j++) {
    for (let i = -8; i <= 8; i++) {
      const v = Math.exp(-((i - px) * (i - px) + (j - py) * (j - py)) / core)
      sum += v
      peak = Math.max(peak, v)
    }
  }
  return { sum: sum / (Math.PI * core), peak }
}

const over = (core: number): { sum: number[]; peak: number[] } => {
  const sum = [Infinity, 0]
  const peak = [Infinity, 0]
  for (let a = 0; a <= 20; a++) {
    for (let b = 0; b <= 20; b++) {
      const r = read(core, a / 20, b / 20)
      sum[0] = Math.min(sum[0]!, r.sum)
      sum[1] = Math.max(sum[1]!, r.sum)
      peak[0] = Math.min(peak[0]!, r.peak)
      peak[1] = Math.max(peak[1]!, r.peak)
    }
  }
  return { sum, peak }
}

describe('the footprint of the points and the grain of the stop band on the pixel grid', () => {
  it('keeps the light of a point at any place on the grid, one sample a pixel', () => {
    const { sum } = over(CORE)
    expect(sum[0]).toBeGreaterThan(0.999)
    expect(sum[1]).toBeLessThan(1.001)
  })

  it('keeps the brightest sample of a point within 35 percent over the grid', () => {
    const { peak } = over(CORE)
    expect(peak[0]! / peak[1]!).toBeGreaterThan(0.65)
    expect(over(0.7).peak[0]! / over(0.7).peak[1]!).toBeLessThan(0.5)
  })

  it('stays a point: the half width is under two pixels of the master format', () => {
    expect(2 * Math.sqrt(CORE * Math.LN2)).toBeLessThan(2)
  })
})
