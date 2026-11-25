import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { AIR_LAW_GLSL, AIR_LAW_MOST, AIR_LAW_SCALE_HEIGHT, airLaw, airLawDepth, airLawDepth32, airLawDepthOut, airLawDepthOut32, airLawError, airLawFactor, airLawFactorSeen, airLawSingle, type AirVec } from '../src/terrain/air'

// The air law (src/terrain/air.ts): the twins against the numerical integral, in doubles and in 32 bit, and the law's own rules: the
// two ends swapped, a path cut in two, the three cases meeting, the floor at black and no ceiling, the picture's term and its least.
// The pixels of the set under the law are tests/air-law-gl.test.ts; the relief's field is tests/air-law-relief.test.ts.

type V = [number, number, number]
const add = (a: AirVec, b: AirVec, t = 1): V => [a[0] + b[0] * t, a[1] + b[1] * t, a[2] + b[2] * t]
const dot = (a: AirVec, b: AirVec): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const len = (a: AirVec): number => Math.sqrt(dot(a, a))

// A stream of numbers from a seed (no Math.random in a test that states a bound).
function stream(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Gauss and Legendre, 16 points, and an integral that halves a span until the halves agree with the whole.
const GL = (() => {
  const n = 16
  const x: number[] = []
  const w: number[] = []
  for (let i = 0; i < n; i++) {
    let z = Math.cos((Math.PI * (i + 0.75)) / (n + 0.5))
    let dp = 1
    for (let it = 0; it < 100; it++) {
      let p0 = 1
      let p1 = z
      for (let k = 2; k <= n; k++) [p0, p1] = [p1, ((2 * k - 1) * z * p1 - (k - 1) * p0) / k]
      dp = (n * (z * p1 - p0)) / (z * z - 1)
      const step = p1 / dp
      z -= step
      if (Math.abs(step) < 1e-16) break
    }
    x.push(z)
    w.push(2 / ((1 - z * z) * dp * dp))
  }
  return { x, w }
})()

function gauss(f: (t: number) => number, x0: number, x1: number): number {
  const m = 0.5 * (x0 + x1)
  const h = 0.5 * (x1 - x0)
  let sum = 0
  for (let i = 0; i < GL.x.length; i++) sum += GL.w[i]! * f(m + h * GL.x[i]!)
  return sum * h
}

function integral(f: (t: number) => number, x0: number, x1: number, depth = 0): number {
  const all = gauss(f, x0, x1)
  const m = 0.5 * (x0 + x1)
  const left = gauss(f, x0, m)
  const right = gauss(f, m, x1)
  if (depth > 30 || Math.abs(left + right - all) <= 1e-12 * Math.abs(all) + 1e-22) return left + right
  return integral(f, x0, m, depth + 1) + integral(f, m, x1, depth + 1)
}

// The air along the path from a to b by the numerical integral of exp(-height / H).
function exact(a: AirVec, b: AirVec, H: number): number {
  const span = add(b, a, -1)
  const s = len(span)
  const d: V = [span[0] / s, span[1] / s, span[2] / s]
  const tp = -dot(d, a)
  const low2 = dot(a, a) - tp * tp
  const far = tp + Math.sqrt(Math.max((1 + 80 * H) ** 2 - low2, 0))
  const end = far > 0 ? Math.min(s, far) : s
  const w = Math.sqrt(2 * H)
  const cuts = [0, end, tp, tp - w, tp + w, tp - 3 * w, tp + 3 * w, tp - 10 * w, tp + 10 * w, end * 1e-3, end * 1e-2, end * 0.1].filter((x) => x >= 0 && x <= end).sort((p, q) => p - q)
  const f = (t: number): number => Math.exp(-(len(add(a, d, t)) - 1) / H)
  let sum = 0
  for (let i = 1; i < cuts.length; i++) if (cuts[i]! > cuts[i - 1]!) sum += integral(f, cuts[i - 1]!, cuts[i]!)
  return sum
}

// A turn of the frame, so that no path lies along an axis.
function turn(rand: () => number): (p: AirVec) => V {
  const u: V = [rand() - 0.5, rand() - 0.5, rand() - 0.5]
  const n = len(u)
  const k: V = [u[0] / n, u[1] / n, u[2] / n]
  const ang = rand() * 2 * Math.PI
  const c = Math.cos(ang)
  const s = Math.sin(ang)
  return (p) => {
    const kxp: V = [k[1] * p[2] - k[2] * p[1], k[2] * p[0] - k[0] * p[2], k[0] * p[1] - k[1] * p[0]]
    const kp = dot(k, p)
    return [p[0] * c + kxp[0] * s + k[0] * kp * (1 - c), p[1] * c + kxp[1] * s + k[1] * kp * (1 - c), p[2] * c + kxp[2] * s + k[2] * kp * (1 - c)]
  }
}

interface Path { kind: 'ground' | 'air' | 'out' | 'dive'; a: V; b: V; d: V }

// The four kinds of path the file's head names, in a turned frame.
function paths(H: number, count: number, seed: number): Path[] {
  const rand = stream(seed)
  const out: Path[] = []
  const kinds = ['ground', 'air', 'out', 'dive'] as const
  while (out.length < count) {
    const kind = kinds[Math.floor(rand() * 4)]!
    const rot = turn(rand)
    let a: V
    let b: V
    if (kind === 'dive') {
      a = [0, 1 + 0.002 + 0.01 * rand(), 0]
      const s = 10 ** (-4 + 2 * rand())
      const el = -0.3 + 0.6 * rand()
      b = add(a, [Math.cos(el), Math.sin(el), 0], s)
      if (len(b) < 1 - 3 * H) continue
    } else {
      const he = rand() < 0.85 ? 10 ** (-4.5 + 6.2 * rand()) : -3 * H * rand()
      a = [0, 1 + he, 0]
      if (kind === 'ground') {
        const most = he > 0 ? Math.acos(Math.min(1 / (1 + he), 1)) : 0.02
        const ang = most * Math.sqrt(rand()) * 0.999
        const hp = rand() < 0.7 ? H * (-3 + 5 * rand()) : 0
        b = [(1 + hp) * Math.sin(ang), (1 + hp) * Math.cos(ang), 0]
      } else if (kind === 'air') {
        const el = (rand() - 0.5) * Math.PI
        const dir: V = [Math.cos(el), Math.sin(el), 0]
        const s = 10 ** (-4 + 5 * rand())
        b = add(a, dir, s)
        if (len(b) < 1 - 3 * H) continue
        const tp = -dot(dir, a)
        if (tp > 0 && tp < s && len(add(a, dir, tp)) < 1 - 3 * H) continue
      } else {
        const el = -0.05 + (Math.PI / 2 + 0.05) * rand()
        const dir: V = [Math.cos(el), Math.sin(el), 0]
        const tp = -dot(dir, a)
        if (tp > 0 && len(add(a, dir, tp)) < 1 - 3 * H) continue
        b = add(a, dir, 200)
      }
    }
    if (len(add(b, a, -1)) <= 0) continue
    const ra = rot(a)
    const rb = rot(b)
    const span = add(rb, ra, -1)
    const s = len(span)
    out.push({ kind, a: ra, b: rb, d: [span[0] / s, span[1] / s, span[2] / s] })
  }
  return out
}

const HEIGHTS = [0.0005, 0.001, 0.0045, 0.016, 0.05, 0.1]

describe('the air law, the chunk', () => {
  it('is a leaf: the file imports nothing', () => {
    const source = readFileSync(resolve(__dirname, '../src/terrain/air.ts'), 'utf8')
    expect(/^\s*import\b/m.test(source)).toBe(false)
    expect(source.includes('require(')).toBe(false)
  })

  it('is pure functions: the four names and the picture term, no uniform, no varying, no precision line, no loop', () => {
    for (const name of ['float airLawDepth(vec3 a, vec3 b, float scaleHeight)', 'float airLawDepthOut(vec3 a, vec3 dir, float scaleHeight)', 'float airLawFactor(float depth, float density)', 'vec3 airLaw(vec3 point, vec3 light, float factor)', 'float airLawFactorSeen(float depth, float seen, float density, float least)']) expect(AIR_LAW_GLSL.split(name).length).toBe(2)
    for (const word of ['uniform', 'precision', 'in vec', 'out vec', 'for (', 'while', 'texture', 'void main', 'NaN', 'undefined']) expect(AIR_LAW_GLSL.includes(word)).toBe(false)
    // every number in the text is a float of the shader's language
    expect(/[^.\w]\d+[^.\w\d]/.test(AIR_LAW_GLSL.replace(/vec3/g, 'vec').replace(/\de-\d+/g, 'e'))).toBe(false)
  })
})

describe('the air law, against the numerical integral', () => {
  for (const H of HEIGHTS) {
    it('scale height ' + H + ': the depth is off by no more than airLawError, in doubles and in 32 bit', () => {
      const worst: Record<string, number> = { ground: 0, air: 0, out: 0, dive: 0 }
      const single: Record<string, number> = { ground: 0, air: 0, out: 0, dive: 0 }
      let n = 0
      let ratio = 0
      for (const p of paths(H, 1600, 11 + Math.round(H * 1e5))) {
        const want = exact(p.a, p.b, H)
        if (want < 1e-9 * H) continue
        n++
        const got = p.kind === 'out' ? airLawDepthOut(p.a, p.d, H) : airLawDepth(p.a, p.b, H)
        worst[p.kind] = Math.max(worst[p.kind]!, Math.abs(got / want - 1))
        const a32: V = [Math.fround(p.a[0]), Math.fround(p.a[1]), Math.fround(p.a[2])]
        const b32: V = [Math.fround(p.b[0]), Math.fround(p.b[1]), Math.fround(p.b[2])]
        const d32: V = [Math.fround(p.d[0]), Math.fround(p.d[1]), Math.fround(p.d[2])]
        const got32 = p.kind === 'out' ? airLawDepthOut32(a32, d32, H) : airLawDepth32(a32, b32, H)
        const twin = p.kind === 'out' ? airLawDepthOut(a32, d32, H) : airLawDepth(a32, b32, H)
        expect(Number.isFinite(got32)).toBe(true)
        single[p.kind] = Math.max(single[p.kind]!, Math.abs(got32 - twin))
        expect(Math.abs(got32 - twin)).toBeLessThan(airLawSingle(H, twin))
        // the float's step of a radius over the scale height, as a share of the depth: what the bound's second term is made of
        ratio = Math.max(ratio, (Math.abs(got32 - twin) - 4e-6) / (twin / H))
      }
      expect(n).toBeGreaterThan(1000)
      console.log('scale height ' + H + ', ' + n + ' paths: worst share off, ground ' + worst.ground!.toFixed(5) + ' air ' + worst.air!.toFixed(5) + ' out ' + worst.out!.toFixed(5) + ' dive ' + worst.dive!.toFixed(5) + '; 32 bit against doubles, radii: ground ' + single.ground!.toExponential(2) + ' air ' + single.air!.toExponential(2) + ' out ' + single.out!.toExponential(2) + ' dive ' + single.dive!.toExponential(2) + '; the rest over (depth / scale height) ' + ratio.toExponential(2))
      for (const kind of Object.keys(worst)) expect(worst[kind]).toBeLessThan(airLawError(H))
      expect(ratio).toBeLessThan(4e-7)
    })
  }

  it('the dive at 32 bit: a short level path low in the air is not a difference the float loses', () => {
    // eye 0.002 to 0.012 radii up, point 1e-4 to 1e-2 radii away, scale height 0.0045 (the ground air of Mars today)
    const H = 0.0045
    let worst = 0
    let model = 0
    let n = 0
    for (const p of paths(H, 6000, 77)) {
      if (p.kind !== 'dive') continue
      n++
      const a32: V = [Math.fround(p.a[0]), Math.fround(p.a[1]), Math.fround(p.a[2])]
      const b32: V = [Math.fround(p.b[0]), Math.fround(p.b[1]), Math.fround(p.b[2])]
      const want = exact(a32, b32, H)
      worst = Math.max(worst, Math.abs(airLawDepth32(a32, b32, H) - airLawDepth(a32, b32, H)))
      model = Math.max(model, Math.abs(airLawDepth32(a32, b32, H) - want) - airLawError(H) * want)
    }
    expect(n).toBeGreaterThan(1000)
    console.log('the dive in 32 bit, ' + n + ' paths: worst ' + worst.toExponential(2) + ' radii of depth against doubles, ' + model.toExponential(2) + ' beyond airLawError against the integral')
    // times a density of 15 a radius that is an optical depth of under 1e-4: not seen
    expect(worst).toBeLessThan(5e-6)
    expect(model).toBeLessThan(5e-6)
  })
})

describe('the air law, its own rules', () => {
  const H = 0.0045
  const set = paths(H, 1200, 5).filter((p) => p.kind !== 'out')

  it('the two ends may be swapped', () => {
    for (const p of set) {
      const there = airLawDepth(p.a, p.b, H)
      const back = airLawDepth(p.b, p.a, H)
      expect(Math.abs(there - back)).toBeLessThanOrEqual(1e-12 * Math.max(there, 1e-6))
    }
  })

  it('a path cut in two adds up to the whole, wherever the cut', () => {
    const rand = stream(3)
    for (const p of set) {
      const m = add(p.a, add(p.b, p.a, -1), rand())
      const all = airLawDepth(p.a, p.b, H)
      const sum = airLawDepth(p.a, m, H) + airLawDepth(m, p.b, H)
      expect(Math.abs(sum - all)).toBeLessThanOrEqual(1e-9 * Math.max(all, 1e-6))
      // and so the factors multiply: the law of a path is the law of its two parts, one after the other
      const whole = airLaw([0.3, 0.2, 0.1], [0.5, 0.4, 0.3], airLawFactor(all, 15))
      const far = airLaw([0.3, 0.2, 0.1], [0.5, 0.4, 0.3], airLawFactor(airLawDepth(m, p.b, H), 15))
      const near = airLaw(far, [0.5, 0.4, 0.3], airLawFactor(airLawDepth(p.a, m, H), 15))
      for (let i = 0; i < 3; i++) expect(near[i]).toBeCloseTo(whole[i]!, 8)
    }
  })

  it('the three cases meet without a step', () => {
    // a level start (the cosine at a passes 0) and a level end (the cosine at b passes 0), each from both sides
    for (const h of [0.0002, 0.002, 0.02]) {
      const a: V = [0, 1 + h, 0]
      for (const s of [0.003, 0.05, 0.4]) {
        for (const e of [1e-9, 1e-7]) {
          const upward = airLawDepth(a, add(a, [Math.cos(e), Math.sin(e), 0], s), H)
          const downward = airLawDepth(a, add(a, [Math.cos(-e), Math.sin(-e), 0], s), H)
          expect(Math.abs(upward - downward)).toBeLessThanOrEqual(4 * e * s * Math.max(upward, downward) / H + 1e-13)
          const b: V = add(a, [1, 0, 0], -s)
          const before = airLawDepth(b, add(a, [0, 1, 0], e * s), H)
          const after = airLawDepth(b, add(a, [0, 1, 0], -e * s), H)
          expect(Math.abs(before - after)).toBeLessThanOrEqual(4 * e * s * Math.max(before, after) / H + 1e-13)
          const outUp = airLawDepthOut(a, [Math.cos(e), Math.sin(e), 0], H)
          const outDown = airLawDepthOut(a, [Math.cos(-e), Math.sin(-e), 0], H)
          expect(Math.abs(outUp - outDown)).toBeLessThanOrEqual(4 * e * outUp / Math.sqrt(H) + 1e-13)
        }
      }
    }
  })

  it('the path out is the path to a point beyond the air', () => {
    for (const p of paths(H, 600, 9)) {
      if (len(p.a) > 30) continue
      const out = airLawDepthOut(p.a, p.d, H)
      const far = airLawDepth(p.a, add(p.a, p.d, 400), H)
      expect(Math.abs(out - far)).toBeLessThanOrEqual(1e-9 * Math.max(out, 1e-6))
    }
  })

  it('more air along a longer path, and none along no path', () => {
    const a: V = [0.1, 1.003, -0.2]
    expect(airLawDepth(a, a, H)).toBe(0)
    let last = 0
    for (let i = 1; i <= 60; i++) {
      const now = airLawDepth(a, add(a, [0.8, -0.02, 0.6], i * 0.002), H)
      expect(now).toBeGreaterThan(last)
      last = now
    }
  })

  it('the law has a floor at black and no ceiling of its own', () => {
    // a factor over 1 (the present eye nearer than the picture's): what is darker than the air's share goes to black and stays there,
    // what is brighter leaves the range upward and is not cut
    expect(airLaw([0.1, 0.5, 2], [0.4, 0.4, 0.4], 1.5)).toEqual([0, 0.55, 2.8])
    expect(airLaw([0, 0, 0], [0.4, 0.4, 0.4], 3)).toEqual([0, 0, 0])
    expect(airLaw([40, 40, 40], [0.4, 0.4, 0.4], 9)[0]).toBeCloseTo(360 - 3.2, 9)
    // the plain ends: the whole point with no air, the air's light behind endless air
    expect(airLaw([0.1, 0.5, 2], [0.4, 0.3, 0.2], 1)).toEqual([0.1, 0.5, 2])
    expect(airLaw([0.1, 0.5, 2], [0.4, 0.3, 0.2], 0)).toEqual([0.4, 0.3, 0.2])
    // the chunk says the same in the same words
    expect(AIR_LAW_GLSL.includes('return max(point * factor + light * (1.0 - factor), vec3(0.0));')).toBe(true)
    expect(/clamp|min\(point|min\(max\(point/.test(AIR_LAW_GLSL)).toBe(false)
  })

  it('the picture term: the texel holds the air of the path seen, down to its least', () => {
    const density = 15
    const seen = 0.11
    // from the picture's eye the factor is 1 for any numbers, so the picture comes back
    for (const least of [0, 0.1, 0.19]) expect(airLawFactorSeen(seen, seen, density, least)).toBe(1)
    // unless its least is over the factor of the path seen: then the texel holds less air than that path has
    for (const least of [0.2, 0.5]) expect(airLawFactorSeen(seen, seen, density, least)).toBeCloseTo(airLawFactor(seen, density) / least, 12)
    expect(airLawFactorSeen(seen, seen, density, 0)).toBe(1)
    // however deep the path seen is: a point behind 2000 depths of air is its texel from the picture's eye, not the light
    for (const deep of [3, 50, 2000, 1e7]) expect(airLawFactorSeen(deep / density, deep / density, density, 0)).toBe(1)
    // and the factor ends at e to the 46, where no float overflows: with the point and with the light it stays a number
    expect(airLawFactorSeen(0, 1e9, density, 0)).toBe(Math.exp(AIR_LAW_MOST))
    expect(Number.isFinite(Math.fround(Math.fround(airLawFactorSeen(0, 1e9, density, 0)) * 1000))).toBe(true)
    expect(AIR_LAW_GLSL.includes('return exp(min(held - density * depth, 46.0));')).toBe(true)
    // least 0: the factor of the present path over the factor of the path seen
    expect(airLawFactorSeen(0.05, seen, density, 0)).toBeCloseTo(airLawFactor(0.05, density) / airLawFactor(seen, density), 12)
    // least 1: the plain law, the texel holds no air
    expect(airLawFactorSeen(0.05, seen, density, 1)).toBeCloseTo(airLawFactor(0.05, density), 15)
    // between: the factor never passes 1 over the least, however little air the present path has
    for (const least of [0.05, 0.3, 0.8]) {
      expect(airLawFactorSeen(0, 5, density, least)).toBeCloseTo(1 / least, 12)
      expect(airLawFactorSeen(0.02, 5, density, least)).toBeCloseTo(airLawFactor(0.02, density) / least, 12)
      expect(airLawFactorSeen(0.02, 0.001, density, least)).toBeCloseTo(airLawFactor(0.02, density) / Math.max(airLawFactor(0.001, density), least), 12)
    }
    // a texel baked as body * least + light * (1 - least) comes back as the body under the plain law
    const body: V = [0.31, 0.22, 0.17]
    const light: V = [0.5, 0.42, 0.36]
    const least = 0.25
    const baked = airLaw(body, light, least)
    const drawn = airLaw(baked, light, airLawFactorSeen(0.03, 9, density, least))
    const plain = airLaw(body, light, airLawFactor(0.03, density))
    for (let i = 0; i < 3; i++) expect(drawn[i]).toBeCloseTo(plain[i]!, 12)
  })

  it('refuses a scale height it is not measured for, and gives no inf and no NaN on a line through the ball', () => {
    expect(() => airLawDepth([0, 1.01, 0], [0.1, 1.01, 0], AIR_LAW_SCALE_HEIGHT[0] * 0.9)).toThrow(/measured/)
    expect(() => airLawDepthOut([0, 1.01, 0], [1, 0, 0], AIR_LAW_SCALE_HEIGHT[1] * 1.1)).toThrow(/measured/)
    expect(() => airLawDepth32([0, 1.01, 0], [0.1, 1.01, 0], 0)).toThrow(/measured/)
    expect(() => airLawDepthOut32([0, 1.01, 0], [1, 0, 0], Number.NaN)).toThrow(/measured/)
    for (const h of [0.0005, 0.001, 0.0045, 0.1]) {
      // the lowest point of the line 0.4 radii, 0.9 radii and all the way inside; an eye at the hold and one far out; the centre itself
      for (const low of [0.6, 0.1, 0]) {
        for (const eye of [1.002, 3, 2000]) {
          const a: V = [-Math.sqrt(eye * eye - low * low), low, 0]
          const b: V = [Math.sqrt(1 - low * low) * 0.999, low, 0]
          for (const v of [airLawDepth(a, b, h), airLawDepth32(a, b, h), airLawDepthOut(a, [1, 0, 0], h), airLawDepthOut32(a, [1, 0, 0], h), airLawDepth([0, 0, 0], b, h), airLawDepth32(a, [0, 0, 0], h), airLawDepthOut([0, 0, 0], [1, 0, 0], h), airLawDepthOut32([0, 0, 0], [0, 1, 0], h)]) {
            expect(Number.isFinite(v)).toBe(true)
            expect(v).toBeGreaterThanOrEqual(0)
          }
          for (const v of [airLawFactor(airLawDepth32(a, b, h), 15), airLawFactorSeen(airLawDepth32(a, b, h), airLawDepthOut32(a, [1, 0, 0], h), 15, 0), ...airLaw([1, 1, 1], [0.4, 0.4, 0.4], airLawFactor(airLawDepthOut32(a, [1, 0, 0], h), 15))]) expect(Number.isFinite(v)).toBe(true)
        }
      }
    }
  })
})
