import { A_CORE, A_MAX, A_WIDE, BLUE, CORE_SIG, DEEP, GRID_EM, LILAC, MAGENTA, NOISE_SEEDS, STAR, STAR_SEED, SWELL_SIG, VIOLET, WIDE_SIG, YCAP } from './look'
import { kernel, type Layout, type LineState } from './layout'
import { MT } from './mt'

const NT = 64
const NY = 32
const NX = 64

export function lattice(seed: number): Float32Array {
  const g = new MT(seed)
  const out = new Float32Array(NT * NY * NX)
  for (let i = 0; i < out.length; i++) out[i] = g.rand()
  return out
}

function wrap(i: number, n: number): number {
  return ((i % n) + n) % n
}

function slice(L: Float32Array, t: number): Float32Array {
  const tf = Math.floor(t)
  let ft = t - tf
  ft = ft * ft * (3 - 2 * ft)
  const a = wrap(tf, NT) * NY * NX
  const b = wrap(tf + 1, NT) * NY * NX
  const out = new Float32Array(NY * NX)
  for (let i = 0; i < out.length; i++) out[i] = L[a + i]! * (1 - ft) + L[b + i]! * ft
  return out
}

function noise(S: Float32Array, x: number, y: number): number {
  const xf = Math.floor(x)
  const yf = Math.floor(y)
  let fx = x - xf
  let fy = y - yf
  fx = fx * fx * (3 - 2 * fx)
  fy = fy * fy * (3 - 2 * fy)
  const x0 = xf & (NX - 1)
  const x1 = (x0 + 1) & (NX - 1)
  const r0 = (yf & (NY - 1)) * NX
  const r1 = ((yf + 1) & (NY - 1)) * NX
  return (S[r0 + x0]! * (1 - fx) + S[r0 + x1]! * fx) * (1 - fy) + (S[r1 + x0]! * (1 - fx) + S[r1 + x1]! * fx) * fy
}

type Field = (x: number, y: number) => number

function fbm(L: Float32Array, t: number, octs: number): Field {
  const slices: Float32Array[] = []
  for (let o = 0; o < octs; o++) slices.push(slice(L, t * (1 + 0.5 * o) + 5.7 * o))
  const tot = octs === 2 ? 0.75 : 0.875
  const [s0, s1, s2] = slices as [Float32Array, Float32Array, Float32Array | undefined]
  if (!s2) return (x, y) => (0.5 * noise(s0, x, y) + 0.25 * noise(s1, x * 2 + 17.3, y * 2 + 9.1)) / tot
  return (x, y) => (0.5 * noise(s0, x, y) + 0.25 * noise(s1, x * 2 + 17.3, y * 2 + 9.1) + 0.125 * noise(s2, x * 4 + 34.6, y * 4 + 18.2)) / tot
}

function sstep(a: number, b: number, x: number): number {
  const c = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return c * c * (3 - 2 * c)
}

