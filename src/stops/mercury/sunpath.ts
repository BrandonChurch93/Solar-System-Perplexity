import * as THREE from 'three'

const g = new THREE.Vector3()
const a = new THREE.Vector3()
const b = new THREE.Vector3()

export function clearance(dir: THREE.Vector3, centre: THREE.Vector3, radii: number): number {
  return dir.angleTo(centre) - Math.asin(Math.min(1 / Math.max(radii, 1), 1))
}

export function ride(low: THREE.Vector3, sun: THREE.Vector3, centre: THREE.Vector3, radii: number, w: number, held: number, floor: number, out: THREE.Vector3): THREE.Vector3 {
  g.copy(centre).normalize()
  const disc = Math.asin(Math.min(1 / Math.max(radii, 1), 1))
  a.copy(low).addScaledVector(g, -low.dot(g)).normalize()
  b.copy(sun).addScaledVector(g, -sun.dot(g)).normalize()
  const turn = a.angleTo(b)
  const axis = b.clone().cross(a).normalize()
  if (turn > 1e-6) a.applyAxisAngle(axis, -turn * w)
  const sep = disc + held + (Math.max(sun.angleTo(g) - disc, floor) - held) * w
  return out.copy(g).multiplyScalar(Math.cos(sep)).addScaledVector(a, Math.sin(sep))
}
