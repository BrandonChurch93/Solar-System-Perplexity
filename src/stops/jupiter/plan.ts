import * as THREE from 'three'
import { config, type Segment } from '../../config'
import type { Pose } from '../../core/types'
import { StopPlan, type Fit, type MoveParams, type OrbitShot } from '../../director/moves'
import { lookAt, mix, ramp, smooth, smoother } from '../../director/rig'
import { coverWindow } from '../../director/timeline'
import fit from './fit.json'

export const climbOut = { lead: 1.4, tail: 0.5, level: -4, fast: [0.24, 0.2, 3] as [number, number, number], settle: 2.9, turn: 0.75, lens: 2 }
export const glide = { bankDeg: 7, lead: 0.8, arc: 1.0, swingDeg: 20 }
export const plunge = { power: 8, lead: 0.48 }
export const veil = { hides: 0, closed: 0.98, lift: 2, sky: 0.75 }

export const params: MoveParams = {
  hold: { orbitDeg: 3, axis: [0.25, 1, 0], push: -0.03 },
  spot: { x: 0.405, y: 0.605 },
  dive: { headingDeg: 80, altitude: 0.045, back: 0.08, ahead: 0.15, bow: 0.24, rollDeg: 4, swoop: true, surge: { glide: 0.1, rise: 8, fall: 0.8 } },
  terrain: { vfov: 64, horizonDeg: 17.72, dipDeg: 4.44, rollDeg: 17.09, gather: -0.1, forward: 1.0, rise: 0.22, side: -1.0, yawDeg: -5, pitchDeg: -5, entryHeight: 0.5, entryBack: 0.1, entryPitchDeg: 6, exitHeight: 2.5, exitForward: -0.15, exitPitchDeg: 9 },
  rise: { azimuthDeg: 44, elevationDeg: -12, distance: 5.6, offset: [0.34, 0.1], driftSpeed: 0.08, rollDeg: -6, ahead: 0.03, hug: 1.7, settle: 2, tilt: 0.5 },
  travel: { turnDeg: 74, side: 1 },
  arrive: { swingDeg: 46, axis: [0.2, 1, 0], power: 2.9, offset: [0.7, -0.15] },
  skyAim: { terrain: [0, -21.8, 31] },
  light: { exposure: 1, skyExposure: 0.5, terrainSkyGlow: 0.35, skyLow: [0.045, 1.0, 0], sunRadiusDeg: 0.5, sunGlare: 0.75, flare: 0.18 },
  cover: [0.42, 0.34, 0.26],
  coverLow: [0.3, 0.235, 0.17],
  coverTerrain: [0.21, 0.177, 0.14],
  coverLowTerrain: [0.205, 0.173, 0.138],
  coverTop: [0, 0],
  coverEdge: [0.5, 0.5],
  coverEdgeRise: [0.5, 0.5],
  coverShell: [1.0, 1.015],
  coverSea: { centre: [-90.618901, -294.74045, -125.576803], radius: 331.946319, edge: [0.955, 0.972] },
  coverRush: { speed: 2.4, reach: 2.5, billow: [2.2, 0.9, 1], streak: [9, 2.2, 1.6], contrast: [1.4, 0.8] },
  spinDegPerSecond: 1.6,
  moonDegPerSecond: 2.6,
  tint: [0.9, 0.75, 0.55],
}

const Z = new THREE.Vector3(0, 0, 1)
const Y = new THREE.Vector3(0, 1, 0)

export class JupiterPlan extends StopPlan {
  override coverAmount(seg: Segment, time: number): number {
    const c = this.coverCenter(seg)
    const amount = super.coverAmount(seg, time) * (seg.kind === 'rise' ? 1 - smooth(ramp(c, c + veil.lift / config.fps, time)) : 1)
    this.p.coverHides = amount < veil.closed ? veil.hides : undefined
    return amount
  }

  override skyUnderCover(amount: number, time: number): number {
    if (time >= this.coverCenter(this.seg.rise)) return 1
    return Math.pow(1 - amount, time >= this.coverCenter(this.seg.dive!) ? veil.sky : 2)
  }

  override skyGain(time: number): number {
    const seg = this.seg.rise
    const low = this.p.light.skyLow
    if (!low || time < this.coverCenter(seg) || time >= seg.end) return 1
    const now = mix(low[2], 1, smooth(ramp(low[0], low[1], Math.abs(this.rise(time).pose.position.length() - 1))))
    const want = Math.max(now, Math.pow(1 - super.coverAmount(seg, time), veil.sky))
    return now > 0 ? want / now : 1
  }

  override turn(time: number): THREE.Quaternion {
    const low = time >= this.coverCenter(this.seg.dive!) && time < this.coverCenter(this.seg.rise)
    return super.turn(low ? (this.seg.terrain.start + this.seg.terrain.end) / 2 : time)
  }

  private lean(time: number): number {
    return glide.bankDeg * super.terrain(time - this.seg.terrain.start).position.z / -this.p.terrain.forward
  }

  private bank(time: number): number {
    const c = this.coverCenter(this.seg.rise)
    const k = climbOut
    return (k.level - (this.p.terrain.rollDeg ?? 0) - this.lean(c)) * smooth(ramp(c - k.lead, c + k.tail, time))
  }