function lin(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function clip(x: number): number {
  return Math.min(1, Math.max(0, x))
}

function mirror(i: number, n: number): number {
  if (n === 1) return 0
  while (i < 0 || i >= n) i = i < 0 ? -i : 2 * (n - 1) - i
  return i
}

interface Taps { k: Float32Array; r: number; ix: Int32Array; rows: Float32Array }
const taps = new Map<string, Taps>()

function tapsFor(sigma: number, w: number, h: number): Taps {
  const key = sigma + ' ' + w + ' ' + h
  let t = taps.get(key)
  if (!t) {
    const k = kernel(sigma)
    const r = (k.length - 1) / 2
    const ix = new Int32Array(w + 2 * r)
    for (let i = 0; i < ix.length; i++) ix[i] = mirror(i - r, w)
    const rows = new Float32Array(h * h)
    for (let y = 0; y < h; y++) for (let j = 0; j < k.length; j++) rows[y * h + mirror(y + j - r, h)] = rows[y * h + mirror(y + j - r, h)]! + k[j]!
    t = { k, r, ix, rows }
    taps.set(key, t)
  }
  return t
}

export function blur(src: Float32Array, w: number, h: number, sigma: number): Float32Array {
  const { k, r, ix, rows } = tapsFor(sigma, w, h)
  const out = new Float32Array(w * h)
  let ya = h
  let yb = -1
  let xa = w
  let xb = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (src[y * w + x] === 0) continue
      if (y < ya) ya = y
      yb = y
      if (x < xa) xa = x
      if (x > xb) xb = x
    }
  }
  if (yb < 0) return out
  const ca = Math.max(0, xa - r)
  const cb = Math.min(w - 1, xb + r)
  const n = cb - ca + 1
  const mid = new Float32Array((yb - ya + 1) * n)
  for (let y = ya; y <= yb; y++) {
    const row = y * w
    const to = (y - ya) * n
    for (let x = ca; x <= cb; x++) {
      let s = 0
      for (let j = 0; j < k.length; j++) s += k[j]! * src[row + ix[x + j]!]!
      mid[to + x - ca] = s
    }
  }
  for (let y = 0; y < h; y++) {
    const at = y * w + ca
    for (let yy = ya; yy <= yb; yy++) {
      const wt = rows[y * h + yy]!
      if (wt === 0) continue
      const from = (yy - ya) * n
      for (let x = 0; x < n; x++) out[at + x] = out[at + x]! + wt * mid[from + x]!
    }
  }
  return out
}

interface Star { u: number; v: number; phase: number; size: number }

export class Haze {
  private readonly lattices = NOISE_SEEDS.map((s) => lattice(s))
  private readonly stars: Star[] = []
  readonly data: Float32Array

  constructor(private readonly L: Layout) {
    const g = new MT(STAR_SEED)
    const n = Math.trunc(((L.gw * L.gh) / (GRID_EM * GRID_EM)) * 0.9)
    for (let i = 0; i < n; i++) {
      const u = (g.rand() * L.gw) / GRID_EM
      const v = (g.rand() * L.gh) / GRID_EM
      const phase = g.rand()
      this.stars.push({ u, v, phase, size: 0.25 + 0.75 * g.rand() ** 2 })
    }
    this.data = new Float32Array(L.gw * L.gh * 4)
  }

  get starList(): readonly Star[] {
    return this.stars
  }

