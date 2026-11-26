// lens_by_frame.ts OUT.json F0 F1 [OFFSET]: run from the repo's root with npx tsx. The lens of each film frame from the engine's own shots, in the frame of the rings (y is the
// ring's normal, the planet's centre at 0, equatorial radius 1): eye, turn, field of view, the set's view and weight
import * as THREE from 'three'
import { writeFileSync } from 'node:fs'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { plan } from '../../../src/stops/saturn/plan'
import fit from '../../../src/stops/saturn/fit.json'
const director = new FilmDirector(plans)
const tilt = new THREE.Quaternion().fromArray((fit as any).globe.quaternion)
const toTilt = tilt.clone().invert()
const P = plan as any
const hero = P.hold(P.holdMid - P.seg.hold.start)
const out: any = { polar: (fit as any).globe.scale[1], hero: { eye: hero.position.clone().applyQuaternion(toTilt).toArray(), q: toTilt.clone().multiply(hero.quaternion).toArray(), vfov: hero.vfov }, sunL: P.lightDir.clone().applyQuaternion(toTilt).normalize().toArray(), seg: { hold: [P.seg.hold.start, P.seg.hold.end], dive: [P.seg.dive.start, P.seg.dive.end], terrain: [P.seg.terrain.start, P.seg.terrain.end], rise: [P.seg.rise.start, P.seg.rise.end] }, frames: {} }
const f0 = Number(process.argv[3]), f1 = Number(process.argv[4])
const off = Number(process.argv[5] ?? 0.25)
for (let f = f0; f <= f1; f++) {
  const time = (f + off) / config.fps
  const shot: any = director.shotAt(f, time)
  const s = shot.sets.find((x: any) => x.id === 'saturn')
  if (!s) { out.frames[f] = { none: shot.sets.map((x: any) => x.id).join(','), kind: shot.segment.kind, stop: shot.segment.stop ?? '' }; continue }
  const inv = (s.rotation as THREE.Quaternion).clone().invert()
  let pos = (shot.camera.position as THREE.Vector3).clone().sub(s.origin).applyQuaternion(inv)
  let q = inv.clone().multiply(shot.camera.quaternion)
  if (s.view !== 'orbit') {
    pos = pos.applyQuaternion(P.terrainFrame).add(P.spot)
    q = (P.terrainFrame as THREE.Quaternion).clone().multiply(q)
  }
  // the sets turn the whole body about the lens by plan.seat(time) (model.ts and kept/set.ts): the picture is that of a lens turned back by it
  q = q.multiply((P.seat(time) as THREE.Quaternion).clone().invert())
  const fl = (time >= P.seg.hold.start) ? P.flight(time) : null
  out.frames[f] = { kind: shot.segment.kind, stop: shot.segment.stop ?? '', u: shot.u, view: s.view, weight: s.weight, eye: pos.clone().applyQuaternion(toTilt).toArray(), q: toTilt.clone().multiply(q).toArray(), vfov: shot.camera.vfov, spin: P.spin(time), gap: fl ? fl.position.distanceTo(pos) : -1, fvfov: fl ? fl.vfov : -1 }
}
writeFileSync(process.argv[2]!, JSON.stringify(out))
console.log('frames', Object.keys(out.frames).length)
