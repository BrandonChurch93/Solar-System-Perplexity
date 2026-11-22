import * as THREE from 'three'
import { config } from '../../../src/config'
import { StopPlan, type Fit, type MoveParams } from '../../../src/director/moves'
import fit from '../../../src/stops/earth/fit.json'
import { params } from '../../../src/stops/earth/plan'

const arg = (name: string, d: string): string => {
  const i = process.argv.indexOf('--' + name)
  return i >= 0 ? process.argv[i + 1]! : d
}
const over = JSON.parse(arg('set', '{}')) as Record<string, Record<string, unknown>>
const merged = { ...params } as unknown as Record<string, unknown>
for (const [k, v] of Object.entries(over)) merged[k] = typeof v === 'object' && !Array.isArray(v) ? { ...(merged[k] as object), ...v } : v
const plan = new StopPlan('earth', fit as Fit, merged as unknown as MoveParams)
const widths = arg('widths', '96,48,24,12,6').split(',').filter(Boolean).map(Number)
const size = Number(arg('size', '4096'))
const mapWidth = Number(arg('map', '8192'))
const fade = [1.02, 1.5]
const feather = 0.12
const W = 1920
const H = 1080
const step = Number(arg('step', '24'))
const frames = arg('frames', '').split(',').filter(Boolean).map(Number)
const seg = (f: number) => config.segments.find((s) => s.stop === 'earth' && f >= s.firstFrame && f < s.endFrame)!
const smoothstep = (a: number, b: number, x: number): number => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}
const shot = (time: number, kind: string) => (kind === 'dive' ? plan.dive(time) : plan.rise(time))
const hit = (pose: { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }, x: number, y: number): THREE.Vector3 | null => {
  const t = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  const ray = new THREE.Vector3(((2 * x) / W - 1) * t * (W / H), (1 - (2 * y) / H) * t, -1).normalize().applyQuaternion(pose.quaternion)
  const b = pose.position.dot(ray)
  const c = pose.position.lengthSq() - 1
  const disc = b * b - c
  if (disc <= 0 || -b - Math.sqrt(disc) <= 0) return null
  return pose.position.clone().addScaledVector(ray, -b - Math.sqrt(disc))
}
const project = (pose: { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }, p: THREE.Vector3): [number, number] => {
  const t = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  const v = p.clone().sub(pose.position).applyQuaternion(pose.quaternion.clone().invert())
  return [((v.x / -v.z / (t * (W / H)) + 1) * W) / 2, ((1 - v.y / -v.z / t) * H) / 2]
}
for (const f of frames) {
  const s = seg(f)
  if (s.kind !== 'dive' && s.kind !== 'rise') continue
  const time = (f + 0.25) / config.fps
  const r = shot(time, s.kind)
  const cover = plan.coverAmount(s, time)
  if (r.view !== 'orbit') {
    console.log(f, s.kind, 'terrain view, cover', cover.toFixed(2))
    continue
  }
  const pose = r.pose
  const tq = plan.turn(time)
  const spot = plan.spot.clone().applyQuaternion(tq)
  const east = new THREE.Vector3(0, 1, 0).cross(spot).normalize()
  const north = spot.clone().cross(east)
  const g = (p: THREE.Vector3): [number, number] => {
    const inv = 1 / Math.max(p.dot(spot), 0.05)
    return [p.dot(east) * inv, p.dot(north) * inv]
  }
  let counted = 0
  let soft = 0
  const blur: number[] = []
  const t0 = f / config.fps
  const t1 = (f + 0.5) / config.fps
  const p0 = shot(t0, s.kind)
  const p1 = shot(t1, s.kind)
  const q0 = plan.turn(t0).multiply(tq.clone().invert())
  const q1 = plan.turn(t1).multiply(tq.clone().invert())
  for (let y = step / 2; y < H; y += step) {
    for (let x = step / 2; x < W; x += step) {
      const a = hit(pose, x, y)
      const bx = hit(pose, x + 1, y)
      const by = hit(pose, x, y + 1)
      if (!a || !bx || !by) continue
      counted++
      const dd = Math.sqrt(Math.max(bx.clone().sub(a).lengthSq(), by.clone().sub(a).lengthSq()))
      let texels = (dd * mapWidth) / (2 * Math.PI)
      const ga = g(a)
      const gx = g(bx)
      const gy = g(by)
      const gd = Math.sqrt(Math.max((gx[0] - ga[0]) ** 2 + (gx[1] - ga[1]) ** 2, (gy[0] - ga[0]) ** 2 + (gy[1] - ga[1]) ** 2))
      const front = a.dot(spot) > 0.3 ? 1 : 0
      let parent = texels
      for (const wdeg of widths) {
        const scale = 1 / (2 * Math.tan(THREE.MathUtils.degToRad(wdeg) / 2))
        const m = Math.max(Math.abs(ga[0] * scale), Math.abs(ga[1] * scale))
        const w = front * smoothstep(0.5, 0.5 - feather, m) * (1 - smoothstep(fade[0], fade[1], parent))
        parent = gd * scale * size
        if (w >= 0.5) texels = parent
      }
      if (texels < 1) soft++
      if (p0.view === 'orbit' && p1.view === 'orbit') {
        const a0 = project(p0.pose, a.clone().applyQuaternion(q0))
        const a1 = project(p1.pose, a.clone().applyQuaternion(q1))
        blur.push(Math.hypot(a1[0] - a0[0], a1[1] - a0[1]))
      }
    }
  }
  blur.sort((u, v) => u - v)
  const sky: number[] = []
  if (p0.view === 'orbit' && p1.view === 'orbit') {
    for (const [sx, sy] of [[60, 60], [1860, 60], [960, 540], [60, 1020], [1860, 1020]] as [number, number][]) {
      const t = Math.tan(THREE.MathUtils.degToRad(p0.pose.vfov) / 2)
      const ray = new THREE.Vector3(((2 * sx) / W - 1) * t * (W / H), (1 - (2 * sy) / H) * t, -1).normalize().applyQuaternion(p0.pose.quaternion)
      const b = project({ position: new THREE.Vector3(), quaternion: p1.pose.quaternion, vfov: p1.pose.vfov }, ray)
      sky.push(Math.hypot(b[0] - sx, b[1] - sy))
    }
  }
  const h = pose.position.length() - 1
  const out = pose.position.clone().normalize()
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(pose.quaternion)
  const pitch = THREE.MathUtils.radToDeg(Math.asin(-fwd.dot(out)))
  const dip = THREE.MathUtils.radToDeg(Math.acos(1 / (1 + h)))
  const th = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  const horizonY = Math.tan(THREE.MathUtils.degToRad(pitch - dip)) / th
  const head = plan.heading.clone().applyQuaternion(tq)
  const hv = head.clone().applyQuaternion(pose.quaternion.clone().invert())
  const off = THREE.MathUtils.radToDeg(out.angleTo(spot))
  console.log(
    f, s.kind, 'h', h.toFixed(4), 'vfov', pose.vfov.toFixed(1), 'pitch', pitch.toFixed(1), 'horizon y', horizonY.toFixed(2), 'heading on screen deg', THREE.MathUtils.radToDeg(Math.atan2(hv.y, hv.x)).toFixed(0),
    'spot off', off.toFixed(2), 'body', (counted / ((W / step) * (H / step))).toFixed(2), 'soft', (soft / Math.max(counted, 1)).toFixed(3), 'blur px median', blur.length ? blur[blur.length >> 1]!.toFixed(1) : '-', 'p90', blur.length ? blur[Math.floor(blur.length * 0.9)]!.toFixed(1) : '-', 'cover', cover.toFixed(2),
    'sky px', sky.map((v) => v.toFixed(1)).join(' ')
  )
}
