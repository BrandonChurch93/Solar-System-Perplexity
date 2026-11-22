import * as THREE from 'three'
import { config } from '../../../src/config'
import type { MoveParams } from '../../../src/director/moves'
import type { Tune } from '../../../src/stops/earth/plan'
import relief from '../../../src/stops/earth/relief.json'

const arg = (name: string, d: string): string => {
  const i = process.argv.indexOf('--' + name)
  return i >= 0 ? process.argv[i + 1]! : d
}
const { Plan, timing, params } = (await import(process.env.EARTH_PLAN ?? '../../../src/stops/earth/plan')) as typeof import('../../../src/stops/earth/plan')
const over = JSON.parse(arg('set', '{}')) as Record<string, Record<string, unknown>>
const merged = { ...params } as unknown as Record<string, unknown>
for (const [k, v] of Object.entries(over)) merged[k] = v !== null && typeof v === 'object' && !Array.isArray(v) ? { ...(merged[k] as object), ...v } : v
const tune = { ...timing } as unknown as Record<string, unknown>
for (const [k, v] of Object.entries((over.tune ?? {}) as Record<string, object | null>)) tune[k] = v === null ? null : { ...(tune[k] as object), ...v }
delete merged.tune
const plan = new Plan(merged as unknown as MoveParams, tune as unknown as Tune)
const frames = arg('frames', '').split(',').filter(Boolean).map(Number)
const W = 1920
const H = 1080
const [IW, IH] = relief.imageSize as [number, number]
const box = relief.ground.box as [number, number, number, number]
const centre = new THREE.Vector3().fromArray(relief.nadir).normalize().multiplyScalar(relief.radius + 1)
const ith = Math.tan(THREE.MathUtils.degToRad(relief.vfovDeg) / 2)
type Pose = { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }
const seg = (f: number) => config.segments.find((s) => s.stop === 'earth' && f >= s.firstFrame && f < s.endFrame)!
const poseAt = (f: number): Pose | null => {
  const s = seg(f)
  const time = (f + 0.25) / config.fps
  if (s.kind === 'terrain') return plan.terrain(time - s.firstFrame / config.fps)
  if (s.kind !== 'dive' && s.kind !== 'rise') return null
  const r = s.kind === 'dive' ? plan.dive(time) : plan.rise(time)
  return r.view === 'terrain' ? r.pose : null
}
const hit = (pose: Pose, x: number, y: number): THREE.Vector3 | null => {
  const t = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  const ray = new THREE.Vector3(((2 * x) / W - 1) * t * (W / H), (1 - (2 * y) / H) * t, -1).normalize().applyQuaternion(pose.quaternion)
  const oc = pose.position.clone().sub(centre)
  const b = oc.dot(ray)
  const disc = b * b - (oc.lengthSq() - relief.radius * relief.radius)
  if (disc <= 0 || -b - Math.sqrt(disc) <= 0) return null
  return pose.position.clone().addScaledVector(ray, -b - Math.sqrt(disc))
}
const image = (p: THREE.Vector3): [number, number] => [((p.x / -p.z / (ith * (IW / IH)) + 1) * IW) / 2, ((1 - p.y / -p.z / ith) * IH) / 2]
const project = (pose: Pose, p: THREE.Vector3): [number, number] => {
  const t = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  const v = p.clone().sub(pose.position).applyQuaternion(pose.quaternion.clone().invert())
  return [((v.x / -v.z / (t * (W / H)) + 1) * W) / 2, ((1 - v.y / -v.z / t) * H) / 2]
}
const flow = (a: Pose, b: Pose, x: number, y: number): string => {
  const p = hit(a, x, y)
  if (!p) return 'sky'
  const q = project(b, p)
  return (q[0] - x).toFixed(1) + ',' + (q[1] - y).toFixed(1)
}
for (const f of frames) {
  const a = poseAt(f)
  const b = poseAt(f + 1)
  if (!a) {
    console.log(f, 'orbit view')
    continue
  }
  let xmin = 1e9
  let xmax = -1e9
  let ymax = -1e9
  for (let i = 0; i <= 40; i++) {
    for (const [x, y] of [[(i / 40) * W, H], [0, (i / 40) * H], [W, (i / 40) * H]] as [number, number][]) {
      const p = hit(a, x, y)
      if (!p) continue
      const q = image(p)
      xmin = Math.min(xmin, q[0])
      xmax = Math.max(xmax, q[0])
      ymax = Math.max(ymax, q[1])
    }
  }
  const speed = b ? b.position.clone().sub(a.position).multiplyScalar(config.fps) : null
  const s = seg(f)
  console.log(
    f, s.kind,
    'pos', a.position.toArray().map((v) => v.toFixed(3)).join(' '),
    'v/s', speed ? speed.toArray().map((v) => v.toFixed(3)).join(' ') + ' |' + speed.length().toFixed(3) : '-',
    'canvas x', xmin.toFixed(0), xmax.toFixed(0), 'of', box[0], box[0] + box[2], 'ymax', ymax.toFixed(0), 'of', box[1] + box[3],
    'flow px/frame bottom', b ? flow(a, b, W / 2, H - 20) : '-', 'mid', b ? flow(a, b, W / 2, H * 0.6) : '-', 'left', b ? flow(a, b, 200, H * 0.8) : '-',
    'cover', s.kind === 'terrain' ? '0' : plan.coverAmount(s, (f + 0.25) / config.fps).toFixed(2),
  )
}
if (arg('scan', '') !== '') {
  const list = arg('scan', '').split(',').map(Number)
  let ymax = -1e9
  let xmin = 1e9
  let xmax = -1e9
  const cells: string[] = []
  for (let f = list[0]!; f <= list[1]!; f++) {
    const a = poseAt(f)!
    const b = poseAt(f + 1)!
    for (let i = 0; i <= 40; i++) {
      for (const [x, y] of [[(i / 40) * W, H], [0, (i / 40) * H], [W, (i / 40) * H]] as [number, number][]) {
        const p = hit(a, x, y)
        if (!p) continue
        const q = image(p)
        xmin = Math.min(xmin, q[0])
        xmax = Math.max(xmax, q[0])
        ymax = Math.max(ymax, q[1])
      }
    }
    if ((f - list[0]!) % 4 === 0 || f >= list[1]! - 1) cells.push(f + ':' + flow(a, b, W / 2, H - 20).split(',')[1] + '/' + flow(a, b, W / 2, H * 0.6).split(',')[1] + '/' + flow(a, b, W / 2, H * 0.3).split(',')[1])
  }
  console.log('scan x', xmin.toFixed(0), xmax.toFixed(0), 'ymax', ymax.toFixed(0), 'flow y bottom/mid/upper', cells.join(' '))
}
