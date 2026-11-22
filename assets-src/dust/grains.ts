import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { stream } from '../../src/core/random'
import { Flow, FLOW } from '../../src/space/travel/flow'
import { DUST } from '../../src/space/dust'

const COUNT = 12000
const d = new FilmDirector(plans)
const flow = new Flow(d, FLOW.ease)
const fmt = config.formats[config.formatKeys.master]!
const rnd = stream('dust')
const base: number[][] = []
const seed: number[][] = []
for (let i = 0; i < COUNT; i++) { base.push([rnd.next(), rnd.next(), rnd.next()]); seed.push([rnd.next(), 0, 0, 0]) }
const more = stream('dust.look')
for (let i = 0; i < COUNT; i++) for (let k = 1; k < 4; k++) seed[i]![k] = more.next()
const fine = stream('dust.grain')
const grain: number[][] = []
for (let i = 0; i < COUNT; i++) grain.push([fine.next(), fine.next(), fine.next(), fine.next()])
const fr = (x: number): number => x - Math.floor(x)
const ss = (a: number, b: number, x: number): number => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t) }
const steps = Math.round(config.shutterFraction * FLOW.stepsPerFrame)

export interface Grain { i: number; x: number; y: number; len: number; depth: number; still: number; peak: number; sigma: number }

export function grainsAt(f: number): Grain[] {
  const seg = config.segments.find((s) => f >= s.firstFrame && f < s.endFrame)!
  const mid = d.shotAt(f, (f + 0.5 * config.shutterFraction) / config.fps)
  const q = mid.camera.quaternion.clone().invert()
  const f0 = flow.at(seg, f, 0, new THREE.Vector3())
  const f1 = flow.at(seg, f, steps, new THREE.Vector3())
  const tan = Math.tan((mid.camera.vfov * Math.PI) / 360)
  const px = (c: THREE.Vector3): THREE.Vector2 => new THREE.Vector2((c.x / -c.z / (tan * fmt.width / fmt.height)) * 0.5 * fmt.width, (c.y / -c.z / tan) * 0.5 * fmt.height)
  const gain = Math.pow(mid.dust / config.raw.travel.dust.level, DUST.response)
  const out: Grain[] = []
  for (let i = 0; i < COUNT; i++) {
    const b = base[i]!
    const s = seed[i]!
    const g = grain[i]!
    if (fr(s[0]! * 13.7 + s[2]! * 7.3) > DUST.share) continue
    const span = DUST.span[0]! * Math.pow(DUST.span[1]! / DUST.span[0]!, s[3]!)
    const w0 = new THREE.Vector3(fr(b[0]! - f0.x / span) - 0.5, fr(b[1]! - f0.y / span) - 0.5, fr(b[2]! - f0.z / span) - 0.5).multiplyScalar(span)
    const w1 = w0.clone().sub(f1.clone().sub(f0))
    const v0 = w0.clone().applyQuaternion(q)
    const v1 = w1.clone().applyQuaternion(q)
    if (v0.z > -0.05 || v1.z > -0.05) continue
    const depth = 0.5 * (v0.length() + v1.length())
    const s0 = px(v0)
    const s1 = px(v1)
    const len = s1.distanceTo(s0)
    const sigma = DUST.core[0]! + (DUST.core[1]! - DUST.core[0]!) * g[0]!
    const wide = Math.hypot(sigma, DUST.taper * len)
    const lobe = 0.5 + 0.5 * w0.clone().normalize().dot(mid.sun.dir)
    const phase = DUST.side[0]! + DUST.side[1]! * lobe ** 3 + DUST.side[2]! * lobe ** 22
    const fade = ss(span * 0.5, span * 0.34, depth) * ss(0.06, 0.2, depth)
    const swing = 0.5 + 0.5 * Math.cos(2 * Math.PI * fr(g[2]! + mid.time * (DUST.spin[0]! + (DUST.spin[1]! - DUST.spin[0]!) * g[3]!)))
    const tumble = g[1]! < DUST.glint[0]! ? 0.55 + DUST.glint[1]! * swing ** 8 : 0.8 + 0.4 * swing
    let still = gain * (DUST.level[0]! + DUST.level[1]! * Math.pow(s[1]!, DUST.level[2]!)) * phase * fade * tumble
    still /= Math.pow(1 + (still / DUST.cap) ** 4, 0.25)
    const peak = (still * sigma) / wide / (1 + (len / DUST.long) ** 2)
    const c = s0.clone().add(s1).multiplyScalar(0.5)
    const x = c.x + fmt.width / 2
    const y = fmt.height / 2 - c.y
    if (x < 0 || x >= fmt.width || y < 0 || y >= fmt.height || peak <= 0.1) continue
    out.push({ i, x, y, len, depth, still, peak, sigma })
  }
  return out
}

if (process.argv[1]!.endsWith('grains.ts')) {
  for (const f of process.argv.slice(2).map(Number)) {
    const a = grainsAt(f)
    const next = new Map(grainsAt(f + 1).map((g) => [g.i, g]))
    const band = (lo: number, hi: number, key: (g: Grain) => number): number => a.filter((g) => key(g) >= lo && key(g) < hi).length
    console.log('frame ' + f + ': drawn in frame ' + a.length + '; nominal peak 1 to 3: ' + band(1, 3, (g) => g.peak) + ', 3 to 6: ' + band(3, 6, (g) => g.peak) + ', 6 to 10: ' + band(6, 11, (g) => g.peak))
    console.log('  streak length px of those over nominal 1: under 2: ' + a.filter((g) => g.peak >= 1 && g.len < 2).length + ', 2 to 5: ' + a.filter((g) => g.peak >= 1 && g.len >= 2 && g.len < 5).length + ', 5 to 10: ' + a.filter((g) => g.peak >= 1 && g.len >= 5 && g.len < 10).length + ', 10 to 20: ' + a.filter((g) => g.peak >= 1 && g.len >= 10 && g.len < 20).length + ', over 20: ' + a.filter((g) => g.peak >= 1 && g.len >= 20).length)
    console.log('  largest nominal peak with a streak over 20 px: ' + Math.max(0, ...a.filter((g) => g.len >= 20).map((g) => g.peak)).toFixed(2) + ' (of ' + a.filter((g) => g.len >= 20).length + ' drawn)')
    const depths = a.filter((g) => g.peak >= 3).map((g) => g.depth).sort((p, q) => p - q)
    if (depths.length) console.log('  depth of those over nominal 3: min ' + depths[0]!.toFixed(1) + ' median ' + depths[depths.length >> 1]!.toFixed(1) + ' max ' + depths[depths.length - 1]!.toFixed(1))
    if (process.env.LIST) for (const g of a.filter((g) => g.peak >= Number(process.env.LIST)).sort((p, q) => q.peak - p.peak)) {
      const n = next.get(g.i)
      console.log('  #' + g.i + ' at ' + g.x.toFixed(1) + ',' + g.y.toFixed(1) + ' len ' + g.len.toFixed(1) + ' depth ' + g.depth.toFixed(1) + ' peak ' + g.peak.toFixed(1) + (n ? ' next ' + n.x.toFixed(1) + ',' + n.y.toFixed(1) + ' peak ' + n.peak.toFixed(1) : ' gone'))
    }
  }
}