  override terrain(tRel: number): Pose {
    const pose = super.terrain(tRel)
    const u = pose.position.z / -this.p.terrain.forward
    pose.position.x += glide.arc * u * u
    const t = this.p.terrain
    const tilt = THREE.MathUtils.degToRad((t.horizonDeg ?? 0) + (t.dipDeg ?? 0))
    const axis = new THREE.Vector3(0, Math.cos(tilt), Math.sin(tilt)).applyAxisAngle(Z, -THREE.MathUtils.degToRad(t.rollDeg ?? 0))
    pose.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(glide.swingDeg) * Math.max(u, 0) ** 2))
    const time = tRel + this.seg.terrain.start
    pose.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(Z, THREE.MathUtils.degToRad(this.lean(time) + this.bank(time))))
    return pose
  }

  private sized(time: number): number {
    const pose = super.dive(time).pose
    return -0.5 * Math.log(pose.position.lengthSq() - 1) - Math.log(Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2))
  }

  private paced(time: number): number {
    const seg = this.seg.dive!
    const c = this.coverCenter(seg) - 1e-6
    const h = 0.25 / config.fps
    const s0 = this.sized(seg.start)
    const s1 = this.sized(c)
    const u = ramp(seg.start, c, time)
    const m0 = ((this.sized(seg.start + h) - s0) / h) * (c - seg.start) / (s1 - s0)
    const want = s0 + (s1 - s0) * (m0 * u + plunge.lead * u * u + (1 - m0 - plunge.lead) * Math.pow(u, plunge.power))
    let lo = seg.start
    let hi = c
    for (let i = 0; i < 40; i++) {
      const mid = 0.5 * (lo + hi)
      if (this.sized(mid) < want) lo = mid
      else hi = mid
    }
    return 0.5 * (lo + hi)
  }

  override dive(time: number): OrbitShot {
    const c = this.coverCenter(this.seg.dive!)
    if (time >= c) return super.dive(time)
    const shot = super.dive(time > this.seg.dive!.start ? this.paced(time) : time)
    const lean = THREE.MathUtils.degToRad(this.lean(c))
    const entry = this.terrain(c - this.seg.terrain.start).quaternion.invert().multiply(super.dive(c).pose.quaternion)
    const roll = new THREE.Quaternion().setFromAxisAngle(Z, lean * smooth(ramp(c - glide.lead, c, time)))
    shot.pose.quaternion.multiply(entry.clone().invert()).multiply(roll).multiply(entry)
    return shot
  }

  override rise(time: number): OrbitShot {
    const seg = this.seg.rise
    const c = this.coverCenter(seg)
    if (time < c) return super.rise(time)
    const k = climbOut
    const t = this.p.terrain
    const r = this.p.rise
    const x = ramp(c, seg.end, time)
    const end = this.after(time)
    const tq = this.turn(time)
    const spot = this.spot.clone().applyQuaternion(tq)
    const normal = this.normal.clone().applyQuaternion(tq)
    const heading = this.heading.clone().applyQuaternion(tq)
    const low = r.from ?? this.p.dive.altitude
    const from = spot.clone().addScaledVector(normal, low).addScaledVector(heading, r.ahead ?? this.p.dive.ahead)
    const span = end.position.clone().sub(from)
    const up1 = span.dot(normal)
    const across = span.clone().addScaledVector(normal, -up1)
    const size = (d: number, vfov: number): number => -0.5 * Math.log(d * d - 1) - Math.log(Math.tan(THREE.MathUtils.degToRad(vfov) / 2))
    const [share, reach, power] = k.fast
    const left = (1 - share) * Math.pow(1 - x, k.settle) + share * Math.pow(1 - ramp(0, reach, x), power)
    const vfov = mix(t.vfov, end.vfov, smooth(1 - Math.pow(1 - x, k.lens)))
    const sized = mix(size(end.position.length(), end.vfov), size(from.length(), t.vfov), left)
    const far = Math.sqrt(1 + Math.exp(-2 * (sized + Math.log(Math.tan(THREE.MathUtils.degToRad(vfov) / 2)))))
    const at = (m: number): THREE.Vector3 => from.clone().addScaledVector(normal, up1 * m).addScaledVector(across, Math.pow(m, r.hug ?? 1))
    let lo = 0
    let hi = 1
    for (let i = 0; i < 48; i++) {
      const mid = 0.5 * (lo + hi)
      if (at(mid).length() < far) lo = mid
      else hi = mid
    }
    const position = at(0.5 * (lo + hi))
    const w = coverWindow(seg)!
    const carried = (t.horizonDeg ?? 0) - t.exitPitchDeg * Math.pow(ramp(0, w.lastFrame + 1 - seg.firstFrame, w.centerFrame - seg.firstFrame), 2.2) - (t.exitDipDeg ?? 0)
    const out = position.clone().normalize()
    const top = Y.clone().applyQuaternion(end.quaternion)
    const level = top.clone().addScaledVector(out, -top.dot(out)).normalize()
    const pitch = Math.acos(Math.min(1 / position.length(), 1)) + THREE.MathUtils.degToRad(carried)
    const aim = level.clone().multiplyScalar(Math.cos(pitch)).addScaledVector(out, -Math.sin(pitch))
    const low0 = lookAt(position, position.clone().add(aim), out.clone().add(level).normalize(), (t.rollDeg ?? 0) + this.lean(c) + this.bank(time))
    const target = end.position.clone().addScaledVector(new THREE.Vector3(0, 0, -1).applyQuaternion(end.quaternion), end.position.length())
    const high = lookAt(position, target, top)
    return { pose: { position, quaternion: low0.slerp(high, smoother(ramp(0, k.turn, x))), vfov }, view: 'orbit' }
  }
}

export const plan: StopPlan = new JupiterPlan('jupiter', fit as Fit, params)
