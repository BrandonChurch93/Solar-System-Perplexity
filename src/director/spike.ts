import * as THREE from 'three'
import { config } from '../config'
import type { Director } from '../core/engine'
import type { Shot } from '../core/types'
import { defaultPost } from '../post/chain'
import { fractionIn, segmentAtFrame, setsForFrame } from './timeline'

export class SpikeDirector implements Director {
  shotAt(frame: number, time: number): Shot {
    const segment = segmentAtFrame(frame)
    const u = fractionIn(segment, time)
    const a = time * 0.05
    const fast = config.fastKinds.includes(segment.kind)
    const dist = fast ? 4.2 - 1.6 * Math.sin(u * Math.PI) : 4.2
    const position = new THREE.Vector3(Math.sin(a) * dist, 0.5, Math.cos(a) * dist)
    const m = new THREE.Matrix4().lookAt(position, new THREE.Vector3(0.6, 0, 0), new THREE.Vector3(0, 1, 0))
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(m)
    const ids = setsForFrame(frame)
    return {
      frame,
      time,
      segment,
      u,
      camera: { position, quaternion, vfov: 30 },
      skyQuaternion: quaternion.clone(),
      skyExposure: 1,
      near: 0.05,
      far: 5000,
      sun: { dir: new THREE.Vector3(0.8, 0.25, 0.55).normalize(), color: new THREE.Color(1, 0.97, 0.92), intensity: 3, angularRadius: 0.005, glare: 1 },
      sets: ids.map((id, i) => ({ id, origin: new THREE.Vector3(i * 6, 0, i * -40), rotation: new THREE.Quaternion(), time, segment, u, weight: 1 })),
      post: defaultPost(),
    }
  }
}
