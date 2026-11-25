import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { bounded, flowJudges, mapFaults, mapOf } from '../tools/smooth/maps'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const LIMIT = 0.45
const NOT_CARRIED = 'the range does not carry the pattern'

interface Case { flow: number | null; patternMap: number | null; patternMapBody: number | null; patternMapAlone: number | null; patternMapNo: string | null; patternMapRefused: number | null; patternMapBulk: number | null; patternMapSure: number | null; patternMapGraze: number | null; patternMapBound: number | null; patternMapMoved: number | null; limits: { bulkPx: number; apart: number; boundPx: number; graze: number; carried: number } }
type Made = Record<'clean' | 'swap' | 'light' | 'lightSwap' | 'glint' | 'drift' | 'far' | 'same' | 'sameSwap' | 'slide' | 'slide4' | 'sky', Case & { true: number | null; trueSteep: number | null; trueGraze: number | null; trueBy: string | null; trueEnds: (number | null)[]; trueRest: number | null; trueBoth: number | null; trueBothBy: string | null; trueBothMap: number | null }>

let made: Made
const row = (c: Case): { k: number; pattern: number | null; patternMapMoves: null } & Omit<Case, 'flow' | 'limits'> => {
  const { flow, limits: _limits, ...all } = c
  const rest = Object.fromEntries(Object.entries(all).filter(([key]) => !key.startsWith('true'))) as Omit<Case, 'flow' | 'limits'>
  return { k: 0, pattern: flow, patternMapMoves: null, ...rest }
}
const geometry = (c: Case): number | null => mapOf(row(c)) ?? null

beforeAll(() => {
  made = JSON.parse(execFileSync('python3', [join(ROOT, 'tools/smooth/madegeo.py')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 24 })) as Made
}, 600000)

describe('the pattern by geometry on a turning sphere under a camera that dives, swings and rolls, over 8 steps', () => {
  it('names its bound, its angle and its share in every reply, and a row with a bound is read by the map and then the bounded flow', () => {
    expect(made.clean.limits).toEqual({ bulkPx: 8, apart: 0.01, boundPx: 12, graze: 0.25, carried: 0.5 })
    expect(made.clean.patternMapBound).toBe(12)
    expect(bounded(row(made.clean))).toBe(true)
    expect(mapOf(row(made.clean))).toBe(made.clean.patternMapBody)
    expect(mapOf({ ...row(made.clean), patternMapBound: undefined })).toBe(made.clean.patternMapAlone)
  })

  it('reads the same texture as nothing changed', () => {
    expect(geometry(made.clean)!).toBeLessThan(0.02)
    expect(made.clean.patternMapNo).toBeNull()
    expect(made.clean.patternMapBulk!).toBeLessThan(0.5)
    expect(made.clean.patternMapSure!).toBeGreaterThan(0.9)
  })

  it('reads one texture swapped for another as an unrelated pattern, and does not refuse it: no flow carries it anywhere', () => {
    for (const c of [made.swap, made.lightSwap]) {
      expect(c.patternMapNo).toBeNull()
      expect(geometry(c)!).toBeGreaterThan(0.9)
      expect(c.patternMapSure!).toBeLessThan(c.limits.carried)
      expect(c.flow!).toBeGreaterThan(0.9)
      expect(mapFaults([row(c)], LIMIT).map((f) => f.kind)).toEqual(['body'])
    }
  })

  it('reads the same texture under a strong light bound to the view\'s angle as nothing changed, where the flow reads four times as much', () => {
    expect(geometry(made.light)!).toBeLessThan(0.1)
    expect(made.light.patternMapNo).toBeNull()
    expect(made.light.patternMapBulk!).toBeLessThan(0.5)
    expect(made.light.flow!).toBeGreaterThan(0.2)
    expect(made.light.flow!).toBeGreaterThan(3 * geometry(made.light)!)
    expect(mapFaults([row(made.light)], LIMIT)).toEqual([])
  })

  it('reads a glint narrower than its wide window, in which the picture is blown out, under the limit and under the flow', () => {
    expect(geometry(made.glint)!).toBeLessThan(0.3)
    expect(geometry(made.glint)!).toBeLessThan(made.glint.flow!)
  })

  it('takes a drift of the ground the record does not tell out with the bounded flow, under the same light', () => {
    expect(made.drift.patternMapBulk!).toBeGreaterThan(3)
    expect(made.drift.patternMapBulk!).toBeLessThan(made.drift.limits.bulkPx)
    expect(made.drift.patternMapAlone!).toBeGreaterThan(0.12)
    expect(geometry(made.drift)!).toBeLessThan(0.1)
    expect(made.drift.patternMapNo).toBeNull()
  })

  it('refuses a ground that lies farther off the map than the bound and leaves the row to the flow, never green by itself', () => {
    expect(made.far.patternMapBulk!).toBeGreaterThan(made.far.limits.boundPx)
    expect(made.far.patternMapSure!).toBeGreaterThan(0.9)
    expect(made.far.patternMapNo).toBe(NOT_CARRIED)
    expect(made.far.patternMap).toBeNull()
    expect(made.far.patternMapRefused!).toBeGreaterThan(LIMIT)
    expect(mapFaults([row(made.far)], LIMIT)).toEqual([])
    expect(mapFaults([{ ...row(made.far), pattern: null }], LIMIT).map((f) => f.kind)).toEqual(['refused'])
  })

  it('leaves every row read by geometry to the flow as well, so a report with the map is red wherever the run without it is red', () => {
    for (const c of [made.clean, made.swap, made.light, made.lightSwap, made.glint, made.drift, made.far]) expect(flowJudges(row(c))).toBe(true)
    expect(geometry(made.light)!).toBeLessThan(LIMIT)
    expect(flowJudges({ ...row(made.light), pattern: 1.04 })).toBe(true)
    const { patternMapBound: _bound, ...older } = row(made.light)
    expect(flowJudges(older)).toBe(false)
    expect(flowJudges({ ...row(made.light), patternMapMoves: 2, patternMapMoved: 1 })).toBe(false)
    expect(flowJudges({ k: 0, pattern: 1.04 })).toBe(true)
  })
})

