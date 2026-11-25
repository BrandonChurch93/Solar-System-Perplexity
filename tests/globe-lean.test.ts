import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { planetFrag, type PatchShader } from '../src/bodies/planet'
import { frozen } from './globe-frozen'

const f = Math.fround
type Mix = (x: number, y: number, a: number) => number
const mixes: Record<string, Mix> = {
  weights: (x, y, a) => f(f(x * f(1 - a)) + f(y * a)),
  step: (x, y, a) => f(x + f(a * f(y - x))),
  fused: (x, y, a) => f(x * f(1 - a) + y * a),
}
type Sum = (s: number, t: number, w: number, o: number) => number
const sums: Record<string, Sum> = {
  plain: (s, t, w, o) => f(f(s * f(1 - w)) + f(t * f(w * o))),
  fused: (s, t, w, o) => f(s * f(1 - w) + f(t * f(w * o))),
}
interface Level { w: number; o: number; t: number }
interface State { albedo: number; ownSum: number; own: number; reads: number }

const seeded = (seed: number) => (): number => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const kept = (levels: Level[], i: number): boolean => {
  const whole = levels.reduce((last, l, j) => (l.w === 1 ? j : last), -1)
  return !(whole > i && f(levels[i]!.w * f(1 - levels[i]!.o)) === 0)
}
const wide = (levels: Level[], i: number): boolean => !(levels.reduce((last, l, j) => (l.w === 1 ? j : last), -1) > i)

const run = (base: number, levels: Level[], mix: Mix, sum: Sum, read: (levels: Level[], i: number) => boolean): State => {
  const s: State = { albedo: f(base), ownSum: 0, own: 0, reads: 0 }
  levels.forEach((l, i) => {
    if (!(l.w > 0) || !read(levels, i)) return
    s.reads++
    s.albedo = mix(s.albedo, l.t, f(l.w * f(1 - l.o)))
    s.ownSum = sum(s.ownSum, l.t, l.w, l.o)
    s.own = sum(s.own, 1, l.w, l.o)
  })
  return s
}

const stacks = (count: number, own: () => number): { base: number; levels: Level[] }[] => {
  const r = seeded(954)
  return Array.from({ length: count }, () => ({
    base: f(r()),
    levels: Array.from({ length: 8 }, () => {
      const pick = r()
      return { w: pick < 0.35 ? 1 : pick < 0.5 ? 0 : f(r()), o: own(), t: f(r()) }
    }),
  }))
}

const hash = (text: string): string => createHash('sha256').update(frozen(text)).digest('hex')
const count = (text: string, part: string): number => text.split(part).length - 1

