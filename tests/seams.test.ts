import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { setCapture } from '../src/core/clock'
import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'
import { STILL, WINDOW, bothCell, cells, change, lowest, meanCell, stand, standing, tableOf, verdict, where, type SeamRow, type Step } from '../tools/seams/rule'
import { read, seamsOf } from '../tools/seams/speeds'

interface Held { rate: number; seams: { stop: string; seam: string; frame: number; k: number; middle: (number | null)[]; limb: (number | null)[]; mean: number[] }[]; table: string[] }

const held = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/seams-take-b9.json', import.meta.url)), 'utf8')) as Held
const steps = (values: (number | null)[], k = 100): Step[] => values.map((v, i) => ({ k: k + i, middle: v, limb: v, mean: v ?? 0 }))
const ks = (n: number, k = 100): number[] => Array.from({ length: n }, (_, i) => k + i)

describe('the rule of the seams report', () => {
  it('is travel_builder\'s: under 0.5 px a half frame for 3 or more steps, in the last 12 film frames before a seam and the first 20 after', () => {
    expect(STILL).toEqual({ px: 0.5, steps: 3 })
    expect(WINDOW).toEqual({ before: 12, after: 20 })
  })

  it('says a picture stands when it is under the limit for 3 steps with motion before and after', () => {
    const s = stand(ks(7), [2, 1, 0.4, 0.1, 0.3, 0.9, 2])
    expect(s).toEqual({ kind: 'stands', run: { first: 102, end: 105, steps: 3, lowest: 0.1 } })
  })

  it('does not say so for 2 steps, nor at the limit itself', () => {
    expect(stand(ks(6), [2, 0.4, 0.1, 0.9, 2, 3]).kind).toBe('moves')
    expect(stand(ks(6), [2, 0.5, 0.5, 0.5, 2, 3]).kind).toBe('moves')
  })

  it('tells a picture that comes to rest and stays from one that stands', () => {
    expect(stand(ks(6), [2, 1, 0.4, 0.1, 0.1, 0.1])).toEqual({ kind: 'rests', from: 102 })
  })

  it('tells a picture that starts from rest', () => {
    expect(stand(ks(6), [0.1, 0.1, 0.4, 0.6, 2, 3])).toEqual({ kind: 'starts', until: 103 })
  })

  it('tells a picture at rest through the whole window', () => {
    expect(stand(ks(4), [0.1, 0.1, 0.1, 0.1])).toEqual({ kind: 'still' })
  })

  it('takes a step with no reading as not under the limit and not as motion', () => {
    expect(stand(ks(7), [2, 0.1, null, 0.1, 0.1, 2, 2]).kind).toBe('moves')
    expect(stand(ks(7), [2, null, 0.1, 0.1, 0.1, 2, 2]).kind).toBe('moves')
    expect(stand(ks(7), [2, 2, 0.1, 0.1, 0.1, null, 2]).kind).toBe('moves')
  })

  it('names the longest of two standing runs', () => {
    const s = stand(ks(12), [2, 0.1, 0.1, 0.1, 2, 0.1, 0.1, 0.1, 0.1, 2, 2, 2])
    expect(s.kind === 'stands' && s.run).toEqual({ first: 105, end: 109, steps: 4, lowest: 0.1 })
  })

  it('needs both points under the limit at the same steps', () => {
    const rows: Step[] = ks(7).map((k, i) => ({ k, middle: [2, 0.1, 0.1, 0.1, 0.1, 2, 2][i]!, limb: [2, 2, 2, 0.1, 0.1, 0.1, 2][i]!, mean: 1 }))
    const v = verdict(rows)
    expect(v.both).toEqual({ kind: 'moves', lowest: 0.1 })
    expect(v.middle.alone).toEqual({ first: 101, end: 105, steps: 4, lowest: 0.1 })
    expect(bothCell(v, 2)).toBe('no, lowest 0.10 (middle alone: 50 1/2 to 52 1/2 (4))')
  })

  it('names the lowest speed by its step and the largest change by the moment its two steps share', () => {
    expect(lowest(ks(4), [2, null, 0.3, 1])).toEqual({ value: 0.3, k: 102 })
    expect(change(ks(5), [2, 2.5, null, 1, 3])).toEqual({ value: 2, k: 104, from: 1, to: 3 })
    expect(change(ks(3), [1, null, 3])).toBeNull()
  })

  it('writes a place as a film frame with its half', () => {
    expect(where(2070, 2)).toBe('1035')
    expect(where(2075, 2)).toBe('1037 1/2')
    expect(where(7, 4)).toBe('1 3/4')
  })

  it('words the mean of the frame', () => {
    expect(meanCell(verdict(steps([2, 0.2, 0.1, 0.3, 2])), 2)).toBe('yes, 50 1/2 to 52 (3), lowest 0.10')
    expect(meanCell(verdict(steps([2, 0.2, 0.1, 0.3])), 2)).toBe('rest from 50 1/2')
    expect(meanCell(verdict(steps([0.2, 0.1, 0.3, 2])), 2)).toBe('rest until 51 1/2')
  })
})