describe('the pattern by the true carry on the same sphere: the map alone at the full size, no flow, no angle left out', () => {
  it('reads nothing where nothing changes and says what its map stands on', () => {
    expect(made.clean.true!).toBeLessThan(0.02)
    expect(made.clean.trueBy).toBe('range')
    expect(made.clean.trueEnds).toHaveLength(2)
  })

  it('keeps a swapped texture red, with and without the light, from both ends', () => {
    for (const c of [made.swap, made.lightSwap]) {
      expect(c.true!).toBeGreaterThan(1)
      for (const end of c.trueEnds) expect(end!).toBeGreaterThan(1)
    }
  })

  it('reads a strong light bound to the angle of the view, and a narrow glint, under the limit without any flow', () => {
    expect(made.light.true!).toBeLessThan(0.25)
    expect(made.glint.true!).toBeLessThan(LIMIT)
  })

  it('has no flow to take out a drift the record does not tell: a small one stays under the limit, a large one is red', () => {
    expect(made.drift.true!).toBeGreaterThan(made.clean.true! + 0.1)
    expect(made.drift.true!).toBeLessThan(LIMIT)
    expect(made.far.true!).toBeGreaterThan(LIMIT)
  })

  it('reads a texture that slides on its body: by 4 px a step red by its number, by 2 px a step three times the flow but under the limit, and both refused because the pattern has moved on its body, where the flow follows the slide and reads it green', () => {
    expect(made.slide4.true!).toBeGreaterThan(LIMIT)
    expect(made.slide.true!).toBeGreaterThan(3 * made.slide.flow!)
    expect(made.slide.true!).toBeLessThan(LIMIT)
    for (const c of [made.slide, made.slide4]) {
      expect(c.flow!).toBeLessThan(0.2)
      expect(c.patternMapNo).toBe('the range does not carry the pattern')
      expect(c.patternMapBulk!).toBeGreaterThan(c.limits.bulkPx)
    }
    expect(made.clean.patternMapNo).toBeNull()
  })

  it('gives the line of both: the larger of the map\'s part and the flow\'s part, with who gives it and the share the map reads', () => {
    for (const c of [made.clean, made.swap, made.light, made.sky]) {
      expect(c.trueBoth!).toBeCloseTo(Math.max(c.true!, c.trueRest!), 9)
      expect(c.trueBothMap!).toBeGreaterThan(0.2)
      expect(c.trueBothMap!).toBeLessThan(0.8)
    }
    expect(made.swap.trueBothBy).toBe('map')
    expect(made.clean.trueBoth!).toBeLessThan(LIMIT)
  })

  it('keeps a row red whose flow part alone is red: the body unchanged, the sky off it one field fading into another', () => {
    expect(made.sky.true!).toBeLessThan(0.02)
    expect(made.sky.trueRest!).toBeGreaterThan(1)
    expect(made.sky.trueBoth!).toBeGreaterThan(1)
    expect(made.sky.trueBothBy).toBe('flow')
  })

  it('shows the reading without the low angles and their share beside it, and leaves nothing out of the number itself', () => {
    for (const c of [made.clean, made.swap, made.light, made.glint]) {
      expect(c.trueGraze!).toBeGreaterThan(0.03)
      expect(c.trueGraze!).toBeLessThan(0.15)
      expect(c.trueSteep!).toBeLessThanOrEqual(c.true! + 1e-9)
    }
  })

  it('reads nothing on the control, a pair whose later frame is the first one drawn again by the map, even where the real pair is a swap', () => {
    expect(made.same.true!).toBeLessThan(0.02)
    expect(made.sameSwap.true!).toBeLessThan(0.02)
    expect(made.sameSwap.flow!).toBeLessThan(LIMIT)
    expect(made.lightSwap.flow!).toBeGreaterThan(LIMIT)
  })
})
