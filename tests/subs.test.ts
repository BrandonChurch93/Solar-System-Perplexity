import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cues, cueAt, fontHeight, kernel, layout, stateAt } from '../src/subs/layout'
import { blur, Haze, lattice } from '../src/subs/haze'
import { MT } from '../src/subs/mt'
import { EM, HAZE_AHEAD, WORD_AHEAD } from '../src/subs/look'
import metrics from '../src/subs/metrics.json'

const root = join(__dirname, '..')
const fx = JSON.parse(readFileSync(join(root, 'tests/fixtures/subs.json'), 'utf8'))
const given = JSON.parse(readFileSync(join(root, 'src/subs/cues.json'), 'utf8')) as { id: string; t_in: number; t_out: number; t_end: number; rows: number[][]; words: { w: string; on: number; off: number }[] }[]

describe('the subtitle cues', () => {
  it('holds the 19 lines with the rows and the word windows of the list', () => {
    expect(cues.length).toBe(19)
    const L = layout(3840, 2160)
    given.forEach((g, n) => {
      const c = cues[n]!
      expect(c.id).toBe(g.id)
      expect(c.rows).toEqual(g.rows)
      expect(c.rows.flat()).toEqual(g.words.map((_, i) => i))
      expect(c.words.map((w) => [w.w, w.on, w.off])).toEqual(g.words.map((w) => [w.w, w.on, w.off]))
      const items = L.lines[n]!
      expect(items.map((it) => it.i)).toEqual(g.rows.flat())
      g.rows.forEach((row, ri) => row.forEach((i) => expect(items.find((it) => it.i === i)!.row).toBe(ri)))
      g.words.forEach((w, i) => {
        const before = stateAt(w.on - WORD_AHEAD - 1e-6, L.em)
        if (before && before.cue === n) expect(before.words[i]!.shown).toBe(0)
        const lit = stateAt(Math.min(w.on + 0.3, g.t_out), L.em)!
        expect(lit.cue).toBe(n)
        expect(lit.words[i]!.shown).toBeGreaterThan(0.9)
        const hazeBefore = stateAt(Math.max(g.t_in, w.on - HAZE_AHEAD - 1e-6), L.em)!
        expect(hazeBefore.words[i]!.haze).toBeLessThan(1e-3)
      })
    })
  })

  it('shows no line before its t_in or after its t_end, and nothing between lines', () => {
    given.forEach((g, n) => {
      expect(cueAt(g.t_in - 1e-6)).not.toBe(n)
      expect(cueAt(g.t_in)).toBe(n)
      expect(cueAt(g.t_end)).toBe(n)
      expect(cueAt(g.t_end + 1e-6)).not.toBe(n)
      const next = given[n + 1]
      if (next) {
        expect(g.t_end).toBeLessThan(next.t_in)
        for (let k = 1; k < 8; k++) expect(stateAt(g.t_end + ((next.t_in - g.t_end) * k) / 8, 108)).toBeNull()
      }
      const end = stateAt(g.t_end, 108)!
      expect(end.env).toBe(0)
      for (const w of end.words) {
        expect(w.shown).toBe(0)
        expect(w.haze).toBe(0)
      }
    })
    expect(stateAt(0, 108)).toBeNull()
    expect(stateAt(given[0]!.t_in - 0.01, 108)).toBeNull()
    expect(stateAt(given[18]!.t_end + 0.01, 108)).toBeNull()
    for (let k = 0; k < 60 * 180; k++) {
      const t = k / 60
      const inside = given.findIndex((g) => g.t_in <= t && t <= g.t_end)
      expect(cueAt(t)).toBe(inside)
    }
  })

  it('has a width for every word and only the characters of the font subset', () => {
    const chars = new Set(fx.chars as string)
    for (const c of cues) for (const w of c.words) {
      for (const size of ['108', '81']) expect((metrics.sizes as Record<string, { widths: Record<string, number> }>)[size]!.widths[w.w]).toBeGreaterThan(0)
      for (const ch of w.w) expect(chars.has(ch)).toBe(true)
    }
  })
})

