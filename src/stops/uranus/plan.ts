import * as THREE from 'three'
import { config, type Segment } from '../../config'
import type { CoverHorizon, Pose } from '../../core/types'
import { StopPlan, type Fit, type MoveParams, type OrbitShot } from '../../director/moves'
import { blendPose, forward, lookAt, mix, ramp, slerpDir, smooth } from '../../director/rig'
import { coverWindow } from '../../director/timeline'
import deck from './deck.json'
import fit from './fit.json'
import { shape, show } from './look'

export const params: MoveParams = {
  hold: { orbitDeg: 6, axis: [0.2, 1, 0], push: -0.03 },
  spot: { x: 0.5574, y: 0.6721 },
  dive: { headingDeg: 53.784, altitude: 0.02623, back: 0.07, ahead: 0.14, bow: 0.2, rollDeg: 7, swoop: true },
  terrain: { vfov: 60, forward: 3.2, rise: 0.7107, side: 0.15, yawDeg: 1.5, pitchDeg: -0.5, entryHeight: 1.14, entryBack: 1.26, entryPitchDeg: 6, exitHeight: 2.4, exitForward: 1.3, exitPitchDeg: 10, horizonDeg: 2.874, dipDeg: 9.9055, rollDeg: 14.03 },
  rise: { azimuthDeg: 65, elevationDeg: 0, distance: 6.8, offset: [0.345, -0.12], driftSpeed: 0.08, rollDeg: -5, ahead: 0.03, hug: 1.7, settle: 5, level: true, pan: 0.3 },
  travel: { turnDeg: 66, side: 1 },
  arrive: { swingDeg: 0, axis: [0, 1, 0], offset: [-0.5, 0.3] },
  light: { exposure: 1, skyExposure: 0.6, sunRadiusDeg: 0.2, sunGlare: 0.65, flare: 0 },
  cover: [0.2, 0.5, 0.58],
  coverLow: [0.035, 0.15, 0.2],
  coverTerrain: [0.2, 0.58, 0.7],
  coverLowTerrain: [0.02, 0.09, 0.13],
  coverTop: [0.12, 0.06],
  coverEdge: [0.2, 0.45],
  coverEdgeRise: [0.4, 0.45],
  coverShell: [1.04, 1.14],
  coverHides: 0.3,
  coverRush: { speed: 14, reach: 2.5, billow: [3, 3, 1], streak: [10, 6, 1.6], contrast: [0.75, 0.5] },
  spinDegPerSecond: -1,
  moonDegPerSecond: 0.6,
  tint: [0.6, 0.9, 0.95],
  skyAim: { orbit: [145.41987, -22.38676, 20.05787], terrain: [22.60603, 20.42393, -46.69144] },
}

export const move = {
  diveJoin: 2,
  diveEase: [30, 42] as [number, number],
  diveLook: [2, 16, 32, 47] as [number, number, number, number],
  riseJoin: 0,
  riseAim: [0, 0.95] as [number, number],
  riseEase: [6, 14, 28] as [number, number, number],
  coverDive: [-13, -3, 2, 18] as [number, number, number, number],
  coverRise: [-14, -3, 2, 18] as [number, number, number, number],
}

const X = new THREE.Vector3(1, 0, 0)
const Y = new THREE.Vector3(0, 1, 0)
const CENTRE = new THREE.Vector3().fromArray(deck.centre)
const UNIT = 1 / deck.radius
const AXIS = new THREE.Quaternion().setFromUnitVectors(X, new THREE.Vector3().fromArray(shape.axis).normalize())
const AXIS_BACK = AXIS.clone().invert()
const SHAPE_CENTRE = new THREE.Vector3().fromArray(shape.center)
const rad = THREE.MathUtils.degToRad

export function shaped(p: THREE.Vector3): THREE.Vector3 {
  const v = p.clone().applyQuaternion(AXIS_BACK)
  v.set(v.x * shape.polar, v.y * shape.equator, v.z * shape.equator)
  return v.applyQuaternion(AXIS).add(SHAPE_CENTRE)
}

function hide(alpha: number): number {
  if (alpha <= 0) return 0
  const x = 0.5 - Math.sin(Math.asin(1 - 2 * Math.min(alpha, 1)) / 3)
  return mix((x + 0.22) / 1.32, 1, smooth(ramp(0.9, 1, alpha))) * smooth(ramp(0, 0.2, alpha))
}

