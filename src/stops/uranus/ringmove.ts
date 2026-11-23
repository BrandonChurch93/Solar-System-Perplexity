import * as THREE from 'three'

export interface ArchPose { position: THREE.Vector3; quaternion: THREE.Quaternion; scale: number; normal: THREE.Vector3 }

export interface RingMove { centre: THREE.Vector3; turn: THREE.Quaternion; size: number; archTurn: THREE.Quaternion; archSize: number }

const from = new THREE.Vector3()
const side = new THREE.Vector3()
const full = new THREE.Quaternion()

export function newRingMove(): RingMove {
  return { centre: new THREE.Vector3(), turn: new THREE.Quaternion(), size: 1, archTurn: new THREE.Quaternion(), archSize: 1 }
}

export function ringMove(out: RingMove, open: number, arch: ArchPose, ringNormal: THREE.Vector3, ratio: number, eye: THREE.Vector3): RingMove {
  const m = 1 - open
  from.copy(arch.normal).applyQuaternion(arch.quaternion)
  if ((side.copy(eye).sub(arch.position).dot(from) < 0) !== (eye.dot(ringNormal) < 0)) from.negate()
  full.setFromUnitVectors(ringNormal, from)
  out.centre.copy(arch.position).multiplyScalar(m)
  out.turn.identity().slerp(full, m)
  out.size = Math.pow(ratio, -m)
  out.archTurn.copy(out.turn).multiply(full.invert()).multiply(arch.quaternion)
  out.archSize = arch.scale * ratio * out.size
  return out
}
