import * as THREE from 'three'
import { config, type Segment } from '../../config'
import type { Shot } from '../../core/types'
import { shutterMid } from '../../core/sampler'
import spec from './belt.json'

export interface BeltDirector { shotAt(frame: number, time: number): Shot }

export interface RockSpec { id: string; asset: string; at: number[]; distance: number; radius: number; hold: number; drift: number[]; tilt: number[]; axis: number[]; spin: number; mesh: number }

export interface RockPose { position: THREE.Vector3; quaternion: THREE.Quaternion }

export const beltSpec = spec

export function beltSegment(): Segment {
  const s = config.segments.find((x) => x.id === spec.segment)
  if (!s) throw new Error('belt segment missing: ' + spec.segment)
  return s
}

export function beltJudgedFrame(): number {
  const s = beltSegment()
  const fr = (config.raw.judged.fractions as Record<string, number>)[s.kind] ?? 0.5
  return s.firstFrame + Math.floor(fr * s.frames + 1e-9)
}

const RAD = Math.PI / 180

export class BeltMotion {
  readonly rocks: RockSpec[] = spec.rocks
  readonly time: number
  private readonly base: THREE.Vector3[] = []
  private readonly velocity: THREE.Vector3[] = []
  private readonly turn: THREE.Quaternion[] = []
  private readonly axis: THREE.Vector3[] = []
  private readonly flow0 = new THREE.Vector3()
  private readonly spinQ = new THREE.Quaternion()

  constructor(director: BeltDirector) {
    const frame = beltJudgedFrame()
    this.time = (frame + shutterMid()) / config.fps
    const h = 0.25 / config.fps
    const at = director.shotAt(frame, this.time)
    const before = director.shotAt(frame, this.time - h)
    const after = director.shotAt(frame, this.time + h)
    const q = at.camera.quaternion
    this.flow0.copy(at.dustOffset)
    const flowRate = after.dustOffset.clone().sub(before.dustOffset).multiplyScalar(spec.flow / (2 * h))
    const master = config.formats[config.formatKeys.master]!
    const t = Math.tan((at.camera.vfov * RAD) / 2)
    const qa = after.camera.quaternion.clone().invert()
    const qb = before.camera.quaternion.clone().invert()
    for (const r of this.rocks) {
      const dir = new THREE.Vector3((2 * r.at[0]! - 1) * t * (master.width / master.height), (1 - 2 * r.at[1]!) * t, -1).normalize()
      const local = dir.multiplyScalar(r.distance)
      const p = local.clone().applyQuaternion(q)
      const carried = p.clone().applyQuaternion(qb).applyQuaternion(after.camera.quaternion).sub(p.clone().applyQuaternion(qa).applyQuaternion(before.camera.quaternion)).multiplyScalar(1 / (2 * h))
      const v = carried.multiplyScalar(0.5).add(flowRate).multiplyScalar(r.hold)
      v.add(new THREE.Vector3().fromArray(r.drift).applyQuaternion(q))
      this.base.push(p)
      this.velocity.push(v)
      this.turn.push(q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(r.tilt[0]! * RAD, r.tilt[1]! * RAD, r.tilt[2]! * RAD))))
      this.axis.push(new THREE.Vector3().fromArray(r.axis).normalize())
    }
  }

  pose(index: number, shot: Shot, out: RockPose): void {
    const r = this.rocks[index]!
    const dt = shot.time - this.time
    out.position.copy(this.base[index]!).addScaledVector(this.velocity[index]!, dt)
    out.position.x += (this.flow0.x - shot.dustOffset.x) * spec.flow
    out.position.y += (this.flow0.y - shot.dustOffset.y) * spec.flow
    out.position.z += (this.flow0.z - shot.dustOffset.z) * spec.flow
    this.spinQ.setFromAxisAngle(this.axis[index]!, r.spin * RAD * dt)
    out.quaternion.copy(this.turn[index]!).multiply(this.spinQ)
  }
}