function trapeze(x: number, a: number, b: number, slope: number): number {
  const up = (v: number, w: number): number => (v * v * v) / (w * w) - (v * v * v * v) / (2 * w * w * w)
  const c = 1 - b
  const area = a / 2 + (b - a) + c / 2
  const y = x - b
  const sum = x < a ? up(x, a) : x < b ? a / 2 + (x - a) : a / 2 + (b - a) + y - up(y, c)
  return sum / area + slope * x * Math.pow(1 - x, 3)
}

export class UranusPlan extends StopPlan {
  private fractions(seg: Segment): { first: number; center: number; last: number } {
    const w = coverWindow(seg)!
    return { first: (w.firstFrame - seg.firstFrame) / seg.frames, center: (w.centerFrame - seg.firstFrame) / seg.frames, last: (w.lastFrame + 1 - seg.firstFrame) / seg.frames }
  }

  entryPath(time: number): Pose {
    const t = this.p.terrain
    const seg = this.seg.dive!
    const u = (time - seg.start) / (seg.end - seg.start)
    const g = Math.pow(Math.max((1 - u) / (1 - this.fractions(seg).first), 0), 2.2)
    const base = this.terrain(time - this.seg.terrain.start)
    return {
      position: base.position.clone().add(new THREE.Vector3(0, t.entryHeight * g, t.entryBack * g)),
      quaternion: base.quaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(X, -rad(t.entryPitchDeg) * g)),
      vfov: t.vfov,
    }
  }

  exitPath(time: number): Pose {
    const t = this.p.terrain
    const seg = this.seg.rise
    const u = (time - seg.start) / (seg.end - seg.start)
    const g = Math.pow(Math.max(u / this.fractions(seg).last, 0), 2.2)
    const base = this.terrain(time - this.seg.terrain.start)
    return {
      position: base.position.clone().add(new THREE.Vector3(0, t.exitHeight * g, -t.exitForward * g)),
      quaternion: base.quaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(X, rad(t.exitPitchDeg) * g)),
      vfov: t.vfov,
    }
  }

  coverAmount(seg: Segment, time: number): number {
    if (!coverWindow(seg)) return 0
    const f = (time - this.coverCenter(seg)) * config.fps
    if (!show.cover) return f === 0 ? 1e-9 : 0
    const k = seg.kind === 'dive' ? move.coverDive : move.coverRise
    return hide(Math.min(smooth(ramp(k[0], k[1], f)), 1 - smooth(ramp(k[2], k[3], f))))
  }

  deckFrame(time: number): THREE.Quaternion {
    return this.turn(time).multiply(this.terrainFrame)
  }

  mapped(local: Pose, time: number): Pose {
    const r = this.deckFrame(time)
    return { position: shaped(local.position.clone().sub(CENTRE).multiplyScalar(UNIT).applyQuaternion(r)), quaternion: r.multiply(local.quaternion), vfov: local.vfov }
  }

  dive(time: number): OrbitShot {
    const seg = this.seg.dive!
    const c = this.coverCenter(seg)
    if (time >= c) return { pose: this.entryPath(time), view: 'terrain' }
    const d = this.p.dive
    const fps = config.fps
    const m = this.mapped(this.entryPath(time), time)
    const held = this.hold(time - this.seg.hold.start)
    const span = (c - seg.start) * fps - move.diveJoin
    const x = ramp(seg.start, c - move.diveJoin / fps, time)
    const s = trapeze(x, move.diveEase[0] / span, move.diveEase[1] / span, 0)
    const hF = held.position.length() - 1
    const hM = m.position.length() - 1
    const h = hF * Math.pow(hM / hF, s)
    const k = (h - hM) / (hF - hM)
    const dF = held.position.clone().normalize()
    const dM = m.position.clone().normalize()
    const side = new THREE.Vector3().crossVectors(dF, dM).normalize()
    const ground = slerpDir(dF, dM, 1 - k).addScaledVector(side, d.bow * Math.sin(Math.PI * s) * k).normalize()
    const position = ground.clone().multiplyScalar(1 + h)
    const l = move.diveLook
    const w = trapeze(ramp(seg.start + l[0] / fps, seg.start + l[3] / fps, time), (l[1] - l[0]) / (l[3] - l[0]), (l[2] - l[0]) / (l[3] - l[0]), 0)
    const quaternion = held.quaternion.clone().slerp(m.quaternion, w)
    return { pose: { position, quaternion, vfov: mix(held.vfov, m.vfov, smooth(x)) }, view: 'orbit' }
  }

  private carried(m: Pose, position: THREE.Vector3): THREE.Quaternion {
    const out = position.clone().normalize()
    const q = new THREE.Quaternion().setFromUnitVectors(m.position.clone().normalize(), out).multiply(m.quaternion)
    const dip = (p: THREE.Vector3): number => Math.acos(Math.min(1 / p.length(), 1))
    const axis = new THREE.Vector3().crossVectors(forward(q), out).normalize()
    return new THREE.Quaternion().setFromAxisAngle(axis, dip(m.position) - dip(position)).multiply(q)
  }

  private framed(position: THREE.Vector3, time: number): THREE.Quaternion {
    const r = this.p.rise
    const out = position.clone().normalize()
    const heading = this.heading.clone().applyQuaternion(this.turn(time))
    const level = heading.addScaledVector(out, -heading.dot(out)).normalize()
    const th = Math.tan(rad(this.fit.vfovDeg) / 2)
    const pitch = Math.acos(Math.min(1 / position.length(), 1)) + Math.asin(1 / r.distance) + Math.atan(r.offset[1] * th)
    const aim = level.clone().multiplyScalar(Math.cos(pitch)).addScaledVector(out, -Math.sin(pitch))
    const q = lookAt(position, position.clone().add(aim), out.clone().add(level).normalize())
    q.multiply(new THREE.Quaternion().setFromAxisAngle(Y, Math.atan(r.offset[0] * th * this.fit.aspect)))
    return q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rad(r.rollDeg)))
  }

  rise(time: number): OrbitShot {
    const seg = this.seg.rise
    const c = this.coverCenter(seg)
    if (time < c) return { pose: this.exitPath(time), view: 'terrain' }
    const m = this.mapped(this.exitPath(time), time)
    const end = this.after(seg.end)
    const from = c + move.riseJoin / config.fps
    const at = (t: number): number => this.mapped(this.exitPath(t), t).position.length() - 1
    const h0 = at(from)
    const step = 1e-3
    const rate = Math.log(at(from + step) / h0) / step
    const n = m.position.clone().normalize()
    const top = end.position.dot(n)
    const log = Math.log((top - 1) / h0)
    const ease = move.riseEase
    const e = trapeze(ramp(from, from + ease[2] / config.fps, time), ease[0] / ease[2], ease[1] / ease[2], (rate * ease[2]) / config.fps / log)
    const z = time < from ? m.position.length() : 1 + h0 * Math.exp(log * e)
    const across = end.position.clone().addScaledVector(n, -top)
    const dip = (h: number): number => Math.acos(1 / (1 + h))
    const swing = Math.max((dip(z - 1) - dip(h0)) / (dip(top - 1) - dip(h0)), 0)
    const lean = (z * Math.tan(Math.atan2(across.length(), top) * swing)) / across.length()
    const position = n.clone().multiplyScalar(z).addScaledVector(across, lean)
    const quaternion = this.carried(m, position).slerp(this.framed(position, time), smooth(ramp(move.riseAim[0], move.riseAim[1], e)))
    const path: Pose = { position, quaternion, vfov: mix(m.vfov, end.vfov, smooth(e)) }
    const u = (time - seg.start) / (seg.end - seg.start)
    return { pose: blendPose(path, this.after(time), smooth(ramp(0.6, 1, u))), view: 'orbit' }
  }

  horizon(view: 'orbit' | 'terrain', local: Pose): CoverHorizon {
    if (view === 'orbit') return super.horizon(view, local)
    const to = CENTRE.clone().sub(local.position)
    const dist = to.length()
    const alpha = Math.asin(Math.min(deck.radius / dist, 1))
    const nadir = to.divideScalar(dist).applyQuaternion(local.quaternion.clone().invert())
    const theta = Math.acos(Math.min(Math.max(-nadir.z, -1), 1))
    const len = Math.hypot(nadir.x, nadir.y)
    const normal: [number, number] = len > 1e-5 ? [-nadir.x / len, -nadir.y / len] : [0, 1]
    return { normal, offset: Math.tan(Math.min(Math.max(theta - alpha, -1.4), 1.4)), soft: 0.22 }
  }
}

export const plan = new UranusPlan('uranus', fit as Fit, params)
