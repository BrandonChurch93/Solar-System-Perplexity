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

function noise(L: Float32Array, x: number, y: number, t: number): number {
  const xf = Math.floor(x)
  const yf = Math.floor(y)
  const tf = Math.floor(t)
  let fx = x - xf
  let fy = y - yf
  let ft = t - tf
  fx = fx * fx * (3 - 2 * fx)
  fy = fy * fy * (3 - 2 * fy)
  ft = ft * ft * (3 - 2 * ft)
  const x0 = wrap(xf, NX)
  const y0 = wrap(yf, NY)
  const x1 = (x0 + 1) % NX
  const y1 = (y0 + 1) % NY
  const a = wrap(tf, NT) * NY * NX
  const b = wrap(tf + 1, NT) * NY * NX
  const r0 = y0 * NX
  const r1 = y1 * NX
  const lo = (L[a + r0 + x0]! * (1 - fx) + L[a + r0 + x1]! * fx) * (1 - fy) + (L[a + r1 + x0]! * (1 - fx) + L[a + r1 + x1]! * fx) * fy
  const hi = (L[b + r0 + x0]! * (1 - fx) + L[b + r0 + x1]! * fx) * (1 - fy) + (L[b + r1 + x0]! * (1 - fx) + L[b + r1 + x1]! * fx) * fy
  return lo * (1 - ft) + hi * ft
}

function fbm(L: Float32Array, x: number, y: number, t: number, octs: number): number {
  let s = 0
  let amp = 0.5
  let f = 1
  let tot = 0
  for (let o = 0; o < octs; o++) {
    s += amp * noise(L, x * f + 17.3 * o, y * f + 9.1 * o, t * (1 + 0.5 * o) + 5.7 * o)
    tot += amp
    amp *= 0.5
    f *= 2
  }
  return s / tot
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

export function blur(src: Float32Array, w: number, h: number, sigma: number): Float32Array {
  const k = kernel(sigma)
  const r = (k.length - 1) / 2
  const mid = new Float32Array(w * h)
  const out = new Float32Array(w * h)
  const ix = new Int32Array(w + 2 * r)
  for (let i = 0; i < ix.length; i++) ix[i] = mirror(i - r, w)
  const iy = new Int32Array(h + 2 * r)
  for (let i = 0; i < iy.length; i++) iy[i] = mirror(i - r, h)
  for (let y = 0; y < h; y++) {
    const row = y * w
    for (let x = 0; x < w; x++) {
      let s = 0
      for (let j = 0; j < k.length; j++) s += k[j]! * src[row + ix[x + j]!]!
      mid[row + x] = s
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0
      for (let j = 0; j < k.length; j++) s += k[j]! * mid[iy[y + j]! * w + x]!
      out[y * w + x] = s
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
    for (let gy = 0; gy < gh; gy++) {
      const V = gy / GRID_EM
      for (let gx = 0; gx < gw; gx++) {
        const U = gx / GRID_EM
        const at = gy * gw + gx
        const warp = fbm(N3, U * 0.13, V * 0.3, t * 0.09 + ci * 3.1, 2) - 0.5
        const X = U * 0.3 - t * 0.075 + 1.9 * warp + ci * 7.7
        const Y = V * 0.8 + 1.1 * warp
        const n1 = fbm(N0, X, Y, tt, 3)
        const cloud = 0.3 + 0.7 * sstep(0.3, 0.76, n1)
        const q = (U * 0.045 + t * 0.022 + ci * 0.37 + 0.35 * (fbm(N1, X * 0.6 + 31.0, Y * 0.7, tt * 0.8, 2) - 0.5)) * 2 * Math.PI
        const kb = 0.5 + 0.5 * Math.cos(q)
        const km = 0.5 + 0.5 * Math.cos(q - 2.3)
        const n2 = fbm(N2, X * 1.7 + 63.0, Y * 1.9, tt * 1.2, 3)
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
        const edge = fbm(N4, U * 0.26 - t * 0.05, V * 0.7, t * 0.2 + ci, 2)
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
