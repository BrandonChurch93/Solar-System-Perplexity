import type { Air, AirKnot, HazeAir, Rgb } from './types'

// PLAN F, the one air (Air in types.ts): the mix of a stop's knots at a height of the lens.
//
// The knots run from the highest down. At and above the highest knot the air is that knot's own object, the same object at every call,
// so a hold keeps every byte; at and below the lowest knot it is the lowest knot's own. Between two neighbours a (the higher) and b every
// number runs on one curve over the logarithm of the height: with u = (ln a.height - ln height) / (ln a.height - ln b.height) and
// s = u * u * (3 - 2 * u) the value is a + (b - a) * s, plus, where there are more than two knots, the term of the slope a middle knot is
// passed with. That slope is the one of a monotone cubic (the weighted harmonic mean of the two secants, 0 where they differ in sign and
// 0 at both ends), so a value that only falls or only rises through the knots does so at every height, without a rest at a middle knot
// and without a turn back. Colours and the fields of haze and shell go number by number.
//
// Nothing here reads a clock or a frame: the same knots and the same height give the same air whichever way the lens passes.

const NUMBERS = ['exposure', 'sky', 'stars', 'sunRadius', 'glare'] as const
const HAZE_NUMBERS = ['depth', 'scaleHeight', 'strength', 'extinction', 'forward'] as const
const HAZE_COLOURS = ['day', 'twilight', 'night'] as const
const HAZE_KEYS: readonly string[] = [...HAZE_NUMBERS, ...HAZE_COLOURS, 'edge']
const KEYS: readonly string[] = ['height', ...NUMBERS, 'limb', 'tint', 'haze', 'shell']

interface Parts { limb: boolean; tint: boolean; haze: boolean; shell: boolean }
interface Laid { airs: Air[]; parts: Parts; x: number[]; rows: number[][]; slopes: number[][] }

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const triple = (v: unknown): v is Rgb => Array.isArray(v) && v.length === 3 && v.every(finite)
const pair = (v: unknown): v is [number, number] => Array.isArray(v) && v.length === 2 && v.every(finite)

function hazeOf(name: string, at: string, given: Partial<HazeAir> | undefined, above: HazeAir | undefined): HazeAir | undefined {
  if (given === undefined) return above
  if (typeof given !== 'object' || given === null) throw new Error(name + ': ' + at + ' must be a set of haze values')
  for (const key of Object.keys(given)) if (!HAZE_KEYS.includes(key)) throw new Error(name + ': ' + at + ' names ' + key + ', which a haze does not hold')
  const out = { ...(above ?? {}), ...given } as HazeAir
  for (const key of HAZE_NUMBERS) if (!finite(out[key])) throw new Error(name + ': ' + at + ' must name ' + key + ' as a number')
  for (const key of HAZE_COLOURS) if (!triple(out[key])) throw new Error(name + ': ' + at + ' must name ' + key + ' as three numbers')
  if (!pair(out.edge)) throw new Error(name + ': ' + at + ' must name edge as two numbers')
  return { depth: out.depth, scaleHeight: out.scaleHeight, day: [...out.day], twilight: [...out.twilight], night: [...out.night], edge: [...out.edge], strength: out.strength, extinction: out.extinction, forward: out.forward }
}

// The knots of a stop as whole airs, highest first: every knot filled from the knot above it, and refused where the knots are out of
// order, name what an air does not hold, leave a number open in the highest knot or bring in a part the highest knot does not have.
export function resolveAir(knots: AirKnot[], name = 'the air'): Air[] {
  if (!Array.isArray(knots) || knots.length === 0) throw new Error(name + ': an air needs at least one knot')
  const out: Air[] = []
  knots.forEach((k, i) => {
    const at = 'knot ' + i + ' of its air'
    if (typeof k !== 'object' || k === null) throw new Error(name + ': ' + at + ' must be a set of values')
    for (const key of Object.keys(k)) if (!KEYS.includes(key)) throw new Error(name + ': ' + at + ' names ' + key + ', which an air does not hold')
    if (!(finite(k.height) && k.height > 0)) throw new Error(name + ': ' + at + ' needs a height above 0, in radii')
    const above = out[i - 1]
    if (above && !(k.height < above.height)) throw new Error(name + ': the knots of an air run from the highest down, and ' + at + ' at ' + k.height + ' is not under the knot before it at ' + above.height)
    const a = { height: k.height, share: 0 } as Air
    for (const key of NUMBERS) {
      const v = k[key] ?? above?.[key]
      if (!finite(v)) throw new Error(name + ': ' + (above ? at + ' must name ' + key + ' as a number' : 'the highest knot of its air must name ' + key))
      a[key] = v
    }
    for (const key of ['limb', 'tint', 'haze', 'shell'] as const) {
      if (k[key] !== undefined && above && above[key] === undefined) throw new Error(name + ': ' + at + ' names ' + key + ', which the highest knot does not: a part of the air is there at every height or at none')
    }
    const limb = k.limb ?? above?.limb
    if (limb !== undefined) {
      if (!finite(limb)) throw new Error(name + ': ' + at + ' must name limb as a number')
      a.limb = limb
    }
    const tint = k.tint ?? above?.tint
    if (tint !== undefined) {
      if (!triple(tint)) throw new Error(name + ': ' + at + ' must name tint as three numbers')
      a.tint = [...tint]
    }
    const haze = hazeOf(name, 'the haze of ' + at, k.haze, above?.haze)
    if (haze) a.haze = haze
    const shell = hazeOf(name, 'the shell of ' + at, k.shell, above?.shell)
    if (shell) a.shell = shell
    out.push(a)
  })
  const top = Math.log(out[0]!.height)
  const span = top - Math.log(out[out.length - 1]!.height)
  for (const a of out) a.share = span > 0 ? (top - Math.log(a.height)) / span : 0
  return out
}

