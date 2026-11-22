import * as THREE from 'three'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/saturn/plan'
import { shotMatrix } from '../../../src/stops/saturn/shot'

const frames = process.argv.slice(2).map(Number)
const tilt = new THREE.Quaternion().fromArray(plan.fit.globe.quaternion)
const toTilt = tilt.clone().invert()
const heroPose = plan.hold(plan.holdMid - plan.seg.hold.start)
const heroL = heroPose.position.clone().applyQuaternion(toTilt)
const heroM = shotMatrix(heroL, toTilt.clone().multiply(heroPose.quaternion), heroPose.vfov, 16 / 9)
const d = new FilmDirector(plans) as any
const px = (m: THREE.Matrix4, p: THREE.Vector3): [number, number] => {
  const v = new THREE.Vector4(p.x, p.y, p.z, 1).applyMatrix4(m)
  return [(v.x / v.w * 0.5 + 0.5) * 1920, (1 - (v.y / v.w * 0.5 + 0.5)) * 1080]
}
const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(2.27, 0, 0), new THREE.Vector3(-2.27, 0, 0), new THREE.Vector3(0, 0, 2.27), new THREE.Vector3(0, 0, -2.27)]
console.log('holdMid frame', plan.holdMid * config.fps, 'hold start', plan.seg.hold.start * config.fps)
for (const f of frames.length ? frames : [3465]) {
  const s = d.shotAt(f, f / config.fps)
  const set = s.sets.find((x: any) => x.id === 'saturn')
  const wq = set.rotation.clone()
  const wp = new THREE.Vector3(set.origin.x, set.origin.y, set.origin.z)
  const toRing = wq.clone().multiply(tilt).invert()
  const camL = s.camera.position.clone().sub(wp).applyQuaternion(toRing)
  const camQ = toRing.clone().multiply(s.camera.quaternion)
  const m = shotMatrix(camL, camQ, s.camera.vfov, 16 / 9)
  console.log(f, 'vfov', s.camera.vfov, 'camL', camL.toArray().map((v: number) => v.toFixed(5)).join(' '), 'hero', heroL.toArray().map((v) => v.toFixed(5)).join(' '))
  for (const p of points) {
    const a = px(m, p)
    const b = px(heroM, p)
    console.log('  point', p.toArray().join(','), 'film', a[0].toFixed(2), a[1].toFixed(2), 'hero', b[0].toFixed(2), b[1].toFixed(2), 'diff', (a[0] - b[0]).toFixed(2), (a[1] - b[1]).toFixed(2))
  }
}
