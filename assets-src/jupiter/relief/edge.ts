import * as THREE from 'three'
import { readFileSync } from 'node:fs'
import { type Fit, type MoveParams } from '../../../src/director/moves'
import fit from '../../../src/stops/jupiter/fit.json'
import { JupiterPlan, params } from '../../../src/stops/jupiter/plan'
import meta from '../../../src/stops/jupiter/relief.json'
import { config } from '../../../src/config'
const overT = JSON.parse(process.env.TERRAIN ?? '{}')
const p: MoveParams = { ...params, terrain: { ...params.terrain, ...overT } }
const plan = new JupiterPlan('jupiter', fit as Fit, p)
const fps = config.fps
const buf = readFileSync('public/assets/jupiter/full/deck-dist.bin')
const dist = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4)
const [gw, gh] = meta.grid as [number, number]
const [ox, oy] = meta.origin as [number, number]
const [iw, ih] = meta.image as [number, number]
const f = meta.focalPx
const ray = (x: number, y: number) => new THREE.Vector3(x - iw / 2, -(y - ih / 2), -f).normalize()
type V = { p: THREE.Vector3; side: string; px: [number, number] }
const border: V[] = []
const add = (i: number, j: number, side: string) => {
  const cx = i * meta.cell, cy = j * meta.cell
  border.push({ p: ray(cx - ox, cy - oy).multiplyScalar(dist[j * gw + i]!), side, px: [cx - ox, cy - oy] })
}
for (let j = 0; j < gh; j += 2) { add(0, j, 'left'); add(gw - 1, j, 'right') }
for (let i = 0; i < gw; i += 2) add(i, gh - 1, 'bottom')
const frames: number[] = []
const spec = process.env.FR ?? '3024-3060:2,3060-3239:20,3240-3269:3'
for (const part of spec.split(',')) {
  const [range, step] = part.split(':')
  const [a, b] = range!.split('-').map(Number)
  for (let k = a!; k <= (b ?? a!); k += Number(step ?? 1)) frames.push(k)
}
const seg = plan.seg
for (const fr of frames) {
  const t = fr / fps
  let pose: { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }
  let view = 'terrain'
  if (t < seg.terrain.start) { const r = plan.dive(t); pose = r.pose; view = r.view } else if (t < seg.terrain.end) pose = plan.terrain(t - seg.terrain.start)
  else { const r = plan.rise(t); pose = r.pose; view = r.view }
  if (view !== 'terrain') { console.log(fr, view); continue }
  const th = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  const inv = pose.quaternion.clone().invert()
  const worst: Record<string, number> = { left: 0, right: 0, bottom: 0 }
  const where: Record<string, string> = {}
  for (const b of border) {
    const v = b.p.clone().sub(pose.position).applyQuaternion(inv)
    if (v.z > -0.02) continue
    const nx = v.x / (-v.z * th * 16 / 9), ny = v.y / (-v.z * th)
    if (Math.abs(nx) >= 1 || Math.abs(ny) >= 1) continue
    const inside = Math.min((1 - Math.abs(nx)) * 960, (1 - Math.abs(ny)) * 540)
    if (inside > worst[b.side]!) { worst[b.side] = inside; where[b.side] = `screen (${((nx + 1) * 960).toFixed(0)}, ${((1 - ny) * 540).toFixed(0)}) canvas (${b.px[0]}, ${b.px[1]})` }
  }
  console.log(fr, 'pos', pose.position.toArray().map((x) => x.toFixed(3)).join(' '), 'edge in frame px: left', worst.left!.toFixed(0), 'bottom', worst.bottom!.toFixed(0), 'right', worst.right!.toFixed(0), where.left ?? '', where.bottom ?? '')
}
