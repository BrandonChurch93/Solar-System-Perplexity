import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { stream } from '../../src/core/random'
import { Flow, FLOW } from '../../src/space/travel/flow'
import { DUST } from '../../src/space/dust'

const d = new FilmDirector(plans)
const flow = new Flow(d, FLOW.ease)
const fmt = config.formats[config.formatKeys.master]!
const COUNT = Number(process.argv[3] ?? 12000)
const rnd = stream('dust')
const base: THREE.Vector3[] = []
const seed: number[][] = []
for (let i = 0; i < COUNT; i++) { base.push(new THREE.Vector3(rnd.next(), rnd.next(), rnd.next())); seed.push([rnd.next(), 0, 0, 0]) }
const more = stream('dust.look')
for (let i = 0; i < COUNT; i++) for (let k = 1; k < 4; k++) seed[i]![k] = more.next()
const fr = (x: number): number => x - Math.floor(x)
const ss = (a: number, b: number, x: number): number => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t) }
const steps = Math.round(config.shutterFraction * FLOW.stepsPerFrame)

interface Mote { x: number; y: number; len: number; peak: number; dir: THREE.Vector3 }
function frame(f: number): Map<number, Mote> {
  const seg = config.segments.find((s) => f >= s.firstFrame && f < s.endFrame)!
  const t0 = f / config.fps
  const mid = d.shotAt(f, t0 + (0.5 * config.shutterFraction) / config.fps)
  const open = d.shotAt(f, t0)
  const close = d.shotAt(f, t0 + config.shutterFraction / config.fps)
  const q0 = mid.camera.quaternion.clone().slerp(open.camera.quaternion, DUST.pan).invert()
  const q1 = mid.camera.quaternion.clone().slerp(close.camera.quaternion, DUST.pan).invert()
  const f0 = flow.at(seg, f, 0, new THREE.Vector3())
  const f1 = flow.at(seg, f, steps, new THREE.Vector3())
  const tan = Math.tan((mid.camera.vfov * Math.PI) / 360)
  const px = (c: THREE.Vector3): THREE.Vector2 => new THREE.Vector2((c.x / -c.z / (tan * fmt.width / fmt.height)) * 0.5 * fmt.width, (c.y / -c.z / tan) * 0.5 * fmt.height)
  const out = new Map<number, Mote>()
  for (let i = 0; i < COUNT; i++) {
    const b = base[i]!
    const s = seed[i]!
    const span = s[3]! < DUST.near ? DUST.nearSpan : DUST.span
    const w0 = new THREE.Vector3(fr(b.x - f0.x / span) - 0.5, fr(b.y - f0.y / span) - 0.5, fr(b.z - f0.z / span) - 0.5).multiplyScalar(span)
    const w1 = w0.clone().sub(f1.clone().sub(f0))
    const v0 = w0.clone().applyQuaternion(q0)
    const v1 = w1.clone().applyQuaternion(q1)
    if (v0.z > -0.05 || v1.z > -0.05) continue
    const dist = 0.5 * (v0.length() + v1.length())
    const s0 = px(v0)
    const s1 = px(v1)
    const len = s1.distanceTo(s0)
    const coc = DUST.bokeh[1]! * Math.max(1 / dist - 1 / DUST.focus[1]!, 0)
    const core = DUST.core[1]! + DUST.coreSpread * s[0]!
    const r = Math.hypot(core, coc)
    const fade = ss(span * 0.5, span * 0.34, dist) * ss(0.06, 0.2, dist)
    const energy = fade * (0.1 + 0.9 * s[1]! ** 3) / Math.pow(Math.max(dist, 0.3), 1.3)
    const peak = energy / (1.428 * r * r + 1.195 * r * len)
    const c = s0.clone().add(s1).multiplyScalar(0.5)
    out.set(i, { x: c.x + fmt.width / 2, y: fmt.height / 2 - c.y, len, peak, dir: w0.clone().add(w1).normalize() })
  }
  return out
}

const f = Number(process.argv[2])
const a = frame(f)
const b = frame(f + 1)
const open = d.shotAt(f, f / config.fps)
const close = d.shotAt(f, (f + config.shutterFraction) / config.fps)
const fly = close.camera.position.clone().sub(open.camera.position).normalize().applyQuaternion(open.camera.quaternion.clone().invert())
const tan = Math.tan((open.camera.vfov * Math.PI) / 360)
const foe = { x: (fly.x / -fly.z / (tan * fmt.width / fmt.height)) * 0.5 * fmt.width + fmt.width / 2, y: fmt.height / 2 - (fly.y / -fly.z / tan) * 0.5 * fmt.height, front: fly.z < 0 }
const rows = [...a.entries()].filter(([i, m]) => b.has(i) && m.x > 40 && m.x < fmt.width - 40 && m.y > 40 && m.y < fmt.height - 40).sort((p, q) => q[1].peak - p[1].peak).slice(0, 40).map(([i, m]) => {
  const n = b.get(i)!
  const star = (g: number): THREE.Vector2 => {
    const mid = d.shotAt(g, (g + 0.5 * config.shutterFraction) / config.fps)
    const v = m.dir.clone().applyQuaternion(mid.camera.quaternion.clone().invert())
    const t = Math.tan((mid.camera.vfov * Math.PI) / 360)
    return new THREE.Vector2((v.x / -v.z / (t * fmt.width / fmt.height)) * 0.5 * fmt.width + fmt.width / 2, fmt.height / 2 - (v.y / -v.z / t) * 0.5 * fmt.height)
  }
  const sa = star(f)
  const sb = star(f + 1)
  const par = { x: n.x - m.x - (sb.x - sa.x), y: n.y - m.y - (sb.y - sa.y) }
  const rad = { x: m.x - foe.x, y: m.y - foe.y }
  const rl = Math.hypot(rad.x, rad.y)
  return { i, ax: m.x, ay: m.y, bx: n.x, by: n.y, len: m.len, peak: m.peak, sky: [sb.x - sa.x, sb.y - sa.y], par: [par.x, par.y], out: (par.x * rad.x + par.y * rad.y) / rl }
})
console.log(JSON.stringify({ frame: f, foe, rows }))
