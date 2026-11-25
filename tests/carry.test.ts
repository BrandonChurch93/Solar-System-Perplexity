import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { BLOOM, NOT_CARRIED as REFUSED_BY_RANGE, NOT_FOLLOWED, apart, byFlow, flowed, glowPx, look, mapFaults, mapOf, moving, outrun, shownRows, unfollowed, worded } from '../tools/smooth/maps'

interface Reading { value: number | null; at: [number, number] | null; share: number; on: number; by: { map: number; sky: number; flow: number } | null; rule: string | null; left: number | null; bulk: number | null; apart: number | null; no: string | null; refused: number | null; body: number | null; sky: number | null; alone: number | null; moves: number | null; moved: number | null }
interface SkyFlow { value: number | null; share: number; far: number | null; farShare: number; none: [number | null, number | null]; limb: (number | null)[]; covered: number; coveredOnBody: number }
interface Way { clean: Reading; exchange: Reading; untold: Reading }
interface Made {
  rise: Way
  dive: Way
  point: { carried: [number, number]; byHand: [number, number]; far: number; farByHand: number }
  moon: { known: Reading; moonUnderMap: number; moonPixels: number; unknown: Reading; unknownMoonUnderMap: number; oneBody: Reading; oneBodyMoonUnderMap: number; covered: { pixels: number; seen: number } }
  oblate: { clean: Reading; ballOff: number; ballAgrees: number; asSphere: Reading }
  relief: { clean: Reading; asSphere: Reading }
  shape: { told: Reading; untold: Reading; oneTold: Reading }
  moving: { rigid: Reading; told: Reading; slow: Reading; stray: { clean: number; slid: number } }
  light: { none: boolean; share: number; byHand: number; inside: boolean }
  sky: { clean: Reading }
  skyFlow: { clean: SkyFlow; exchange: SkyFlow }
  refusal: { clean: Reading; shell: Reading; grounds: Reading }
  range: { off: number; none: boolean; reduced: number; units: number; picked: boolean; pickedSmall: number[]; near: number[] }
  tool: { plainKeys: string[]; mainSame: boolean; more: string[]; limits: { bulkPx: number; apart: number }; main: number | null; clean: Record<string, unknown>; exchange: Record<string, unknown>; ball: number | null; ballUnits: number[] | null; rows: boolean[] }
}

const LIMIT = 0.45
const NOT_CARRIED = 'the range does not carry the pattern'
let made: Made
let folder = ''