describe('the own levels under a whole level', () => {
  it('weigh exactly 0, so the pixel holds the same floats with them read and not read', () => {
    const r = seeded(7)
    const flags = stacks(20000, () => (r() < 0.6 ? 1 : 0))
    const parts = stacks(20000, () => (r() < 0.4 ? 1 : r() < 0.5 ? 0 : f(r())))
    for (const [mixName, mix] of Object.entries(mixes)) for (const [sumName, sum] of Object.entries(sums)) {
      let skipped = 0
      for (const s of [...flags, ...parts]) {
        const every = run(s.base, s.levels, mix, sum, () => true)
        const lean = run(s.base, s.levels, mix, sum, kept)
        skipped += every.reads - lean.reads
        expect([lean.albedo, lean.ownSum, lean.own], mixName + ' ' + sumName).toEqual([every.albedo, every.ownSum, every.own])
      }
      expect(skipped).toBeGreaterThan(20000)
    }
    for (const sum of Object.values(sums)) for (let i = 0; i < 1000; i++) {
      const t = f(r())
      const o = r() < 0.5 ? 1 : 0
      expect(sum(f(r() * 1e6), t, 1, o)).toBe(sum(0, t, 1, o))
      expect(sum(0, t, 1, o)).toBe(o === 1 ? t : 0)
    }
  }, 60000)

  it('stay read where a lit level would be skipped too: that rule moves the lit ground', () => {
    const r = seeded(11)
    const flags = stacks(20000, () => (r() < 0.6 ? 1 : 0))
    const moved: Record<string, number> = {}
    for (const [name, mix] of Object.entries(mixes)) {
      moved[name] = 0
      for (const s of flags) {
        const every = run(s.base, s.levels, mix, sums.plain!, () => true)
        const lean = run(s.base, s.levels, mix, sums.plain!, wide)
        expect([lean.ownSum, lean.own]).toEqual([every.ownSum, every.own])
        if (lean.albedo !== every.albedo) moved[name]!++
      }
    }
    expect(moved.weights).toBeGreaterThan(1000)
    expect(moved.step).toBeGreaterThan(1000)
    let bits = 0
    for (let i = 0; i < 20000; i++) {
      const y = f(r())
      if (mixes.step!(f(r()), y, 1) !== y) bits++
    }
    expect(bits).toBeGreaterThan(0)
  }, 60000)

  it('leave the text of a body without own levels to the letter', () => {
    const shapes: [PatchShader, string][] = [
      [{ slots: 3, own: false, gain: false, minor: false, glow: false, cut: true }, '2032eaaf37e7593fdeab8544b2078deb541e56ffa1047bb7f4c5fe44573612b7'],
      [{ slots: 1, own: false, gain: false, minor: true, glow: false, centres: true, cut: true }, '83012cfd33e4dfe541233801f2b72f51ab2e937e97fd5decfb56d5fa94e49803'],
      [{ slots: 8, own: false, gain: false, minor: true, glow: true, cap: true, capLight: true, centres: true, turn: true }, '3dd44a152e4835ccac50a432d75db1a091bd8718ecc1ee796fcd8bc4c327bd70'],
      [{ slots: 8, own: false, gain: false, minor: true, glow: true, cap: true, capLight: true, centres: true, turn: true, detail: 'vec4 groundDetail(vec3 a, float b, vec3 c, float d) { return vec4(1.0); }' }, '8a15b3fc9f4bc1e8b41751c90a1809f2704b24e017a39c82b86b268e3f9c5547'],
    ]
    for (const [shape, was] of shapes) {
      const text = planetFrag(shape)
      expect(hash(text), JSON.stringify(shape)).toBe(was)
      expect(count(text, 'whole')).toBe(0)
      expect(count(text, 'textureGrad(uPatch')).toBe(shape.slots)
    }
  })

  it('are weighed first and read after, each once, by the rule the arithmetic holds', () => {
    for (const more of [{}, { minor: true, centres: true }, { minor: true, glow: true, cap: true, capLight: true, centres: true, turn: true }] as Partial<PatchShader>[]) {
      const shape: PatchShader = { slots: 8, own: true, gain: true, minor: false, glow: false, ...more }
      const text = planetFrag(shape)
      expect(count(text, 'float whole = -1.0;')).toBe(1)
      expect(count(text, 'textureGrad(uPatch')).toBe(8)
      const lines = text.split('\n')
      for (let i = 0; i < 8; i++) {
        const weigh = lines.indexOf(`    if (uPatchCount > ${i}.5) {`, lines.indexOf('    float whole = -1.0;'))
        const read = lines.indexOf(`    if (w${i} > 0.0 && !(whole > ${i}.5 && w${i} * (1.0 - uPatchOwn[${i}]) == 0.0)) {`)
        expect(lines[weigh - 1]).toBe(`    float w${i} = 0.0;`)
        expect(lines.slice(weigh + 3, weigh + 5)).toEqual([`      w${i} = w;`, `      if (w == 1.0) whole = ${i}.0;`])
        expect(read).toBeGreaterThan(lines.indexOf('    if (uPatchCount > 7.5) {'))
        expect(lines.slice(read + 2, read + 9)).toEqual([
          `      float w = w${i};`,
          `      vec3 t = textureGrad(uPatch${i}, q + 0.5, gx * uPatchScale[${i}], gy * uPatchScale[${i}]).rgb;`,
          `      float o = uPatchOwn[${i}];`,
          '      albedo = mix(albedo, t, w * (1.0 - o));',
          '      ownSum = ownSum * (1.0 - w) + t * (w * o);',
          '      own = own * (1.0 - w) + w * o;',
          '    }',
        ])
        expect(lines[weigh + 1]).toBe(lines[read + 1])
      }
    }
  })
})
