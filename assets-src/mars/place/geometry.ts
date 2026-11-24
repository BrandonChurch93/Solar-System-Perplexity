import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import * as THREE from 'three'
import { config } from '../../../src/config'
import { placeLayout } from '../../../src/core/place'
import { shutterMid } from '../../../src/core/sampler'
import { handoverFrame, handoverOf, sideAt } from '../../../src/director/handover'
import { plans } from '../../../src/director/plans'
import type { Pose } from '../../../src/core/types'

// Writes the cameras of the Mars dive and rise in the body frame (the frame of the wrap map and the patches),
// the twin at both handovers, the layout of the place picture and the frame of the close view on the globe
// (terrain: a point of the close view times scale, turned by rotation, plus origin is its place in the body frame) and the
// scene's Sun in the body frame. Read by the Python tools in this folder.
//   npx tsx assets-src/mars/place/geometry.ts [out.json]

const out = resolve(process.argv[2] ?? 'out/work/place/geometry.json')
const plan = plans.find((p) => p.id === 'mars')!
const fps = config.fps
const globe = new THREE.Quaternion().fromArray(plan.fit.globe.quaternion)
const toBody = (time: number): THREE.Quaternion => plan.turn(time).multiply(globe).invert()
const body = (p: Pose, time: number): { position: number[]; quaternion: number[]; vfov: number } => {
  const q = toBody(time)
  return { position: p.position.clone().applyQuaternion(q).toArray(), quaternion: q.clone().multiply(p.quaternion).toArray(), vfov: p.vfov }
}
const master = config.formats[config.formatKeys.master]!
const result: Record<string, unknown> = { fps, format: master, globeScale: plan.fit.globe.scale, spotBody: plan.spot.clone().applyQuaternion(globe.clone().invert()).toArray(), headingBody: plan.heading.clone().applyQuaternion(globe.clone().invert()).toArray(), ground: plan.ground }
for (const kind of ['dive', 'rise'] as const) {
  const seg = kind === 'dive' ? plan.seg.dive! : plan.seg.rise
  const h = handoverOf('mars', kind)!
  const T = h.time
  const close = plan.closePose(kind, T)
  const twin = plan.twin(close, T)
  const size = plan.p.handover?.[kind]?.place ?? {}
  const layout = placeLayout(master, size, 8192)
  const frames: unknown[] = []
  for (let f = seg.firstFrame; f < seg.endFrame; f++) {
    const mid = (f + shutterMid()) / fps
    const side = sideAt(seg, mid)
    const pose = side === 'orbit' ? (kind === 'dive' ? plan.divePose(mid, 'orbit') : plan.risePose(mid, 'orbit')) : plan.twin(plan.closePose(kind, mid), mid)
    frames.push({ frame: f, side, height: pose.position.length() - 1, ...body(pose, mid) })
  }
  const tf = plan.twinFrame(T)
  const terrain = { rotation: toBody(T).multiply(tf.rotation).toArray(), origin: tf.origin.clone().applyQuaternion(toBody(T)).toArray(), scale: tf.scale }
  result[kind] = { T, frameT: handoverFrame(h), handover: h, terrain, close: { position: close.position.toArray(), quaternion: close.quaternion.toArray(), vfov: close.vfov }, twin: body(twin, T), layout, place: body({ position: plan.place(kind, T), quaternion: new THREE.Quaternion(), vfov: 0 }, T).position, frames }
}
const hold = plan.seg.hold
const still: unknown[] = []
for (const f of [hold.firstFrame, Math.floor((hold.firstFrame + hold.endFrame) / 2), hold.endFrame - 1]) {
  const mid = (f + shutterMid()) / fps
  still.push({ frame: f, ...body(plan.hold(mid - hold.start), mid) })
}
result.hold = still
// the scene's Sun in the body frame (the globe turns under it): at the middle of the hold, at both handovers and at the
// middle of the surface view, by which the cast shadows of the country are baked (relight.py)
const terrain = plan.seg.terrain
const sunAt = (name: string, time: number): unknown => ({ name, time, body: plan.lightDir.clone().applyQuaternion(toBody(time)).toArray() })
result.sun = [sunAt('hold', (hold.start + hold.end) / 2), sunAt('dive', handoverOf('mars', 'dive')!.time), sunAt('surface', (terrain.start + terrain.end) / 2), sunAt('rise', handoverOf('mars', 'rise')!.time)]
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(result, null, 1))
console.log('wrote ' + out)
