import lab from './lab.json'

const S = lab.sim
export const TILE = S.tile
export const SLOTS = S.slots
export const EDGES = 12
const REC = 6

function hash(a: number, b: number): number {
  let h = (Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x7f4a7c15, 0xc2b2ae35)) | 0
  h ^= h >>> 15
  h = Math.imul(h, 0x2c1b3c6d)
  h ^= h >>> 12
  h = Math.imul(h, 0x297a2d39)
  h ^= h >>> 15
  return (h >>> 0) / 4294967296
}

const smooth = (x: number): number => {
  const k = x < 0 ? 0 : x > 1 ? 1 : x
  return k * k * (3 - 2 * k)
}

/** The weight of a cell by the share of its life that has passed, of its full radius squared: far below nil at
 * both ends, so the cell comes from nothing and goes to nothing. */
function weight(u: number): number {
  const env = smooth(u / 0.4) * (1 - smooth((u - 0.6) / 0.4))
  return 3 * env - 2
}

export interface Diagram {
  /** per cell: 1 where it holds ground */
  on: Uint8Array
  /** per cell: middle of its ground (x, y in the tile), its area */
  mid: Float64Array
  area: Float64Array
  /** per cell, EDGES times: the outward normal of an edge over its distance from the middle (x, y) */
  edges: Float32Array
  count: Uint8Array
}

export function newDiagram(): Diagram {
  return { on: new Uint8Array(SLOTS), mid: new Float64Array(SLOTS * 2), area: new Float64Array(SLOTS), edges: new Float32Array(SLOTS * EDGES * 2), count: new Uint8Array(SLOTS) }
}

const NG = Math.floor(TILE / 0.32)
const GS = TILE / NG
const binStart = new Int32Array(NG * NG + 1)
const binItem = new Int32Array(SLOTS)
const binOf = new Int32Array(SLOTS)
const MAXV = 96
const ax = new Float64Array(MAXV)
const ay = new Float64Array(MAXV)
const anx = new Float64Array(MAXV)
const any = new Float64Array(MAXV)
const ad = new Float64Array(MAXV)
const bx = new Float64Array(MAXV)
const by = new Float64Array(MAXV)
const bnx = new Float64Array(MAXV)
const bny = new Float64Array(MAXV)
const bd = new Float64Array(MAXV)
const START = 0.7

