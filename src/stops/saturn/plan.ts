import * as THREE from 'three'
import { config, type Segment } from '../../config'
import type { Pose, ViewKind } from '../../core/types'
import { handoverOf } from '../../director/handover'
import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import { drift, lookAt, mix, ramp, smooth } from '../../director/rig'
import fit from './fit.json'
import skimJson from './skim.json'

export const params: MoveParams = {
  hold: { orbitDeg: 7, axis: [-0.2, 1, 0.1], push: -0.03 },
  spot: { x: 0.256, y: 0.856, on: 'rings' },
  dive: { headingDeg: -35, altitude: 0.03, back: 0.1, ahead: 0.3, bow: -0.12, rollDeg: -4 },
  terrain: { vfov: skimJson.pose.vfov, forward: skimJson.path.forward, rise: -skimJson.pose.height * (Math.sqrt(skimJson.path.descent) - 1 / Math.sqrt(skimJson.path.descent)), side: skimJson.path.side, yawDeg: skimJson.path.yawDeg, pitchDeg: skimJson.path.pitchDeg, entryHeight: 0.72, entryBack: 1.1, entryPitchDeg: 3.6, exitHeight: 1.6, exitForward: 1.5, exitPitchDeg: 6, ground: 0 },
  rise: { azimuthDeg: -14, elevationDeg: 6, distance: 6.6, offset: [-0.28, -0.12], driftSpeed: 0.08, rollDeg: 0 },
  travel: { turnDeg: 88, side: -1, turnEnd: 0.5 },
  arrive: { swingDeg: -23.5, axis: [-0.866, 0.216, -0.027], power: 3, from: 0.35, offset: [-0.25, 0.1] },
  light: { exposure: 1, skyExposure: 0.55, sunRadiusDeg: 0.32, sunGlare: 0.7, flare: 0.1 },
  cover: [0.9, 0.82, 0.66],
  spinDegPerSecond: 1.4,
  moonDegPerSecond: 0.3,
  tint: [0.92, 0.82, 0.6],
  skyAim: { orbit: [-14, 153, -7.3] },
  handover: {
    // skyFrames 0: the engine crosses no sky by the clock here (see heroSky)
    dive: { at: skimJson.handover.dive.at, picture: false, skyFrames: 0 },
    rise: { at: skimJson.handover.rise.at, picture: false, skyFrames: 0 },
  },
}

export const skim = { seatIn: 0.8 }

// One pace through a move. The rate of a quantity goes from its rate before the move (from) up to one largest
// value and down to its rate after the move (to). On the way up and on the way down it changes by a steady
// amount a frame and its turns are rounded, so the change of the rate a frame is as small as the length of
// the move allows and has no step. peak is one share of the move or two. One share: the rate turns at the top
// there, and its three turns (at the start, at the top, at the end) are rounded over the share round of the
// move each (the top over twice that); round is one share for all three or three shares. Two shares: the rate
// is level between them (up, level, down), and round is one share or four, for the turn at the start, the
// turn into the level (it ends at the first share), the turn out of it (it begins at the second) and the turn
// at the end. total is the way done over the whole move. at(u) is the way done at the share u of the move and
// rate(u) its rate, both for a unit of u.
export class Pace {
  private readonly x: number[]
  private readonly p: number[]
  private readonly q: number[]
  private readonly up: number
  private readonly down: number

