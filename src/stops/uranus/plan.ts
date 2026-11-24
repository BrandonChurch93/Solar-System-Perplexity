import * as THREE from 'three'
import { config, type Segment } from '../../config'
import type { CoverHorizon, Pose, ViewKind } from '../../core/types'
import { handoverOf, sideAt, skyWeight } from '../../director/handover'
import { StopPlan, type Fit, type MoveParams, type OrbitShot } from '../../director/moves'
import { forward, lookAt, mix, ramp, smooth } from '../../director/rig'
import deck from './deck.json'
import fit from './fit.json'
import { haze, place as low, shape, show } from './look'
import path from './path.json'
import place from './place.json'
import plates from './plates.json'

export const params: MoveParams = {
  hold: { orbitDeg: 6, axis: [0.2, 1, 0], push: -0.03 },
  spot: { x: 0.5574, y: 0.6721 },
  dive: { headingDeg: 53.784, altitude: 0.02623, back: 0.07, ahead: 0.14, bow: 0.2, rollDeg: 7, swoop: true },
  handover: { dive: { at: path.dive.at, placeFrames: 0, skyFrames: low.patch.dive[0] + low.patch.dive[1] }, rise: { at: path.rise.at, placeFrames: 2, skyFrames: low.patch.rise[0] + low.patch.rise[1] } },
  terrain: { vfov: 60, forward: 3.2, rise: 0.7107, side: 0.15, yawDeg: 1.5, pitchDeg: -0.5, entryHeight: 1.14, entryBack: 1.26, entryPitchDeg: 6, exitHeight: 2.4, exitForward: 1.3, exitPitchDeg: 10, horizonDeg: 2.874, dipDeg: 9.9055, rollDeg: 14.03 },
  rise: { azimuthDeg: 30, elevationDeg: -30, distance: 6.8, offset: [0.3, -0.32], driftSpeed: 0.08, rollDeg: -25, ahead: 0.03, hug: 1.7, settle: 5, level: true, pan: 0.3 },
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
  coverRush: { speed: 5, reach: 2.5, billow: [3, 3, 1], streak: [7, 7, 1.3], contrast: [0.75, 0.25] },
  spinDegPerSecond: -1,
  moonDegPerSecond: 0.6,
  tint: [0.6, 0.9, 0.95],
  skyAim: { orbit: [145.41987, -22.38676, 20.05787], terrain: [22.60603, 20.42393, -46.69144] },
}

export const move = {
  clockRise: 0.5,
  roundDive: 1,
  roundRise: 1,
}

const X = new THREE.Vector3(1, 0, 0)
const CENTRE = new THREE.Vector3().fromArray(deck.centre)
const UNIT = 1 / deck.radius
const AXIS = new THREE.Quaternion().setFromUnitVectors(X, new THREE.Vector3().fromArray(shape.axis).normalize())
const AXIS_BACK = AXIS.clone().invert()
const SHAPE_CENTRE = new THREE.Vector3().fromArray(shape.center)
const rad = THREE.MathUtils.degToRad

export function shaped(p: THREE.Vector3, sphere = 0): THREE.Vector3 {
  const v = p.clone().applyQuaternion(AXIS_BACK)
  v.set(v.x * mix(shape.polar, 1, sphere), v.y * mix(shape.equator, 1, sphere), v.z * mix(shape.equator, 1, sphere))
  return v.applyQuaternion(AXIS).addScaledVector(SHAPE_CENTRE, 1 - sphere)
}

function round(p: THREE.Vector3, sphere = 0): THREE.Vector3 {
  const v = p.clone().addScaledVector(SHAPE_CENTRE, sphere - 1).applyQuaternion(AXIS_BACK)
  v.set(v.x / mix(shape.polar, 1, sphere), v.y / mix(shape.equator, 1, sphere), v.z / mix(shape.equator, 1, sphere))
  return v.applyQuaternion(AXIS)
}

