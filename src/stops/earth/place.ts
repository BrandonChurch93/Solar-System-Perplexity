import * as THREE from 'three'
import type { Pose } from '../../core/types'
import type { StopPlan } from '../../director/moves'
import fit from './fit.json'
import place from './place.json'

const nadir = new THREE.Vector3().fromArray(place.nadir).normalize()
const up = nadir.clone().negate()
const ahead = new THREE.Vector3(0, 0, -1).addScaledVector(up, up.z).normalize()
const right = new THREE.Vector3().crossVectors(ahead, up)

export const radius = place.radius
export const centre = nadir.clone().multiplyScalar(place.radius + 1)
export const fromLocal = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, ahead.clone().negate())).invert()

function onBody(): THREE.Quaternion {
  const lon = THREE.MathUtils.degToRad(place.globe.lon)
  const lat = THREE.MathUtils.degToRad(place.globe.lat)
  const az = THREE.MathUtils.degToRad(place.globe.azimuthDeg)
  const normal = new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon))
  const east = new THREE.Vector3(0, 1, 0).cross(normal).normalize()
  const north = new THREE.Vector3().crossVectors(normal, east)
  const heading = north.multiplyScalar(Math.cos(az)).addScaledVector(east, Math.sin(az))
  const frame = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(heading, normal), normal, heading.clone().negate())
  return new THREE.Quaternion().fromArray(fit.globe.quaternion).multiply(new THREE.Quaternion().setFromRotationMatrix(frame))
}

export const placeFrame = onBody()

export function carry(plan: StopPlan, time: number): THREE.Quaternion {
  return plan.turn(time).multiply(placeFrame).multiply(fromLocal)
}

export function twin(plan: StopPlan, local: Pose, time: number): Pose {
  const q = carry(plan, time)
  return { position: local.position.clone().sub(centre).divideScalar(radius).applyQuaternion(q), quaternion: q.clone().multiply(local.quaternion), vfov: local.vfov }
}

export function side(): 'orbit' | 'terrain' | null {
  const at = (globalThis as { location?: { search?: string } }).location
  const v = at?.search ? new URLSearchParams(at.search).get('earthSide') : null
  return v === 'orbit' || v === 'terrain' ? v : null
}
