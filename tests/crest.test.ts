import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import type { SetContext } from '../src/core/types'
import { CREST_BEHIND, CREST_SPAN, boxMean, crestCells, crestEnds, crestField, crestRim, crestRing, crestTexels, slide, type CrestField } from '../src/terrain/crest'
import { Relief, SHEET_GLSL, withEdge, withPresence, withSheets, type ReliefDef, type ReliefMotion } from '../src/terrain/relief'

// The crests of a relief (src/terrain/crest.ts, ReliefMotion.crest): where a layer's distances step, the cells of the step are drawn as
// a sheet of the near side over a sheet of the far side in place of the wall. Here: the finding on maps made for it, and what a relief
// builds from it. The pixels are tests/crest-gl.test.ts.

const W = 64
const H = 48
const FAR = 20
const NEAR = 5
// A step from the far ground on the left to the near ground on the right: columns under from are far, columns from + width and beyond
// are near, between them the inverse distance runs straight. Both grounds lean a little down the map, as ground does.
const stepMap = (from: number, width: number): Float32Array => {
  const d = new Float32Array(W * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = Math.min(1, Math.max(0, (x - from + 1) / (width + 1)))
      d[y * W + x] = 1 / ((1 / FAR) * (1 - t) + (1 / NEAR) * t + y * 2e-5)
    }
  }
  return d
}
// The same step lying flat: the far ground above, the near ground below.
const flatMap = (from: number, width: number): Float32Array => {
  const d = new Float32Array(W * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = Math.min(1, Math.max(0, (y - from + 1) / (width + 1)))
      d[y * W + x] = 1 / ((1 / FAR) * (1 - t) + (1 / NEAR) * t + x * 2e-5)
    }
  }
  return d
}
// Two steps side by side on a map w wide: the far ground on the left, a ground between them, the near ground on the right. Each
// step runs over three columns, from the column first and from the column second.
const MID = 10
const pairMap = (w: number, first: number, second: number): Float32Array => {
  const d = new Float32Array(w * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < w; x++) {
      const t = Math.min(1, Math.max(0, (x - first + 1) / 4))
      const u = Math.min(1, Math.max(0, (x - second + 1) / 4))
      d[y * w + x] = 1 / (1 / FAR + (1 / MID - 1 / FAR) * t + (1 / NEAR - 1 / MID) * u + y * 2e-5)
    }
  }
  return d
}
const NUMBERS = { step: 0.02, walk: 8, under: 12 }
// What the byte of the cut says: how many texels the texel lies from the cut, over 0 on the near side, held at half the span.
const lies = (byte: number): number => (byte / 255 - 0.5) * CREST_SPAN
const held = (texels: number): number => Math.min(CREST_SPAN / 2, Math.max(-CREST_SPAN / 2, texels))