describe('the pattern of a pair read by the camera\'s own map, on made bodies with their depth pictures', () => {
  beforeAll(() => {
    folder = mkdtempSync(join(tmpdir(), 'carry-'))
    made = JSON.parse(execFileSync('python3', [fileURLToPath(new URL('../tools/smooth/madecarry.py', import.meta.url)), folder], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 24 })) as Made
  }, 300_000)
  afterAll(() => rmSync(folder, { recursive: true, force: true }))

  it('carries a point of a turning body to the place worked out by hand', () => {
    expect(Math.abs(made.point.carried[0] - made.point.byHand[0])).toBeLessThan(1e-3)
    expect(Math.abs(made.point.carried[1] - made.point.byHand[1])).toBeLessThan(1e-3)
    expect(Math.abs(made.point.far - made.point.farByHand)).toBeLessThan(1e-9)
  })

  it('reads a clean rise and a clean dive over a turning sphere as the same pattern, on the nearer frame, under the map', () => {
    for (const way of [made.rise, made.dive]) {
      expect(way.clean.value!).toBeLessThan(0.05)
      expect(way.clean.by!.map + way.clean.by!.sky).toBeGreaterThan(0.95)
      expect(way.clean.left!).toBeLessThan(4)
    }
    expect(made.rise.clean.on).toBe(0)
    expect(made.dive.clean.on).toBe(1)
  })

  it('gives another pattern on the same body no reading: the map does not carry it, the pair itself an exchange, its largest block under the map', () => {
    for (const way of [made.rise, made.dive]) {
      expect(way.exchange.value).toBeNull()
      expect(way.exchange.no).toBe(NOT_CARRIED)
      expect(way.exchange.refused!).toBeGreaterThan(1)
      expect(way.exchange.rule).toBe('map')
    }
  })

  it('gives a turn the record does not tell no reading, though the flow finds it: the flow left over the body is the evidence', () => {
    for (const way of [made.rise, made.dive]) {
      expect(way.clean.bulk!).toBeLessThan(0.5)
      expect(way.clean.no).toBeNull()
      expect(way.untold.value).toBeNull()
      expect(way.untold.no).toBe(NOT_CARRIED)
      expect(way.untold.bulk!).toBeGreaterThan(made.tool.limits.bulkPx)
      expect(way.untold.refused!).toBeLessThan(LIMIT)
      expect(way.untold.by!.flow).toBeGreaterThan(0.8)
      expect(way.untold.rule).toBe('flow')
    }
  })

  it('refuses a depth picture that lies off the surface the pattern is on, and says two grounds where the frames hold the body at two distances', () => {
    const { clean, shell, grounds } = made.refusal
    expect(clean.value!).toBeLessThan(0.05)
    expect(clean.no).toBeNull()
    expect(clean.bulk!).toBeLessThan(0.5)
    expect(clean.apart!).toBeLessThan(made.tool.limits.apart / 10)
    expect(shell.value).toBeNull()
    expect(shell.no).toBe(NOT_CARRIED)
    expect(shell.bulk!).toBeGreaterThan(made.tool.limits.bulkPx)
    expect(shell.apart!).toBeLessThan(made.tool.limits.apart / 10)
    expect(grounds.value).toBeNull()
    expect(grounds.no).toBe('two grounds')
    expect(grounds.bulk!).toBeLessThan(0.5)
    expect(grounds.apart!).toBeGreaterThan(made.tool.limits.apart)
  })

  it('carries a moon the depth picture names by its own place and turn, and judges nothing of the ground it covers', () => {
    expect(made.moon.moonPixels).toBeGreaterThan(1000)
    expect(made.moon.known.value!).toBeLessThan(0.1)
    expect(made.moon.moonUnderMap).toBeGreaterThan(0.9)
    expect(made.moon.covered.pixels).toBeGreaterThan(500)
    expect(made.moon.covered.seen).toBe(0)
  })

  it('refuses a moon the depth picture has the distance of and the record does not name, and reads a moon it knows nothing of as an exchange', () => {
    expect(made.moon.oneBodyMoonUnderMap).toBe(0)
    expect(made.moon.oneBody.value).toBeNull()
    expect(made.moon.oneBody.no).toBe('two grounds')
    expect(made.moon.oneBody.apart!).toBeGreaterThan(made.tool.limits.apart)
    expect(made.moon.oneBody.refused!).toBeLessThan(LIMIT)
    expect(made.moon.known.no).toBeNull()
    expect(made.moon.unknown.value!).toBeGreaterThan(LIMIT)
  })

  it('follows a flattened body by its depth picture, which the made depth of the pose agrees with', () => {
    expect(made.oblate.clean.value!).toBeLessThan(0.05)
    expect(made.oblate.ballOff).toBeLessThan(1e-9)
    expect(made.oblate.ballAgrees).toBe(1)
    expect(made.oblate.asSphere.by!.flow).toBeGreaterThan(made.oblate.clean.by!.flow + 0.1)
  })

  it('carries a body through the shape it is drawn in at each frame, outside its turn, and refuses the pair where the record names none', () => {
    expect(made.shape.told.no).toBeNull()
    expect(made.shape.told.value!).toBeLessThan(0.05)
    expect(made.shape.told.bulk!).toBeLessThan(1)
    for (const r of [made.shape.untold, made.shape.oneTold]) {
      expect(r.value).toBeNull()
      expect(r.no).toBe('the range does not carry the pattern')
      expect(r.bulk!).toBeGreaterThan(made.tool.limits.bulkPx)
    }
  })

  it('follows relief near the lens by its depth picture, where a sphere leaves most of the frame to the flow', () => {
    expect(made.relief.clean.value!).toBeLessThan(0.05)
    expect(made.relief.clean.by!.flow).toBeLessThan(0.05)
    expect(made.relief.asSphere.by!.flow).toBeGreaterThan(0.5)
  })

  it('carries the sky by the camera\'s rotation alone', () => {
    expect(made.sky.clean.value!).toBeLessThan(0.05)
    expect(made.sky.clean.by!.sky).toBe(1)
    expect(made.sky.clean.sky!).toBeLessThan(0.05)
    expect(made.sky.clean.body).toBeNull()
  })

  it('reads the pixels off the bodies by the flow alone and leaves out the sky the other frame\'s body covers', () => {
    expect(made.skyFlow.clean.value!).toBeLessThan(0.283)
    expect(made.skyFlow.clean.share).toBeGreaterThan(0.5)
    expect(made.skyFlow.exchange.value!).toBeGreaterThan(0.45)
    expect(made.skyFlow.clean.covered).toBeGreaterThan(0.02)
    expect(made.skyFlow.clean.coveredOnBody).toBe(0)
    expect(made.skyFlow.clean.farShare).toBeGreaterThan(0.02)
    expect(made.skyFlow.clean.farShare).toBeLessThanOrEqual(made.skyFlow.clean.share)
    expect(made.skyFlow.clean.far!).toBeLessThan(0.283)
    expect(made.skyFlow.clean.limb).toEqual([6, null])
    expect(made.skyFlow.clean.none).toEqual([null, null])
  })

  it('gives the reading on the bodies and the reading off them beside the row\'s own', () => {
    for (const way of [made.rise, made.dive]) {
      expect(way.clean.body!).toBeLessThan(0.05)
      expect(way.exchange.body!).toBeGreaterThan(1)
      expect(Math.max(way.exchange.body!, way.exchange.sky ?? 0)).toBeGreaterThanOrEqual(way.exchange.refused! - 1e-6)
    }
  })

  it('reads every pair by the map alone too: the same as after the flow where the record is true, and it does not follow a surface that slides', () => {
    for (const r of [made.rise.clean, made.dive.clean, made.oblate.clean, made.relief.clean, made.shape.told]) {
      expect(r.alone!).toBeLessThan(0.01)
      expect(Math.abs(r.alone! - r.body!)).toBeLessThan(0.001)
    }
    expect(made.moon.known.alone!).toBeLessThan(0.01)
    expect(made.rise.exchange.alone!).toBeGreaterThan(1)
    const { rigid, told, slow } = made.moving
    for (const r of [rigid, told, slow]) {
      expect(r.no).toBeNull()
      expect(r.bulk!).toBeGreaterThan(6)
      expect(r.bulk!).toBeLessThan(8)
      expect(r.body!).toBeLessThan(0.01)
      expect(r.alone!).toBeGreaterThan(0.2)
    }
    const key = (r: Reading): object => ({ k: 1, pattern: 0.011, patternMap: r.value, patternMapBody: r.body, patternMapAlone: r.alone, patternMapMoves: r.moves, patternMapMoved: r.moved })
    expect(rigid.moves).toBeNull()
    expect(mapOf(key(rigid) as never)).toBe(rigid.alone)
    expect(told.moves).toBe(12)
    expect(told.moved!).toBeLessThan(12)
    expect(mapOf(key(told) as never)).toBe(0.011)
    expect(slow.moves).toBeCloseTo(0.8, 9)
    expect(outrun(key(slow) as never)).toBe(true)
    expect(mapOf(key(slow) as never)).toBe(slow.alone)
    expect(mapFaults([key(slow) as never], LIMIT)).toEqual([{ kind: 'outrun', rows: 1, first: 1, k: 1, value: slow.alone, moved: slow.moved, moves: slow.moves }])
  })

  it('measures how far the picture\'s own way along the flows parts from the map on a body: under a pixel where the record is true, the slide where the surface slides', () => {
    expect(made.moving.stray.clean).toBeLessThan(1)
    const byHand = (2 * Math.PI / 180 / 4) * (540 / 2 / Math.tan((20 * Math.PI) / 180))
    expect(Math.abs(made.moving.stray.slid - byHand)).toBeLessThan(0.5)
  })

  it('takes the light of a body from its record: every ray that passes nearer to it than the light reaches, none where the record names none', () => {
    expect(made.light.none).toBe(true)
    expect(Math.abs(made.light.share - made.light.byHand)).toBeLessThan(0.005)
    expect(made.light.inside).toBe(true)
  })

  it('reads the depth as the render packs it, to two millionths, and none as none', () => {
    expect(made.range.off).toBeLessThan(2e-6)
    expect(made.range.units).toBeLessThan(2e-6)
    expect(made.range.picked).toBe(true)
    expect(made.range.pickedSmall[0]! + made.range.pickedSmall[1]! + made.range.pickedSmall[2]!).toBeCloseTo(1, 9)
    expect(Math.abs(made.range.pickedSmall[1]! - made.range.pickedSmall[2]!)).toBeLessThan(0.02)
    expect(made.range.none).toBe(true)
    expect(made.range.reduced).toBeCloseTo(480 / 540, 6)
  })

  it('takes no unit that puts a point nearer than the lens can draw, where the record names the near plane', () => {
    expect(made.range.near[0]).toBeGreaterThan(0.2)
    expect(made.range.near[1]).toBe(made.range.near[0])
    expect(made.range.near[2]).toBe(0)
  })

  it('stands beside main\'s reader in the pictures part: main\'s numbers do not move, the new ones have keys of their own', () => {
    expect(made.tool.mainSame).toBe(true)
    expect(made.tool.plainKeys).toContain('pattern')
    expect(made.tool.plainKeys.some((k) => k.startsWith('patternMap'))).toBe(false)
    expect(made.tool.more).toEqual(['patternMap', 'patternMapAlone', 'patternMapApart', 'patternMapAt', 'patternMapBody', 'patternMapBulk', 'patternMapBy', 'patternMapLeft', 'patternMapLimits', 'patternMapLit', 'patternMapMoved', 'patternMapMoves', 'patternMapNo', 'patternMapOn', 'patternMapRefused', 'patternMapRule', 'patternMapShare', 'patternMapSky', 'patternMapSkyFar', 'patternMapSkyFarShare', 'patternMapSkyShare', 'patternMapSkyTurn', 'patternMapUnits'])
    expect(made.tool.limits).toEqual({ bulkPx: 8, apart: 0.01 })
    expect(made.tool.clean.patternMapUnits).toHaveLength(1)
    expect((made.tool.clean.patternMapUnits as number[])[0]!).toBeGreaterThan(0.5)
    expect(made.tool.ballUnits).toBeNull()
    expect(made.tool.rows).toEqual([true, false, false])
    expect(made.tool.clean.patternMap as number).toBeLessThan(0.05)
    expect(made.tool.clean.patternMapAlone as number).toBeLessThan(0.05)
    expect(made.tool.clean.patternMapMoves).toBeNull()
    expect(made.tool.clean.patternMapLit).toBe(false)
    expect(made.tool.ball as number).toBeLessThan(0.05)
    expect(made.tool.exchange.patternMap).toBeNull()
    expect(made.tool.exchange.patternMapNo).toBe(NOT_CARRIED)
    expect(made.tool.exchange.patternMapRefused as number).toBeGreaterThan(1)
    expect(made.tool.exchange.patternMapRule).toBe('map')
  })
})