function trapeze(x: number, a: number, b: number, slope: number): number {
  const up = (v: number, w: number): number => (v * v * v) / (w * w) - (v * v * v * v) / (2 * w * w * w)
  const c = 1 - b
  const area = a / 2 + (b - a) + c / 2
  const y = x - b
  const sum = x < a ? up(x, a) : x < b ? a / 2 + (x - a) : a / 2 + (b - a) + y - up(y, c)
  return sum / area + slope * x * Math.pow(1 - x, 3)
}

function window(x: number, k: number[]): number {
  const span = k[3]! - k[0]!
  return trapeze(ramp(k[0]!, k[3]!, x), (k[1]! - k[0]!) / span, (k[2]! - k[0]!) / span, 0)
}

interface Pivot { n: THREE.Vector3; f: THREE.Vector3; e: THREE.Vector3 }
interface Polar { height: number; sweep: number; turn: number; rel: THREE.Quaternion; field: number }

function frame(g: Pivot, sweep: number, turn: number): { out: THREE.Vector3; quaternion: THREE.Quaternion } {
  const ahead = g.f.clone().multiplyScalar(Math.cos(turn)).addScaledVector(g.e, Math.sin(turn))
  const right = g.e.clone().multiplyScalar(Math.cos(turn)).addScaledVector(g.f, -Math.sin(turn))
  const out = ahead.multiplyScalar(Math.cos(sweep)).addScaledVector(g.n, Math.sin(sweep))
  const up = new THREE.Vector3().crossVectors(out, right)
  return { out, quaternion: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, out)) }
}

export class UranusPlan extends StopPlan {
  clock(time: number): number {
    const e = time - this.holdMid
    const dive = this.seg.dive!
    const rise = this.seg.rise!
    const from = dive.start - this.holdMid
    if (e <= from) return e
    const ref = plates.clockRef
    if (time < rise.start) {
      const x = Math.min((e - from) / (2 * (ref - from)), 1)
      return from + 2 * (ref - from) * (x - x * x * x + (x * x * x * x) / 2)
    }
    const end = rise.end - this.holdMid
    if (e >= end) return e
    const y = ramp(move.clockRise, 1, (time - rise.start) / (rise.end - rise.start))
    const s = ((1 - move.clockRise) * (rise.end - rise.start)) / (end - ref)
    return ref + (end - ref) * ((3 - s) * y * y + (s - 2) * y * y * y)
  }

  roundness(time: number): number {
    const dive = this.seg.dive!
    const rise = this.seg.rise!
    if (time < rise.start) return smooth(ramp(dive.start, dive.start + move.roundDive, time))
    return 1 - smooth(ramp(rise.end - move.roundRise, rise.end, time))
  }

  deckFrame(time: number): THREE.Quaternion {
    return this.turn(time).multiply(this.terrainFrame)
  }

  seat(local: Pose, time: number): Pose {
    const r = this.deckFrame(time)
    return { position: local.position.clone().sub(CENTRE).multiplyScalar(UNIT).applyQuaternion(r), quaternion: r.clone().multiply(local.quaternion), vfov: local.vfov }
  }

  twin(local: Pose, time: number): Pose {
    return this.seat(local, time)
  }

  skyTurnShare(seg: Segment, time: number): number | null {
    if (seg.kind !== 'dive' && seg.kind !== 'rise') return null
    const h = handoverOf(this.id, seg.kind)
    if (!h) return super.skyTurnShare(seg, time)
    if (seg.kind === 'dive') return smooth(ramp(seg.start, (h.firstFrame - low.patch.turn[0]) / config.fps, time))
    return 1 - smooth(ramp((h.lastFrame + 1 + low.patch.turn[1]) / config.fps, seg.end, time))
  }

