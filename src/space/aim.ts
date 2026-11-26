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
  dives: Record<string, { turn: THREE.Quaternion; aim: THREE.Quaternion; from: number; to: number }>
  orbits: Record<string, THREE.Quaternion>
  patches: Record<string, { orbit: THREE.Quaternion; terrain: THREE.Quaternion }>
  fitted: { frame: number; terrainFrame: number }
  anchor: string
  follows: Record<string, string>
  open: Record<string, boolean>
}

export const STAR_LEVEL = 0.01

export function starShare(plate: { aim: THREE.Quaternion; tan: [number, number]; add: boolean; ring: [number, number, number, number]; edge: number; unfold?: [number, number] }, weight: number, shot: { skyQuaternion: THREE.Quaternion; skyTurn: THREE.Quaternion; camera: { vfov: number } }, frame: THREE.Quaternion, aspect: number): number {
  if (plate.add || !(plate.ring[2] < plate.ring[3] && plate.ring[3] <= 0)) return 1
  const q = plate.aim.clone().invert().multiply(frame).multiply(shot.skyTurn.clone().invert()).multiply(shot.skyQuaternion)
  const th = Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2)
  const v = new THREE.Vector3()
  let least = Infinity
  for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    v.set(x * th * aspect, y * th, -1).applyQuaternion(q)
    if (!(v.z < 0)) return 1
    const u = (v.x / -v.z / plate.tan[0]) * 0.5 + 0.5
    const w = (v.y / -v.z / plate.tan[1]) * 0.5 + 0.5
    least = Math.min(least, u, 1 - u, w, 1 - w)
  }
  const from = plate.edge * (plate.unfold?.[1] ?? 0)
  const k = plate.edge > from ? Math.min(Math.max((least - from) / (plate.edge - from), 0), 1) : least >= plate.edge ? 1 : 0
  return 1 - Math.min(Math.max(weight, 0), 1) * k * k * (3 - 2 * k)
}