/** The power diagram of the sites (x, y, weight w) that live (w above gone), on the tile that repeats. */
export function diagram(x: Float64Array, y: Float64Array, w: Float64Array, live: Uint8Array, out: Diagram): void {
  binStart.fill(0)
  for (let i = 0; i < SLOTS; i++) {
    if (!live[i]) continue
    const gx = Math.min(Math.floor(x[i]! / GS), NG - 1)
    const gy = Math.min(Math.floor(y[i]! / GS), NG - 1)
    binOf[i] = gy * NG + gx
    binStart[binOf[i]! + 1]!++
  }
  for (let b = 0; b < NG * NG; b++) binStart[b + 1]! += binStart[b]!
  const fill = binStart.slice(0, NG * NG)
  for (let i = 0; i < SLOTS; i++) if (live[i]) binItem[fill[binOf[i]!]!++] = i
  for (let i = 0; i < SLOTS; i++) {
    out.on[i] = 0
    out.count[i] = 0
    out.area[i] = 0
    if (!live[i]) continue
    let n = 4
    ax[0] = -START; ay[0] = -START; anx[0] = 0; any[0] = -1; ad[0] = START
    ax[1] = START; ay[1] = -START; anx[1] = 1; any[1] = 0; ad[1] = START
    ax[2] = START; ay[2] = START; anx[2] = 0; any[2] = 1; ad[2] = START
    ax[3] = -START; ay[3] = START; anx[3] = -1; any[3] = 0; ad[3] = START
    let far = START * 1.4143
    const xi = x[i]!
    const yi = y[i]!
    const wi = w[i]!
    const gx = binOf[i]! % NG
    const gy = (binOf[i]! - gx) / NG
    for (let oy = -2; oy <= 2 && n > 0; oy++) {
      for (let ox = -2; ox <= 2 && n > 0; ox++) {
        const b = ((gy + oy + NG) % NG) * NG + ((gx + ox + NG) % NG)
        for (let k = binStart[b]!; k < binStart[b + 1]! && n > 0; k++) {
          const j = binItem[k]!
          if (j === i) continue
          let dx = x[j]! - xi
          let dy = y[j]! - yi
          if (dx > TILE / 2) dx -= TILE
          else if (dx < -TILE / 2) dx += TILE
          if (dy > TILE / 2) dy -= TILE
          else if (dy < -TILE / 2) dy += TILE
          const d2 = dx * dx + dy * dy
          if (d2 < 1e-14) continue
          const dl = Math.sqrt(d2)
          const dist = (d2 + wi - w[j]!) / (2 * dl)
          if (dist >= far) continue
          const nx = dx / dl
          const ny = dy / dl
          let m = 0
          for (let a = 0; a < n; a++) {
            const c = a + 1 === n ? 0 : a + 1
            const sa = ax[a]! * nx + ay[a]! * ny - dist
            const sb = ax[c]! * nx + ay[c]! * ny - dist
            if (sa <= 0) {
              bx[m] = ax[a]!; by[m] = ay[a]!; bnx[m] = anx[a]!; bny[m] = any[a]!; bd[m] = ad[a]!
              m++
              if (sb > 0) {
                const t = sa / (sa - sb)
                bx[m] = ax[a]! + (ax[c]! - ax[a]!) * t; by[m] = ay[a]! + (ay[c]! - ay[a]!) * t; bnx[m] = nx; bny[m] = ny; bd[m] = dist
                m++
              }
            } else if (sb <= 0) {
              const t = sa / (sa - sb)
              bx[m] = ax[a]! + (ax[c]! - ax[a]!) * t; by[m] = ay[a]! + (ay[c]! - ay[a]!) * t; bnx[m] = anx[a]!; bny[m] = any[a]!; bd[m] = ad[a]!
              m++
            }
          }
          n = m < MAXV - 2 ? m : 0
          far = 0
          for (let a = 0; a < n; a++) {
            ax[a] = bx[a]!; ay[a] = by[a]!; anx[a] = bnx[a]!; any[a] = bny[a]!; ad[a] = bd[a]!
            const r = ax[a]! * ax[a]! + ay[a]! * ay[a]!
            if (r > far) far = r
          }
          far = Math.sqrt(far)
        }
      }
    }
    if (n < 3) continue
    let area = 0
    let cx = 0
    let cy = 0
    for (let a = 0; a < n; a++) {
      const c = a + 1 === n ? 0 : a + 1
      const cr = ax[a]! * ay[c]! - ax[c]! * ay[a]!
      area += cr
      cx += (ax[a]! + ax[c]!) * cr
      cy += (ay[a]! + ay[c]!) * cr
    }
    area *= 0.5
    if (!(area > 1e-9)) continue
    cx /= 6 * area
    cy /= 6 * area
    out.on[i] = 1
    out.area[i] = area
    out.mid[i * 2] = xi + cx
    out.mid[i * 2 + 1] = yi + cy
    let e = 0
    const r = Math.sqrt(area / 3.14159265)
    while (n > EDGES) {
      let least = 0
      let len = Infinity
      for (let a = 0; a < n; a++) {
        const c = a + 1 === n ? 0 : a + 1
        const l = (ax[c]! - ax[a]!) * (ax[c]! - ax[a]!) + (ay[c]! - ay[a]!) * (ay[c]! - ay[a]!)
        if (l < len) { len = l; least = a }
      }
      for (let a = least; a < n - 1; a++) { ax[a] = ax[a + 1]!; ay[a] = ay[a + 1]!; anx[a] = anx[a + 1]!; any[a] = any[a + 1]!; ad[a] = ad[a + 1]! }
      n--
    }
    for (let a = 0; a < n; a++) {
      const d = Math.max(ad[a]! - (cx * anx[a]! + cy * any[a]!), r * 1e-3)
      out.edges[(i * EDGES + e) * 2] = anx[a]! / d
      out.edges[(i * EDGES + e) * 2 + 1] = any[a]! / d
      e++
    }
    out.count[i] = e
  }
}

export interface Life {
  steps: number
  /** steps times SLOTS times: x, y, weight, share of life passed, seed, full radius */
  table: Float32Array
}

let made: Life | null = null

/** The life of the cells, simulated once with a fixed step: the same table on every machine (sums, products,
 * quotients, square roots and a whole number hash, nothing else). */