describe('the subtitle layout against subs.py', () => {
  it('reads the font heights as PIL does', () => {
    for (const [size, [asc, desc]] of Object.entries(fx.pil as Record<string, [number, number]>)) {
      expect(fontHeight(metrics.ascent, Number(size))).toBe(asc)
      expect(fontHeight(metrics.descent, Number(size))).toBe(desc)
    }
  })

  it('places the band, the grid and every word as subs.py does', () => {
    for (const [key, f] of Object.entries(fx.layout as Record<string, any>)) {
      const [w, h] = key.split('x').map(Number) as [number, number]
      const L = layout(w, h)
      expect(L.em).toBeCloseTo(f.em, 9)
      expect(L.em).toBeCloseTo(EM * h, 9)
      expect([L.ss, L.y0, L.y1, L.gw, L.gh, L.upW, L.upH]).toEqual([f.ss, f.y0, f.y1, f.gw, f.gh, f.up[0], f.up[1]])
      expect(L.asc).toBeCloseTo(f.asc, 9)
      expect(L.desc).toBeCloseTo(f.desc, 9)
      const hz = new Haze(L)
      expect(hz.starList.length).toBe(f.nstars)
      f.stars.forEach((s: number[], i: number) => {
        const st = hz.starList[i]!
        expect([st.u, st.v, st.phase, st.size].map((v, j) => Math.abs(v - s[j]!) < 1e-9)).toEqual([true, true, true, true])
      })
      cues.forEach((c, n) => {
        const ref = f.lines[c.id]
        expect(ref.rows).toEqual(c.rows)
        L.lines[n]!.forEach((it, j) => {
          const [i, x, base, wd, row, tx, ty, tw, th] = ref.items[j] as number[]
          expect([it.i, it.row, it.tx, it.ty, it.tw, it.th]).toEqual([i, row, tx, ty, tw, th])
          expect(Math.abs(it.x - x!)).toBeLessThan(1e-6)
          expect(Math.abs(it.base - base!)).toBeLessThan(1e-6)
          expect(Math.abs(it.w - wd!)).toBeLessThan(1e-6)
        })
      })
    }
  })
})

describe('the subtitle haze against subs.py', () => {
  it('draws the random numbers of numpy', () => {
    for (const [seed, want] of Object.entries(fx.mt as Record<string, number[]>)) {
      const g = new MT(Number(seed))
      expect(want.map(() => g.rand())).toEqual(want)
    }
    const L = lattice(11)
    expect([L[0], L[(1 * 32 + 2) * 64 + 3], L[(63 * 32 + 31) * 64 + 63]]).toEqual(fx.lattice11)
  })

  it('makes the kernels and the blur of OpenCV', () => {
    for (const [sigma, want] of Object.entries(fx.kernel as Record<string, number[]>)) {
      const k = kernel(Number(sigma))
      expect(k.length).toBe(want.length)
      want.forEach((v, i) => expect(Math.abs(k[i]! - v)).toBeLessThan(2e-7))
    }
    const src = new Float32Array((fx.blur.src as number[][]).flat())
    const out = blur(src, 14, 9, fx.blur.sigma)
    ;(fx.blur.out as number[][]).flat().forEach((v, i) => expect(Math.abs(out[i]! - v)).toBeLessThan(2e-6))
  })

  it('gives the haze grid of subs.py at seven times', () => {
    const L = layout(1920, 1080)
    const hz = new Haze(L)
    for (const f of fx.haze as { t: number; at: number[][]; mean: number[] }[]) {
      const g = hz.fill(f.t, stateAt(f.t, L.em)!)
      let worst = 0
      for (const [y, x, ...v] of f.at) for (let c = 0; c < 4; c++) worst = Math.max(worst, Math.abs(g[(y! * L.gw + x!) * 4 + c]! - v[c]!))
      expect(worst).toBeLessThan(2e-4)
      const mean = [0, 0, 0, 0]
      for (let i = 0; i < g.length; i++) mean[i & 3] = mean[i & 3]! + g[i]! / (L.gw * L.gh)
      mean.forEach((m, c) => expect(Math.abs(m - f.mean[c]!)).toBeLessThan(2e-5))
    }
  })
})