  patchWeight(time: number, view: ViewKind): number {
    const seg = time < this.seg.rise!.start ? this.seg.dive! : this.seg.rise!
    if (time < seg.start || time >= seg.end) return 1
    const kind = seg.kind as 'dive' | 'rise'
    const h = handoverOf(this.id, kind)
    const share = skyWeight(seg, time)
    if (!h || share <= 0) return 1
    const [hold, fade] = low.patch[kind]
    const fps = config.fps
    const want = kind === 'dive' ? smooth(ramp((h.firstFrame - hold - fade) / fps, (h.firstFrame - hold) / fps, time)) : 1 - smooth(ramp((h.lastFrame + 1 + hold) / fps, (h.lastFrame + 1 + hold + fade) / fps, time))
    if (view === 'terrain') return want / share
    return share < 1 ? (1 - want) / (1 - share) : 0
  }

  unseat(pose: Pose, time: number): Pose {
    const back = this.deckFrame(time).invert()
    return { position: pose.position.clone().applyQuaternion(back).divideScalar(UNIT).add(CENTRE), quaternion: back.multiply(pose.quaternion), vfov: pose.vfov }
  }

  pivot(time: number, units: number): Pivot {
    const r = this.deckFrame(time)
    const a = units * UNIT
    const n = new THREE.Vector3().fromArray(plates.n)
    const u = new THREE.Vector3().fromArray(plates.u)
    return {
      n: n.clone().multiplyScalar(Math.cos(a)).addScaledVector(u, Math.sin(a)).applyQuaternion(r),
      f: u.clone().multiplyScalar(Math.cos(a)).addScaledVector(n, -Math.sin(a)).applyQuaternion(r),
      e: new THREE.Vector3().fromArray(plates.e).applyQuaternion(r),
    }
  }

  polar(pose: Pose, g: Pivot): Polar {
    const v = pose.position.clone().sub(g.n)
    const x = v.dot(g.f)
    const z = v.dot(g.e)
    const side = x < 0 ? -1 : 1
    const turn = Math.atan2(z * side, Math.abs(x))
    const sweep = Math.atan2(v.dot(g.n), side * Math.hypot(x, z))
    return { height: Math.log(pose.position.length() - 1), sweep, turn, rel: frame(g, sweep, turn).quaternion.invert().multiply(pose.quaternion), field: Math.log(Math.tan(rad(pose.vfov) / 2)) }
  }

  posed(p: Polar, g: Pivot): Pose {
    const h = Math.exp(p.height)
    const s = Math.sin(p.sweep)
    const f = frame(g, p.sweep, p.turn)
    return { position: g.n.clone().addScaledVector(f.out, -s + Math.sqrt(s * s + h * (2 + h))), quaternion: f.quaternion.multiply(p.rel), vfov: THREE.MathUtils.radToDeg(2 * Math.atan(Math.exp(p.field))) }
  }

  flown(kind: 'dive' | 'rise', time: number): Pose {
    const seg = kind === 'dive' ? this.seg.dive! : this.seg.rise
    const x = (time - seg.start) / (seg.end - seg.start)
    const close = this.seat(this.terrain(time - this.seg.terrain.start), time)
    const far = kind === 'dive' ? this.hold(time - this.seg.hold.start) : this.after(time)
    if (x <= 0) return kind === 'dive' ? far : close
    if (x >= 1) return kind === 'dive' ? close : far
    const k = path[kind]
    const g = this.pivot(time, k.pivotUnits)
    const a = this.polar(kind === 'dive' ? far : close, g)
    const b = this.polar(kind === 'dive' ? close : far, g)
    return this.posed({ height: mix(a.height, b.height, window(x, k.height)), sweep: mix(a.sweep, b.sweep, window(x, k.sweep)), turn: mix(a.turn, b.turn, window(x, k.turn)), rel: a.rel.slerp(b.rel, window(x, k.aim)), field: mix(a.field, b.field, window(x, k.field)) }, g)
  }