describe('the finding of the crests', () => {
  it('slides the least and the greatest of a window as the plain count does', () => {
    const w = 23
    const h = 17
    const src = new Float32Array(w * h)
    let seed = 12345
    for (let i = 0; i < src.length; i++) {
      seed = (seed * 1103515245 + 12345) % 2147483648
      src[i] = seed / 2147483648
    }
    for (const radius of [1, 3, 30]) {
      for (const greatest of [false, true]) {
        const got = slide(src, w, h, radius, greatest)
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            let want = greatest ? -Infinity : Infinity
            for (let yy = Math.max(0, y - radius); yy <= Math.min(h - 1, y + radius); yy++) {
              for (let xx = Math.max(0, x - radius); xx <= Math.min(w - 1, x + radius); xx++) want = greatest ? Math.max(want, src[yy * w + xx]!) : Math.min(want, src[yy * w + xx]!)
            }
            expect(got[y * w + x]).toBe(want)
          }
        }
      }
    }
    const mean = boxMean(src, w, h, 2)
    let sum = 0
    for (let yy = 3; yy <= 7; yy++) for (let xx = 8; xx <= 12; xx++) sum += src[yy * w + xx]!
    expect(mean[5 * w + 10]).toBeCloseTo(sum / 25, 6)
  })

  it('finds no crest on even ground and none on a slope wider than a walk', () => {
    const even = new Float32Array(W * H)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) even[y * W + x] = 1 / (0.05 + x * 1e-4 + y * 2e-5)
    for (const map of [even, stepMap(12, 40)]) {
      const f = crestField(map, W, H, 8, NUMBERS)
      expect(f.ramps).toBe(0)
      for (let i = 0; i < W * H; i++) {
        expect(f.near[i]).toBe(map[i])
        expect(f.far[i]).toBe(map[i])
        expect(f.share[i]).toBe(0)
        expect(f.away[i]).toBe(255)
      }
      expect(crestCells(f, 8, 6).some((k) => k !== 0)).toBe(false)
    }
  })

  it('finds a step, gives each side its own distance to the bit and the other side the distance of its end', () => {
    const map = stepMap(30, 3)
    const f = crestField(map, W, H, 8, NUMBERS)
    expect(f.ramps).toBeGreaterThan(0)
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x
        // The ramp is columns 30 to 32; half a cell (4 texels) to either side is all a ramp texel may lie from it.
        if (f.ramp[i]) expect(x >= 30 - 5 && x <= 32 + 5).toBe(true)
        if (x >= 30 && x <= 32 && y >= 10 && y < H - 10) expect(f.ramp[i]).toBe(1)
        if (f.ramp[i]) {
          expect(Math.abs(f.near[i]! - NEAR)).toBeLessThan(0.05)
          expect(Math.abs(f.far[i]! - FAR)).toBeLessThan(0.5)
          continue
        }
        if (f.away[i] === 255) {
          expect(f.near[i]).toBe(map[i])
          expect(f.far[i]).toBe(map[i])
          expect(f.share[i]).toBe(0)
        } else if (x > 32) {
          // The near side: its own distance, the far side's under it, the cut as far to its left as the ramp's middle column is,
          // the far ground to the left.
          expect(f.near[i]).toBe(map[i])
          expect(Math.abs(f.far[i]! - FAR)).toBeLessThan(0.5)
          expect(Math.abs(lies(f.share[i]!) - held(x - 31))).toBeLessThan(0.1)
          expect(f.toFarX[i]!).toBeLessThan(-(x - 30))
          expect(x + f.toFarX[i]!).toBeGreaterThanOrEqual(30 - 6)
        } else {
          // The far side: its own distance, the near side's over it, the cut to its right. Beside the ramp (where a cut moved out
          // could take it) it knows the way to its own ground further out, beyond that it has no way.
          expect(f.far[i]).toBe(map[i])
          expect(Math.abs(f.near[i]! - NEAR)).toBeLessThan(0.05)
          expect(Math.abs(lies(f.share[i]!) - held(x - 31))).toBeLessThan(0.1)
          expect(f.side[i]).toBe(0)
          if (f.away[i]! > 2) {
            expect(f.toFarX[i]).toBe(0)
            expect(f.toFarY[i]).toBe(0)
          } else {
            // The far end: the first even ground left of the ramp's texels, within a texel of column 25.
            expect(x + f.toFarX[i]!).toBeGreaterThanOrEqual(30 - 6)
            expect(x + f.toFarX[i]!).toBeLessThanOrEqual(30 - 4)
          }
        }
      }
    }
    // The cut: across the ramp and its band the byte rises with the place, a texel of the map to an eighth of its run, from none
    // four texels before the ramp's middle column to all four texels beyond it, and half of it lies on that column. Beyond the
    // band (26 texels here) nothing is a sheet and the byte is left at none.
    const row = 24 * W
    for (let x = 1; x < W; x++) if (f.away[row + x] !== 255) expect(f.share[row + x]!).toBeGreaterThanOrEqual(f.share[row + x - 1]!)
    expect(f.away[row + 62]).toBe(26)
    expect(f.away[row + 63]).toBe(255)
    expect(f.share[row + 63]).toBe(0)
    expect(f.share[row + 27]).toBe(0)
    expect(f.share[row + 35]).toBe(255)
    for (let x = 28; x <= 34; x++) expect(Math.abs(f.share[row + x]! - (0.5 + (x - 31) / CREST_SPAN) * 255)).toBeLessThanOrEqual(2)
  })

  it('packs the field into bytes that give the way to the far ground back within a step of the scale', () => {
    const f = crestField(stepMap(30, 3), W, H, 8, NUMBERS)
    const { cut: t, back } = crestTexels(f)
    const k = f.reach / 127
    let ways = 0
    for (let i = 0; i < W * H; i++) {
      expect(t[i * 4]).toBe(f.share[i])
      expect(Math.abs((t[i * 4 + 1]! - 128) * k - f.toFarX[i]!)).toBeLessThanOrEqual(k / 2 + 1e-6)
      expect(Math.abs((t[i * 4 + 2]! - 128) * k - f.toFarY[i]!)).toBeLessThanOrEqual(k / 2 + 1e-6)
      expect(t[i * 4 + 3]).toBe(255)
      expect(Math.abs((back[i * 4]! - 128) * k - f.toNearX[i]!)).toBeLessThanOrEqual(k / 2 + 1e-6)
      expect(Math.abs((back[i * 4 + 1]! - 128) * k - f.toNearY[i]!)).toBeLessThanOrEqual(k / 2 + 1e-6)
      expect(back[i * 4 + 2]).toBe(0)
      expect(back[i * 4 + 3]).toBe(255)
      if (f.toNearX[i] !== 0) ways++
    }
    expect(ways).toBeGreaterThan(0)
  })

  it('names the cells: the step is drawn as sheets, the near side beside it gets the far sheet under it, the rest is left', () => {
    const f = crestField(stepMap(30, 3), W, H, 8, NUMBERS)
    const kinds = crestCells(f, 8, 6)
    for (let cj = 1; cj < 5; cj++) {
      // Cells are 8 texels: columns 24 to 31 and 32 to 39 hold the ramp and its half cell to either side.
      expect(kinds[cj * 8 + 3]).toBe(1)
      expect(kinds[cj * 8 + 4]).toBe(1)
      expect(kinds[cj * 8 + 0]).toBe(0)
      expect(kinds[cj * 8 + 1]).toBe(0)
      expect(kinds[cj * 8 + 5]).toBe(2)
      expect(kinds[cj * 8 + 7]).toBe(0)
    }
    expect(crestCells(crestField(stepMap(30, 3), W, H, 8, { ...NUMBERS, under: 0 }), 8, 6).some((k) => k === 2)).toBe(false)
  })

  it('knows the side of a texel by its place beside the step, whatever its own distance is, and the way to the near ground', () => {
    // A step from one texel to the next (column 29 far, column 30 near) and a hollow in the near ground, 10 texels right of the
    // ramp: by its distance the hollow lies beyond the step's middle, by its place it is the near side's. The step asked for is
    // larger than the hollow is deep, so the hollow is no crest of its own.
    const map = stepMap(30, 0)
    for (let y = 22; y < 26; y++) for (let x = 44; x < 46; x++) map[y * W + x] = 1 / (1 / NEAR - 0.08)
    const f = crestField(map, W, H, 8, { ...NUMBERS, step: 0.1 })
    expect(f.ramps).toBeGreaterThan(0)
    expect(1 / map[23 * W + 44]!).toBeLessThan((1 / FAR + 1 / NEAR) / 2)
    expect(f.ramp[23 * W + 44]).toBe(0)
    expect(f.away[23 * W + 44]).toBe(11)
    for (let y = 12; y < H - 12; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x
        if (f.away[i] === 255) {
          expect(f.side[i]).toBe(0)
          continue
        }
        expect(f.side[i]).toBe(x >= 30 ? 1 : 0)
        // The cut lies between the two columns of the step.
        expect(Math.abs(lies(f.share[i]!) - held(x - 29.5))).toBeLessThan(0.1)
        if (x >= 30) {
          if (!f.ramp[i]) expect(f.near[i]).toBe(map[i])
          expect(Math.abs(f.far[i]! - FAR)).toBeLessThan(0.5)
        }
        // The near end: the first even ground right of the ramp's texels, column 34. A texel far from the ramp asks itself.
        if (f.ramp[i] || f.away[i]! <= 14) {
          expect(Math.abs(x + f.toNearX[i]! - 34)).toBeLessThanOrEqual(1)
          expect(Math.abs(f.toNearY[i]!)).toBeLessThanOrEqual(1)
        } else {
          expect(f.toNearX[i]).toBe(0)
          expect(f.toNearY[i]).toBe(0)
        }
      }
    }
  })

  it('gives a texel beside a ramp the ramp texel nearest to it, not one along a diagonal', () => {
    // Beside a ramp that runs straight down the map every texel of the band reads the far ground on its own row, to a texel.
    const f = crestField(stepMap(30, 3), W, H, 8, NUMBERS)
    let read = 0
    for (let y = 12; y < H - 12; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x
        if (f.away[i] === 255 || f.ramp[i]) continue
        expect(f.away[i]).toBe(x < 26 ? 26 - x : x - 36)
        if (f.toFarX[i] === 0 && f.toFarY[i] === 0) continue
        expect(Math.abs(f.toFarY[i]!)).toBeLessThanOrEqual(1)
        read++
      }
    }
    expect(read).toBeGreaterThan(0)
  })

  it('moves the cut out by the number the stop gives and reads the far ground as much further out', () => {
    const map = stepMap(30, 3)
    const f0 = crestField(map, W, H, 8, NUMBERS)
    const f = crestField(map, W, H, 8, { ...NUMBERS, out: 2 })
    // The finding is the same: the ramp, the sides and the distances of the two sheets.
    expect(f.ramp).toEqual(f0.ramp)
    expect(f.side).toEqual(f0.side)
    expect(f.near).toEqual(f0.near)
    expect(f.far).toEqual(f0.far)
    expect(f.toNearX).toEqual(f0.toNearX)
    let taken = 0
    for (let y = 12; y < H - 12; y++) {
      const row = y * W
      // The cut, a line straight down the map here, lies 2 texels further left, the byte as it was.
      for (let x = 2; x < W - 2; x++) if (f.away[row + x] !== 255 && f0.away[row + x + 2] !== 255) expect(Math.abs(f.share[row + x]! - f0.share[row + x + 2]!)).toBeLessThanOrEqual(1)
      expect(f.share[row + 25]).toBe(0)
      expect(f.share[row + 33]).toBe(255)
      expect(Math.abs(f.share[row + 29]! - 127.5)).toBeLessThanOrEqual(2)
      for (let x = 0; x < W; x++) {
        const i = row + x
        if (!(f.share[i]! > 127)) continue
        // Every texel inside the cut reads the far ground 2 texels beyond the far end (column 25), and so beyond the cut.
        expect(x + f.toFarX[i]!).toBeGreaterThanOrEqual(25 - 2 - 1)
        expect(x + f.toFarX[i]!).toBeLessThanOrEqual(25 - 2 + 1)
        expect(x + f0.toFarX[i]! - (x + f.toFarX[i]!)).toBeGreaterThan(1.9)
        if (!f.side[i]) taken++
      }
    }
    expect(taken).toBeGreaterThan(0)
    // A cell that holds a texel of the far side the near side may reach (the cut and four texels more, for the pixel and a half
    // its edge lies beyond the cut) is drawn as sheets: with the cut 7 texels out, on column 24, that is from column 21 on, in the
    // cells of columns 16 to 23 and their one texel more.
    const wide = crestField(map, W, H, 8, { ...NUMBERS, out: 7 })
    const kinds0 = crestCells(f0, 8, 6)
    const kinds = crestCells(wide, 8, 6, 7)
    for (let cj = 1; cj < 5; cj++) {
      expect(kinds0[cj * 8 + 2]).toBe(0)
      expect(kinds[cj * 8 + 2]).toBe(1)
      expect(kinds[cj * 8 + 1]).toBe(0)
    }
  })

  it('finds a crest that lies flat with its ways up and down the map', () => {
    const map = flatMap(22, 3)
    const f = crestField(map, W, H, 8, { ...NUMBERS, out: 1 })
    expect(f.ramps).toBeGreaterThan(0)
    for (let y = 0; y < H; y++) {
      for (let x = 12; x < W - 12; x++) {
        const i = y * W + x
        // The ramp is rows 22 to 24, its middle row 23; the cut lies one row above it.
        if (y >= 22 && y <= 24) expect(f.ramp[i]).toBe(1)
        if (f.away[i] === 255) continue
        if (y !== 23) expect(f.side[i]).toBe(y > 23 ? 1 : 0)
        expect(Math.abs(lies(f.share[i]!) - held(y - 22))).toBeLessThan(0.1)
        if (f.share[i]! > 127) {
          // The far ground lies up the map (a smaller row), one row beyond the far end, row 17.
          expect(y + f.toFarY[i]!).toBeGreaterThanOrEqual(17 - 1 - 1)
          expect(y + f.toFarY[i]!).toBeLessThanOrEqual(17 - 1 + 1)
          expect(Math.abs(f.toFarX[i]!)).toBeLessThanOrEqual(1)
        }
        if (f.ramp[i]) {
          expect(y + f.toNearY[i]!).toBeGreaterThanOrEqual(24 + 4)
          expect(y + f.toNearY[i]!).toBeLessThanOrEqual(24 + 6)
        }
      }
    }
  })

  it('refuses numbers that are none', () => {
    const map = stepMap(30, 3)
    expect(() => crestField(map, W, H, 8, { step: 0, walk: 8, under: 0 })).toThrow()
    expect(() => crestField(map, W, H, 8, { step: 0.02, walk: 0, under: 0 })).toThrow()
    expect(() => crestField(map, W, H, 8, { step: 0.02, walk: 8, under: -1 })).toThrow()
    expect(() => crestField(map, W, H, 8, { ...NUMBERS, out: -0.5 })).toThrow()
    expect(() => crestField(map, W, H, 8, { ...NUMBERS, out: 8.5 })).toThrow()
    expect(crestField(map, W, H, 8, { ...NUMBERS, out: 8 }).ramps).toBeGreaterThan(0)
    expect(() => crestField(map.subarray(1), W, H, 8, NUMBERS)).toThrow()
    expect(() => crestField(map, W, H, 8, { ...NUMBERS, boxes: [[10, 10, 10, 20]] })).toThrow()
    expect(() => crestField(map, W, H, 8, { ...NUMBERS, boxes: [[10, 20, 30, 12]] })).toThrow()
  })

  it('keeps to the boxes a stop gives: a ramp outside them is no ramp, and what is left is the field of the ramp inside', () => {
    const map = stepMap(30, 3)
    const whole = crestField(map, W, H, 8, NUMBERS)
    // Rows 8 to 23 of the step, whatever the column.
    const f = crestField(map, W, H, 8, { ...NUMBERS, boxes: [[0, 8, W, 24]] })
    expect(f.ramps).toBeGreaterThan(0)
    expect(f.ramps).toBeLessThan(whole.ramps)
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x
        expect(f.ramp[i]).toBe(y >= 8 && y < 24 ? whole.ramp[i] : 0)
        // Far from the box (its band is 26 texels) the map is the mesh's own again.
        if (y >= 24 + 27) {
          expect(f.away[i]).toBe(255)
          expect(f.near[i]).toBe(map[i])
          expect(f.far[i]).toBe(map[i])
        }
      }
    }
    // Well inside the box the field is the whole map's.
    for (let x = 0; x < W; x++) {
      const i = 14 * W + x
      expect(f.share[i]).toBe(whole.share[i])
      expect(f.near[i]).toBe(whole.near[i])
      expect(f.far[i]).toBe(whole.far[i])
    }
    // Two boxes count as one ground: a ramp in either is a ramp.
    const two = crestField(map, W, H, 8, { ...NUMBERS, boxes: [[0, 8, W, 24], [0, 30, W, 40]] })
    for (let i = 0; i < W * H; i++) {
      const y = Math.floor(i / W)
      expect(two.ramp[i]).toBe((y >= 8 && y < 24) || (y >= 30 && y < 40) ? whole.ramp[i] : 0)
    }
    // The cells of the mesh outside the box keep the mesh.
    const kinds = crestCells(f, 8, 6)
    const all = crestCells(whole, 8, 6)
    expect(all[5 * 8 + 3]).toBe(1)
    expect(kinds[5 * 8 + 3]).toBe(0)
    expect(kinds[1 * 8 + 3]).toBe(1)
  })

  it('cuts the crests a stop names by a point and leaves every other step the wall of the mesh', () => {
    const w = 96
    const map = pairMap(w, 20, 70)
    const whole = crestField(map, w, H, 8, NUMBERS)
    const count = (f: CrestField, from: number, to: number): number => {
      let got = 0
      for (let y = 0; y < H; y++) for (let x = from; x < to; x++) got += f.ramp[y * w + x]!
      return got
    }
    const same = (f: CrestField, g: CrestField, from: number, to: number): void => {
      for (let y = 0; y < H; y++) {
        for (let x = from; x < to; x++) {
          const i = y * w + x
          expect([f.ramp[i], f.away[i], f.side[i], f.near[i], f.far[i], f.share[i], f.toFarX[i], f.toFarY[i], f.toNearX[i], f.toNearY[i]]).toEqual([g.ramp[i], g.away[i], g.side[i], g.near[i], g.far[i], g.share[i], g.toFarX[i], g.toFarY[i], g.toNearX[i], g.toNearY[i]])
        }
      }
    }
    const untouched = (f: CrestField, from: number, to: number): void => {
      for (let y = 0; y < H; y++) {
        for (let x = from; x < to; x++) {
          const i = y * w + x
          expect([f.ramp[i], f.away[i], f.side[i], f.near[i], f.far[i], f.share[i], f.toFarX[i], f.toFarY[i], f.toNearX[i], f.toNearY[i]]).toEqual([0, 255, 0, map[i], map[i], 0, 0, 0, 0, 0])
        }
      }
    }
    // Both steps are ramps on the whole map: one left of the middle column, one right of it.
    const first = count(whole, 0, 48)
    const second = count(whole, 48, w)
    expect(first).toBeGreaterThan(0)
    expect(second).toBeGreaterThan(0)
    expect(whole.ramps).toBe(first + second)
    // A point on the first names it alone: the second is no ramp, and beyond the first one's band (26 texels from its last texel, which
    // lies half a cell from the step at the most) the map is the mesh's own. Where the first one's texels were the nearer ones on the
    // whole map as well, the field is the whole map's. (On the whole map the ground between the two is the near side of the one and
    // the far side of the other, and half way between them, about column 46, the byte of the cut has a line that is no crest's:
    // why a stop does not name two crests that lie within a few cells of one another. The fields are compared short of that line.)
    const one = crestField(map, w, H, 8, { ...NUMBERS, at: [[21.5, 24]] })
    expect(one.ramps).toBe(first)
    expect(count(one, 0, 48)).toBe(first)
    expect(count(one, 48, w)).toBe(0)
    same(one, whole, 0, 40)
    untouched(one, 22 + 5 + 26 + 1, w)
    for (let x = 30; x < 52; x++) expect(one.share[24 * w + x]).toBe(255)
    expect(whole.share[24 * w + 44]!).toBeLessThan(255)
    // A point on the second: the same from the other side.
    const other = crestField(map, w, H, 8, { ...NUMBERS, at: [[71.5, 24]] })
    expect(other.ramps).toBe(second)
    expect(count(other, 0, 48)).toBe(0)
    same(other, whole, 53, w)
    untouched(other, 0, 70 - 5 - 26 - 1)
    // Two points name both, and the field is the whole map's to the texel.
    const both = crestField(map, w, H, 8, { ...NUMBERS, at: [[21.5, 24], [71.5, 40]] })
    expect(both.ramps).toBe(whole.ramps)
    expect(both.reach).toBe(whole.reach)
    same(both, whole, 0, w)
    // A point names the ramp that has a texel within one cell of it (8 texels here, from the point to the texel's middle), no further.
    let last = 0
    for (let x = 0; x < 48; x++) if (whole.ramp[24 * w + x]) last = x
    expect(crestField(map, w, H, 8, { ...NUMBERS, at: [[last + 0.5 + 7.9, 24.5]] }).ramps).toBe(first)
    const none = crestField(map, w, H, 8, { ...NUMBERS, at: [[last + 0.5 + 8.1, 24.5]] })
    expect(none.ramps).toBe(0)
    untouched(none, 0, w)
    expect(crestCells(none, 12, 6).some((k) => k !== 0)).toBe(false)
    // A ramp is named as far as its texels hang together: where the boxes break it, the piece the point lies on and no other.
    const broken = { ...NUMBERS, boxes: [[0, 0, w, 16], [0, 24, w, H]] as [number, number, number, number][] }
    const pieces = crestField(map, w, H, 8, broken)
    const piece = crestField(map, w, H, 8, { ...broken, at: [[21.5, 8]] })
    expect(piece.ramps).toBeGreaterThan(0)
    expect(piece.ramps).toBeLessThan(count(pieces, 0, 48))
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x
        expect(pieces.ramp[i]).toBe(y < 16 || y >= 24 ? whole.ramp[i] : 0)
        expect(piece.ramp[i]).toBe(y < 16 && x < 48 ? whole.ramp[i] : 0)
      }
    }
    // A point is two numbers.
    expect(() => crestField(map, w, H, 8, { ...NUMBERS, at: [[21.5] as unknown as [number, number]] })).toThrow()
    expect(() => crestField(map, w, H, 8, { ...NUMBERS, at: [[21.5, NaN]] })).toThrow()
  })

  it('puts the far sheet under the near side beside a ramp and not beyond its ends', () => {
    // The step of rows 8 to 23 alone. The band of its ramp goes on around its ends: a texel below the end is the near side's (by
    // its place beside the end, or by its own distance on along the crest's line) and lies within the number under of the end,
    // and there is no step there to open.
    const f = crestField(stepMap(30, 3), W, H, 8, { ...NUMBERS, boxes: [[0, 8, W, 24]] })
    let under = 0
    let beyond = 0
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x
        if (f.beneath[i]) {
          under++
          // On the way of a ramp texel to the near side: its own row (the step runs straight down the map), to the right of the ramp,
          // on the near side, no more than under from the ramp.
          expect(y >= 8 && y < 24).toBe(true)
          expect(x).toBeGreaterThan(32)
          expect(f.side[i]).toBe(1)
          expect(f.ramp[i]).toBe(0)
          expect(f.away[i]!).toBeLessThanOrEqual(NUMBERS.under)
        } else if (f.side[i] && !f.ramp[i] && f.away[i]! <= NUMBERS.under) {
          beyond++
          expect(y < 8 || y >= 24).toBe(true)
        }
      }
    }
    expect(under).toBeGreaterThan(0)
    expect(beyond).toBeGreaterThan(0)
    // Beside the ramp every texel of the near side within under of it has the far sheet under it.
    for (let y = 8; y < 24; y++) for (let x = 37; x <= 36 + NUMBERS.under; x++) expect(f.beneath[y * W + x]).toBe(1)
    // The cells: rows 8 to 23 are the cells of rows 1 and 2, and the cell of row 3 touches row 23 by a texel; the cell of row 4
    // lies below the end and keeps the mesh alone, though texels of it lie within under of the ramp's last texel.
    const kinds = crestCells(f, 8, 6)
    expect(kinds[1 * 8 + 5]).toBe(2)
    expect(kinds[2 * 8 + 5]).toBe(2)
    expect(kinds[4 * 8 + 5]).toBe(0)
    let near = 0
    for (let y = 32; y < 40; y++) for (let x = 40; x < 48; x++) if (f.side[y * W + x] && f.away[y * W + x]! <= NUMBERS.under) near++
    expect(near).toBeGreaterThan(0)
  })

  it('finds a step whose near side is a steady slope, and no ramp in the slope itself', () => {
    // The far ground a plain, the step on the columns 30 to 32, and from the column 33 on the near ground comes nearer by 0.004 a
    // texel: more across a cell than the least step. The slope is the near side's own doing: the way of a ramp texel ends in it
    // where the range falls no further, and a texel of the slope alone is even ground on its side.
    const map = new Float32Array(W * H)
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) map[y * W + x] = 1 / (0.05 + Math.min(1, Math.max(0, (x - 29) / 4)) * 0.15 + Math.max(0, x - 33) * 0.004 + y * 2e-5)
    }
    const f = crestField(map, W, H, 8, NUMBERS)
    let count = 0
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x
        if (x >= 30 && x <= 32 && y >= 10 && y < H - 10) expect(f.ramp[i]).toBe(1)
        if (x >= 37 || x <= 24) expect(f.ramp[i]).toBe(0)
        if (!f.ramp[i]) continue
        count++
        // The far end on the plain. The near end where the slope alone is left: no more than 6 texels beyond the top of the step
        // (the column 33), so the near sheet has the distance of the ground just inside its side.
        expect(Math.abs(f.far[i]! - FAR)).toBeLessThan(0.5)
        expect(f.near[i]!).toBeLessThanOrEqual(map[y * W + 33]!)
        expect(f.near[i]!).toBeGreaterThanOrEqual(map[y * W + 39]!)
      }
    }
    expect(count).toBeGreaterThan((H - 20) * 3)
    // The near side beside it: its own distance, the far side's under it.
    for (let x = 37; x <= 44; x++) {
      expect(f.side[24 * W + x]).toBe(1)
      expect(f.near[24 * W + x]).toBe(map[24 * W + x])
      expect(Math.abs(f.far[24 * W + x]! - FAR)).toBeLessThan(0.5)
      expect(f.beneath[24 * W + x]).toBe(1)
    }
  })

  it('ends a ramp beyond the step itself: a second, smaller step on a shelf beside it is no ramp with the shelf for its far end', () => {
    // The far ground slopes to the step of the columns 30 to 32; the near ground is a shelf five texels wide (33 to 37) and steps
    // up once more at the column 38, by less. A texel on that second step sees the range rise on its way to the far side: the step
    // itself lies where the range is greatest, and an end is looked for beyond it, never on the shelf between. So no ramp texel
    // has the shelf (5 away) for its far side; the far ground lies 10 and more away.
    const profile = (x: number): number => (x <= 29 ? 0.1 - (29 - x) * 0.002 : x <= 32 ? 0.1 + (x - 29) * 0.025 : x <= 37 ? 0.2 : 0.2325 + (x - 38) * 0.001)
    const map = new Float32Array(W * H)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) map[y * W + x] = 1 / (profile(x) + y * 2e-5)
    const f = crestField(map, W, H, 8, NUMBERS)
    let count = 0
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x
        if (x >= 30 && x <= 32 && y >= 10 && y < H - 10) expect(f.ramp[i]).toBe(1)
        if (!f.ramp[i]) continue
        count++
        expect(x >= 30 - 5 && x <= 32 + 5).toBe(true)
        expect(f.far[i]!).toBeGreaterThan(9.5)
        // The shelf is narrower than a cell and is no even ground of its own: the near end lies beyond the second step.
        expect(f.near[i]!).toBeLessThan(5.1)
      }
    }
    expect(count).toBeGreaterThan((H - 20) * 3)
    // The second step is the near side's own ground, with the far sheet under it.
    for (let x = 38; x <= 41; x++) {
      expect(f.ramp[24 * W + x]).toBe(0)
      expect(f.side[24 * W + x]).toBe(1)
      expect(f.near[24 * W + x]).toBe(map[24 * W + x])
      expect(f.far[24 * W + x]!).toBeGreaterThan(9.5)
    }
  })

  it('has no other side past a ramp end: on along the line of the crest both sheets keep the distance of the map', () => {
    // The step of the rows 8 to 23 alone, the step itself going on below. A texel below the end, on along the crest's line (no
    // further across it than beyond its end), is past the ramp: both sheets have its own distance to the bit, and it is the near
    // side's where its own ground lies nearer than the middle of the step at the end. A texel beside the end, further across the
    // line than beyond it, still lies beside the ramp and has the other side's distance for the other sheet.
    const map = stepMap(30, 3)
    const f = crestField(map, W, H, 8, { ...NUMBERS, boxes: [[0, 8, W, 24]] })
    let past = 0
    for (let y = 24; y < H; y++) {
      for (let x = 30; x <= 32; x++) {
        const i = y * W + x
        expect(f.ramp[i]).toBe(0)
        if (f.away[i] === 255) continue
        past++
        expect(f.near[i]).toBe(map[i])
        expect(f.far[i]).toBe(map[i])
        expect(f.beneath[i]).toBe(0)
        if (x !== 31) expect(f.side[i]).toBe(x > 31 ? 1 : 0)
      }
    }
    expect(past).toBeGreaterThan(3 * 12)
    // The cut goes on down the middle column as far as the band reaches: the byte of the row 28 is that of the row 16.
    for (let x = 28; x <= 34; x++) expect(Math.abs(f.share[28 * W + x]! - f.share[16 * W + x]!)).toBeLessThanOrEqual(2)
    // Beside the end: 12 texels across the line and 5 beyond the end, on the near side and on the far side.
    expect(f.side[28 * W + 48]).toBe(1)
    expect(f.near[28 * W + 48]).toBe(map[28 * W + 48])
    expect(Math.abs(f.far[28 * W + 48]! - FAR)).toBeLessThan(0.5)
    expect(f.side[28 * W + 14]).toBe(0)
    expect(f.far[28 * W + 14]).toBe(map[28 * W + 14])
    expect(Math.abs(f.near[28 * W + 14]! - NEAR)).toBeLessThan(0.05)
    // Above the box the same.
    for (let x = 30; x <= 32; x++) {
      expect(f.near[4 * W + x]).toBe(map[4 * W + x])
      expect(f.far[4 * W + x]).toBe(map[4 * W + x])
    }
  })

  it('names the vertices where the sheets end with a step left, and none beside a crest that runs on', () => {
    const map = stepMap(30, 3)
    // The vertices of a mesh of 8 by 6 cells, 9 in a row: which are named, row by row.
    const rows = (ends: Uint8Array): string[] => Array.from({ length: 7 }, (_, cj) => Array.from(ends.subarray(cj * 9, cj * 9 + 9)).join(''))
    const none = '000000000'
    // The step runs down the whole map through the cells of the columns 3 and 4: the sheets end on the map's own rim only, above
    // and below. That is no end: no wall of the mesh lies beyond it, the sheets end there with the map and stay as they are.
    const whole = crestField(map, W, H, 8, NUMBERS)
    const all = crestCells(whole, 8, 6)
    expect(rows(crestEnds(whole, all, 8, 6))).toEqual([none, none, none, none, none, none, none])
    // The ring round them (kind 3) is no sheet in place of a cell: the ends are the same with it.
    expect(crestEnds(whole, crestRing(all, 8, 6), 8, 6)).toEqual(crestEnds(whole, all, 8, 6))
    // The step of rows 16 to 31 alone: the sheets are the cells of the rows 2 and 3 and the two that touch its ends by a texel, rows 1
    // and 4. They end where the mesh's wall goes on, at the rows of vertices 1 and 5, and nowhere on the rim of the map. Past the
    // ramp's ends the cut goes on along the middle of the wall, through the texels of the column 31, and crosses the side of the
    // column 3 (the vertices of the columns 3 and 4: x 24 and 32). The ground leans down the map: above the box the texel 31 lies
    // a hair further than the middle of the step at the end and is the far side's, so the side of the column 4 has both grounds
    // there too (the vertex of the column 5: x 40); below the box it lies a hair nearer and is the near side's.
    const boxed = crestField(map, W, H, 8, { ...NUMBERS, boxes: [[0, 16, W, 32]] })
    const kinds = crestCells(boxed, 8, 6)
    for (let cj = 0; cj < 6; cj++) expect(kinds[cj * 8 + 3]).toBe(cj >= 1 && cj <= 4 ? 1 : 0)
    const ends = crestEnds(boxed, kinds, 8, 6)
    expect(rows(ends)).toEqual([none, '000111000', none, none, none, '000110000', none])
    expect(boxed.side[4 * W + 31]).toBe(0)
    expect(boxed.side[44 * W + 31]).toBe(1)
    // Past the end the field has closed the sheets itself: round the vertex in the wall one cell beyond the end (x 32, y 40) both
    // sheets have the map's own distance, to the bit, and so they have round the one above the box (x 32, y 8).
    for (const [x, y] of [[32, 40], [32, 8]] as [number, number][]) {
      for (const i of [(y - 1) * W + x - 1, (y - 1) * W + x, y * W + x - 1, y * W + x]) {
        expect(boxed.ramp[i]).toBe(0)
        expect(boxed.near[i]).toBe(map[i])
        expect(boxed.far[i]).toBe(map[i])
      }
    }
    // A cell the relief keeps for itself in the middle of a crest (as it does for a ridge) is an end on both of its sides.
    const kept = Uint8Array.from(all)
    kept[2 * 8 + 3] = 0
    expect(rows(crestEnds(whole, kept, 8, 6))).toEqual([none, none, '000110000', '000110000', none, none, none])
    // That the closing has work to do there: round the vertex in the wall (x 32, y 24) the far sheet's distance is the far ground's
    // and the near sheet's the near ground's, and the mesh's own lies between them, far from both.
    const round = (of: Float32Array): number => (of[23 * W + 31]! + of[23 * W + 32]! + of[24 * W + 31]! + of[24 * W + 32]!) / 4
    expect(round(whole.far) / round(map)).toBeGreaterThan(1.5)
    expect(round(map) / round(whole.near)).toBeGreaterThan(1.1)
    // The side between that cell and the sheets right of it runs along the far side of the cut, where the near side may still
    // reach: it is named by its ends, which the rows above have already. A side with one ground alone names nothing: the sheets'
    // sides to the left, where no near ground reaches, and to the right, under the near ground.
    for (const e of [crestEnds(whole, all, 8, 6), ends, crestEnds(whole, kept, 8, 6)]) for (let cj = 0; cj <= 6; cj++) for (const ci of [0, 1, 2, 6, 7, 8]) expect(e[cj * 9 + ci]).toBe(0)
    // The step of rows 8 to 23 alone: its sheets run from above the box, where the field has closed them (no end), to the row of
    // vertices 4, where the cut crosses the side of the column 3 (the vertices of the columns 3 and 4: x 24 and 32). With the cut
    // moved out by 2 texels it crosses the same side.
    const upper = crestField(map, W, H, 8, { ...NUMBERS, boxes: [[0, 8, W, 24]] })
    expect(rows(crestEnds(upper, crestCells(upper, 8, 6), 8, 6))).toEqual([none, none, none, none, '000110000', none, none])
    const moved = crestField(map, W, H, 8, { ...NUMBERS, out: 2, boxes: [[0, 8, W, 24]] })
    expect(rows(crestEnds(moved, crestCells(moved, 8, 6, 2), 8, 6))).toEqual([none, none, none, none, '000110000', none, none])
    // No sheets, no ends.
    expect(crestEnds(whole, new Uint8Array(48), 8, 6).some((v) => v !== 0)).toBe(false)
  })

  it('rings the cells that have a far sheet with cells where it comes up to the ground, and names the vertices of its rim', () => {
    const map = stepMap(30, 3)
    const cells = (kinds: Uint8Array): string[] => Array.from({ length: 6 }, (_, cj) => Array.from(kinds.subarray(cj * 8, cj * 8 + 8)).join(''))
    const rows = (rim: Uint8Array): string[] => Array.from({ length: 7 }, (_, cj) => Array.from(rim.subarray(cj * 9, cj * 9 + 9)).join(''))
    // The step down the whole map: the sheets in the columns 3 and 4, the far sheet under the columns 5 and 6, and the ring one
    // column to either side. The rim: the vertices beside a cell left alone (columns 0 to 2). The rim of the map is none: the
    // ring's last column ends with the map, on the far sheet's own distance.
    const whole = crestField(map, W, H, 8, NUMBERS)
    const all = crestCells(whole, 8, 6)
    expect(cells(all)).toEqual(Array.from({ length: 6 }, () => '00011220'))
    const ring = crestRing(all, 8, 6)
    expect(cells(ring)).toEqual(Array.from({ length: 6 }, () => '00311223'))
    // The cells it was given are not written to, and a ring is not ringed again.
    expect(cells(all)).toEqual(Array.from({ length: 6 }, () => '00011220'))
    expect(crestRing(ring, 8, 6)).toEqual(ring)
    expect(rows(crestRim(ring, 8, 6))).toEqual(Array.from({ length: 7 }, () => '111000000'))
    // With the far sheet a third as far under the near side (4 texels: the column 5 alone) the ring is the column 6 and the last
    // column is left alone: the rim is the vertices of the columns 7 and 8 as well.
    const short = crestField(map, W, H, 8, { ...NUMBERS, under: 4 })
    const shortRing = crestRing(crestCells(short, 8, 6), 8, 6)
    expect(cells(shortRing)).toEqual(Array.from({ length: 6 }, () => '00311230'))
    expect(rows(crestRim(shortRing, 8, 6))).toEqual(Array.from({ length: 7 }, () => '111000011'))
    // The step of rows 16 to 31 alone: the ring goes round its ends as well, by the corners too. It reaches the rim of the map
    // above, below and on the right, so no vertex on the near side is rim.
    const boxed = crestField(map, W, H, 8, { ...NUMBERS, boxes: [[0, 16, W, 32]] })
    const ringed = crestRing(crestCells(boxed, 8, 6), 8, 6)
    expect(cells(ringed)).toEqual(['00333333', '00311223', '00311223', '00311223', '00311223', '00333333'])
    expect(rows(crestRim(ringed, 8, 6))).toEqual(Array.from({ length: 7 }, () => '111000000'))
    // The step of rows 8 to 23 alone: one row of the ring below it, and the last row of cells is left alone. The rim: the row of
    // vertices between the two and the one below.
    const upper = crestField(map, W, H, 8, { ...NUMBERS, boxes: [[0, 8, W, 24]] })
    const upperRing = crestRing(crestCells(upper, 8, 6), 8, 6)
    expect(cells(upperRing)).toEqual(['00311223', '00311223', '00311223', '00311223', '00333333', '00000000'])
    expect(rows(crestRim(upperRing, 8, 6))).toEqual(['111000000', '111000000', '111000000', '111000000', '111000000', '111111111', '111111111'])
    // A cell the relief takes out after the ring (as it does for a ridge) has no far sheet: its four vertices are rim.
    const kept = Uint8Array.from(ring)
    kept[2 * 8 + 4] = 0
    expect(rows(crestRim(kept, 8, 6))).toEqual(['111000000', '111000000', '111011000', '111011000', '111000000', '111000000', '111000000'])
    // No sheets: no ring, and every vertex is rim.
    expect(crestRing(new Uint8Array(48), 8, 6).some((v) => v !== 0)).toBe(false)
    expect(crestRim(new Uint8Array(48), 8, 6).every((v) => v === 1)).toBe(true)
  })

  it('keeps the far sheet behind the ground it goes under, where that ground lies further than the far side', () => {
    // The step from one texel to the next and a hollow in the near ground, 10 texels right of the ramp, that is deeper than the far
    // side lies. The step is named by a point, so the hollow's own rims are no crests.
    const map = stepMap(30, 0)
    const deep = 2 * FAR
    for (let y = 22; y < 26; y++) for (let x = 44; x < 46; x++) map[y * W + x] = deep
    const f = crestField(map, W, H, 8, { ...NUMBERS, at: [[30, 12]] })
    expect(f.ramps).toBeGreaterThan(0)
    let hollow = 0
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x
        if (f.away[i] === 255 || f.ramp[i] || !f.side[i]) continue
        // The near side: the far sheet under it is the far side's ground, or lies a thousandth behind the texel's own.
        expect(f.near[i]).toBe(map[i])
        expect(f.far[i]!).toBeGreaterThan(map[i]!)
        if (map[i] === deep) {
          hollow++
          expect(f.beneath[i]).toBe(1)
          expect(f.far[i]).toBe(Math.fround(deep * (1 + CREST_BEHIND)))
        } else if (y < 12 || y > 36) expect(Math.abs(f.far[i]! - FAR)).toBeLessThan(0.5)
      }
    }
    expect(hollow).toBe(8)
  })
})

