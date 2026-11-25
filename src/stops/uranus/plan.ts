import * as THREE from 'three'
import { config, type Segment } from '../../config'
import type { CoverHorizon, Pose, ViewKind } from '../../core/types'
import { handoverOf, sideAt, type SkyShares } from '../../director/handover'
import { StopPlan, type Fit, type MoveParams, type OrbitShot } from '../../director/moves'
import { blendPose, forward, lookAt, mix, ramp, smooth } from '../../director/rig'
import deck from './deck.json'
import fit from './fit.json'
import { haze, moons, place as low, shape, show } from './look'
import path from './path.json'
import place from './place.json'
import plates from './plates.json'

export const params: MoveParams = {
  hold: { orbitDeg: 6, axis: [0.2, 1, 0], push: -0.03 },
  spot: { x: 0.5574, y: 0.6721 },
  dive: { headingDeg: 53.784, altitude: 0.02623, back: 0.07, ahead: 0.14, bow: 0.2, rollDeg: 7, swoop: true },
  handover: { dive: { at: path.dive.at, placeFrames: 0, skyFrames: 0, picture: false }, rise: { at: path.rise.at, placeFrames: 0, skyFrames: 0, picture: false } },
  terrain: { vfov: 60, forward: 3.2, rise: 0.7107, side: 0.15, yawDeg: 1.5, pitchDeg: -0.5, entryHeight: 1.14, entryBack: 1.26, entryPitchDeg: 6, exitHeight: 2.4, exitForward: 1.3, exitPitchDeg: 10, horizonDeg: 2.874, dipDeg: 9.9055, rollDeg: 14.03 },
  rise: { azimuthDeg: 0, elevationDeg: 0, distance: 6.8, offset: [0.036, -0.083], driftSpeed: 0.08, rollDeg: 0, ahead: 0.03, hug: 1.7, settle: 5, level: false, pan: 0.3 },
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
}

export function below(span: [number, number], altitude: number): number {
  return 1 - smooth(ramp(Math.log(span[0]), Math.log(span[1]), Math.log(Math.max(altitude, 1e-4))))
}