  fill(t: number, state: LineState): Float32Array {
    const { gw, gh } = this.L
    const items = this.L.lines[state.cue]!
    const M = new Float32Array(gw * gh)
    const Mb = new Float32Array(gw * gh)
    let swell = false
    for (const it of items) {
      const s = state.words[it.i]!
      if (s.haze <= 0) continue
      const { xa, xb, ya, yb, cx, cy } = it.pill
      for (let y = ya; y < yb; y++) {
        for (let x = xa; x < xb; x++) {
          const rect = cy[y - ya]! * cx[x - xa]!
          const at = y * gw + x
          M[at] = Math.max(M[at]!, Math.fround(s.haze * rect))
          if (s.swell > 0) Mb[at] = Math.max(Mb[at]!, Math.fround(s.swell * rect))
        }
      }
      if (s.swell > 0) swell = true
    }
    const core = blur(M, gw, gh, CORE_SIG * GRID_EM)
    const wide = blur(M, gw, gh, WIDE_SIG * GRID_EM)
    const S = swell ? blur(Mb, gw, gh, SWELL_SIG * GRID_EM) : Mb
    const [N0, N1, N2, N3, N4] = this.lattices as [Float32Array, Float32Array, Float32Array, Float32Array, Float32Array]
    const ci = state.cue
    const out = this.data
    const alpha = new Float32Array(gw * gh)
    const tt = t * 0.26 + ci * 2.3
    const fWarp = fbm(N3, t * 0.09 + ci * 3.1, 2)
    const fCloud = fbm(N0, tt, 3)
    const fHue = fbm(N1, tt * 0.8, 2)
    const fThread = fbm(N2, tt * 1.2, 3)
    const fEdge = fbm(N4, t * 0.2 + ci, 2)
    for (let gy = 0; gy < gh; gy++) {
      const V = gy / GRID_EM
      for (let gx = 0; gx < gw; gx++) {
        const U = gx / GRID_EM
        const at = gy * gw + gx
        const warp = fWarp(U * 0.13, V * 0.3) - 0.5
        const X = U * 0.3 - t * 0.075 + 1.9 * warp + ci * 7.7
        const Y = V * 0.8 + 1.1 * warp
        const n1 = fCloud(X, Y)
        const cloud = 0.3 + 0.7 * sstep(0.3, 0.76, n1)
        const q = (U * 0.045 + t * 0.022 + ci * 0.37 + 0.35 * (fHue(X * 0.6 + 31.0, Y * 0.7) - 0.5)) * 2 * Math.PI
        const kb = 0.5 + 0.5 * Math.cos(q)
        const km = 0.5 + 0.5 * Math.cos(q - 2.3)
        const n2 = fThread(X * 1.7 + 63.0, Y * 1.9)
        const thread = clip(1 - Math.abs(n2 - 0.5) * 9.0) ** 2 * sstep(0.35, 0.7, n1)
        const s = S[at]!
        const hv = (1 - 0.75 * kb) * (1 - 0.7 * km)
        let r = DEEP[0] + 0.6 * cloud * (VIOLET[0] * hv + BLUE[0] * 0.95 * kb + MAGENTA[0] * 0.8 * km) + 0.22 * thread * LILAC[0] + 0.5 * s * LILAC[0]
        let g = DEEP[1] + 0.6 * cloud * (VIOLET[1] * hv + BLUE[1] * 0.95 * kb + MAGENTA[1] * 0.8 * km) + 0.22 * thread * LILAC[1] + 0.5 * s * LILAC[1]
        let b = DEEP[2] + 0.6 * cloud * (VIOLET[2] * hv + BLUE[2] * 0.95 * kb + MAGENTA[2] * 0.8 * km) + 0.22 * thread * LILAC[2] + 0.5 * s * LILAC[2]
        const y = lin(clip(r)) * 0.2126 + lin(clip(g)) * 0.7152 + lin(clip(b)) * 0.0722
        const k = Math.min(1, (YCAP / Math.max(y, 1e-4)) ** (1 / 2.2))
        r = clip(r * k)
        g = clip(g * k)
        b = clip(b * k)
        const edge = fEdge(U * 0.26 - t * 0.05, V * 0.7)
        const a = Math.min(A_MAX, A_CORE * sstep(0.06, 0.52, core[at]! * (0.8 + 0.4 * edge)) + A_WIDE * sstep(0.0, 0.6, wide[at]!) * (0.35 + 0.95 * cloud) + 0.1 * s)
        alpha[at] = a
        out[at * 4] = r
        out[at * 4 + 1] = g
        out[at * 4 + 2] = b
        out[at * 4 + 3] = a
      }
    }
    for (const st of this.stars) {
      const tw = 0.5 + 0.5 * Math.sin(t * (1.1 + 1.7 * st.phase) + 40 * st.phase)
      const sx = st.u * GRID_EM
      const sy = st.v * GRID_EM
      const ix = Math.trunc(sx)
      const iy = Math.trunc(sy)
      if (!(ix >= 1 && ix < gw - 2 && iy >= 1 && iy < gh - 2)) continue
      const amp = (0.25 + 0.75 * tw) * st.size * clip(alpha[iy * gw + ix]! / 0.5)
      if (!(amp > 0.02)) continue
      const fx = sx - ix
      const fy = sy - iy
      for (const [dy, wy] of [[0, 1 - fy], [1, fy]] as const) {
        for (const [dx, wx] of [[0, 1 - fx], [1, fx]] as const) {
          const at = ((iy + dy) * gw + ix + dx) * 4
          for (let c = 0; c < 3; c++) out[at + c] = out[at + c]! + amp * wy * wx * STAR[c]!
        }
      }
    }
    for (let i = 0; i < out.length; i++) if ((i & 3) !== 3) out[i] = clip(out[i]!)
    return out
  }
}
