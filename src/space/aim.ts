import * as THREE from 'three'

const pole = new THREE.Vector3(-0.44023326, -0.81460296, -0.37764626).normalize()
const center = new THREE.Vector3(-0.41465582, -0.25249158, 0.87424742)

export function aimAt(alongDeg: number, tiltDeg: number, liftDeg: number): THREE.Quaternion {
  const along = THREE.MathUtils.degToRad(alongDeg)
  const tilt = THREE.MathUtils.degToRad(tiltDeg)
  const lift = THREE.MathUtils.degToRad(liftDeg)
  const t1 = center.clone().addScaledVector(pole, -center.dot(pole)).normalize()
  const t2 = new THREE.Vector3().crossVectors(pole, t1)
  const onBand = t1.clone().multiplyScalar(Math.cos(along)).addScaledVector(t2, Math.sin(along))
  const tangent = t1.clone().multiplyScalar(-Math.sin(along)).addScaledVector(t2, Math.cos(along))
  const aim = onBand.clone().multiplyScalar(Math.cos(lift)).addScaledVector(pole, Math.sin(lift)).normalize()
  const upFlat = new THREE.Vector3().crossVectors(tangent, aim).negate().normalize()
  const right = tangent.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(upFlat, Math.sin(tilt)).normalize()
  const up = new THREE.Vector3().crossVectors(aim.clone().negate(), right).normalize()
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, aim.clone().negate()))
}

export function aimOf(q: THREE.Quaternion): [number, number, number] {
  const t1 = center.clone().addScaledVector(pole, -center.dot(pole)).normalize()
  const t2 = new THREE.Vector3().crossVectors(pole, t1)
  const aim = new THREE.Vector3(0, 0, -1).applyQuaternion(q)
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(q)
  const along = Math.atan2(aim.dot(t2), aim.dot(t1))
  const lift = Math.asin(Math.max(-1, Math.min(1, aim.dot(pole))))
  const tangent = t1.clone().multiplyScalar(-Math.sin(along)).addScaledVector(t2, Math.cos(along))
  const upFlat = new THREE.Vector3().crossVectors(tangent, aim).negate().normalize()
  const tilt = Math.atan2(right.dot(upFlat), right.dot(tangent))
  return [THREE.MathUtils.radToDeg(along), THREE.MathUtils.radToDeg(tilt), THREE.MathUtils.radToDeg(lift)]
}

export interface SkyAims {
  frame: THREE.Quaternion
  turns: Record<string, THREE.Quaternion>
  orbits: Record<string, THREE.Quaternion>
  patches: Record<string, { orbit: THREE.Quaternion; terrain: THREE.Quaternion }>
  fitted: { frame: number; terrainFrame: number }
  anchor: string
}
