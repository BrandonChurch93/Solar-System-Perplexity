import * as THREE from 'three'
import { config, type Segment } from '../../config'
import type { Shot } from '../../core/types'

export interface FlowDirector { shotAt(frame: number, time: number): Shot }

export const FLOW = { stepsPerFrame: 4, speed: 0.9, knee: 0.6, full: 20000, kinds: ['travel', 'retreat'] }

export function flowSpeed(real: number): number {
  return FLOW.speed * Math.min(Math.log(1 + real / FLOW.knee) / Math.log(1 + FLOW.full / FLOW.knee), 1.25)
}

export class Flow {
  private readonly tables = new Map<string, Float64Array>()

  constructor(private readonly director: FlowDirector) {}

  private table(seg: Segment): Float64Array {
    const done = this.tables.get(seg.id)
    if (done) return done
    const n = seg.frames * FLOW.stepsPerFrame
    const h = 1 / (config.fps * FLOW.stepsPerFrame)
    const out = new Float64Array((n + 1) * 3)
    const at = (k: number): THREE.Vector3 => {
      const frame = Math.min(seg.firstFrame + Math.floor(k / FLOW.stepsPerFrame), seg.endFrame - 1)
      return this.director.shotAt(frame, seg.firstFrame / config.fps + k * h).camera.position
    }
    let last = at(0)
    const sum = new THREE.Vector3()
    const v = new THREE.Vector3()
    for (let k = 0; k < n; k++) {
      const next = at(k + 1)
      v.copy(next).sub(last)
      const real = v.length() / h
      if (real > 1e-9) sum.addScaledVector(v, (flowSpeed(real) * h) / v.length())
      out[(k + 1) * 3] = sum.x
      out[(k + 1) * 3 + 1] = sum.y
      out[(k + 1) * 3 + 2] = sum.z
      last = next
    }
    this.tables.set(seg.id, out)
    return out
  }

  at(seg: Segment, frame: number, step: number, out: THREE.Vector3): THREE.Vector3 {
    if (!FLOW.kinds.includes(seg.kind)) return out.set(0, 0, 0)
    const t = this.table(seg)
    const k = Math.min(Math.max((frame - seg.firstFrame) * FLOW.stepsPerFrame + step, 0), seg.frames * FLOW.stepsPerFrame)
    return out.set(t[k * 3]!, t[k * 3 + 1]!, t[k * 3 + 2]!)
  }
}
