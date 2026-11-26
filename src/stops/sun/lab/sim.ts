import lab from './lab.json'

const S = lab.sim
export const TILE = S.tile
export const SLOTS = S.slots
export const EDGES = 12
const REC = 8

function hash(a: number, b: number): number {
  let h = (Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x7f4a7c15, 0xc2b2ae35)) | 0
  h ^= h >>> 15
  h = Math.imul(h, 0x2c1b3c6d)
  h ^= h >>> 12
  h = Math.imul(h, 0x297a2d39)
  h ^= h >>> 15
  return (h >>> 0) / 4294967296
}

/** The share of its full ground that a cell holds by the share of its life that has passed: it comes from nothing
 * and goes to nothing over S.grow of its life and never over less than S.least seconds, its ground growing evenly
 * with the time (at the two ends its radius does, so it starts and ends as a point). */
function share(u: number, span: number): number {
  const g = Math.min(Math.max(S.grow, S.least / span), 0.5)
  const x = Math.min(Math.max(Math.min(u, 1 - u) / g, 0), 1)
  const k = S.ease
  return x >= k ? (x - k / 2) / (1 - k / 2) : (x * x) / (2 * k) / (1 - k / 2)
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
  /** per cell: how much ground it gains for a unit of weight (the sum of its edges over twice the way to the
   * neighbour behind each) */
  stiff: Float64Array
}

export function newDiagram(): Diagram {
  return { on: new Uint8Array(SLOTS), mid: new Float64Array(SLOTS * 2), area: new Float64Array(SLOTS), edges: new Float32Array(SLOTS * EDGES * 2), count: new Uint8Array(SLOTS), stiff: new Float64Array(SLOTS) }
}

const NG = Math.floor(TILE / (S.radius[1]! * 2))
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
const aw = new Float64Array(MAXV)
const bw = new Float64Array(MAXV)
const START = S.radius[1]! * 4.2
const RING: number[] = []
for (let r = 0; r <= 2; r++) for (let oy = -2; oy <= 2; oy++) for (let ox = -2; ox <= 2; ox++) if (Math.max(Math.abs(ox), Math.abs(oy)) === r) RING.push(ox, oy)

let WMOST = -1e9

/** The ground of a site at (xi, yi) with the weight wi, cut out by all sites but i: the corners are left in ax, ay; their
 * number is returned. The bins are those of the last diagram(). */
function clip(i: number, xi: number, yi: number, wi: number, x: Float64Array, y: Float64Array, w: Float64Array): number {
  let n = 4
  ax[0] = -START; ay[0] = -START; anx[0] = 0; any[0] = -1; ad[0] = START; aw[0] = 0
  ax[1] = START; ay[1] = -START; anx[1] = 1; any[1] = 0; ad[1] = START; aw[1] = 0
  ax[2] = START; ay[2] = START; anx[2] = 0; any[2] = 1; ad[2] = START; aw[2] = 0
  ax[3] = -START; ay[3] = START; anx[3] = -1; any[3] = 0; ad[3] = START; aw[3] = 0
  let far = START * 1.4143
  const gx = Math.min(Math.floor(xi / GS), NG - 1)
  const gy = Math.min(Math.floor(yi / GS), NG - 1)
  for (let q = 0; q < 25 && n > 0; q++) {
    {
      if (q === 9 && GS / 2 - (WMOST - wi) / (2 * GS) >= far) break
      const b = ((gy + RING[q * 2 + 1]! + NG) % NG) * NG + ((gx + RING[q * 2]! + NG) % NG)
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
        if (d2 < 1e-14) {
          if (w[j]! > wi || (w[j]! === wi && j < i)) n = 0
          continue
        }
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
            bx[m] = ax[a]!; by[m] = ay[a]!; bnx[m] = anx[a]!; bny[m] = any[a]!; bd[m] = ad[a]!; bw[m] = aw[a]!
            m++
            if (sb > 0) {
              const t = sa / (sa - sb)
              bx[m] = ax[a]! + (ax[c]! - ax[a]!) * t; by[m] = ay[a]! + (ay[c]! - ay[a]!) * t; bnx[m] = nx; bny[m] = ny; bd[m] = dist; bw[m] = 0.5 / dl
              m++
            }
          } else if (sb <= 0) {
            const t = sa / (sa - sb)
            bx[m] = ax[a]! + (ax[c]! - ax[a]!) * t; by[m] = ay[a]! + (ay[c]! - ay[a]!) * t; bnx[m] = anx[a]!; bny[m] = any[a]!; bd[m] = ad[a]!; bw[m] = aw[a]!
            m++
          }
        }
        n = m < MAXV - 2 ? m : 0
        far = 0
        for (let a = 0; a < n; a++) {
          ax[a] = bx[a]!; ay[a] = by[a]!; anx[a] = bnx[a]!; any[a] = bny[a]!; ad[a] = bd[a]!; aw[a] = bw[a]!
          const r = ax[a]! * ax[a]! + ay[a]! * ay[a]!
          if (r > far) far = r
        }
        far = Math.sqrt(far)
      }
    }
  }
  return n
}