describe('the test case: travel_builder\'s table on take batch 9', () => {
  const rows: SeamRow[] = held.seams.map((s) => ({ stop: s.stop, seam: s.seam, frame: s.frame, verdict: verdict(s.middle.map((m, i) => ({ k: s.k + i, middle: m, limb: s.limb[i]!, mean: s.mean[i]! }))) }))

  it('holds 18 seams of 64 half frames each', () => {
    expect(held.seams).toHaveLength(18)
    for (const s of held.seams) expect(s.middle).toHaveLength((WINDOW.before + WINDOW.after) * held.rate)
  })

  it('reads every cell of its table from its steps', () => {
    expect(held.table).toHaveLength(18)
    expect(tableOf(rows, held.rate).slice(2)).toEqual(held.table)
  })

  it('finds its four rises that stand: Mercury 1035, Mars 2745, Jupiter 3315, Neptune 5025', () => {
    expect(standing(rows).map((r) => r.stop + ' ' + r.frame)).toEqual(['mercury 1035', 'mars 2745', 'jupiter 3315', 'neptune 5025'])
    expect(cells(rows.find((r) => r.frame === 1035)!, 2)[6]).toBe('YES, 1034 to 1037 1/2 (7)')
    expect(cells(rows.find((r) => r.frame === 1605)!, 2)[6]).toBe('no, lowest 0.64')
  })
})

describe('the reading on this tree', () => {
  const rate = config.raw.smooth.rate
  setCapture(rate)
  const film = new FilmDirector(plans)
  const seams = seamsOf()

  it('has one seam for the end of every rise, one for every arrival at a hold and the Sun\'s leaving, in the film\'s order', () => {
    expect(seams).toHaveLength(plans.length * 2)
    expect(seams.filter((s) => s.seam.startsWith('rise to '))).toHaveLength(plans.length)
    expect(seams.filter((s) => s.seam.endsWith(' to hold'))).toHaveLength(plans.length - 1)
    expect(seams.filter((s) => s.seam.startsWith('hold to ')).map((s) => s.stop)).toEqual(['sun'])
    expect(seams.map((s) => s.frame)).toEqual([...seams.map((s) => s.frame)].sort((a, b) => a - b))
  })

  it('takes the windows of the rule', () => {
    for (const s of seams) {
      const [before, after] = s.seam.endsWith(' to hold') ? [WINDOW.after, WINDOW.before] : [WINDOW.before, WINDOW.after]
      expect([s.frame - s.from, s.to - s.frame]).toEqual([before, after])
    }
  })

  it('reads a speed for every half frame of a window and draws nothing', () => {
    const seam = seams.find((s) => s.stop === 'mars' && s.seam.startsWith('rise to '))!
    const rows = read(film, seam, { w: 960, h: 540, rate })
    expect(rows).toHaveLength((seam.to - seam.from) * rate)
    expect(rows.map((r) => r.k)).toEqual(ks(rows.length, seam.from * rate))
    for (const r of rows) {
      expect(Number.isFinite(r.mean)).toBe(true)
      expect(r.middle === null || r.middle >= 0).toBe(true)
      expect(r.limb === null || r.limb >= 0).toBe(true)
    }
    expect(rows.some((r) => r.limb !== null)).toBe(true)
  })

  it('reads twice the speed at twice the size', () => {
    const seam = seams.find((s) => s.stop === 'jupiter' && s.seam.startsWith('rise to '))!
    const [small, large] = [read(film, seam, { w: 960, h: 540, rate }), read(film, seam, { w: 1920, h: 1080, rate })]
    small.forEach((r, i) => {
      if (r.limb !== null && large[i]!.limb !== null) expect(large[i]!.limb!).toBeCloseTo(2 * r.limb, 6)
      if (r.middle !== null && large[i]!.middle !== null) expect(large[i]!.middle!).toBeCloseTo(2 * r.middle, 6)
    })
  })
})