  divePose(time: number, view: ViewKind): Pose {
    if (show.down) return this.above(time)
    const pose = this.flown('dive', time)
    return view === 'terrain' ? this.unseat(pose, time) : pose
  }

  risePose(time: number, view: ViewKind): Pose {
    const pose = this.flown('rise', time)
    return view === 'terrain' ? this.unseat(pose, time) : pose
  }

  above(time: number): Pose {
    const seg = this.seg.dive!
    const u = Math.min(Math.max((time - seg.start) / (seg.end - seg.start - 1 / config.fps), 0), 1)
    const top = this.hold(seg.start - this.seg.hold.start).position.length() - 1
    const h = top * Math.pow(place.heightRadii / top, u)
    const r = this.deckFrame(time)
    const k = this.roundness(time)
    const aim = plates.aimUnits * UNIT
    const n = new THREE.Vector3().fromArray(plates.n).multiplyScalar(Math.cos(aim)).addScaledVector(new THREE.Vector3().fromArray(plates.u), Math.sin(aim)).applyQuaternion(r)
    const position = shaped(n.clone().multiplyScalar(1 + h), k)
    return { position, quaternion: lookAt(position, shaped(n, k), new THREE.Vector3().fromArray(plates.u).applyQuaternion(r)), vfov: this.p.terrain.vfov }
  }

  dive(time: number): OrbitShot {
    const view = show.down ? 'orbit' : show.side ?? sideAt(this.seg.dive!, time)
    return { pose: this.divePose(time, view), view }
  }

  rise(time: number): OrbitShot {
    const view = show.side ?? sideAt(this.seg.rise, time)
    return { pose: this.risePose(time, view), view }
  }

  horizon(view: 'orbit' | 'terrain', local: Pose): CoverHorizon {
    const inward = view === 'orbit' ? round : (p: THREE.Vector3): THREE.Vector3 => p.clone().sub(CENTRE).multiplyScalar(UNIT)
    const outward = view === 'orbit' ? shaped : (p: THREE.Vector3): THREE.Vector3 => p.clone().multiplyScalar(deck.radius).add(CENTRE)
    const eye = inward(local.position)
    const dist = Math.max(eye.length(), 1 + 1e-6)
    const n = eye.clone().divideScalar(eye.length())
    const ahead = inward(local.position.clone().add(forward(local.quaternion))).sub(eye)
    const e1 = ahead.addScaledVector(n, -ahead.dot(n)).normalize()
    const e2 = new THREE.Vector3().crossVectors(n, e1)
    const back = local.quaternion.clone().invert()
    const span = Math.min(Math.atan(haze.chord * Math.tan(rad(local.vfov) / 2) * this.fit.aspect) * dist, 1.2)
    const seen = (phi: number, lift: number): THREE.Vector2 | null => {
      const t = n.clone().multiplyScalar(1 / dist).addScaledVector(e1, Math.sqrt(1 - 1 / (dist * dist)) * Math.cos(phi)).addScaledVector(e2, Math.sqrt(1 - 1 / (dist * dist)) * Math.sin(phi))
      const c = outward(t.multiplyScalar(lift)).sub(local.position).applyQuaternion(back)
      return c.z < -1e-6 ? new THREE.Vector2(c.x / -c.z, c.y / -c.z) : null
    }
    const a = seen(-span, 1)
    const b = seen(span, 1)
    const sky = seen(0, 1.01)
    const mid = seen(0, 1)
    if (!a || !b || !sky || !mid) return { normal: [0, 1], offset: 1.4, soft: 0.22 }
    const along = b.clone().sub(a).normalize()
    const normal = new THREE.Vector2(-along.y, along.x)
    if (sky.clone().sub(mid).dot(normal) < 0) normal.negate()
    return { normal: [normal.x, normal.y], offset: -a.dot(normal) + haze.line, soft: 0.22 }
  }
}

export const plan = new UranusPlan('uranus', fit as Fit, params)