describe('the rows where the two readers fall on different sides of their limits', () => {
  const row = (k: number, pattern: number | null, patternMap: number | null | undefined): { k: number; pattern: number | null; patternMap?: number | null } => ({ k, pattern, ...(patternMap === undefined ? {} : { patternMap }) })

  it('gathers rows that follow each other into one run, with the row where the two lie farthest apart', () => {
    const rows = [row(10, 0.5, 0.2), row(11, 0.7, 0.1), row(12, 0.6, 0.3), row(13, 0.2, 0.2), row(14, 0.3, 0.9), row(15, 0.9, 0.9), row(16, 0.5, 0.4)]
    expect(apart(rows, 0.45, 0.45)).toEqual([{ first: 10, last: 12, rows: 3, k: 11, main: 0.7, map: 0.1, red: 'main' }, { first: 14, last: 14, rows: 1, k: 14, main: 0.3, map: 0.9, red: 'map' }, { first: 16, last: 16, rows: 1, k: 16, main: 0.5, map: 0.4, red: 'main' }])
  })

  it('takes each reader by its own limit, and a row without a number is in no run and ends one', () => {
    expect(apart([row(1, 0.5, 0.4)], 0.45, 0.3)).toEqual([])
    expect(apart([row(1, 0.5, 0.2), row(2, null, 0.2), row(3, 0.5, 0.2), row(4, 0.5, null), row(5, 0.5, undefined)], 0.45, 0.3).map((r) => [r.first, r.last])).toEqual([[1, 1], [3, 3]])
    expect(apart([row(1, 0.5, 0.2)], null, 0.3)).toEqual([])
  })

  it('shows the largest reading by the map and one row of each run, the farthest apart first', () => {
    const rows = [row(10, 0.5, 0.2), row(11, 0.7, 0.1), row(12, 0.2, 0.2), row(13, 0.3, 0.9), row(14, 0.2, 0.3), row(15, 0.5, 0.4)]
    expect(shownRows(rows, 0.45, 0.45, 6).map((r) => r.k)).toEqual([11, 13, 15])
    expect(shownRows(rows, 0.45, 0.45, 2).map((r) => r.k)).toEqual([11, 13])
    expect(shownRows([row(1, 0.5, null)], 0.45, 0.45, 6)).toEqual([])
  })

  it('counts a row the map\'s reader refuses as a red of it, and shows it before any other', () => {
    const no = (k: number, pattern: number | null): { k: number; pattern: number | null; patternMap: null; patternMapNo: string } => ({ k, pattern, patternMap: null, patternMapNo: 'two grounds' })
    expect(apart([no(1, 0.2), no(2, 0.3), no(3, 0.9), no(4, null)], 0.45, 0.3)).toEqual([{ first: 1, last: 2, rows: 2, k: 1, main: 0.2, map: Number.POSITIVE_INFINITY, red: 'map', no: 'two grounds' }])
    expect(shownRows([row(1, 0.5, 0.2), row(2, 0.7, 0.1), no(3, 0.2), row(4, 0.6, 0.6)], 0.45, 0.45, 2).map((r) => r.k)).toEqual([3, 4])
    expect(shownRows([no(1, 0.2), no(2, null)], 0.45, 0.45, 6).map((r) => r.k)).toEqual([1])
  })
})

