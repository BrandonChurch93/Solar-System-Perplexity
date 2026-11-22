import * as THREE from 'three'
import reliefJson from './relief.json'

export const closeRadius = reliefJson.camera.planetRadius
export const closeUp = new THREE.Vector3().fromArray(reliefJson.camera.up)

export const closeAhead = new THREE.Vector3(0, 0, -1).addScaledVector(closeUp, closeUp.z).normalize()
const side = new THREE.Vector3().crossVectors(closeAhead, closeUp)
export const closeLevel = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, closeUp, closeAhead.clone().negate())).invert()

const reachDown = (closeRadius + 1) * closeUp.y
export const closePivot = closeUp.clone().multiplyScalar(closeRadius + 1).add(new THREE.Vector3(0, -(reachDown - Math.sqrt(reachDown * reachDown - 2 * closeRadius - 1)), 0)).normalize()

export interface Anchor { origin: THREE.Vector3; frame: THREE.Quaternion }

export function anchor(normal: THREE.Vector3, heading: THREE.Vector3, shift: readonly [number, number]): Anchor {
  const h = 1 / closeRadius
  const right = new THREE.Vector3().crossVectors(heading, normal).normalize()
  const n = normal.clone().addScaledVector(heading, shift[0] * h).addScaledVector(right, shift[1] * h).normalize()
  const r = right.addScaledVector(n, -right.dot(n)).normalize()
  const back = new THREE.Vector3().crossVectors(r, n)
  const frame = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, n, back)).multiply(closeLevel)
  return { origin: n.multiplyScalar(1 + h), frame }
}

export const closeImage = {
  focal: reliefJson.imageSize.web[1] / 2 / Math.tan(THREE.MathUtils.degToRad(reliefJson.vfovDeg) / 2),
  center: [reliefJson.imageSize.web[0] / 2, reliefJson.imageSize.web[1] / 2] as [number, number],
  box: reliefJson.box.web as [number, number, number, number],
}