export function turned(span: [number, number], soft: number, altitude: number): number {
  const x = 1 - ramp(Math.log(span[0]), Math.log(span[1]), Math.log(Math.max(altitude, 1e-4)))
  const end = (u: number): number => soft * (u * u * u - (u * u * u * u) / 2)
  const p = x < soft ? end(x / soft) : x > 1 - soft ? 1 - soft - end((1 - x) / soft) : x - soft / 2
  return Math.min(Math.max(p / (1 - soft), 0), 1)
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

function eased(s: number, q: number): number {
  const k = 1 / (1 - q)
  if (s < q) return (s * s * s * k) / (6 * q)
  if (s <= 1 - q) return (q * q * k) / 6 + ((s * s - q * q) / 2 - (q / 2) * (s - q)) * k
  return 0.5 - (1 - s) + eased(1 - s, q)
}

function trapeze(x: number, a: number, b: number, slope: number): number {
  const q = Math.min(Math.max(path.corner, 0.01), 0.5)
  const up = (v: number, w: number): number => (w > 0 ? w * eased(v / w, q) : 0)
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

function share(x: number, k: number[]): number {
  return window(x, k) / window(1, k)
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

const BEND_STEPS = 64
const POSES_KEPT = 32

export class UranusPlan extends StopPlan {
  private kept = false

  terrain(tRel: number): Pose {
    const base = super.terrain(tRel)
    const b = path.bend
    if (this.kept || b.turnDeg === 0) return base
    const dur = this.seg.terrain.end - this.seg.terrain.start
    const u = tRel / dur - 0.5 - config.shutterFraction / (2 * config.fps * dur)
    const from = b.heading[0]! - 0.5
    if (u <= from) return base
    const t = this.p.terrain
    const line = new THREE.Vector3(t.side, t.rise, -t.forward)
    const start = line.clone().multiplyScalar(from)
    const speed = line.length()
    const ahead = line.clone().normalize()
    const across = new THREE.Vector3().crossVectors(ahead, start.clone().sub(CENTRE)).normalize().multiplyScalar(b.side)
    const angle = (w: number): number => rad(b.turnDeg) * window(w + 0.5, b.heading)
    const last = Math.min(u, b.heading[3]! - 0.5)
    const h = (last - from) / BEND_STEPS
    let c = 0
    let s = 0
    for (let i = 0; i <= BEND_STEPS; i++) {
      const k = i === 0 || i === BEND_STEPS ? 1 : i % 2 === 1 ? 4 : 2
      const a = angle(from + h * i)
      c += k * Math.cos(a)
      s += k * Math.sin(a)
    }
    const end = angle(last)
    const over = u - last
    const position = start.addScaledVector(ahead, speed * ((c * h) / 3 + Math.cos(end) * over)).addScaledVector(across, speed * ((s * h) / 3 + Math.sin(end) * over))
    return { position, quaternion: base.quaternion, vfov: base.vfov }
  }

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

  altitude(time: number): number {
    const rise = this.seg.rise!
    return this.flown(time < rise.start ? 'dive' : 'rise', time).position.length() - 1
  }

  roundness(time: number): number {
    return below(low.round, this.altitude(time))
  }

  drawnShape(view: ViewKind, _eye: THREE.Vector3, time: number): { shape: number[]; place: number[] } | null {
    if (view !== 'orbit') return null
    const moving = (this.seg.dive !== undefined && time >= this.seg.dive.start && time < this.seg.dive.end) || (time >= this.seg.rise.start && time < this.seg.rise.end)
    const sphere = moving ? this.roundness(time) : 0
    const place = shaped(new THREE.Vector3(), sphere)
    const cols = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)].map((e) => shaped(e, sphere).sub(place))
    return { shape: [0, 1, 2].flatMap((i) => cols.map((c) => c.getComponent(i))), place: place.toArray() }
  }

  drawnBodies(view: ViewKind, _eye: THREE.Vector3, time: number): { id: string; place: number[]; turn: number[]; reach: number }[] {
    if (view !== 'orbit') return []
    const e = time - this.holdMid
    const eye = this.hold(this.holdMid - this.seg.hold.start).position
    const normal = new THREE.Vector3().fromArray(fit.rings.normal).normalize()
    return fit.moons.map((m, i) => {
      const depth = moons.bodies[m.id]!.depth
      const home = new THREE.Vector3().fromArray(m.position).sub(eye).multiplyScalar(depth).add(eye)
      const turn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0.3 - 0.5 * i, 1, 0.2).normalize(), 1.1 + 2.3 * i + rad(moons.spinDegPerSecond) * e)
      return { id: m.id, place: home.applyAxisAngle(normal, rad(this.p.moonDegPerSecond) * e).toArray(), turn: turn.toArray(), reach: m.radius * depth }
    })
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

  private handed(seg: Segment): boolean {
    return seg.stop === this.id && (seg.kind === 'dive' || seg.kind === 'rise') && handoverOf(this.id, seg.kind) !== null
  }

  skyTurnShare(seg: Segment, time: number): number | null {
    if (!this.handed(seg)) return super.skyTurnShare(seg, time)
    return this.skyTurned(seg, time)
  }

  private skyTurned(seg: Segment, time: number): number {
    return seg.kind === 'dive' ? turned(low.skyDive.turn, low.skyDive.soft, this.altitude(time)) : below(low.skyTurn, this.altitude(time))
  }

  skyCarryShare(seg: Segment, time: number): number | null {
    return this.handed(seg) ? this.skyTurned(seg, time) : null
  }

  skyShare(seg: Segment, time: number): SkyShares | null {
    if (!this.handed(seg)) return null
    if (seg.kind !== 'dive') return { low: below(low.skyPicture, this.altitude(time)) }
    const share = below(low.skyDive.picture, this.altitude(time))
    return { low: share, high: 1 - share }
  }

  skyLiftAt(seg: Segment, time: number): number | null {
    if (!this.handed(seg) || seg.kind !== 'rise') return null
    const from = handoverOf(this.id, 'rise')!.time
    return from + (seg.end - from) * ramp(Math.log(low.lift), Math.log(this.flown('rise', seg.end).position.length() - 1), Math.log(Math.max(this.altitude(time), 1e-4)))
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

  private readonly anchors = new Map<string, THREE.Vector3>()

  private sight(pose: Pose): THREE.Vector3 {
    const eye = pose.position
    const dir = forward(pose.quaternion)
    const out = eye.clone().normalize()
    const level = dir.clone().addScaledVector(out, -dir.dot(out)).normalize()
    const b = eye.dot(dir)
    const c = eye.lengthSq() - 1
    const disc = b * b - c
    const reach = Math.acos(Math.min(1 / eye.length(), 1)) * config.raw.handover.descent.targetReach
    let arc = reach
    if (disc > 0 && b < 0) arc = Math.min(Math.acos(Math.min(Math.max(eye.clone().addScaledVector(dir, c / (-b + Math.sqrt(disc))).normalize().dot(out), -1), 1)), reach)
    return out.multiplyScalar(Math.cos(arc)).addScaledVector(level, Math.sin(arc))
  }

  private anchor(kind: 'dive' | 'rise', time: number): THREE.Vector3 {
    const key = this.kept ? kind + ' kept' : kind
    let a = this.anchors.get(key)
    if (!a) {
      const at = handoverOf(this.id, kind)!.time
      const back = this.turn(at).invert()
      a = this.sight(this.seat(this.terrain(at - this.seg.terrain.start), at)).applyQuaternion(back)
      for (let i = 0; i < path.anchorSteps; i++) a = this.sight(this.led(kind, at, a.clone().applyQuaternion(this.turn(at)))).applyQuaternion(back)
      this.anchors.set(key, a)
    }
    return a.clone().applyQuaternion(this.turn(time))
  }

  private led(kind: 'dive' | 'rise', time: number, mark: THREE.Vector3): Pose {
    const seg = kind === 'dive' ? this.seg.dive! : this.seg.rise
    const x = (time - seg.start) / (seg.end - seg.start)
    const close = this.seat(this.terrain(time - this.seg.terrain.start), time)
    const far = kind === 'dive' ? this.hold(time - this.seg.hold.start) : this.after(time)
    if (x <= 0) return kind === 'dive' ? far : close
    if (x >= 1) return kind === 'dive' ? close : far
    const k = path[kind]
    const g = this.pivot(time, k.pivotUnits)
    const from = kind === 'dive' ? far : close
    const to = kind === 'dive' ? close : far
    const a = this.polar(from, g)
    const b = this.polar(to, g)
    const base = this.posed({ height: mix(a.height, b.height, share(x, k.height)), sweep: mix(a.sweep, b.sweep, window(x, k.sweep)), turn: mix(a.turn, b.turn, window(x, k.turn)), rel: a.rel.slerp(b.rel, window(x, k.aim)), field: mix(a.field, b.field, window(x, k.field)) }, g)
    const seen = (p: Pose): THREE.Vector2 => {
      const v = mark.clone().sub(p.position).applyQuaternion(p.quaternion.clone().invert())
      const t = Math.tan(rad(p.vfov) / 2) * -v.z
      return new THREE.Vector2(v.x / t, v.y / t)
    }
    const w = window(x, k.track)
    const s = seen(from).lerp(seen(to), w).add(new THREE.Vector2().fromArray(k.bow).multiplyScalar(w * w * (1 - w)))
    const t = Math.tan(rad(base.vfov) / 2)
    const want = new THREE.Vector3(s.x * t, s.y * t, -1).normalize()
    const now = mark.clone().sub(base.position).applyQuaternion(base.quaternion.clone().invert()).normalize()
    return { position: base.position, quaternion: base.quaternion.multiply(new THREE.Quaternion().setFromUnitVectors(want, now)), vfov: base.vfov }
  }

  private readonly poses = new Map<string, Pose>()

  flown(kind: 'dive' | 'rise', time: number): Pose {
    if (this.kept) return this.joined(kind, time)
    const key = kind + time
    let pose = this.poses.get(key)
    if (!pose) {
      if (this.poses.size >= POSES_KEPT) this.poses.clear()
      pose = this.joined(kind, time)
      this.poses.set(key, pose)
    }
    return { position: pose.position.clone(), quaternion: pose.quaternion.clone(), vfov: pose.vfov }
  }

  private joined(kind: 'dive' | 'rise', time: number): Pose {
    const k = path.bend.back
    const x = kind === 'rise' ? (time - this.seg.rise.start) / (this.seg.rise.end - this.seg.rise.start) : 0
    if (x <= k[0]! || path.bend.turnDeg === 0) return this.led(kind, time, this.anchor(kind, time))
    this.kept = true
    let old: Pose
    try {
      old = this.led(kind, time, this.anchor(kind, time))
    } finally {
      this.kept = false
    }
    if (x >= k[3]!) return old
    return blendPose(this.led(kind, time, this.anchor(kind, time)), old, window(x, k))
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