export function life(): Life {
  if (made) return made
  const n = SLOTS
  const x = new Float64Array(n)
  const y = new Float64Array(n)
  const w = new Float64Array(n)
  const born = new Float64Array(n)
  const span = new Float64Array(n)
  const full = new Float64Array(n)
  const seed = new Float64Array(n)
  const gen = new Int32Array(n)
  const live = new Uint8Array(n)
  const d = newDiagram()
  const side = Math.ceil(Math.sqrt(n))
  const t0 = S.from - S.warm
  const fresh = (i: number, t: number, first: boolean): void => {
    gen[i]!++
    const g = gen[i]!
    span[i] = S.life[0]! + (S.life[1]! - S.life[0]!) * hash(i, g * 7 + 1)
    born[i] = first ? t - span[i]! * hash(i, 3) : t
    const k = hash(i, g * 7 + 2)
    full[i] = S.radius[0]! + (S.radius[1]! - S.radius[0]!) * k * k
    seed[i] = Math.floor(hash(i, g * 7 + 3) * 65535) + 1
  }
  for (let i = 0; i < n; i++) {
    x[i] = (((i % side) + 0.15 + 0.7 * hash(i, 1)) / side) * TILE
    y[i] = ((Math.floor(i / side) + 0.15 + 0.7 * hash(i, 2)) / side) * TILE
    if (y[i]! >= TILE) y[i] = y[i]! - TILE
    fresh(i, t0, true)
  }
  const warm = Math.round(S.warm / S.step)
  const kept = Math.round((S.to - S.from) / S.step) + 1
  const table = new Float32Array(kept * n * REC)
  for (let s = 0; s < warm + kept; s++) {
    const t = t0 + s * S.step
    for (let i = 0; i < n; i++) {
      const u = (t - born[i]!) / span[i]!
      w[i] = full[i]! * full[i]! * weight(u)
      live[i] = u > 0.02 && u < 0.98 ? 1 : 0
    }
    diagram(x, y, w, live, d)
    if (s >= warm) {
      const o = (s - warm) * n * REC
      for (let i = 0; i < n; i++) {
        table[o + i * REC] = x[i]!
        table[o + i * REC + 1] = y[i]!
        table[o + i * REC + 2] = live[i] ? w[i]! : -9
        table[o + i * REC + 3] = (t - born[i]!) / span[i]!
        table[o + i * REC + 4] = seed[i]!
        table[o + i * REC + 5] = full[i]!
      }
    }
    for (let i = 0; i < n; i++) {
      if (!d.on[i]) continue
      let px = x[i]! + S.relax * (d.mid[i * 2]! - x[i]!)
      let py = y[i]! + S.relax * (d.mid[i * 2 + 1]! - y[i]!)
      if (px < 0) px += TILE
      else if (px >= TILE) px -= TILE
      if (py < 0) py += TILE
      else if (py >= TILE) py -= TILE
      x[i] = px
      y[i] = py
    }
    for (let i = 0; i < n; i++) {
      if ((t + S.step - born[i]!) / span[i]! < 1) continue
      fresh(i, t + S.step, false)
      const pick = hash(i, gen[i]! * 7 + 4)
      let host = Math.floor(hash(i, gen[i]! * 7 + 5) * n)
      if (pick < S.split) {
        let most = 0
        for (let k = 0; k < 24; k++) {
          const j = Math.floor(hash(i, gen[i]! * 31 + k) * n)
          if (d.on[j] && d.area[j]! > most) { most = d.area[j]!; host = j }
        }
      }
      for (let k = 0; k < n && !d.on[host]; k++) host = (host + 1) % n
      const e = Math.floor(hash(i, gen[i]! * 7 + 6) * d.count[host]!)
      const ex = d.edges[(host * EDGES + e) * 2]!
      const ey = d.edges[(host * EDGES + e) * 2 + 1]!
      const inv = ex * ex + ey * ey
      const reach = pick < S.split ? 0.55 : 1
      let px = d.mid[host * 2]! + (reach * ex) / inv
      let py = d.mid[host * 2 + 1]! + (reach * ey) / inv
      px -= Math.floor(px / TILE) * TILE
      py -= Math.floor(py / TILE) * TILE
      x[i] = px
      y[i] = py
    }
  }
  made = { steps: kept, table }
  return made
}

export interface Cells {
  x: Float64Array
  y: Float64Array
  w: Float64Array
  u: Float32Array
  seed: Float32Array
  live: Uint8Array
  diagram: Diagram
}

export function newCells(): Cells {
  return { x: new Float64Array(SLOTS), y: new Float64Array(SLOTS), w: new Float64Array(SLOTS), u: new Float32Array(SLOTS), seed: new Float32Array(SLOTS), live: new Uint8Array(SLOTS), diagram: newDiagram() }
}

/** The cells at the time t (seconds from the first frame of the terrain segment), read from the table alone. */
export function cellsAt(t: number, out: Cells): void {
  const l = life()
  const at = Math.min(Math.max((t - S.from) / S.step, 0), l.steps - 1.0001)
  const k = Math.floor(at)
  const f = at - k
  const a = k * SLOTS * REC
  const b = a + SLOTS * REC
  const tb = l.table
  for (let i = 0; i < SLOTS; i++) {
    const p = a + i * REC
    const q = b + i * REC
    const same = tb[p + 4] === tb[q + 4]
    const wa = tb[p + 2]!
    const wb = tb[q + 2]!
    out.live[i] = same && wa > -8 && wb > -8 ? 1 : 0
    if (!out.live[i]) continue
    let dx = tb[q]! - tb[p]!
    let dy = tb[q + 1]! - tb[p + 1]!
    if (dx > TILE / 2) dx -= TILE
    else if (dx < -TILE / 2) dx += TILE
    if (dy > TILE / 2) dy -= TILE
    else if (dy < -TILE / 2) dy += TILE
    out.x[i] = tb[p]! + dx * f
    out.y[i] = tb[p + 1]! + dy * f
    out.w[i] = wa + (wb - wa) * f
    out.u[i] = tb[p + 3]! + (tb[q + 3]! - tb[p + 3]!) * f
    out.seed[i] = tb[p + 4]!
  }
  diagram(out.x, out.y, out.w, out.live, out.diagram)
}