const picture = (): THREE.Texture => {
  const t = new THREE.Texture()
  t.image = { width: 64, height: 48 }
  return t
}

const ctx = {
  texture: async () => picture(),
  buffer: async (path: string) => (path === 'relief-step-dist.bin' ? stepMap(30, 3) : new Float32Array(4).fill(40)).buffer,
} as unknown as SetContext

const def: ReliefDef = {
  imageSize: [64, 48],
  vfovDeg: 40,
  layers: [
    { color: 'relief-back-color.jpg', dist: 'relief-back-dist.bin', box: [0, 0, 64, 48], distSize: [2, 2], tint: [1, 1, 1] },
    { color: 'relief-step-color.jpg', alpha: 'relief-step-alpha.png', dist: 'relief-step-dist.bin', box: [0, 0, 64, 48], distSize: [64, 48], tint: [1, 1, 1] },
  ],
  masks: 'masks.png',
  maskBox: [0, 0, 64, 48],
  mistDir: [1, 0],
}

// A stop counts in cells of the layer's mesh; a cell of this mesh is 8 texels of the map.
const CELLS = { step: NUMBERS.step, walk: NUMBERS.walk / 8, under: NUMBERS.under / 8 }
const motion = (crest: boolean): ReliefMotion => ({ mistSpeed: 0, dustSpeed: 0, dustDir: [1, 0], mesh: 8, ...(crest ? { crest: [{ layer: 'step', ...CELLS }] } : {}) })
const meshes = (r: Relief): THREE.Mesh[] => r.group.children as THREE.Mesh[]
const indexOf = (m: THREE.Mesh): Uint32Array => m.geometry.getIndex()!.array as Uint32Array
const positions = (m: THREE.Mesh): Float32Array => m.geometry.getAttribute('position').array as Float32Array

