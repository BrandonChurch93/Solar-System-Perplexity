import * as THREE from 'three'
import { config, type Segment } from '../../config'
import type { Shot } from '../../core/types'
import { shutterMid } from '../../core/sampler'
import { Flow, FLOW } from '../travel/flow'
import spec from './belt.json'

export interface BeltDirector { shotAt(frame: number, time: number): Shot }

export interface RockSpec { id: string; asset: string; frame: number; at: number[]; distance: number; radius: number; hold: number; smear: number; approach: number; tilt: number[]; axis: number[]; spin: number; mesh: number; gain: number; fill: number }

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
  private readonly segment = beltSegment()
  private readonly flow: Flow
  private readonly times: number[] = []
  private readonly base: THREE.Vector3[] = []
  private readonly from: THREE.Quaternion[] = []
  private readonly flow0: THREE.Vector3[] = []
  private readonly turn: THREE.Quaternion[] = []
  private readonly axis: THREE.Vector3[] = []
  private readonly spinQ = new THREE.Quaternion()
  private readonly pan = new THREE.Quaternion()
  private readonly unit = new THREE.Quaternion()
  private readonly a = new THREE.Vector3()
  private readonly b = new THREE.Vector3()
  private readonly c = new THREE.Vector3()

  constructor(director: BeltDirector) {
    this.flow = new Flow(director)
    this.time = (beltJudgedFrame() + shutterMid()) / config.fps
    const master = config.formats[config.formatKeys.master]!
    for (const r of this.rocks) {
      const time = (r.frame + shutterMid()) / config.fps
      const at = director.shotAt(r.frame, time)
      const q = at.camera.quaternion
      const t = Math.tan((at.camera.vfov * RAD) / 2)
      const dir = new THREE.Vector3((2 * r.at[0]! - 1) * t * (master.width / master.height), (1 - 2 * r.at[1]!) * t, -1).normalize()
      this.times.push(time)
      this.base.push(dir.multiplyScalar(r.distance).applyQuaternion(q))
      this.from.push(q.clone().invert())
      this.flow0.push(this.drift(time, new THREE.Vector3()))
      this.turn.push(q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(r.tilt[0]! * RAD, r.tilt[1]! * RAD, r.tilt[2]! * RAD))))
      this.axis.push(new THREE.Vector3().fromArray(r.axis).normalize())
    }
  }

  private drift(time: number, out: THREE.Vector3): THREE.Vector3 {
    const seg = this.segment
    const s = Math.min(Math.max((time * config.fps - seg.firstFrame) * FLOW.stepsPerFrame, 0), seg.frames * FLOW.stepsPerFrame)
    const k = Math.min(Math.floor(s), seg.frames * FLOW.stepsPerFrame - 1)
    this.flow.at(seg, seg.firstFrame, k, this.a)
    this.flow.at(seg, seg.firstFrame, k + 1, this.b)
    return out.copy(this.a).lerp(this.b, s - k)
  }

  pose(index: number, shot: Shot, out: RockPose): void {
    const r = this.rocks[index]!
    const dt = shot.time - this.times[index]!
    this.pan.copy(shot.camera.quaternion).multiply(this.from[index]!)
    this.pan.copy(this.unit.identity().slerp(this.pan, r.hold))
    out.position.copy(this.base[index]!).applyQuaternion(this.pan).multiplyScalar(Math.max(1 + (r.approach * dt) / r.distance, 0.05))
    out.position.sub(this.drift(shot.time, this.c)).add(this.flow0[index]!)
    this.spinQ.setFromAxisAngle(this.axis[index]!, r.spin * RAD * dt)
    out.quaternion.copy(this.turn[index]!).multiply(this.spinQ)
  }
}