  constructor(private readonly from: number, to: number, total: number, peak: number | number[], round: number | number[]) {
    if (typeof peak === 'number') {
      this.p = [0, 1, 1, 0, 0, 0]
      this.q = [0, 0, 0, 1, 1, 0]
      if (typeof round === 'number') {
        const r = Math.min(round, peak / 2, (1 - peak) / 2)
        this.x = [0, r, peak - r, peak + r, 1 - r, 1]
      } else {
        const top = Math.min(round[1]!, peak / 2, (1 - peak) / 2)
        this.x = [0, Math.min(round[0]!, peak - top), peak - top, peak + top, 1 - Math.min(round[2]!, 1 - peak - top), 1]
      }
    } else {
      const [a, b] = peak as [number, number]
      const r = typeof round === 'number' ? [round, round, round, round] : round
      const into = Math.min(r[1]!, a)
      const out = Math.min(r[2]!, 1 - b)
      this.p = [0, 1, 1, 0, 0, 0, 0, 0]
      this.q = [0, 0, 0, 0, 0, 1, 1, 0]
      this.x = [0, Math.min(r[0]!, a - into), a - into, a, b, b + out, 1 - Math.min(r[3]!, 1 - b - out), 1]
    }
    const [p1, p2] = this.sum(this.p, 1)
    const [q1, q2] = this.sum(this.q, 1)
    const det = q1 * p2 - p1 * q2
    this.up = (q1 * (total - from) - q2 * (to - from)) / det
    this.down = (p1 * (total - from) - p2 * (to - from)) / det
  }

  // the first and the second integral, from 0 to u, of the line through the values y at the nodes x
  private sum(y: readonly number[], u: number): [number, number] {
    let one = 0
    let two = 0
    for (let i = 0; i + 1 < this.x.length; i++) {
      const x0 = this.x[i]!
      const x1 = this.x[i + 1]!
      if (u <= x0 || x1 <= x0) continue
      const t = Math.min(u, x1) - x0
      const k = (y[i + 1]! - y[i]!) / (x1 - x0)
      two += one * t + (y[i]! * t * t) / 2 + (k * t * t * t) / 6
      one += y[i]! * t + (k * t * t) / 2
    }
    return [one, two]
  }

  at(u: number): number {
    const k = Math.min(Math.max(u, 0), 1)
    return this.from * k + this.up * this.sum(this.p, k)[1] - this.down * this.sum(this.q, k)[1]
  }

  rate(u: number): number {
    const k = Math.min(Math.max(u, 0), 1)
    return this.from + this.up * this.sum(this.p, k)[0] - this.down * this.sum(this.q, k)[0]
  }
}

interface PaceOf { peak: number | number[]; round: number | number[] }
interface Paces { reach: PaceOf; climb: PaceOf; round: PaceOf; view: PaceOf }
interface Law { e1: THREE.Vector3; e2: THREE.Vector3; reach0: number; reach: Pace; climb0: number; climb: Pace; round0: number; round: Pace; view: Pace }

export class SaturnPlan extends StopPlan {
  readonly ringNormal: THREE.Vector3
  readonly skimPosition: THREE.Vector3
  readonly skimQuaternion: THREE.Quaternion
  readonly skimForward: THREE.Vector3
  readonly skimRight: THREE.Vector3
  private readonly toTerrain: THREE.Quaternion

