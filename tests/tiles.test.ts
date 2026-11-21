import { describe, expect, it } from 'vitest'
import { openRects } from '../src/core/tiles'

function cover(width: number, height: number, filled: (x: number, y: number) => boolean): Uint16Array {
  const a = new Uint16Array(width * height * 4)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (filled(x, y)) a[(y * width + x) * 4 + 3] = 0x3c00
  return a
}

function paint(rects: number[], width: number, height: number): Uint8Array {
  const hit = new Uint8Array(width * height)
  for (let i = 0; i < rects.length; i += 4) {
    for (let y = rects[i + 1]!; y < rects[i + 1]! + rects[i + 3]!; y++) for (let x = rects[i]!; x < rects[i]! + rects[i + 2]!; x++) hit[y * width + x]!++
  }
  return hit
}

describe('openRects', () => {
  it('returns one rectangle for an empty target', () => {
    expect(openRects(cover(100, 70, () => false), 100, 70)).toEqual([0, 0, 100, 70])
  })

  it('returns nothing for a covered target', () => {
    expect(openRects(cover(100, 70, () => true), 100, 70)).toEqual([])
  })

  it('treats negative zero as open', () => {
    const a = cover(40, 40, () => true)
    a[(5 * 40 + 35) * 4 + 3] = 0x8000
    expect(openRects(a, 40, 40)).toEqual([32, 0, 8, 32])
  })

  it('covers every open pixel once and stays inside the target', () => {
    const width = 203
    const height = 131
    const filled = (x: number, y: number): boolean => (x - 90) * (x - 90) + (y - 60) * (y - 60) < 55 * 55 || (x > 150 && y > 100)
    const rects = openRects(cover(width, height, filled), width, height)
    const hit = paint(rects, width, height)
    let closed = 0
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const n = hit[y * width + x]!
        expect(n).toBeLessThanOrEqual(1)
        if (!filled(x, y)) expect(n).toBe(1)
        if (n === 0) closed++
      }
    }
    expect(closed).toBeGreaterThan(0)
    for (let i = 0; i < rects.length; i += 4) {
      expect(rects[i]! + rects[i + 2]!).toBeLessThanOrEqual(width)
      expect(rects[i + 1]! + rects[i + 3]!).toBeLessThanOrEqual(height)
    }
  })
})