describe('what the map\'s reader judges and what it hands to the eye', () => {
  const row = (k: number, more: object): { k: number; pattern: number | null } => ({ k, pattern: 0.9, ...more })

  it('takes the glow\'s reach from the film\'s bloom and not from a free number', () => {
    const chain = readFileSync(fileURLToPath(new URL('../src/post/chain.ts', import.meta.url)), 'utf8')
    expect(Number(/const LEVELS = (\d+)/.exec(chain)![1])).toBe(BLOOM.levels)
    expect(chain).toContain('vec2 t = uTexel * uRadius;')
    expect(chain).toContain('vUv + t * vec2(' + BLOOM.taps.toFixed(1) + ', 0.0)')
    expect(chain).not.toContain('vUv + t * vec2(' + (BLOOM.taps + 1).toFixed(1) + ', 0.0)')
    expect(chain).toContain('for (let i = LEVELS - 2; i >= 0; i--)')
    expect(glowPx(1)).toBe(2 + 4 + 8 + 16 + 32 + 64 + 64 + 32 + 16 + 8 + 4)
    expect(glowPx(1)).toBe(250)
    expect(glowPx(0.5)).toBe(188)
  })

  it('marks a row LOOK where the sky off every body is over the limit and the sky far from the limbs is not', () => {
    expect(look(row(1, { patternMapSky: 0.63, patternMapSkyFar: 0.18 }), 0.45)).toBe(true)
    expect(look(row(1, { patternMapSky: 0.63, patternMapSkyFar: null }), 0.45)).toBe(true)
    expect(look(row(1, { patternMapSky: 0.63, patternMapSkyFar: 0.5 }), 0.45)).toBe(false)
    expect(look(row(1, { patternMapSky: 0.4, patternMapSkyFar: 0.18 }), 0.45)).toBe(false)
    expect(look(row(1, { patternMapSky: null, patternMapSkyFar: null }), 0.45)).toBe(false)
    expect(look(row(1, { patternMapSky: 0.63, patternMapSkyFar: 0.18 }), null)).toBe(false)
  })

  it('finds the body and the far sky red over the limit, a refusal red by its reason, and nothing where the reader has no word', () => {
    const rows = [
      row(1, { patternMap: 0.3, patternMapBody: 0.1, patternMapSky: 0.63, patternMapSkyFar: 0.18 }),
      row(2, { patternMap: 0.3, patternMapBody: 0.5, patternMapSky: 0.2, patternMapSkyFar: 0.1 }),
      row(3, { patternMap: 0.3, patternMapBody: 0.7, patternMapSky: 0.2, patternMapSkyFar: 0.1 }),
      row(4, { patternMap: 0.6, patternMapBody: null, patternMapSky: 0.6, patternMapSkyFar: 0.6 }),
      row(5, { patternMap: null, patternMapNo: 'two grounds', patternMapRefused: 0.8 }),
      row(6, { patternMap: null, patternMapNo: 'two grounds', patternMapRefused: 0.9, patternMapSkyFar: 0.2 }),
      row(7, { patternMap: null, patternMapNo: 'the range does not carry the pattern', patternMapRefused: null }),
      row(8, { patternMap: null }),
      row(9, {}),
      { ...row(10, { patternMap: null, patternMapNo: 'the range does not carry the pattern', patternMapRefused: 0.3 }), pattern: null },
    ]
    expect(mapFaults(rows, 0.45)).toEqual([
      { kind: 'body', rows: 3, first: 2, k: 3, value: 0.7 },
      { kind: 'far', rows: 1, first: 4, k: 4, value: 0.6 },
      { kind: 'refused', rows: 2, first: 5, k: 6, value: 0.9, no: 'two grounds' },
      { kind: 'refused', rows: 1, first: 10, k: 10, value: 0.3, no: 'the range does not carry the pattern' },
    ])
    expect(mapFaults(rows, null).map((f) => f.kind)).toEqual(['refused', 'refused'])
    expect(mapFaults([rows[0]!], 0.45)).toEqual([])
    expect(rows.map((r) => worded(r))).toEqual([true, true, true, true, true, true, true, false, false, true])
    expect(rows.map((r) => byFlow(r))).toEqual([false, false, false, false, false, false, true, false, false, true])
  })

  it('hands a row the map refuses because the range does not carry the pattern to main\'s reader, and keeps it out of the runs of the two readers', () => {
    expect(readFileSync(fileURLToPath(new URL('../tools/img/carry.py', import.meta.url)), 'utf8')).toContain('NOT_CARRIED = \'' + REFUSED_BY_RANGE + '\'')
    const no = (k: number, pattern: number | null): { k: number; pattern: number | null; patternMap: null; patternMapNo: string } => ({ k, pattern, patternMap: null, patternMapNo: REFUSED_BY_RANGE })
    expect(apart([no(1, 0.2), no(2, 0.9), no(3, null)], 0.45, 0.45)).toEqual([])
    expect(mapFaults([no(1, 0.2), no(2, 0.9)], 0.45)).toEqual([])
    expect(mapFaults([no(1, 0.2), no(2, 0.9), no(3, null)], 0.45)).toEqual([{ kind: 'refused', rows: 1, first: 3, k: 3, value: null, no: REFUSED_BY_RANGE }])
  })

  it('judges a rigid body by the map alone and a body whose drawer names its surface\'s own motion by the picture\'s own flow, within that motion of the map', () => {
    const rigid = row(1, { patternMap: 0.2, patternMapBody: 0.1, patternMapAlone: 0.6, patternMapMoves: null, patternMapMoved: 3 })
    const told = row(2, { pattern: 0.3, patternMap: 0.2, patternMapBody: 0.1, patternMapAlone: 0.6, patternMapMoves: 4, patternMapMoved: 3 })
    const fast = row(3, { pattern: 0.2, patternMap: 0.2, patternMapBody: 0.1, patternMapAlone: 0.3, patternMapMoves: 2, patternMapMoved: 3 })
    const old = row(4, { patternMap: 0.2, patternMapBody: 0.1 })
    const bare = row(5, { patternMap: 0.2, patternMapBody: null, patternMapAlone: 0.5, patternMapMoves: null, patternMapMoved: null })
    const blind = row(6, { pattern: 0.3, patternMap: 0.2, patternMapBody: 0.1, patternMapAlone: 0.2, patternMapMoves: 4, patternMapMoved: null })
    const lost = row(7, { pattern: null, patternMap: 0.2, patternMapBody: 0.1, patternMapAlone: 0.2, patternMapMoves: 4, patternMapMoved: 3 })
    const loud = row(8, { pattern: 0.8, patternMap: 0.2, patternMapBody: 0.1, patternMapAlone: 0.2, patternMapMoves: 4, patternMapMoved: 3 })
    const all = [rigid, told, fast, old, bare, blind, lost, loud]
    expect(all.map((r) => mapOf(r))).toEqual([0.6, 0.3, 0.3, 0.1, 0.5, 0.3, null, 0.8])
    expect(all.map((r) => flowed(r))).toEqual([0.1, 0.1, 0.1, 0.1, 0.2, 0.1, 0.1, 0.1])
    expect(all.map((r) => [moving(r), outrun(r), unfollowed(r)])).toEqual([[false, false, false], [true, false, false], [true, true, false], [false, false, false], [false, false, false], [true, false, true], [true, false, true], [true, false, false]])
    expect(mapFaults(all, 0.45)).toEqual([
      { kind: 'body', rows: 3, first: 1, k: 8, value: 0.8 },
      { kind: 'outrun', rows: 1, first: 3, k: 3, value: 0.3, moved: 3, moves: 2 },
      { kind: 'refused', rows: 2, first: 6, k: 6, value: null, no: NOT_FOLLOWED },
    ])
  })
})