/** The area of that ground. */
function areaAt(i: number, xi: number, yi: number, wi: number, x: Float64Array, y: Float64Array, w: Float64Array): number {
  const n = clip(i, xi, yi, wi, x, y, w)
  let area = 0
  for (let a = 0; a < n; a++) {
    const c = a + 1 === n ? 0 : a + 1
    area += ax[a]! * ay[c]! - ax[c]! * ay[a]!
  }
  return n < 3 ? 0 : area * 0.5
}

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
  WMOST = -1e9
  for (let i = 0; i < SLOTS; i++) if (live[i] && w[i]! > WMOST) WMOST = w[i]!
  for (let b = 0; b < NG * NG; b++) binStart[b + 1]! += binStart[b]!
  const fill = binStart.slice(0, NG * NG)
  for (let i = 0; i < SLOTS; i++) if (live[i]) binItem[fill[binOf[i]!]!++] = i
  for (let i = 0; i < SLOTS; i++) {
    out.on[i] = 0
    out.count[i] = 0
    out.area[i] = 0
    out.stiff[i] = 0
    if (!live[i]) continue
    const xi = x[i]!
    const yi = y[i]!
    let n = clip(i, xi, yi, w[i]!, x, y, w)
    if (n < 3) continue
    let area = 0
    let cx = 0
    let cy = 0
    let stiff = 0
    for (let a = 0; a < n; a++) {
      const c = a + 1 === n ? 0 : a + 1
      stiff += Math.sqrt((ax[c]! - ax[a]!) * (ax[c]! - ax[a]!) + (ay[c]! - ay[a]!) * (ay[c]! - ay[a]!)) * aw[a]!
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
    out.stiff[i] = stiff
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
  /** steps times SLOTS times: x, y, the time of birth, the length of the life, seed, full radius, the weight at
   * the step and the weight a step later */
  table: Float32Array
}

let made: Life | null = null

/** The life of the cells, simulated once with a fixed step: the same table on every machine (sums, products,
 * quotients, square roots and a whole number hash, nothing else). Every cell is given the ground its age asks for:
 * at each step the weights of the power diagram are moved toward the weights at which every cell holds its share
 * of the tile (S.solve rounds of S.gain of the ground it lacks), so no cell is swallowed faster than its age says,
 * whatever its neighbours do. A life starts and ends on a step. */
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
  const want = new Float64Array(n)
  const move = new Float64Array(n)
  const endX = new Float64Array(n)
  const endY = new Float64Array(n)
  const gen = new Int32Array(n)
  const live = new Uint8Array(n)
  const d = newDiagram()
  const side = Math.ceil(Math.sqrt(n))
  const t0 = S.from - S.warm
  const DEEP = S.radius[1]! * S.radius[1]! * 4
  const fresh = (i: number, t: number, first: boolean): void => {
    gen[i]!++
    const g = gen[i]!
    const long = hash(i, g * 7 + 1)
    span[i] = Math.max(Math.round((S.life[0]! + (S.life[1]! - S.life[0]!) * long * long) / S.step), 2) * S.step
    born[i] = first ? t - Math.round((span[i]! * hash(i, 3)) / S.step) * S.step : t
    const k = hash(i, g * 7 + 2)
    full[i] = S.radius[0]! + (S.radius[1]! - S.radius[0]!) * k * k
    seed[i] = Math.floor(hash(i, g * 7 + 3) * 65535) + 1
  }
  // the weight at which a cell at the place would begin to hold the place itself
  const anchor = (i: number, xi: number, yi: number): number => {
    let most = -1e9
    for (let j = 0; j < n; j++) {
      if (j === i || !live[j]) continue
      let dx = x[j]! - xi
      let dy = y[j]! - yi
      if (dx > TILE / 2) dx -= TILE
      else if (dx < -TILE / 2) dx += TILE
      if (dy > TILE / 2) dy -= TILE
      else if (dy < -TILE / 2) dy += TILE
      const v = w[j]! - dx * dx - dy * dy
      if (v > most) most = v
    }
    return most
  }
  // the weight at which a cell at the place holds the ground asked for, the others as they are (the bins of the
  // last diagram)
  const find = (i: number, xi: number, yi: number, ask: number): number => {
    let hi = anchor(i, xi, yi)
    let lo = hi - DEEP
    if (areaAt(i, xi, yi, hi, x, y, w) <= ask) return hi
    for (let k = 0; k < 18; k++) {
      const mid = (lo + hi) / 2
      if (areaAt(i, xi, yi, mid, x, y, w) > ask) hi = mid
      else lo = mid
    }
    return lo
  }
  for (let i = 0; i < n; i++) {
    x[i] = (((i % side) + 0.15 + 0.7 * hash(i, 1)) / side) * TILE
    y[i] = ((Math.floor(i / side) + 0.15 + 0.7 * hash(i, 2)) / side) * TILE
    if (y[i]! >= TILE) y[i] = y[i]! - TILE
    fresh(i, t0, true)
    w[i] = 0
  }
  const warm = Math.round(S.warm / S.step)
  const kept = Math.round((S.to - S.from) / S.step) + 1
  const table = new Float32Array(kept * n * REC)
  const first = new Int32Array(n).fill(-9)
  for (let s = 0; s < warm + kept; s++) {
    const t = t0 + s * S.step
    let sum = 0
    for (let i = 0; i < n; i++) {
      const u = (t - born[i]!) / span[i]!
      live[i] = u > 1e-9 && u < 1 - 1e-9 ? 1 : 0
      want[i] = live[i] ? share(u, span[i]!) * full[i]! * full[i]! : 0
      sum += want[i]!
    }
    const scale = (TILE * TILE) / sum
    for (let i = 0; i < n; i++) if (live[i] && first[i] === s) w[i] = anchor(i, x[i]!, y[i]!) - DEEP
    for (let k = 0; k < S.solve; k++) {
      diagram(x, y, w, live, d)
      for (let i = 0; i < n; i++) {
        const ask = want[i]! * scale
        move[i] = !live[i] ? 0 : d.area[i]! > 0 ? (S.gain * (ask - d.area[i]!)) / Math.max(d.stiff[i]!, S.soft) : find(i, x[i]!, y[i]!, ask) - w[i]!
      }
      for (let i = 0; i < n; i++) w[i] = w[i]! + move[i]!
    }
    diagram(x, y, w, live, d)
    if (s >= warm) {
      const o = (s - warm) * n * REC
      for (let i = 0; i < n; i++) {
        const p = o + i * REC
        table[p] = x[i]!
        table[p + 1] = y[i]!
        table[p + 2] = born[i]!
        table[p + 3] = span[i]!
        table[p + 4] = seed[i]!
        table[p + 5] = full[i]!
        table[p + 6] = w[i]!
        // a cell born on this step comes up from the weight at which it holds nothing, and the cell that ended on
        // it went down to that weight at its last place
        table[p + 6] = first[i] === s + 1 ? find(i, x[i]!, y[i]!, 0) : w[i]!
        table[p + 7] = table[p + 6]!
        if (s > warm) {
          const q = p - n * REC
          table[q + 7] = table[q + 4] === seed[i] ? w[i]! : find(i, endX[i]!, endY[i]!, 0)
        }
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
      if ((t + S.step - born[i]!) / span[i]! < 1 - 1e-9) continue
      endX[i] = x[i]!
      endY[i] = y[i]!
      fresh(i, t + S.step, false)
      first[i] = s + 2
      const pick = hash(i, gen[i]! * 7 + 4)
      let host = Math.floor(hash(i, gen[i]! * 7 + 5) * n)
      if (pick < S.split) {
        let most = 0
        for (let k = 0; k < 24; k++) {
          const j = Math.floor(hash(i, gen[i]! * 31 + k) * n)
          if (d.on[j] && d.area[j]! > most) { most = d.area[j]!; host = j }
        }
      }
      // a cell that is no split wells up where another is about to end: of a few cells, the one nearest the end of
      // its life; it takes that ground over as the old cell sinks, so the cells round them stay where they are
      const heir = pick >= S.split && hash(i, gen[i]! * 7 + 10) < ((S as { heir?: number }).heir ?? 0)
      if (heir) {
        let most = -1
        for (let k = 0; k < 24; k++) {
          const j = Math.floor(hash(i, gen[i]! * 37 + k) * n)
          const u = (t + S.step - born[j]!) / span[j]!
          if (j !== i && d.on[j] && u < 1 && u > most) { most = u; host = j }
        }
      }
      for (let k = 0; k < n && !d.on[host]; k++) host = (host + 1) % n
      const e = Math.floor(hash(i, gen[i]! * 7 + 6) * d.count[host]!)
      const ex = d.edges[(host * EDGES + e) * 2]!
      const ey = d.edges[(host * EDGES + e) * 2 + 1]!
      const inv = ex * ex + ey * ey
      const reach = (pick < S.split ? 0.55 : heir ? 0.3 : 1) * (0.5 + hash(i, gen[i]! * 7 + 8))
      const lean = (hash(i, gen[i]! * 7 + 9) - 0.5) * 0.9
      let px = d.mid[host * 2]! + (reach * (ex - lean * ey)) / inv
      let py = d.mid[host * 2 + 1]! + (reach * (ey + lean * ex)) / inv
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
  /** the radius of the cell's ground at the middle of its life */
  full: Float32Array
  live: Uint8Array
  diagram: Diagram
}

export function newCells(): Cells {
  return { x: new Float64Array(SLOTS), y: new Float64Array(SLOTS), w: new Float64Array(SLOTS), u: new Float32Array(SLOTS), seed: new Float32Array(SLOTS), full: new Float32Array(SLOTS), live: new Uint8Array(SLOTS), diagram: newDiagram() }
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
    // the weight is read off the cell's own age at the time, not off the steps, so nothing shows at a step: a cell
    // whose life ends between two steps is there to its end, and the one that takes its slot is born on the step
    const same = tb[p + 4] === tb[q + 4]
    const u = (t - tb[p + 2]!) / tb[p + 3]!
    out.live[i] = u > 1e-9 && u < 1 - 1e-9 ? 1 : 0
    if (!out.live[i]) continue
    let dx = same ? tb[q]! - tb[p]! : 0
    let dy = same ? tb[q + 1]! - tb[p + 1]! : 0
    if (dx > TILE / 2) dx -= TILE
    else if (dx < -TILE / 2) dx += TILE
    if (dy > TILE / 2) dy -= TILE
    else if (dy < -TILE / 2) dy += TILE
    let px = tb[p]! + dx * f
    let py = tb[p + 1]! + dy * f
    if (px < 0) px += TILE
    else if (px >= TILE) px -= TILE
    if (py < 0) py += TILE
    else if (py >= TILE) py -= TILE
    out.x[i] = px
    out.y[i] = py
    out.w[i] = tb[p + 6]! + (tb[p + 7]! - tb[p + 6]!) * f
    out.u[i] = u
    out.seed[i] = tb[p + 4]!
    out.full[i] = tb[p + 5]!
  }
  diagram(out.x, out.y, out.w, out.live, out.diagram)
}
