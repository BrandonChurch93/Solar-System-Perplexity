import * as THREE from 'three'
import { config } from '../../../src/config'
import { StopPlan, type Fit, type MoveParams } from '../../../src/director/moves'
import fit from '../../../src/stops/earth/fit.json'
import { params } from '../../../src/stops/earth/plan'
import relief from '../../../src/stops/earth/relief.json'

const arg = (name: string, d: string): string => {
  const i = process.argv.indexOf('--' + name)
  return i >= 0 ? process.argv[i + 1]! : d
}
const over = JSON.parse(arg('set', '{}')) as Record<string, Record<string, unknown>>
const merged = { ...params } as unknown as Record<string, unknown>
for (const [k, v] of Object.entries(over)) merged[k] = typeof v === 'object' && !Array.isArray(v) ? { ...(merged[k] as object), ...v } : v
const plan = new StopPlan('earth', fit as Fit, merged as unknown as MoveParams)
const frames = arg('frames', '').split(',').filter(Boolean).map(Number)
const sun0 = Number(arg('sun', '27.39'))
const sunRate = Number(arg('sunrate', '0.857'))
const centre = new THREE.Vector3().fromArray(relief.nadir).normalize().multiplyScalar(relief.radius + 1)
const deg = THREE.MathUtils.radToDeg
const seg = (f: number) => config.segments.find((s) => s.stop === 'earth' && f >= s.firstFrame && f < s.endFrame)!
const base = plan.terrain((2010.25 - seg(2010).firstFrame) / config.fps)
for (const f of frames) {
  const s = seg(f)
  const time = (f + 0.25) / config.fps
  let pose: { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }
  let view = 'terrain'
  if (s.kind === 'terrain') pose = plan.terrain(time - s.firstFrame / config.fps)
  else {
    const r = s.kind === 'dive' ? plan.dive(time) : plan.rise(time)
    pose = r.pose
    view = r.view
  }
  const c = view === 'terrain' ? centre : new THREE.Vector3()
  const R = view === 'terrain' ? relief.radius : 1
  const down = c.clone().sub(pose.position)
  const d = down.length()
  down.normalize()
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(pose.quaternion)
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(pose.quaternion)
  const off = Math.acos(THREE.MathUtils.clamp(fwd.dot(down), -1, 1))
  const limb = Math.asin(Math.min(R / d, 1)) - off
  const th = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  const tilt = deg(Math.atan2(-down.dot(new THREE.Vector3(1, 0, 0).applyQuaternion(pose.quaternion)), -down.dot(up)))
  let sun = '-'
  if (view === 'terrain') {
    const rel = pose.quaternion.clone().multiply(base.quaternion.clone().invert())
    const e = new THREE.Euler().setFromQuaternion(rel, 'YXZ')
    const el = sun0 - sunRate * (time - 2010.25 / config.fps) - deg(e.x)
    sun = (Math.tan(THREE.MathUtils.degToRad(el)) / th).toFixed(3)
  }
  console.log(
    f, s.kind, view, 'height', (d - R).toFixed(view === 'terrain' ? 3 : 4), 'dip', deg(Math.acos(Math.min(R / d, 1))).toFixed(2),
    'limb above axis', deg(limb).toFixed(2), 'limb from top', (0.5 - (0.5 * Math.tan(limb)) / th).toFixed(3), 'limb tilt', tilt.toFixed(1),
    'vfov', pose.vfov.toFixed(1), 'sun y (edge 1)', sun, 'cover', s.kind === 'terrain' || s.kind === 'hold' ? '0' : plan.coverAmount(s, time).toFixed(2),
  )
}