  constructor(id: string, f: Fit, p: MoveParams) {
    super(id, f, p)
    const rad = THREE.MathUtils.degToRad
    const pose = skimJson.pose
    const n = this.normal.clone()
    this.ringNormal = n
    const sun = this.lightDir.clone()
    const flat = sun.clone().addScaledVector(n, -sun.dot(n)).normalize()
    const out = new THREE.Vector3().crossVectors(n, flat).normalize().applyAxisAngle(n, rad(pose.azimuthDeg))
    const tilt = rad(pose.tiltDeg)
    const roll = rad(pose.rollDeg)
    const yaw = rad(pose.yawDeg)
    const nc = new THREE.Vector3(-Math.sin(roll) * Math.cos(tilt), Math.cos(roll) * Math.cos(tilt), Math.sin(tilt))
    const fp = new THREE.Vector3(0, 0, -1).addScaledVector(nc, nc.z).normalize()
    const left = new THREE.Vector3().crossVectors(nc, fp)
    const toGlobe = fp.clone().multiplyScalar(Math.cos(yaw)).addScaledVector(left, -Math.sin(yaw))
    const inward = out.clone().negate()
    const cam = new THREE.Matrix4().makeBasis(nc, toGlobe, new THREE.Vector3().crossVectors(nc, toGlobe))
    const world = new THREE.Matrix4().makeBasis(n, inward, new THREE.Vector3().crossVectors(n, inward))
    this.skimQuaternion = new THREE.Quaternion().setFromRotationMatrix(world.multiply(cam.transpose()))
    this.skimPosition = out.clone().multiplyScalar(pose.foot).addScaledVector(n, pose.height)
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.skimQuaternion)
    this.skimForward = fwd.addScaledVector(n, -fwd.dot(n)).normalize()
    this.skimRight = new THREE.Vector3().crossVectors(this.skimForward, n).normalize()
    this.toTerrain = this.terrainFrame.clone().invert()
  }

  // The skim: the height falls by the same share in every frame and the speed over the plane goes with the
  // height, so the sheet passes under the lens at a steady number of pixels a frame. u is the time from the
  // middle of the skim over its length; along is the share of the way done since the middle. From the share
  // path.bend.from on (just past the judged frame) the way bends (skimBend) and the rule of the speed stays.
  skimAt(time: number): Pose {
    const path = skimJson.path
    const seg = this.seg.terrain
    const dur = seg.end - seg.start
    const u = (time - seg.start) / dur - 0.5 - config.shutterFraction / (2 * config.fps * dur)
    const quaternion = new THREE.Quaternion().setFromAxisAngle(this.ringNormal, THREE.MathUtils.degToRad(path.yawDeg) * u).multiply(this.skimQuaternion)
    quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(path.pitchDeg) * u))
    return { position: u > path.bend.from ? this.skimBend(u) : this.skimStraight(u), quaternion, vfov: skimJson.pose.vfov }
  }

  // The straight way of the skim at the share u from its middle.
  private skimStraight(u: number): THREE.Vector3 {
    const path = skimJson.path
    const k = Math.log(path.descent)
    const fall = Math.exp(-k * u)
    const along = k === 0 ? u : (1 - fall) / (2 * Math.sinh(k / 2))
    return this.skimPosition.clone().addScaledVector(this.skimForward, path.forward * along).addScaledVector(this.skimRight, path.side * along).addScaledVector(this.ringNormal, skimJson.pose.height * (fall - 1))
  }

  private bend: { c: number; lift0: number; ahead: THREE.Vector3; across: THREE.Vector3; start: THREE.Vector3; turn: Pace; lift: Pace; nodes: [number, number, number][] } | null = null

  // The end of the skim (ruling d196). The skim pushes at the globe and the way out lies behind the lens, so
  // the lens would have to stop and turn back where the rise begins. Instead the way of the lens bends over
  // the last seconds of the skim: from the push into a track across the plane and on into the pull back, and
  // the rise takes that motion and only speeds it up. The lens never rests: all the way the speed of the lens
  // is the same share of its height over the plane as in the straight skim, in whatever direction it goes.
  // The direction turns from the share path.bend.from to the share path.bend.to of the skim (shares from its
  // middle, like u): its heading over the plane by turnDeg toward the right of the lens, where the globe is
  // (the pace of bend.turn), and its angle to the plane from the descent of the skim up to liftDeg (the pace
  // of bend.lift). Past bend.to the way is straight again. The lens looks where it looked: nothing of its
  // turn is here. The way has no closed form (the speed goes with the height, the height with the way): it is
  // summed once in bend.steps steps of the classic fourth order rule, and a place between two steps is one
  // such step from the one before, so the way is one smooth function of the time and of nothing else.
  private skimBend(u: number): THREE.Vector3 {
    const path = skimJson.path
    const b = path.bend
    const span = b.to - b.from
    const rad = THREE.MathUtils.degToRad
    if (!this.bend) {
      const k = Math.log(path.descent)
      const h0 = skimJson.pose.height
      // the velocity of the straight skim over its height: the same at every time
      const flat = this.skimForward.clone().multiplyScalar(path.forward).addScaledVector(this.skimRight, path.side).multiplyScalar(k === 0 ? 1 / h0 : k / (2 * Math.sinh(k / 2) * h0))
      const c = Math.hypot(flat.length(), k)
      const ahead = flat.clone().normalize()
      this.bend = { c, lift0: Math.asin(-k / c), ahead, across: new THREE.Vector3().crossVectors(ahead, this.ringNormal).normalize(), start: this.skimStraight(b.from), turn: new Pace(0, 0, 1, b.turn.peak, b.turn.round), lift: new Pace(0, 0, 1, b.lift.peak, b.lift.round), nodes: [] }
      let at: [number, number, number] = [Math.log(h0) - k * b.from, 0, 0]
      this.bend.nodes.push(at)
      for (let i = 0; i < b.steps; i++) {
        at = this.bendStep(at, i / b.steps, 1 / b.steps)
        this.bend.nodes.push(at)
      }
    }
    const B = this.bend
    const s = Math.min((u - b.from) / span, 1)
    const i = Math.min(Math.floor(s * b.steps), b.steps - 1)
    let [logHeight, x, y] = this.bendStep(B.nodes[i]!, i / b.steps, s - i / b.steps)
    if (u > b.to) {
      // straight on: the height grows (or falls) by the same share in every frame, the way with it
      const lift = B.lift0 + (rad(b.liftDeg) - B.lift0) * B.lift.at(1)
      const heading = rad(b.turnDeg) * B.turn.at(1)
      const grow = B.c * Math.sin(lift) * (u - b.to)
      const way = Math.abs(grow) < 1e-9 ? B.c * Math.exp(logHeight) * Math.cos(lift) * (u - b.to) : (Math.exp(logHeight) * Math.cos(lift) * Math.expm1(grow)) / Math.sin(lift)
      x += way * Math.cos(heading)
      y += way * Math.sin(heading)
      logHeight += grow
    }
    const height0 = B.start.dot(this.ringNormal)
    return B.start.clone().addScaledVector(B.ahead, x).addScaledVector(B.across, y).addScaledVector(this.ringNormal, Math.exp(logHeight) - height0)
  }

  // One step of the sum of the bend: from the state at the share s of the bend (the logarithm of the height,
  // the way ahead and the way across) over the share ds.
  private bendStep(from: [number, number, number], s: number, ds: number): [number, number, number] {
    const b = skimJson.path.bend
    const B = this.bend!
    const span = b.to - b.from
    const rad = THREE.MathUtils.degToRad
    const rate = (at: number, logHeight: number): [number, number, number] => {
      const lift = B.lift0 + (rad(b.liftDeg) - B.lift0) * B.lift.at(at)
      const heading = rad(b.turnDeg) * B.turn.at(at)
      const flat = B.c * span * Math.exp(logHeight) * Math.cos(lift)
      return [B.c * span * Math.sin(lift), flat * Math.cos(heading), flat * Math.sin(heading)]
    }
    const k1 = rate(s, from[0])
    const k2 = rate(s + ds / 2, from[0] + (k1[0] * ds) / 2)
    const k3 = rate(s + ds / 2, from[0] + (k2[0] * ds) / 2)
    const k4 = rate(s + ds, from[0] + k3[0] * ds)
    return [0, 1, 2].map((j) => from[j]! + (ds * (k1[j]! + 2 * k2[j]! + 2 * k3[j]! + k4[j]!)) / 6) as [number, number, number]
  }

  private local(pose: Pose): Pose {
    return { position: pose.position.clone().sub(this.spot).applyQuaternion(this.toTerrain), quaternion: this.toTerrain.clone().multiply(pose.quaternion), vfov: pose.vfov }
  }

  // A move from one motion to another (the dive from the hold to the skim, the rise from the skim to the way
  // out) is one move in four measures, each with one pace (Pace) from its rate in the motion before to its
  // rate in the motion after, so the move meets both without a step in speed: the distance to the globe's
  // surface (reach), the height over the ring plane (climb), the angle of the foot of the lens round the
  // globe (round) and the turn of the camera with its field of view (view). The numbers of each pace are in
  // skim.json handover.
  private law(from: (time: number) => Pose, to: (time: number) => Pose, seg: { start: number; end: number }, d: Paces): Law {
    const n = this.ringNormal
    const e1 = this.skimPosition.clone().addScaledVector(n, -this.skimPosition.dot(n)).normalize()
    const e2 = new THREE.Vector3().crossVectors(n, e1)
    const e = 0.5 / config.fps
    const dur = seg.end - seg.start
    const near = (v: number): number => Math.atan2(Math.sin(v), Math.cos(v))
    const pace = (f: (p: THREE.Vector3) => number, wrap: boolean, k: PaceOf): [number, Pace] => {
      const s0 = f(from(seg.start + e).position) - f(from(seg.start - e).position)
      const s1 = f(to(seg.end + e).position) - f(to(seg.end - e).position)
      const first = f(from(seg.start).position)
      const total = f(to(seg.end).position) - first
      return [first, new Pace(((wrap ? near(s0) : s0) / (2 * e)) * dur, ((wrap ? near(s1) : s1) / (2 * e)) * dur, wrap ? near(total) : total, k.peak, k.round)]
    }
    const reach = pace((p) => Math.log(Math.max(p.length() - 1, 1e-6)), false, d.reach)
    const climb = pace((p) => Math.log(Math.max(p.dot(n), 1e-6)), false, d.climb)
    const round = pace((p) => Math.atan2(p.dot(e2), p.dot(e1)), true, d.round)
    return { e1, e2, reach0: reach[0], reach: reach[1], climb0: climb[0], climb: climb[1], round0: round[0], round: round[1], view: new Pace(0, 0, 1, d.view.peak, d.view.round) }
  }

  // The pose at the share u of such a move; a and b are the poses of the two motions at the same time.
  private move(law: Law, a: Pose, b: Pose, u: number): Pose {
    if (u <= 0) return a
    if (u >= 1) return b
    const far = 1 + Math.exp(law.reach0 + law.reach.at(u))
    const h = Math.exp(law.climb0 + law.climb.at(u))
    const phi = law.round0 + law.round.at(u)
    const foot = Math.sqrt(Math.max(far * far - h * h, 0))
    const position = new THREE.Vector3().addScaledVector(law.e1, foot * Math.cos(phi)).addScaledVector(law.e2, foot * Math.sin(phi)).addScaledVector(this.ringNormal, h)
    const w = law.view.at(u)
    return { position, quaternion: a.quaternion.clone().slerp(b.quaternion, w), vfov: a.vfov * Math.pow(b.vfov / a.vfov, w) }
  }

  private diveLaw: Law | null = null
  private riseLaw: Law | null = null

  private diving(): Law {
    return (this.diveLaw ??= this.law((t) => this.hold(t - this.seg.hold.start), (t) => this.skimAt(t), this.seg.dive!, skimJson.handover.dive))
  }

  private rising(): Law {
    return (this.riseLaw ??= this.law((t) => this.skimAt(t), (t) => this.after(t), this.seg.rise, skimJson.handover.rise))
  }

  // How much of the turn of the dive is done at a time (0 in the hold, 1 in the skim), and of the rise.
  private diveShare(time: number): number {
    const seg = this.seg.dive!
    return this.diving().view.at((time - seg.start) / (seg.end - seg.start))
  }

  private riseShare(time: number): number {
    const seg = this.seg.rise
    return this.rising().view.at((time - seg.start) / (seg.end - seg.start))
  }

  override terrain(tRel: number): Pose {
    return this.local(this.skimAt(this.seg.terrain.start + tRel))
  }

  // No cover is drawn at this stop: the dive and the rise are one flight through one world.
  override coverAmount(): number {
    return 0
  }

  // Where the lens is in the frame of the globe at any time from the hold to the end of the rise: one path.
  flight(time: number): Pose {
    const d = this.seg.dive!
    const r = this.seg.rise
    if (time < d.start) return this.hold(time - this.seg.hold.start)
    if (time < d.end) return this.move(this.diving(), this.hold(time - this.seg.hold.start), this.skimAt(time), (time - d.start) / (d.end - d.start))
    if (time < r.start) return this.skimAt(time)
    return this.move(this.rising(), this.skimAt(time), this.after(time), (time - r.start) / (r.end - r.start))
  }

  // The two views of the handover show the same world from the same lens: the close view is the flight seen in
  // the frame of the skim, and its twin in the frame of the globe is the flight itself.
  override divePose(time: number, view: ViewKind): Pose {
    const pose = this.flight(time)
    return view === 'terrain' ? this.local(pose) : pose
  }

  override risePose(time: number, view: ViewKind): Pose {
    const pose = this.flight(time)
    return view === 'terrain' ? this.local(pose) : pose
  }

  override twin(local: Pose, _time: number): Pose {
    return { position: local.position.clone().applyQuaternion(this.terrainFrame).add(this.spot), quaternion: this.terrainFrame.clone().multiply(local.quaternion), vfov: local.vfov }
  }

  // The place the dive goes to and the rise leaves: a point of the ring plane ahead of the lens of the skim.
  // The ground of this stop is the plane of the rings, not the sphere.
  placePoint(): THREE.Vector3 {
    const foot = this.skimPosition.clone().addScaledVector(this.ringNormal, -this.skimPosition.dot(this.ringNormal))
    return foot.addScaledVector(this.skimForward, skimJson.handover.place.ahead)
  }

  // The engine reads a place as a direction from the centre of the globe: the direction of that point.
  override place(_kind: 'dive' | 'rise', _time: number): THREE.Vector3 {
    return this.placePoint().normalize()
  }

  // The harness's top down view: on the line from the centre through the place, at the distance and with the
  // field of the given pose, looking at the centre, the heading of the lens at the handover up in the picture.
  override topDown(kind: 'dive' | 'rise', time: number, pose: Pose): Pose {
    const seg = kind === 'dive' ? this.seg.dive : this.seg.rise
    if (!seg) throw new Error(this.id + ' has no ' + kind)
    const at = this.coverCenter(seg)
    const tw = this.twin(this.closePose(kind, at), at)
    const heading = new THREE.Vector3(0, 0, -1).applyQuaternion(tw.quaternion).applyQuaternion(this.turn(at).invert()).applyQuaternion(this.turn(time))
    const position = this.place(kind, time).multiplyScalar(pose.position.length())
    return { position, quaternion: lookAt(position, new THREE.Vector3(0, 0, 0), heading), vfov: pose.vfov }
  }

  // One sky for the stop: the film's own star field, in the view of the globe and in the close view alike. The
  // engine's cross of two sky pictures by the clock is not used (handover skyFrames 0, and the close view has no
  // sky picture at all): the picture of the sky of the hold has its whole share in the view of the globe and
  // leaves by how far the lens is from the path of the hold (heroSky). It is gone by the first frame of the
  // engine's handover, from which the engine draws no picture of the sky for the view of the globe (skyProof).

  // How low the lens is over the ring plane at a height: 0 at the heights of the hold, 1 at those of the skim,
  // by the logarithm of the height between the two heights of skim.json sky, to the power sky.power (under 1:
  // the air comes in early below the upper height and settles at the lower). The air of the stop (the dimming
  // of the stars and the glow under them) follows this and nothing of it follows the clock.
  lowAt(height: number): number {
    const [lo, hi] = skimJson.sky.heights as [number, number]
    return Math.pow(1 - smooth(Math.log(Math.max(Math.abs(height), 1e-6) / lo) / Math.log(hi / lo)), skimJson.sky.power)
  }

  low(time: number): number {
    return this.lowAt(this.flight(time).position.dot(this.ringNormal))
  }

  override skyGain(time: number): number {
    return mix(1, skimJson.sky.near, this.low(time))
  }

  // The stars of the flight: the engine brings them in through the rise, from its change of view to the end of
  // the rise, and reads how far by a time. That time is given here by the height of the lens over the ring plane
  // and not by the clock. liftAt is their level as a function of the height alone: a smooth step of
  // 1 - (1 - share)^power, share the way between the two heights of skim.json sky.lift. The lens climbs ever
  // slower toward the end of the rise (the height left goes with the square of the time left), so with the
  // power one half the level runs evenly over the frames of the climb. The lower height lies over every height
  // of the hold and of the dive (skyProof), so it is one function of the height on both sides of the skim: none
  // of them at any height the lens has on the way down.
  liftAt(height: number): number {
    const k = skimJson.sky.lift
    return smooth(1 - Math.pow(1 - ramp(k.heights[0]!, k.heights[1]!, Math.abs(height)), k.power))
  }

  // The engine runs its own course on the time it is given (a smooth step of the share of its span, then
  // 1 - (1 - x)^2). Both are undone here, so the level it shows is liftAt of the height.
  override skyLiftAt(seg: Segment, time: number): number | null {
    if (seg.kind !== 'rise') return null
    const change = handoverOf(this.id, 'rise')
    if (!change) return null
    const x = 1 - Math.sqrt(1 - this.liftAt(this.flight(time).position.dot(this.ringNormal)))
    return mix(change.time, seg.end, 0.5 - Math.sin(Math.asin(1 - 2 * x) / 3))
  }

  private holdPath: THREE.Vector3[] | null = null

  // How far a place is from the path the lens flies in the hold: the distance to the nearest point of that path
  // (the path as a chain of chords, sky.hero.chords of them).
  fromHold(place: THREE.Vector3): number {
    if (!this.holdPath) {
      const h = this.seg.hold
      const n = skimJson.sky.hero.chords
      this.holdPath = []
      for (let i = 0; i <= n; i++) this.holdPath.push(this.hold(((h.end - h.start) * i) / n).position.clone())
    }
    const pts = this.holdPath
    const ab = new THREE.Vector3()
    const ap = new THREE.Vector3()
    let best = Infinity
    for (let i = 0; i + 1 < pts.length; i++) {
      ab.subVectors(pts[i + 1]!, pts[i]!)
      ap.subVectors(place, pts[i]!)
      const k = Math.min(Math.max(ap.dot(ab) / Math.max(ab.lengthSq(), 1e-18), 0), 1)
      best = Math.min(best, ap.addScaledVector(ab, -k).lengthSq())
    }
    return Math.sqrt(best)
  }

  // How far the lens is from the path of the hold at a time.
  heroDistance(time: number): number {
    return this.fromHold(this.flight(time).position)
  }

  // How much of the hero's own sky (the picture of the sky of the hold) shows: all of it on the path of the
  // hold, none of it from the distance sky.hero.reach from that path on, and between the two it falls by a
  // smooth step of the distance over the reach to the power sky.hero.power (the power under 1 spreads the fall
  // evenly over the dive, which leaves the hold slowly and then fast). slack is the distance under which the
  // lens counts as on the path (the chords cut the path's curve by far less). A function of where the lens is
  // and of nothing else.
  heroSky(time: number): number {
    const k = skimJson.sky.hero
    return 1 - smooth(Math.pow(Math.max(this.heroDistance(time) - k.slack, 0) / k.reach, k.power))
  }

  // The proof that the hero's sky leaves once and for good: the hold keeps it whole, the dive has lost it before
  // the engine changes the view (after that no picture of the sky is drawn), the rise never comes near enough
  // to bring it back, and through the dive it only ever falls. Throws if a change of the paths breaks any of it.
  skyProof(): { hold: number; change: number; rise: number } {
    const k = skimJson.sky.hero
    const step = 0.25 / config.fps
    const d = this.seg.dive!
    const change = handoverOf(this.id, 'dive')
    if (!change) throw new Error(this.id + ': no handover in the dive')
    let hold = 1
    for (let t = this.seg.hold.start; t < d.start; t += step) hold = Math.min(hold, this.heroSky(t))
    if (hold !== 1) throw new Error(this.id + ': the hold does not keep its sky whole, least share ' + hold)
    // and the hold is flown above the air of the stop
    for (let t = this.seg.hold.start; t < d.start; t += step) if (this.low(t) !== 0) throw new Error(this.id + ': the hold is flown inside the air of the stop at ' + (t * config.fps).toFixed(2) + ', sky.heights ' + skimJson.sky.heights)
    let last = 0
    for (let t = d.start; t <= change.time; t += step) {
      const now = this.heroDistance(t)
      if (now < last - 1e-9 && now < k.reach + k.slack) throw new Error(this.id + ': the dive comes back towards the hold at ' + (t * config.fps).toFixed(2))
      last = now
    }
    // from the first frame of the engine's handover on the engine draws no picture of the sky in the view of the
    // globe: the hero's must be gone by then
    const first = change.firstFrame / config.fps
    const at = this.heroDistance(first)
    if (this.heroSky(first) !== 0) throw new Error(this.id + ': at the first frame of the handover (' + change.firstFrame + ') the lens is ' + at.toFixed(4) + ' from the path of the hold, sky.hero.reach is ' + k.reach)
    let rise = Infinity
    for (let t = this.seg.rise.start; t <= this.seg.rise.end + 1e-9; t += step) rise = Math.min(rise, this.heroDistance(t))
    if (!(rise - k.slack >= k.reach)) throw new Error(this.id + ': the rise comes to ' + rise.toFixed(4) + ' from the path of the hold, sky.hero.reach is ' + k.reach)
    // the stars of the flight come in by the height of the lens, one function of the height on the way down and
    // on the way up: none at any height of the hold or of the dive, none at the engine's change of view in the
    // rise, all of them at the end of the rise, and the lens never comes down between the two heights
    const up = handoverOf(this.id, 'rise')
    if (!up) throw new Error(this.id + ': no handover in the rise')
    const high = (t: number): number => Math.abs(this.flight(t).position.dot(this.ringNormal))
    const r = this.seg.rise
    for (let t = this.seg.hold.start; t <= d.end + 1e-9; t += step) if (this.liftAt(high(t)) !== 0) throw new Error(this.id + ': the hold or the dive is flown at ' + high(t).toFixed(4) + ' over the ring plane at ' + (t * config.fps).toFixed(2) + ', inside sky.lift.heights ' + skimJson.sky.lift.heights)
    if (this.liftAt(high(up.time)) !== 0) throw new Error(this.id + ': at the change of view of the rise the lens is ' + high(up.time).toFixed(4) + ' over the ring plane, sky.lift.heights ' + skimJson.sky.lift.heights)
    if (this.liftAt(high(r.end)) !== 1) throw new Error(this.id + ': at the end of the rise the lens is ' + high(r.end).toFixed(4) + ' over the ring plane, sky.lift.heights ' + skimJson.sky.lift.heights)
    let top = 0
    for (let t = up.time; t <= r.end + 1e-9; t += step) {
      const now = this.liftAt(high(t))
      if (now < top) throw new Error(this.id + ': the rise comes down again inside sky.lift.heights at ' + (t * config.fps).toFixed(2))
      top = now
    }
    return { hold, change: at, rise }
  }

  seat(time: number): THREE.Quaternion {
    const h = this.seg.hold
    const d = this.seg.dive!
    const t = this.seg.terrain
    const r = this.seg.rise
    const out = new THREE.Quaternion()
    if (time <= h.start || time >= r.end) return out
    const fractions = config.raw.judged.fractions as Record<string, number>
    const at = (s: typeof h): THREE.Quaternion => drift((s.firstFrame + Math.floor((fractions[s.kind] ?? 0.5) * s.frames + 1e-9)) / config.fps)
    if (time < d.start) return out.slerp(at(h), smooth(ramp(h.start, mix(h.start, this.holdMid, skim.seatIn), time)))
    if (time < d.end) return at(h).slerp(at(t), smooth(this.diveShare(time)))
    if (time < r.start) return at(t)
    return at(t).slerp(out, smooth(this.riseShare(time)))
  }
}

export const plan = new SaturnPlan('saturn', fit as Fit, params)
