import * as THREE from 'three'
import close from '../close.json'
import { plan as live } from '../plan'
import pose from './pose.json'

// The kept set draws the approach, the hold and the first part of the dive (see ../set.ts). It flies with the
// one plan of this stop; no second plan is made. Only the close pose of the kept build is worked out here, as
// the kept plan did, because the kept set measures its weights against that pose.
const n = live.ringNormal.clone()
const sun = live.lightDir.clone()
const level = sun.clone().addScaledVector(n, -sun.dot(n)).normalize()
const out = new THREE.Vector3().crossVectors(n, level).normalize().applyAxisAngle(n, THREE.MathUtils.degToRad(pose.azimuthDeg))
const tilt = THREE.MathUtils.degToRad(close.tiltDeg)
const roll = THREE.MathUtils.degToRad(close.rollDeg)
const nc = new THREE.Vector3(-Math.sin(roll) * Math.cos(tilt), Math.cos(roll) * Math.cos(tilt), Math.sin(tilt))
const c = new THREE.Vector3().fromArray(close.centre)
const height = -c.dot(nc)
const hc = c.clone().negate().addScaledVector(nc, -height)
const reach = hc.length()
hc.normalize()
const cam = new THREE.Matrix4().makeBasis(nc, hc, new THREE.Vector3().crossVectors(nc, hc))
const world = new THREE.Matrix4().makeBasis(n, out, new THREE.Vector3().crossVectors(n, out))
const skimQuaternion = new THREE.Quaternion().setFromRotationMatrix(world.multiply(cam.transpose()))
const skimPosition = out.clone().multiplyScalar(reach * pose.distanceScale).addScaledVector(n, height * pose.heightScale)
const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(skimQuaternion)
const skimForward = fwd.addScaledVector(n, -fwd.dot(n)).normalize()

export const plan = {
  id: live.id,
  fit: live.fit,
  p: { ...live.p, terrain: { ...live.p.terrain, vfov: close.vfov } },
  seg: live.seg,
  holdMid: live.holdMid,
  lightDir: live.lightDir,
  axis: live.axis,
  terrainFrame: live.terrainFrame,
  spot: live.spot,
  ringNormal: n,
  skimPosition,
  skimQuaternion,
  skimForward,
  hold: (tRel: number) => live.hold(tRel),
  spin: (time: number) => live.spin(time),
  seat: (time: number) => live.seat(time),
}
