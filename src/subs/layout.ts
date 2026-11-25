import cueList from './cues.json'
import metrics from './metrics.json'
import { BASE, CAP, DESC, EM, GRID_EM, HAZE_AHEAD, HAZE_IN, BLOOM_T, LEAD, OUT, PAD, PILL_X, PILL_Y, TILE_PAD, WORD_AHEAD, WORD_IN, WORD_RISE, WORD_SOFT } from './look'

export interface Word { w: string; on: number; off: number }
export interface Cue { id: string; t_in: number; t_out: number; t_end: number; rows: number[][]; words: Word[] }
export const cues = cueList as Cue[]

export interface Item {
  i: number
  row: number
  x: number
  base: number
  w: number
  tx: number
  ty: number
  tw: number
  th: number
  ax: number
  ay: number
  pill: { xa: number; xb: number; ya: number; yb: number; cx: Float32Array; cy: Float32Array }
}

export interface Layout {
  width: number
  height: number
  em: number
  ss: number
  size: number
  asc: number
  desc: number
  y0: number
  y1: number
  bh: number
  cell: number
  gw: number
  gh: number
  upW: number
  upH: number
  atlasW: number
  atlasH: number
  lines: Item[][]
}

interface Table { space: number; widths: Record<string, number> }
const tables = metrics.sizes as Record<string, Table>
const WIDTHS_AT = 108

export function fontHeight(units: number, size: number): number {
  const scale = Math.round((size * 64 * 65536) / metrics.upm)
  return Math.ceil(Math.round((units * scale) / 65536) / 64)
}

export function layout(width: number, height: number, list: Cue[] = cues): Layout {
  const em = EM * height
  const ss = height <= 720 ? 3 : height <= 1440 ? 2 : 1
  const size = Math.round(em * ss)
  const asc = fontHeight(metrics.ascent, size) / ss
  const desc = fontHeight(metrics.descent, size) / ss
  const table = tables[String(size)] ?? tables[String(WIDTHS_AT)]!
  const scale = (tables[String(size)] ? 1 : size / WIDTHS_AT) / ss
  const wordWidth = (word: string): number => {
    const w = table.widths[word]
    if (w === undefined) throw new Error('subs: no width for ' + word)
    return w
  }
  const pad = PAD * em
  const y0 = Math.max(0, Math.floor(BASE * height - LEAD * em - asc - pad))
  const y1 = Math.min(height, Math.ceil(BASE * height + desc + pad))
  const cell = em / GRID_EM
  const gw = Math.ceil(width / cell)
  const gh = Math.ceil((y1 - y0) / cell)
  const space = table.space * scale
  const m = Math.ceil(TILE_PAD * em)
  const th = Math.ceil(asc + desc) + 2 * m + 2
  let atlasW = width
  let atlasH = 0
  const lines = list.map((c) => {
    const widths = c.words.map((w) => wordWidth(w.w) * scale)
    const items: Item[] = []
    let ax = 0
    let ay = 0
    c.rows.forEach((row, ri) => {
      const rw = row.reduce((s, i) => s + widths[i]!, 0) + space * (row.length - 1)
      let x = (width - rw) / 2
      const base = BASE * height - (c.rows.length - 1 - ri) * LEAD * em - y0
      for (const i of row) {
        const w = widths[i]!
        const tw = Math.ceil(w) + 2 * m + 2
        const tx = Math.floor(x) - m
        const ty = Math.floor(base - asc) - m
        const x0 = (x - PILL_X * em) / cell
        const x1 = (x + w + PILL_X * em) / cell
        const p0 = (base - (CAP + PILL_Y) * em) / cell
        const p1 = (base + (DESC + PILL_Y) * em) / cell
        const xa = Math.max(0, Math.floor(x0))
        const xb = Math.min(gw, Math.ceil(x1))
        const ya = Math.max(0, Math.floor(p0))
        const yb = Math.min(gh, Math.ceil(p1))
        const cover = (a: number, b: number, lo: number, hi: number): Float32Array => {
          const out = new Float32Array(Math.max(0, b - a))
          for (let k = a; k < b; k++) out[k - a] = Math.min(1, Math.max(0, Math.min(k + 1, hi) - Math.max(k, lo)))
          return out
        }
        if (ax + tw > Math.max(atlasW, tw)) {
          ax = 0
          ay += th
        }
        atlasW = Math.max(atlasW, tw)
        items.push({ i, row: ri, x, base, w, tx, ty, tw, th, ax, ay, pill: { xa, xb, ya, yb, cx: cover(xa, xb, x0, x1), cy: cover(ya, yb, p0, p1) } })
        ax += tw
        x += w + space
      }
    })
    atlasH = Math.max(atlasH, ay + th)
    return items
  })
  return { width, height, em, ss, size, asc, desc, y0, y1, bh: y1 - y0, cell, gw, gh, upW: Math.round(gw * cell), upH: Math.round(gh * cell), atlasW, atlasH, lines }
}

export function cueAt(t: number, list: Cue[] = cues): number {
  for (let i = 0; i < list.length; i++) if (list[i]!.t_in <= t && t <= list[i]!.t_end) return i
  return -1
}

function smooth(x: number): number {
  const c = Math.min(1, Math.max(0, x))
  return c * c * (3 - 2 * c)
}

export interface WordState { haze: number; swell: number; shown: number; soft: number; drop: number; settled: boolean }
export interface LineState { cue: number; env: number; words: WordState[] }

export function stateAt(t: number, em: number, list: Cue[] = cues): LineState | null {
  const cue = cueAt(t, list)
  if (cue < 0) return null
  const c = list[cue]!
  const env = t <= c.t_out ? 1 : 1 - smooth((t - c.t_out) / OUT)
  const words = c.words.map((w): WordState => {
    const haze = smooth((t - (w.on - HAZE_AHEAD)) / HAZE_IN) * env
    const none = { haze, swell: 0, shown: 0, soft: 0, drop: 0, settled: true }
    if (haze <= 0) return none
    const b = smooth((t - (w.on - 0.08)) / 0.16) * Math.exp(-Math.max(0, t - w.on - 0.08) / BLOOM_T) * env
    const swell = b > 0.004 ? b : 0
    const p = Math.min(1, Math.max(0, (t - (w.on - WORD_AHEAD)) / WORD_IN))
    if (p <= 0) return { ...none, swell }
    const e = 1 - (1 - p) ** 3
    const settled = !(e < 0.999)
    const sg = settled ? 0 : (1 - e) * WORD_SOFT * em
    return { haze, swell, shown: e * env, soft: sg > 0.15 ? sg : 0, drop: settled ? 0 : (1 - e) * WORD_RISE * em, settled }
  })
  return { cue, env, words }
}

export function kernel(sigma: number): Float32Array {
  const n = roundEven(sigma * 8 + 1) | 1
  const k = new Float32Array(n)
  let sum = 0
  for (let i = 0; i < n; i++) {
    const x = i - (n - 1) / 2
    const v = Math.exp(-(x * x) / (2 * sigma * sigma))
    k[i] = v
    sum += v
  }
  for (let i = 0; i < n; i++) k[i] = k[i]! / sum
  return k
}

export function roundEven(x: number): number {
  const r = Math.round(x)
  return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r
}
