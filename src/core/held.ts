import * as THREE from 'three'
import type { SetState, Shot } from './types'

const ONE = new THREE.Vector3(1, 1, 1)
const step = new THREE.Matrix4()
const offset = new THREE.Vector3()

export function midShutterCarry(out: THREE.Matrix4, shot: Shot, state: SetState, mid: Shot, at: SetState): THREE.Matrix4 {
  const zoom = Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2) / Math.tan(THREE.MathUtils.degToRad(mid.camera.vfov) / 2)
  out.compose(offset.copy(at.origin).sub(mid.camera.position), at.rotation, ONE)
  out.multiply(step.compose(offset.copy(state.origin).sub(shot.camera.position), state.rotation, ONE).invert())
  out.premultiply(step.makeRotationFromQuaternion(mid.camera.quaternion).invert())
  out.premultiply(step.makeScale(zoom, zoom, 1))
  return out.premultiply(step.makeRotationFromQuaternion(shot.camera.quaternion))
}