describe('the sheets of a relief', () => {
  it('are off unless a stop gives the numbers: the meshes, the index and the shaders of a relief without them', async () => {
    const plain = await Relief.load(ctx, '', def, motion(false))
    expect(meshes(plain).length).toBe(2)
    for (const m of meshes(plain)) {
      const material = m.material as THREE.ShaderMaterial
      expect(material.fragmentShader.includes('uCut')).toBe(false)
      expect(material.vertexShader.includes('aSheet')).toBe(false)
      expect(material.uniforms.uCut).toBeUndefined()
      const index = indexOf(m)
      for (let c = 0; c < index.length; c += 3) expect(index[c] !== index[c + 1] && index[c + 1] !== index[c + 2]).toBe(true)
    }
    // A layer the crest does not name is left as it is, and so is a relief whose named layer has no step.
    const other = await Relief.load(ctx, '', def, { ...motion(false), crest: [{ layer: 'back', ...CELLS }] })
    expect(meshes(other).length).toBe(2)
    expect(indexOf(meshes(other)[0]!)).toEqual(indexOf(meshes(plain)[0]!))
  })

  it('take the cells of the step out of the mesh and draw them after it, the far sheet first', async () => {
    const plain = await Relief.load(ctx, '', def, motion(false))
    const r = await Relief.load(ctx, '', def, motion(true))
    const all = meshes(r)
    expect(all.length).toBe(3)
    const [back, layer, sheets] = all as [THREE.Mesh, THREE.Mesh, THREE.Mesh]
    expect(indexOf(back)).toEqual(indexOf(meshes(plain)[0]!))
    expect(positions(layer)).toEqual(positions(meshes(plain)[1]!))
    // After the layer's own mesh and before the next layer's, whatever the eye: the renderer sorts by this number first.
    expect(sheets.renderOrder).toBeGreaterThan(layer.renderOrder)
    expect(sheets.renderOrder).toBeLessThan(layer.renderOrder + 1)
    expect(layer.renderOrder).toBe(back.renderOrder + 1)
    expect(r.owns(sheets)).toBe(true)
    expect(sheets.frustumCulled).toBe(false)
    const was = indexOf(meshes(plain)[1]!)
    const now = indexOf(layer)
    const f = crestField(stepMap(30, 3), W, H, 8, NUMBERS)
    const kinds = crestRing(crestCells(f, 8, 6), 8, 6)
    let gone = 0
    let under = 0
    let ring = 0
    for (let cell = 0; cell < 48; cell++) {
      const six = now.subarray(cell * 6, cell * 6 + 6)
      if (kinds[cell] === 1) {
        gone++
        for (const v of six) expect(v).toBe(was[cell * 6])
      } else {
        if (kinds[cell] === 2 || kinds[cell] === 3) under++
        if (kinds[cell] === 3) ring++
        expect(six).toEqual(was.subarray(cell * 6, cell * 6 + 6))
      }
    }
    expect(gone).toBeGreaterThan(0)
    expect(under).toBeGreaterThan(ring)
    expect(ring).toBeGreaterThan(0)
    // The far sheet has the cells of the step, the near cells beside it and the ring round both, the near sheet the cells of the
    // step; far first.
    const sheet = sheets.geometry.getAttribute('aSheet').array as Float32Array
    const index = indexOf(sheets)
    expect(index.length).toBe((gone + under + gone) * 6)
    // In the far sheet a cell of the step is 0 and a cell under the kept mesh is -1; no vertex is shared between the three.
    let at = 0
    for (let cell = 0; cell < 48; cell++) {
      if (kinds[cell] === 0) continue
      for (let c = 0; c < 6; c++) expect(sheet[index[at + c]!]).toBe(kinds[cell] === 1 ? 0 : -1)
      at += 6
    }
    expect(at).toBe((gone + under) * 6)
    for (let c = at; c < index.length; c++) expect(sheet[index[c]!]).toBe(1)
  })

  it('give a sheet the vertex of the mesh to the bit where the ground round it is the sheet side, and keep every vertex on its ray', async () => {
    const plain = await Relief.load(ctx, '', def, motion(false))
    const grid = positions(meshes(plain)[1]!)
    // Three crests. The step down the whole map: its sheets and its ring end with the map, and nothing is shut. The same with the
    // far sheet 4 texels under the near side: the ring is the column 6 and comes up to the ground along the column of vertices 7.
    // The step of the rows 8 to 23 alone: past its ends, on along its line, the field has the map's own distance for both sheets,
    // so at the rows of vertices a cell beyond the box (0 and 4) the sheets have the mesh's vertex in the columns 3 to 5 (which lie
    // no further across the crest's line than beyond its end) whatever ground lies round it. Its sheets end with a step left at
    // the row 4, and the ring goes round that end, down to the row 5.
    const crests: { texels: { under: number; boxes?: [number, number, number, number][] }; cells: { under: number; boxes?: [number, number, number, number][] }; beyond: number[]; edge: number[]; closed: number[]; gone: number[]; met: number; behind: number }[] = [
      { texels: { under: 12 }, cells: { under: 1.5 }, beyond: [], edge: [], closed: [0, 0, 0], gone: [0, 0, 0], met: 7, behind: 7 },
      { texels: { under: 4 }, cells: { under: 0.5 }, beyond: [], edge: [], closed: [7, 0, 0], gone: [0, 0, 0], met: 7, behind: 7 },
      { texels: { under: 12, boxes: [[0, 8, W, 24]] }, cells: { under: 1.5, boxes: [[0, 8 / H, 1, 24 / H]] }, beyond: [0, 4], edge: [1, 3], closed: [1 + 5, 1, 2], gone: [2, 3, 2], met: 3, behind: 5 + 1 + 2 },
    ]
    for (const crest of crests) {
      const r = await Relief.load(ctx, '', def, { ...motion(false), crest: [{ layer: 'step', ...CELLS, ...crest.cells }] })
      const sheets = meshes(r)[2]!
      const p = positions(sheets)
      const uv = sheets.geometry.getAttribute('uv').array as Float32Array
      const sheet = sheets.geometry.getAttribute('aSheet').array as Float32Array
      const f = crestField(stepMap(30, 3), W, H, 8, { ...NUMBERS, ...crest.texels })
      const kinds = crestRing(crestCells(f, 8, 6), 8, 6)
      const ends = crestEnds(f, kinds, 8, 6)
      const rim = crestRim(kinds, 8, 6)
      const same = [0, 0]
      // Vertices a sheet has on the mesh though the ground round them is the other side's: the closing at its ends and on its rim
      // (closed), and what lies past the crest's end (gone).
      const closed = [0, 0, 0]
      const gone = [0, 0, 0]
      const reached = [0, 0]
      let half = 0
      for (let n = 0; n < sheet.length; n++) {
        const bi = Math.round(uv[n * 2]! * 8)
        const cj = Math.round((1 - uv[n * 2 + 1]!) * 6)
        const g = (cj * 9 + bi) * 3
        const a = new THREE.Vector3(p[n * 3]!, p[n * 3 + 1]!, p[n * 3 + 2]!)
        const b = new THREE.Vector3(grid[g]!, grid[g + 1]!, grid[g + 2]!)
        expect(a.clone().normalize().distanceTo(b.clone().normalize())).toBeLessThan(1e-6)
        // Columns of vertices: 3 (x 24) and left lie on the far ground, 5 (x 40) and right on the near ground.
        const mine = sheet[n] === 1 ? bi >= 5 : bi <= 3
        // Where the sheets end with the cut across the side both take the mesh's vertex, and the far sheet takes it on its rim.
        const shut = ends[cj * 9 + bi] === 1 || (sheet[n] !== 1 && rim[cj * 9 + bi] === 1)
        const past = crest.beyond.includes(cj) && bi >= 3 && bi <= 5
        if (sheet[n] === -1) {
          // Under a kept cell the far sheet lies a thousandth behind the mesh's own vertex at the least, and just that where it is
          // shut, the ground is its own or the crest has ended.
          expect(a.length()).toBeGreaterThan(b.length())
          if (shut || mine || past) {
            expect(Math.abs(a.length() / b.length() - (1 + CREST_BEHIND))).toBeLessThan(1e-6)
            if (!mine) (shut ? closed : gone)[0]!++
          } else if (bi >= 5) {
            // Not shut, under the near ground: the far side's distance as far as the band of the ramp reaches, and beyond it
            // the ground's own with the thousandth (the ring's last column, where it ends with the map).
            const round = [0, 1, 2, 3].map((q) => f.away[Math.min(H - 1, Math.max(0, cj * 8 - (q >> 1))) * W + Math.min(W - 1, Math.max(0, bi * 8 - (q & 1)))]! < 255)
            if (round.every((v) => v)) expect(Math.abs(a.length() - FAR)).toBeLessThan(0.5)
            if (round.every((v) => !v)) expect(Math.abs(a.length() / b.length() - (1 + CREST_BEHIND))).toBeLessThan(1e-6)
            reached[round.every((v) => v) ? 0 : 1]!++
          }
        } else if (shut || mine || past) {
          expect([a.x, a.y, a.z]).toEqual([b.x, b.y, b.z])
          same[sheet[n] === 1 ? 1 : 0]!++
          if (!mine) (shut ? closed : gone)[sheet[n] === 1 ? 2 : 1]!++
        } else if (bi >= 5 || bi <= 3) {
          expect(Math.abs(a.length() - (sheet[n] === 1 ? NEAR : FAR))).toBeLessThan(0.5)
        } else if (crest.edge.includes(cj)) {
          // The vertex in the wall on the box's own row: two of the texels round it are the ramp's and two lie past its end, so
          // each sheet is half way from its side to the wall.
          half++
          if (sheet[n] === 1) {
            expect(a.length()).toBeGreaterThan(NEAR + 0.5)
            expect(a.length()).toBeLessThan(b.length() - 0.5)
          } else {
            expect(a.length()).toBeGreaterThan(b.length() + 0.5)
            expect(a.length()).toBeLessThan(FAR - 0.5)
          }
        }
      }
      expect(same[0]).toBeGreaterThan(0)
      expect(same[1]).toBeGreaterThan(0)
      // The far sheet under a kept cell: on the ring's outer column (7 vertices), or at the end vertex of the column 4 and along the
      // row 5 from the column 4 to the column 8. The far sheet in place of a cell: at the end vertex of the column 4. The near
      // sheet: at those of the columns 3 and 4.
      expect(closed).toEqual(crest.closed)
      // Past the end: the far sheet under a kept cell in the column 5 of both rows; the far sheet in place of a cell in the
      // columns 4 and 5 above the box and in the column 5 below it (the column 4 is an end there); the near sheet in the columns
      // 3 and 4 above the box.
      expect(gone).toEqual(crest.gone)
      expect(half).toBe(crest.edge.length * 2)
      expect(reached[0]).toBeGreaterThan(reached[1]!)
      // Where the far sheet in place of a cell meets the far sheet under a kept cell on the near side and neither is shut, the two
      // have the vertex at one place: no crack. On the far side, where they are shut and past the crest's end (where the one in
      // place of a cell lies in the ground itself) the one under the kept cell lies the thousandth behind.
      const placed = new Map<number, number>()
      for (let n = 0; n < sheet.length; n++) if (sheet[n] === 0) placed.set(Math.round((1 - uv[n * 2 + 1]!) * 6) * 9 + Math.round(uv[n * 2]! * 8), n)
      let met = 0
      let behind = 0
      for (let n = 0; n < sheet.length; n++) {
        if (sheet[n] !== -1) continue
        const key = Math.round((1 - uv[n * 2 + 1]!) * 6) * 9 + Math.round(uv[n * 2]! * 8)
        const m = placed.get(key)
        if (m === undefined) continue
        if (ends[key] || rim[key] || key % 9 <= 3 || crest.beyond.includes((key - (key % 9)) / 9)) {
          behind++
          expect(Math.abs(Math.hypot(p[n * 3]!, p[n * 3 + 1]!, p[n * 3 + 2]!) / Math.hypot(p[m * 3]!, p[m * 3 + 1]!, p[m * 3 + 2]!) - (1 + CREST_BEHIND))).toBeLessThan(1e-6)
          continue
        }
        met++
        expect([p[n * 3], p[n * 3 + 1], p[n * 3 + 2]]).toEqual([p[m * 3], p[m * 3 + 1], p[m * 3 + 2]])
      }
      // Met: the column 5 as far as the crest runs. Behind: the column 3 whole, the end vertex of the column 4 and the column 5
      // past the crest's ends.
      expect(met).toBe(crest.met)
      expect(behind).toBe(crest.behind)
    }
  })

  it('run the layer program with the cut, on the layer own uniforms, and follow a presence and an edge', async () => {
    const plain = await Relief.load(ctx, '', def, motion(false))
    const r = await Relief.load(ctx, '', def, motion(true))
    const [, layer, sheets] = meshes(r) as [THREE.Mesh, THREE.Mesh, THREE.Mesh]
    const own = layer.material as THREE.ShaderMaterial
    const cut = sheets.material as THREE.ShaderMaterial
    const was = meshes(plain)[1]!.material as THREE.ShaderMaterial
    expect(own.fragmentShader).toBe(was.fragmentShader)
    expect(own.vertexShader).toBe(was.vertexShader)
    expect(cut.uniforms).toBe(own.uniforms)
    expect(cut.fragmentShader).toBe(withSheets(was.fragmentShader))
    expect(cut.vertexShader).toBe(withSheets(was.vertexShader))
    expect(cut.fragmentShader.split(SHEET_GLSL.slice(1)).length).toBe(2)
    expect(cut.fragmentShader.replace(SHEET_GLSL.slice(1) + '  ', '').replace('\nin float vSheet;\nuniform sampler2D uCut;\nuniform sampler2D uCutBack;\nuniform vec4 uCutBox;\nuniform vec3 uCutMap;', '')).toBe(was.fragmentShader)
    expect(() => withSheets(cut.fragmentShader)).toThrow()
    expect(() => withSheets(cut.vertexShader)).toThrow()
    const texture = own.uniforms.uCut!.value as THREE.DataTexture
    const box = own.uniforms.uCutBox!.value as THREE.Vector4
    const map = own.uniforms.uCutMap!.value as THREE.Vector3
    expect([map.x, map.y]).toEqual([W, H])
    expect((texture.image as { width: number }).width).toBe(box.z)
    expect((texture.image as { height: number }).height).toBe(box.w)
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.z).toBeLessThanOrEqual(W)
    // The window holds the field's bytes at its place in the map.
    const f = crestField(stepMap(30, 3), W, H, 8, NUMBERS)
    const whole = crestTexels(f)
    const data = (texture.image as unknown as { data: Uint8Array }).data
    const behind = own.uniforms.uCutBack!.value as THREE.DataTexture
    const dataBack = (behind.image as unknown as { data: Uint8Array }).data
    expect((behind.image as { width: number }).width).toBe(box.z)
    expect((behind.image as { height: number }).height).toBe(box.w)
    // The distance to the cut is read between its texels, the ways are read at their texel.
    expect(texture.magFilter).toBe(THREE.LinearFilter)
    expect(behind.magFilter).toBe(THREE.NearestFilter)
    for (const [x, y] of [[0, 0], [3, 5], [box.z - 1, box.w - 1]] as [number, number][]) {
      for (let c = 0; c < 4; c++) {
        expect(data[(y * box.z + x) * 4 + c]).toBe(whole.cut[((box.y + y) * W + box.x + x) * 4 + c])
        expect(dataBack[(y * box.z + x) * 4 + c]).toBe(whole.back[((box.y + y) * W + box.x + x) * 4 + c])
      }
    }
    r.presence(0.5)
    r.presenceEdge([4, 4, 4, 4])
    for (const m of [own, cut]) {
      expect(m.fragmentShader.includes('uPresence')).toBe(true)
      expect(m.fragmentShader.includes('uEdgeSide')).toBe(true)
      expect(m.uniforms.uPresence!.value).toBe(0.5)
    }
    expect(cut.fragmentShader).toBe(withEdge(withPresence(withSheets(was.fragmentShader), 'vec4(col * alpha, alpha)'), 'vec4(col * alpha, alpha)'))
    r.dispose()
  })

  it('take the points and the boxes of a stop as shares of the layer own box, whatever size its map has', async () => {
    const map = pairMap(W, 12, 48)
    const two = { texture: async () => picture(), buffer: async (path: string) => (path === 'relief-step-dist.bin' ? map : new Float32Array(4).fill(40)).buffer } as unknown as SetContext
    const plain = await Relief.load(two, '', def, motion(false))
    const was = indexOf(meshes(plain)[1]!)
    const built = async (more: { at?: [number, number][]; boxes?: [number, number, number, number][] }): Promise<Uint32Array | null> => {
      const r = await Relief.load(two, '', def, { ...motion(false), crest: [{ layer: 'step', ...CELLS, ...more }] })
      return meshes(r).length === 3 ? indexOf(meshes(r)[1]!) : null
    }
    const check = (now: Uint32Array | null, kinds: Uint8Array): number => {
      let gone = 0
      for (let cell = 0; cell < 48; cell++) {
        const six = now!.subarray(cell * 6, cell * 6 + 6)
        if (kinds[cell] === 1) {
          gone++
          for (const v of six) expect(v).toBe(was[cell * 6])
        } else expect(six).toEqual(was.subarray(cell * 6, cell * 6 + 6))
      }
      return gone
    }
    const all = crestCells(crestField(map, W, H, 8, NUMBERS), 8, 6)
    const every = check(await built({}), all)
    // The second step named by a point at 49.5 of 64 columns and row 24 of 48: its cells leave the mesh, the first step's stay.
    const named = crestCells(crestField(map, W, H, 8, { ...NUMBERS, at: [[49.5, 24]] }), 8, 6)
    const one = check(await built({ at: [[49.5 / W, 24 / H]] }), named)
    expect(one).toBeGreaterThan(0)
    expect(one).toBeLessThan(every)
    for (let cj = 1; cj < 5; cj++) {
      expect(all[cj * 8 + 1]).toBe(1)
      expect(named[cj * 8 + 1]).toBe(0)
      expect(named[cj * 8 + 6]).toBe(1)
    }
    // The upper half of the layer as a box: the steps below it stay the mesh's.
    const boxed = crestCells(crestField(map, W, H, 8, { ...NUMBERS, boxes: [[0, 0, W, 24]] }), 8, 6)
    const half = check(await built({ boxes: [[0, 0, 1, 0.5]] }), boxed)
    expect(half).toBeGreaterThan(0)
    expect(half).toBeLessThan(every)
    expect(boxed[5 * 8 + 6]).toBe(0)
    // A point with no step beside it names nothing, and the relief is the one without the numbers.
    expect(await built({ at: [[0.5, 0.5]] })).toBeNull()
  })
})
