import * as THREE from 'three'
import { config } from '../../../src/config'
import type { MoveParams, StopPlan } from '../../../src/director/moves'
import type { Tune } from '../../../src/stops/earth/plan'

const { Plan, timing: liveTune, params, plan: live } = (await import(process.env.EARTH_PLAN ?? '../../../src/stops/earth/plan')) as typeof import('../../../src/stops/earth/plan')

const arg = (name: string, d: string): string => {
  const i = process.argv.indexOf('--' + name)
  return i >= 0 ? process.argv[i + 1]! : d
}
const kind = arg('kind', 'dive') as 'dive' | 'rise'
const over = arg('set', '')
let plan: StopPlan = live
if (over) {
  const o = JSON.parse(over) as Record<string, Record<string, unknown>>
  const merged = { ...params } as unknown as Record<string, unknown>
  for (const [k, v] of Object.entries(o)) merged[k] = v !== null && typeof v === 'object' && !Array.isArray(v) ? { ...(merged[k] as object), ...v } : v
  const t = (o.tune ?? {}) as Record<string, object | null>
  const tune = { ...liveTune } as unknown as Record<string, unknown>
  for (const [k, v] of Object.entries(t)) tune[k] = v === null ? null : { ...(tune[k] as object), ...v }
  delete merged.tune
  plan = new Plan(merged as unknown as MoveParams, tune as unknown as Tune)
}
const [a, b] = arg('range', kind === 'dive' ? '1868-1892' : '2120-2142').split('-').map(Number) as [number, number]
const sub = Number(arg('sub', '1'))
const seg = kind === 'dive' ? plan.seg.dive! : plan.seg.rise
const RAD = Math.PI / 180
const H = 540
const W = 960

interface Seen { view: string; limb: number; x: number; y: number; edge: number; tilt: number; inside: number; top: number; head: number; vfov: number; pitch: number }

function seen(time: number): Seen {
  const shot = kind === 'dive' ? plan.dive(time) : plan.rise(time)
  const p = shot.pose
  const inv = p.quaternion.clone().invert()
  const th = Math.tan((p.vfov * RAD) / 2)
  let nadir: THREE.Vector3
  let alpha: number
  let heading: THREE.Vector3
  if (shot.view === 'orbit') {
    nadir = p.position.clone().normalize().negate()
    alpha = Math.asin(Math.min(1 / p.position.length(), 1))
    heading = plan.heading.clone().applyQuaternion(plan.turn(time))
  } else {
    const sea = plan.p.coverSea!
    const to = new THREE.Vector3().fromArray(sea.centre).sub(p.position)
    alpha = Math.asin(Math.min(sea.radius / to.length(), 1))
    nadir = to.normalize()
    heading = new THREE.Vector3(0, 0, -1)
  }
  const n = nadir.clone().applyQuaternion(inv)
  const k = H / th
  const off = Math.acos(THREE.MathUtils.clamp(-n.z, -1, 1))
  const len = Math.hypot(n.x, n.y)
  const tilt = len > 1e-9 ? Math.atan2(n.x, -n.y) / RAD : 0
  const edge = Math.tan(alpha - off) * k
  let inside = 1e9
  for (const [cx, cy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) {
    const ray = new THREE.Vector3(cx * th * (W / H), cy * th, -1).normalize()
    inside = Math.min(inside, (alpha - Math.acos(THREE.MathUtils.clamp(ray.dot(n), -1, 1))) / RAD)
  }
  const h = heading.clone().addScaledVector(nadir, -heading.dot(nadir)).normalize().applyQuaternion(inv)
  const along = len > 1e-9 ? -n.y / len : 1
  const reach = Math.abs(along) > 1e-6 ? edge / along : 1e9
  return {
    view: shot.view,
    limb: Math.tan(alpha) * k,
    x: n.z < 0 ? (n.x / -n.z) * k : NaN,
    y: n.z < 0 ? (-n.y / -n.z) * k : NaN,
    edge,
    tilt,
    inside,
    top: (H - reach) / (2 * H),
    head: Math.atan2(h.x, h.y) / RAD,
    vfov: p.vfov,
    pitch: off / RAD,
  }
}

const centre = plan.coverCenter(seg)
console.log('cover centre frame ' + (centre * config.fps).toFixed(2) + '  columns: limb px, nadir x y px from the frame centre (y down), edge = nearest limb from the centre px, tilt deg of the horizon, top = limb on the centre column as a share of the height, inside = deg by which the last corner is inside the disc, head = heading on screen deg, pitch = axis off nadir deg')
let last: Seen | null = null
for (let f = a; f <= b; f++) {
  for (let j = 0; j < sub; j++) {
    const time = (f + (sub === 1 ? config.shutterFraction / 2 : j / sub)) / config.fps
    const s = seen(time)
    const cover = plan.coverAmount(seg, time)
    const d = last ? ' | d edge ' + (s.edge - last.edge).toFixed(1) + ' d tilt ' + (s.tilt - last.tilt).toFixed(2) + ' d head ' + (s.head - last.head).toFixed(2) : ''
    console.log((f + (sub === 1 ? 0 : j / sub)).toFixed(sub === 1 ? 0 : 2) + ' ' + s.view.padEnd(7) + ' cover ' + cover.toFixed(2) + ' vfov ' + s.vfov.toFixed(1) + ' limb ' + s.limb.toFixed(0) + ' nadir ' + s.x.toFixed(0) + ' ' + s.y.toFixed(0) + ' edge ' + s.edge.toFixed(0) + ' tilt ' + s.tilt.toFixed(1) + ' top ' + s.top.toFixed(3) + ' inside ' + s.inside.toFixed(1) + ' head ' + s.head.toFixed(1) + ' pitch ' + s.pitch.toFixed(1) + d)
    last = s
  }
}
