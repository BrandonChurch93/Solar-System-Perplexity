import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { FULL, carriedFull } from '../tools/smooth/maps'

interface Way { left: [number, number]; pop: number | null; pops: (number | null)[]; block: number | null; change: number | null; pattern: number | null; step: number | null }
interface Slide { unit: 'reduced' | 'full'; px: number; made: number; stands: Way; full: Way }
interface Made { slides: Slide[]; grow: { slides: number[]; stands: Way; full: Way }; popped: { at: number; stands: Way; full: Way }; soft: number; settle: number; edge: number }

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const FLOOR = 0.25
const MAX_POP = 1.2
const MAX_PATTERN = 0.45
const PX = [0.25, 0.5, 1, 1.5, 3.66]

let made: Made

beforeAll(() => {
  made = JSON.parse(execFileSync('python3', [join(ROOT, 'tools/smooth/madeslide.py')], { encoding: 'utf8', maxBuffer: 1 << 26 })) as Made
}, 600000)

const at = (unit: 'reduced' | 'full', px: number): Slide => made.slides.find((s) => s.unit === unit && s.px === px)!

describe('a sharp still that only slides (MAIL 922)', () => {
  it('is made at every slide asked for, in pixels of the reduced picture and of the frame', () => {
    expect(made.slides.map((s) => s.unit + ' ' + s.px)).toEqual([...PX.map((px) => 'reduced ' + px), ...PX.map((px) => 'full ' + px)])
    for (const s of made.slides) expect(Math.abs(s.made - s.px)).toBeLessThan(0.04)
  })

  it('as the reader stands, leaves a difference that is the reader\'s own: a part of a reduced pixel reads over nine times a whole one', () => {
    const whole = at('reduced', 1).stands.left[1]
    expect(whole).toBeLessThan(0.3)
    for (const px of [0.25, 0.5, 1.5, 3.66]) expect(at('reduced', px).stands.left[0]).toBeGreaterThan(9 * whole)
    for (const px of PX) expect(at('full', px).stands.left[0]).toBeGreaterThan(0.8)
  })

  it('with carryFull leaves nothing at every slide: what is left stays under the pop\'s floor', () => {
    for (const s of made.slides) {
      expect(s.full.left[1]).toBeLessThan(FLOOR * 0.7)
      expect(s.full.left[1]).toBeLessThan(s.stands.left[0])
    }
  })

  it('with carryFull reads no pop, no change in place and no pattern at any slide', () => {
    for (const s of made.slides) {
      expect(s.full.pop!).toBeLessThan(0.7)
      expect(s.full.change!).toBeLessThan(MAX_PATTERN)
      expect(s.full.change!).toBeLessThan(s.stands.change!)
      expect(s.full.pattern!).toBeLessThan(0.01)
      expect(s.full.block!).toBeLessThanOrEqual(s.stands.block!)
    }
  })

  it('leaves the pattern and the level step as they stand', () => {
    for (const s of made.slides) {
      expect(s.full.pattern).toBe(s.stands.pattern)
      expect(s.full.step).toBe(s.stands.step)
    }
  })
})

describe('a slide that grows from 3 to 3.5 reduced pixels a half frame', () => {
  it('is red as the reader stands, on a picture where nothing changes', () => {
    expect(made.grow.slides[0]).toBe(3)
    expect(made.grow.slides[made.grow.slides.length - 1]).toBe(3.5)
    expect(made.grow.stands.pop!).toBeGreaterThan(MAX_POP)
    expect(made.grow.stands.left[1]).toBeGreaterThan(10 * made.grow.stands.left[0])
  })

  it('is green with carryFull, what is left under the floor at every step', () => {
    expect(made.grow.full.pop!).toBeLessThan(0.7)
    expect(made.grow.full.left[1]).toBeLessThan(FLOOR * 0.7)
  })
})

describe('a real pop on the sliding still', () => {
  it('stands out of the smear only just as the reader stands', () => {
    expect(made.popped.stands.pops[made.popped.at]!).toBeGreaterThan(MAX_POP)
    expect(made.popped.stands.pops[made.popped.at]!).toBeLessThan(1.5)
  })

  it('is caught with carryFull, at its own frame and four times as high', () => {
    const pops = made.popped.full.pops
    expect(pops[made.popped.at]!).toBeGreaterThan(4 * made.popped.stands.pops[made.popped.at]!)
    expect(pops.indexOf(Math.max(...pops.map((v) => v ?? 0)))).toBe(made.popped.at)
    for (let i = 0; i < made.popped.at; i++) expect(pops[i]!).toBeLessThan(0.7)
    expect(made.popped.full.change!).toBeGreaterThan(10)
  })
})

describe('the report\'s words for --carry-full', () => {
  it('name the reader\'s own numbers and the pixels left out at the frame\'s size', () => {
    expect(FULL).toEqual({ softPx: made.soft, settlePx: made.settle, edge: made.edge })
    const lines = carriedFull(0.25)
    expect(lines).toHaveLength(2)
    expect(lines[0]).toContain('the outermost 4 px')
    expect(lines[0]).toContain('within 16 px of the edge')
    expect(lines.join(' ')).not.toMatch(/[\u2014!]/)
  })
})