const hazeRow = (h: HazeAir): number[] => [h.depth, h.scaleHeight, h.strength, h.extinction, h.forward, ...h.day, ...h.twilight, ...h.night, ...h.edge]
const hazeFrom = (v: number[], i: number): HazeAir => ({
  depth: v[i]!, scaleHeight: v[i + 1]!, strength: v[i + 2]!, extinction: v[i + 3]!, forward: v[i + 4]!,
  day: [v[i + 5]!, v[i + 6]!, v[i + 7]!], twilight: [v[i + 8]!, v[i + 9]!, v[i + 10]!], night: [v[i + 11]!, v[i + 12]!, v[i + 13]!], edge: [v[i + 14]!, v[i + 15]!],
})
const HAZE_ROW = 16

function rowOf(a: Air): number[] {
  const v: number[] = [a.exposure, a.sky, a.stars, a.sunRadius, a.glare]
  if (a.limb !== undefined) v.push(a.limb)
  if (a.tint) v.push(...a.tint)
  if (a.haze) v.push(...hazeRow(a.haze))
  if (a.shell) v.push(...hazeRow(a.shell))
  return v
}

function airOf(height: number, share: number, v: number[], parts: Parts): Air {
  const a: Air = { height, share, exposure: v[0]!, sky: v[1]!, stars: v[2]!, sunRadius: v[3]!, glare: v[4]! }
  let i = 5
  if (parts.limb) a.limb = v[i++]!
  if (parts.tint) {
    a.tint = [v[i]!, v[i + 1]!, v[i + 2]!]
    i += 3
  }
  if (parts.haze) {
    a.haze = hazeFrom(v, i)
    i += HAZE_ROW
  }
  if (parts.shell) a.shell = hazeFrom(v, i)
  return a
}

function frozen(a: Air): Air {
  for (const h of [a.haze, a.shell]) {
    if (!h) continue
    for (const key of [...HAZE_COLOURS, 'edge'] as const) Object.freeze(h[key])
    Object.freeze(h)
  }
  if (a.tint) Object.freeze(a.tint)
  return Object.freeze(a)
}

function lay(knots: AirKnot[], name: string): Laid {
  const airs = resolveAir(knots, name).map(frozen)
  const first = airs[0]!
  const parts: Parts = { limb: first.limb !== undefined, tint: !!first.tint, haze: !!first.haze, shell: !!first.shell }
  const x = airs.map((a) => -Math.log(a.height))
  const rows = airs.map(rowOf)
  const n = airs.length
  const slopes = rows.map((r) => r.map(() => 0))
  for (let i = 1; i < n - 1; i++) {
    const before = x[i]! - x[i - 1]!
    const after = x[i + 1]! - x[i]!
    for (let j = 0; j < rows[i]!.length; j++) {
      const d0 = (rows[i]![j]! - rows[i - 1]![j]!) / before
      const d1 = (rows[i + 1]![j]! - rows[i]![j]!) / after
      if (!(d0 * d1 > 0)) continue
      const w0 = 2 * after + before
      const w1 = after + 2 * before
      slopes[i]![j] = (w0 + w1) / (w0 / d0 + w1 / d1)
    }
  }
  return { airs, parts, x, rows, slopes }
}

const laid = new WeakMap<AirKnot[], Laid>()

// The air of a stop at a height of the lens over its body, in radii. Null for no knots. The knots are read once per array: give the same
// array at every call and do not change it afterwards.
export function airAt(knots: AirKnot[] | null | undefined, height: number, name = 'the air'): Air | null {
  if (!knots) return null
  if (!Number.isFinite(height)) throw new Error(name + ': the air was asked for at a height that is not a number')
  let l = laid.get(knots)
  if (!l) {
    l = lay(knots, name)
    laid.set(knots, l)
  }
  const { airs, x, rows, slopes } = l
  const n = airs.length
  if (height >= airs[0]!.height) return airs[0]!
  if (height <= airs[n - 1]!.height) return airs[n - 1]!
  let i = 0
  while (height <= airs[i + 1]!.height) i++
  const at = -Math.log(height)
  const dx = x[i + 1]! - x[i]!
  const u = (at - x[i]!) / dx
  const s = u * u * (3 - 2 * u)
  const from = u * (1 - u) * (1 - u)
  const to = -u * u * (1 - u)
  const a = rows[i]!
  const b = rows[i + 1]!
  const ma = slopes[i]!
  const mb = slopes[i + 1]!
  const v = a.map((ya, j) => ya + (b[j]! - ya) * s + dx * (ma[j]! * from + mb[j]! * to))
  return airOf(height, (at - x[0]!) / (x[n - 1]! - x[0]!), v, l.parts)
}
