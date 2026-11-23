import { describe, expect, it } from 'vitest'
import type { Pixels } from '../tools/lib/frames'
import { CARRIED, blur, carried } from '../tools/measure/carried'

const W = 320
const H = 180
const GRID: [number, number] = [8, 6]
let seed = 7
const rnd = (): number => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296

function texels(report: (x: number, y: number) => number, counted: (x: number, y: number) => boolean = () => true): Pixels {
  const data = new Uint8Array(W * H * 4)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4
    data[i] = Math.round(Math.min(report(x, y) * 0.5, 1) * 255)
    data[i + 1] = counted(x, y) ? 255 : 0
    data[i + 3] = 255
  }
  return { width: W, height: H, channels: 4, data }
}

function picture(level: (x: number, y: number) => number): Pixels {
  const data = new Uint8Array(W * H * 3)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) data.fill(Math.round(Math.min(Math.max(level(x, y), 0), 255)), (y * W + x) * 3, (y * W + x) * 3 + 3)
  return { width: W, height: H, channels: 3, data }
}

function noise(cell: number): (x: number, y: number) => number {
  seed = 7
  const cols = Math.ceil(W / cell) + 2
  const grid = Array.from({ length: (Math.ceil(H / cell) + 2) * cols }, () => 60 + 120 * rnd())
  const at = (cx: number, cy: number): number => grid[cy * cols + cx]!
  return (x, y) => {
    const fx = x / cell, fy = y / cell
    const cx = Math.floor(fx), cy = Math.floor(fy)
    const u = fx - cx, v = fy - cy
    return (at(cx, cy) * (1 - u) + at(cx + 1, cy) * u) * (1 - v) + (at(cx, cy + 1) * (1 - u) + at(cx + 1, cy + 1) * u) * v
  }
}

describe('the report beside G13: what the material says against what the picture carries', () => {
  it('raises no flag where a sharp report stands on fine detail', () => {
    const r = carried(texels(() => 1.2), picture(noise(1)), 1, GRID)
    expect(r.judged).toBe(48)
    expect(r.flagged).toEqual([])
    expect(r.sharp.tiles).toBe(48)
    expect(r.sharp.energy!).toBeGreaterThan(100 * CARRIED.nothing)
  })

  it('flags every tile that says sharp over a flat picture and none that says soft', () => {
    const r = carried(texels((x) => (x < W / 2 ? 1.004 : 0.6)), picture(() => 140), 1, GRID)
    expect(r.flagged.length).toBe(24)
    for (const [i] of r.flagged) expect(i).toBeLessThan(4)
    expect(r.soft.tiles).toBe(24)
    expect(r.tiles.find((t) => t.tile[0] === 0)!.reported).toBeCloseTo(1.004, 2)
    expect(r.tiles.find((t) => t.tile[0] === 7)!.says).toBe('soft')
    expect(r.byReport.map((b) => [b.from, b.under, b.tiles, b.flagged])).toEqual([[0, 1.25, 48, 24], [1.25, 1.9, 0, 0], [1.9, null, 0, 0]])
    expect(r.byReport[1]!.energy).toBeNull()
  })

  it('tells a map enlarged eight times from the same map at its own size by both numbers, and flags it when it is faint', () => {
    const own = carried(texels(() => 1.004), picture(noise(1)), 1, GRID)
    const coarse = noise(8)
    const large = carried(texels(() => 1.004), picture(coarse), 1, GRID)
    const faint = carried(texels(() => 1.004), picture((x, y) => 140 + 0.2 * (coarse(x, y) - 120)), 1, GRID)
    expect(own.flagged).toEqual([])
    expect(large.sharp.energy!).toBeLessThan(own.sharp.energy! / 10)
    expect(large.sharp.fineOverCoarse!).toBeLessThan(own.sharp.fineOverCoarse! / 50)
    expect(faint.flagged.length).toBeGreaterThan(40)
  })

  it('does not flag dark tiles and does not judge tiles outside the counted pixels', () => {
    const r = carried(texels(() => 1.5, (x) => x < W / 2), picture((_, y) => (y < H / 2 ? 4 : 140)), 1, GRID)
    expect(r.tiles.every((t) => t.tile[0] < 4)).toBe(true)
    expect(r.dark).toBeGreaterThan(0)
    expect(r.tiles.filter((t) => t.dark).every((t) => t.flag === false)).toBe(true)
    expect(r.flagged.length).toBeGreaterThan(0)
    for (const [, j] of r.flagged) expect(j).toBeGreaterThanOrEqual(3)
  })

  it('keeps a limb against black sky out of the energy, so a flat disc that says sharp is flagged', () => {
    const inDisc = (x: number, y: number): boolean => (x - W / 2) ** 2 + (y - H / 2) ** 2 < 80 * 80
    const r = carried(texels(() => 1.2, inDisc), picture((x, y) => (inDisc(x, y) ? 150 : 0)), 1, GRID)
    expect(r.judged).toBeGreaterThan(8)
    expect(r.flagged.length).toBe(r.judged)
  })

  it('uses a band that passes fine detail and holds back a flat field and a slow ramp', () => {
    const ramp = Float64Array.from({ length: 64 * 64 }, (_, i) => (i % 64) / 640)
    const a = blur(ramp, 64, 64, 0.6)
    const b = blur(ramp, 64, 64, 2.0)
    for (let y = 8; y < 56; y++) for (let x = 8; x < 56; x++) expect(Math.abs(a[y * 64 + x]! - b[y * 64 + x]!)).toBeLessThan(1e-9)
    expect(() => carried(texels(() => 1), { width: 10, height: 10, channels: 3, data: new Uint8Array(300) }, 1)).toThrow()
  })
})
