import { describe, expect, it } from 'vitest'
import { MAX_MARK, marksIn, reach, reachNeeded, uniformCells } from '../src/terrain/shield'

function image(width: number, height: number, value: (x: number, y: number) => number): Uint8Array {
  const a = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) a[(y * width + x) * 4] = value(x, y)
  return a
}

function half(v: number): number {
  const f = new Float32Array([v])
  const b = new Uint32Array(f.buffer)[0]!
  const e = ((b >> 23) & 0xff) - 127
  if (v === 0) return 0
  return ((e + 15) << 10) | ((b >> 13) & 0x3ff)
}

function marks(width: number, height: number, id: (x: number, y: number) => number): Uint16Array {
  const a = new Uint16Array(width * height * 4)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) a[(y * width + x) * 4 + 3] = half(id(x, y))
  return a
}

describe('uniformCells', () => {
  it('flags only cells whose texels are all 255 or all 0, with row 0 at the last data row', () => {
    const f = uniformCells(image(8, 8, (x, y) => (y < 4 ? 255 : x < 4 ? 0 : 128)), 8, 8, 2, 2)
    expect(Array.from(f.one)).toEqual([0, 0, 1, 1])
    expect(Array.from(f.zero)).toEqual([1, 0, 0, 0])
  })

  it('drops a cell for one texel that differs', () => {
    const f = uniformCells(image(8, 8, (x, y) => (x === 5 && y === 6 ? 254 : 255)), 8, 8, 2, 2)
    expect(Array.from(f.one)).toEqual([1, 0, 1, 1])
    expect(Array.from(f.zero)).toEqual([0, 0, 0, 0])
  })

  it('never flags a cell that a texel of another value touches when sizes do not divide', () => {
    const width = 37
    const height = 23
    const nx = 5
    const ny = 4
    const value = (x: number, y: number): number => (x > 11 && y > 6 ? 255 : 0)
    const f = uniformCells(image(width, height, value), width, height, nx, ny)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const c = (ny - 1 - Math.floor((y * ny) / height)) * nx + Math.floor((x * nx) / width)
        if (f.one[c]) expect(value(x, y)).toBe(255)
        if (f.zero[c]) expect(value(x, y)).toBe(0)
      }
    }
    expect(f.one.reduce((a, b) => a + b, 0)).toBeGreaterThan(0)
    expect(f.zero.reduce((a, b) => a + b, 0)).toBeGreaterThan(0)
  })
})

describe('reach', () => {
  it('is the distance in cells to the nearest clear cell or border', () => {
    const nx = 7
    const ny = 5
    const flag = new Uint8Array(nx * ny).fill(1)
    flag[2 * nx + 6] = 0
    const d = reach(flag, nx, ny)
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        let want = Math.min(i + 1, j + 1, nx - i, ny - j)
        want = Math.min(want, Math.max(Math.abs(i - 6), Math.abs(j - 2)))
        expect(d[j * nx + i]).toBe(want)
      }
    }
  })

  it('is zero where the flag is clear', () => {
    expect(Array.from(reach(new Uint8Array(9), 3, 3))).toEqual(new Array(9).fill(0))
  })
})

describe('marksIn', () => {
  it('collects the marks of every pixel of a tile, bit 0 for none', () => {
    const width = 70
    const height = 40
    const a = marks(width, height, (x, y) => (x < 32 ? 2 : x < 64 ? (y < 32 ? 3 : 1) : 0))
    a[(10 * width + 40) * 4 + 3] = 0
    expect(Array.from(marksIn(a, width, height, 32))).toEqual([4, 8 | 1, 1, 4, 2, 1])
  })

  it('reads every mark id', () => {
    for (let id = 1; id <= MAX_MARK; id++) expect(Array.from(marksIn(marks(8, 8, () => id), 8, 8, 8))).toEqual([1 << id])
  })

  it('counts values that are not a mark as none', () => {
    expect(Array.from(marksIn(marks(8, 8, () => 0.5), 8, 8, 8))).toEqual([1])
    expect(Array.from(marksIn(marks(8, 8, () => MAX_MARK + 1), 8, 8, 8))).toEqual([1])
    expect(Array.from(marksIn(marks(8, 8, (x) => (x === 7 ? 0.5 : 5)), 8, 8, 8))).toEqual([32 | 1])
  })
})

describe('reachNeeded', () => {
  it('grows with the texels under one pixel', () => {
    const near = reachNeeded(0, 0, 8, 0, 0, 8, 8, 8)
    const far = reachNeeded(0, 0, 1, 0, 0, 1, 8, 8)
    expect(near).toBeGreaterThanOrEqual(2)
    expect(far).toBeGreaterThan(near)
  })

  it('is the documented bound', () => {
    expect(reachNeeded(0, 0, 4, 0, 0, 4, 8, 8)).toBe(Math.ceil((6 * ((8 * Math.sqrt(32)) / 16) + 2) / 8) + 1)
  })

  it('refuses a degenerate cell', () => {
    expect(reachNeeded(0, 0, 4, 0, 8, 0, 8, 8)).toBe(Infinity)
    expect(reachNeeded(NaN, 0, 4, 0, 0, 4, 8, 8)).toBe(Infinity)
  })
})
