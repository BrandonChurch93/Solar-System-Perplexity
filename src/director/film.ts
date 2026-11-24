import * as THREE from 'three'
import { config, type Segment } from '../config'
import { spanMid } from '../core/clock'
import type { Director } from '../core/engine'
import { shutterScale } from '../core/motion'
import type { CoverState, PlaceState, Pose, SetState, Shot, SkyFloor, SunState, ViewKind } from '../core/types'
import { defaultPost } from '../post/chain'
import { StopPlan, easeInOut, type OrbitShot } from './moves'
import { arc, drift, forward, lookAt, lookbackLight, mix, ramp, slerpDir, smooth, smoother } from './rig'
import { coverWindow, segmentAtFrame } from './timeline'
import { handoverFrame, handoverOf, horizonWeight, placeWeight, shutterScales, skyTurnWeight, skyWeight, topForced } from './handover'
import skyFrame from '../space/skyframe.json'
import world from './world.json'
import { aimAt, type SkyAims } from '../space/aim'
import { TravelShape, inFrame } from '../space/travel/path'
import { discShare, openSky } from '../space/travel/open'

const NO_TURN = new THREE.Quaternion()

export interface StopFrame { rotation: THREE.Quaternion; origin: THREE.Vector3 }

const FAR_FACTOR = 2600
const TURN_END = 0.46
const APPROACH_START = 0.2
const APPROACH_POWER = 2.5
const SWING_FROM = 0.3
const CLEAR_DEG = 3
const SUN_PULL_FROM = 0.2
const SUN_PULL_END = 0.42
const SUN_APPROACH_START = 0.42
export const LOOKBACK = { phaseDeg: 148, azimuthDeg: 127, distance: 8.6, sun: [0.59, 0.3] as [number, number], sunPerSecond: [-0.02, 0.005] as [number, number], settle: 4.8, hand: 0.1, lineDeg: 195, vfov: 34, glare: 4, flare: 0.35, sky: [0, 35, -5] as [number, number, number], skyExposure: 0.36, skyAnchor: { aimDeg: 14, rollDeg: 13 }, glide: { turn: 0.5, phase: 0.4, pull: 0.3, aim: 0.3 } }
const basis = (first: THREE.Vector3, toward: THREE.Vector3): THREE.Quaternion => {
  const x = first.clone().normalize()
  const y = toward.clone().addScaledVector(x, -toward.dot(x)).normalize()
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, new THREE.Vector3().crossVectors(x, y)))
}
const glide = (u: number, e: number): number => {
  const x = Math.min(Math.max(u, 0), 1)
  const edge = (t: number): number => e * (t * t * t - (t * t * t * t) / 2)
  return (x < e ? edge(x / e) : x > 1 - e ? 1 - e - edge((1 - x) / e) : x - e / 2) / (1 - e)
}
const OFFSET_FROM = 0.15
const PASS_REACH = 60
const SUN_LEAVE = 0.55
const SUN_SWAP: [number, number] = [0.42, SUN_LEAVE]
const SUN_GLOW_FROM = 0.06
const SUN_HAND = { span: [0.25, 0.8] as [number, number], last: 0.6, reach: 2, behind: 1000 }
const SUN_DIM = { level: 0.25, window: 0.4, taps: 6, back: [0.8, 1] as [number, number] }
const RETREAT_DUST = 0.045
const LOCK_PX: [number, number] = [3, 40]
const PLACE_TIE = 1e-6
type CameraPose = { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }
const PIN_FRAMES = 8
const FAR_LIGHT = { within: 3, frames: 12, power: 1.5 }
const Y = new THREE.Vector3(0, 1, 0)
const OPEN = config.raw.travel.sky
const bandLook = (id: string): number => (OPEN.bandLook as Record<string, number>)[id] ?? 0
const riseLift = (id: string): number => (OPEN.riseLift as Record<string, number>)[id] ?? 0
const DUST_LOOK = config.raw.travel.dust
const OPEN_TAPS = 8
const SUN_COLOR = new THREE.Color(1, 0.9, 0.72)

export interface LiveControl { stop: string; view: ViewKind; yaw: number; pitch: number; zoom: number; time: number }

export class FilmDirector implements Director {
  readonly plans: StopPlan[]
  readonly frames: StopFrame[] = []
  readonly sunWorld = new THREE.Vector3()
  private readonly approach: THREE.Vector3[] = []
  private readonly reach: number[] = []
  private readonly begin: number[] = []
  private readonly clear: number[] = [0]
  private readonly slide: number[] = []
  private readonly shapes: TravelShape[] = []
  private readonly lit: number[] = []
  private readonly sunHand: number[] = []
  private readonly small: number[] = []
  private readonly sunSwapSpan: [number, number] = SUN_SWAP
  private readonly openRef = new Map<number, number>()
  private readonly settled = new Map<number, [number, number]>()
  private readonly skyFloors = new Map<string, SkyFloor>()
  // E6: the share of the film's shutter a frame keeps, as this film's own shots measure it. The film that is asked for a shot hands it to the
  // handover, where a sample takes its side by its position inside the shutter that is open.
  private readonly shutterOf = (frame: number): number => shutterScale(this, frame)
  private lookbackUp = new THREE.Vector3()
  private lookbackSun = new THREE.Vector3()
  private lookbackSide = new THREE.Vector3()
  private sunStart = 1
  private sunSwap = 1
  sky: SkyAims = { frame: new THREE.Quaternion(), turns: {}, orbits: {}, patches: {}, fitted: { frame: 0, terrainFrame: 0 }, anchor: '', follows: {}, open: {} }

  constructor(plans: StopPlan[]) {
    shutterScales(this.shutterOf)
    this.plans = plans
    this.frames.push({ rotation: new THREE.Quaternion(), origin: new THREE.Vector3() })
    this.approach.push(new THREE.Vector3(0, 0, -1))
    this.reach.push(0)
    this.begin.push(0)
    for (let i = 0; i + 1 < plans.length; i++) this.place(i)
    this.pin()
    for (let i = 0; i + 1 < plans.length; i++) {
      const id = plans[i]!.id
      const shape = new TravelShape(id)
      let clear = SUN_LEAVE
      let slide = 0
      if (i > 0) {
        let low = 0
        let high = PASS_REACH
        for (let k = 0; k < 24; k++) {
          const mid = (low + high) / 2
          if (this.passSeen(i, shape, mid, shape.look.passBy)) low = mid
          else high = mid
        }
        slide = high
        clear = this.clearOf(i, shape, slide)
        shape.from = clear
        if (shape.look.point > 0) {
          const b = plans[i + 1]!
          const hold = b.hold(0)
          const dh = hold.position.length()
          const far = 1 / (2 * shape.look.point * Math.tan(THREE.MathUtils.degToRad(hold.vfov) / 2))
          shape.until = clear + (1 - clear) * shape.grown(1 - Math.log(Math.max(far / dh, 1)) / Math.log(this.reach[i + 1]! / dh))
        }
      }
      this.slide.push(slide)
      this.shapes.push(shape)
      this.clear.push(clear)
      let small = 0
      if (shape.look.window > 0) {
        const seg = plans[i]!.seg.travel!
        const settled = i > 0 && shape.look.pin[1] > 0 ? Math.min(clear + shape.look.pinFrames / ((seg.end - seg.start) * config.fps), 1) : clear
        const open = Math.max(1 - shape.look.window / ((seg.end - seg.start) * config.fps), settled)
        if (i > 0 && shape.look.pin[1] > 0) shape.until = settled
        shape.open = open
        small = this.sizeOf(i, this.travelPath(i, seg.start + open * (seg.end - seg.start)))
      }
      this.small.push(small)
      let lit = 1
      if (i > 0 && shape.look.pin[1] > 0) {
        const seg = plans[i]!.seg.travel!
        const body = this.frames[i + 1]!.origin
        const seen = (pose: CameraPose): THREE.Vector2 => {
          const v = body.clone().sub(pose.position).applyQuaternion(pose.quaternion.clone().invert())
          return new THREE.Vector2(v.x, v.y).multiplyScalar(540 / (Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2) * Math.max(-v.z, 1e-9)))
        }
        const drifted = (pose: CameraPose, time: number): CameraPose => ({ ...pose, quaternion: pose.quaternion.clone().multiply(drift(time)) })
        const home = seen(drifted(this.toWorld(i + 1, plans[i + 1]!.hold(0)), seg.end))
        const steps = Math.round((seg.end - seg.start) * config.fps) * 8
        for (let k = steps; k >= 0; k--) {
          const time = seg.start + (k / steps) * (seg.end - seg.start)
          const place = shape.look.follow > 0 || shape.look.window > 0 ? seen(drifted(this.toWorld(i + 1, plans[i + 1]!.hold(time - seg.end)), time)) : home
          if (seen(drifted(this.travelCamera(i, time), time)).distanceTo(place) > FAR_LIGHT.within) break
          lit = k / steps
        }
      }
      this.lit.push(lit)
      let hand = SUN_HAND.span[0]
      if (i > 0) {
        const seg = plans[i]!.seg.travel!
        const master = config.formats[config.formatKeys.master]!
        const steps = Math.round((seg.end - seg.start) * config.fps) * 8
        const seen = (u: number): boolean => {
          const pose = this.travelCamera(i, seg.start + u * (seg.end - seg.start))
          return inFrame(pose.quaternion, pose.vfov, master.width / master.height, this.sunWorld, Math.sin(Math.min(SUN_HAND.reach * this.sunFor(i).radius, Math.PI / 2)), 0)
        }
        while (hand < SUN_HAND.last && seen(hand)) hand = Math.min(hand + 1 / steps, SUN_HAND.last)
      }
      this.sunHand.push(hand)
    }
    const last = plans.length - 1
    const n = this.plans[last]!
    const s = n.sunDir.clone()
    const axis = new THREE.Vector3().crossVectors(s, Y).normalize()
    const up = axis.clone()
    this.lookbackUp = up
    this.lookbackSun = s
    const out = n.exitPose(n.seg.rise.end).position.clone().normalize()
    this.lookbackSide = out
    this.sky = this.aimSky()
  }

  private aimSky(): SkyAims {
    const a = skyFrame.args
    const round = (q: THREE.Quaternion): THREE.Quaternion => new THREE.Quaternion().fromArray(q.toArray().map((x) => Number(x.toFixed(7))))
    const fractions = config.raw.judged.fractions as Record<string, number>
    const judged = (id: string): number | null => {
      const s = config.segments.find((x) => x.id === id)
      return s ? Math.min(s.endFrame - 1, s.firstFrame + Math.floor((fractions[s.kind] ?? 0.5) * s.frames + 1e-9)) : null
    }
    const cam = (frame: number): THREE.Quaternion => this.shotAt(frame, frame / config.fps).camera.quaternion.clone()
    const anchor = aimAt(a.along, a.tilt, a.lift)
    const frame = judged(a.stop + '.hold')!
    const f = anchor.clone().multiply(cam(frame).invert())
    const out: SkyAims = { frame: round(f), turns: {}, orbits: {}, patches: {}, fitted: { frame, terrainFrame: judged(a.tstop + '.terrain')! }, anchor: a.stop, follows: {}, open: {} }
    const bare = (q: StopPlan, seg?: Segment): boolean => q.coverBare(seg)
    this.plans.forEach((p, i) => {
      const before = this.plans[i - 1]
      if (bare(p, p.seg.dive) || bare(p, p.seg.rise)) out.open[p.id] = true
      if (before && (before.id === a.stop || bare(before, before.seg.rise))) out.follows[p.id] = before.id
    })
    const own = this.plans.map((p): THREE.Quaternion | null | undefined => {
      if (p.id === a.stop) return null
      const hold = judged(p.id + '.hold')
      const want = p.p.skyAim?.orbit
      if (!want || hold === null || out.follows[p.id]) return undefined
      return round(cam(hold).multiply(aimAt(want[0], want[1], want[2]).invert()).multiply(f))
    })
    let carry: THREE.Quaternion | null = null
    this.plans.forEach((p, i) => {
      const hold = judged(p.id + '.hold')
      const terrain = judged(p.id + '.terrain')
      const want = p.id === a.tstop ? [a.talong, a.ttilt, a.tlift] : out.open[p.id] ? undefined : p.p.skyAim?.terrain
      const next = i === 0 ? own[1] : undefined
      const mineOwn = next !== undefined ? next : own[i]
      const t = mineOwn !== undefined ? mineOwn : carry
      carry = t
      const set = own[i] !== undefined && own[i] === t ? p.p.skyAim?.orbit : undefined
      const mine = t ? f.clone().multiply(t.clone().invert()) : f
      if (t) out.orbits[p.id] = t
      const orbit = p.id === a.stop || hold === null ? anchor.clone() : set ? aimAt(set[0], set[1], set[2]) : mine.clone().multiply(cam(hold))
      let low = orbit
      if (terrain !== null) {
        const tcam = cam(terrain)
        if (want) {
          low = aimAt(want[0]!, want[1]!, want[2]!)
          out.turns[p.id] = round(tcam.clone().multiply(low.clone().invert()).multiply(f))
        } else {
          low = mine.clone().multiply(tcam)
          if (t) out.turns[p.id] = t
        }
      }
      out.patches[p.id] = { orbit: round(orbit), terrain: round(low) }
    })
    const back = judged(config.endingId + '.lookback')
    const lastId = this.plans[this.plans.length - 1]!.id
    const kept = out.orbits[lastId]
    if (back !== null && !out.open[lastId]) out.orbits[config.endingId] = round(this.skyAnchor(back).multiply(aimAt(LOOKBACK.sky[0], LOOKBACK.sky[1], LOOKBACK.sky[2]).invert()).multiply(f))
    else if (kept) out.orbits[config.endingId] = kept
    return out
  }

  private skyAnchor(frame: number): THREE.Quaternion {
    const rad = THREE.MathUtils.degToRad
    const up = this.lookbackUp
    const aim = this.lookbackSun.clone().applyAxisAngle(up, rad(LOOKBACK.skyAnchor.aimDeg))
    const local = lookAt(new THREE.Vector3(), aim, up, LOOKBACK.skyAnchor.rollDeg)
    return this.frames[this.plans.length - 1]!.rotation.clone().multiply(local).multiply(drift(frame / config.fps))
  }

  private lookbackPlace(t: number): { phase: number; azimuth: number; distance: number; s: number; hand: number } {
    const lb = config.segments.find((x) => x.kind === 'lookback')!
    const rest = (at: number): number => {
      const x = Math.min(Math.max((at - lb.start) / LOOKBACK.settle, 0), 1)
      return Math.min(at - lb.start, 0) + (LOOKBACK.settle * (1 - (1 - x) * (1 - x) * (1 - x))) / 3
    }
    const rad = THREE.MathUtils.degToRad
    const mid = (lb.start + lb.end) / 2
    const s = rest(t) - rest(mid)
    return { phase: rad(LOOKBACK.phaseDeg), azimuth: rad(LOOKBACK.azimuthDeg), distance: LOOKBACK.distance, s, hand: mid + mix(s, t - mid, LOOKBACK.hand) }
  }

  private nightSide(phase: number, azimuth: number, distance: number, sun = this.lookbackSun): THREE.Vector3 {
    const side = this.lookbackSide.clone().addScaledVector(sun, -this.lookbackSide.dot(sun)).normalize()
    return slerpDir(sun, side.applyAxisAngle(sun, azimuth), phase / (Math.PI / 2)).multiplyScalar(distance)
  }

  private lookback(t: number): Pose {
    const at = this.lookbackPlace(t)
    const s = at.s
    const rad = THREE.MathUtils.degToRad
    const position = this.nightSide(at.phase, at.azimuth, at.distance)
    const tan = Math.tan(rad(LOOKBACK.vfov) / 2)
    const sx = (LOOKBACK.sun[0] + LOOKBACK.sunPerSecond[0] * s) * tan
    const sy = (LOOKBACK.sun[1] + LOOKBACK.sunPerSecond[1] * s) * tan
    const line = rad(LOOKBACK.lineDeg)
    const seen = basis(new THREE.Vector3(sx, sy, -1), new THREE.Vector3(sx + Math.cos(line), sy + Math.sin(line), -1))
    return { position, quaternion: basis(this.lookbackSun, position.clone().negate()).multiply(seen.invert()).multiply(drift(at.hand)).multiply(drift(t).invert()), vfov: LOOKBACK.vfov }
  }

  private turnEnd(i: number): number {
    return this.plans[i]!.p.travel.turnEnd ?? TURN_END
  }

  private approachLocal(i: number, x: number, time: number, shape?: TravelShape): Pose {
    const b = this.plans[i]!
    const hold = b.hold(time - b.seg.hold.start)
    const dh = b.hold(0).position.length()
    const e = shape ? shape.grow(x) : 1 - Math.pow(1 - x, b.p.arrive?.power ?? APPROACH_POWER)
    const sigma = dh * (Math.pow(this.reach[i]! / dh, 1 - e) - 1)
    const pose: Pose = { position: hold.position.clone().addScaledVector(forward(hold.quaternion), -sigma), quaternion: hold.quaternion.clone(), vfov: hold.vfov }
    const a = b.p.arrive
    if (a && a.swingDeg !== 0) {
      const left = shape ? shape.swingLeft(x) : 1 - smoother(ramp(a.from ?? SWING_FROM, 1, x))
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(a.axis[0], a.axis[1], a.axis[2]).normalize(), THREE.MathUtils.degToRad(a.swingDeg) * left)
      pose.position.applyQuaternion(q)
      pose.quaternion.premultiply(q)
    }
    if (a?.offset) {
      const left = shape ? shape.offsetLeft(x) : 1 - smoother(ramp(OFFSET_FROM, 1, x))
      const half = THREE.MathUtils.degToRad(hold.vfov) / 2
      pose.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(a.offset[1] * half * left, a.offset[0] * half * left, 0, 'YXZ')))
    }
    return pose
  }

  private clearAt(i: number, rotation: THREE.Quaternion, seg: Segment): number {
    const a = this.plans[i]!
    const dur = seg.end - seg.start
    const end = this.turnEnd(i)
    const target = rotation.clone().multiply(this.approachLocal(i + 1, 0, seg.start).quaternion)
    const half = Math.atan(Math.tan(THREE.MathUtils.degToRad(a.fit.vfovDeg) / 2) * Math.hypot(1, config.formats[config.formatKeys.master]!.width / config.formats[config.formatKeys.master]!.height))
    const things: { at: THREE.Vector3; radius: number }[] = [{ at: new THREE.Vector3(), radius: Math.max(1, a.fit.rings?.outer ?? 0) }]
    for (const m of a.fit.moons ?? []) things.push({ at: new THREE.Vector3(m.position[0], m.position[1], m.position[2]), radius: m.radius })
    const least = a.p.travel.start ?? APPROACH_START
    for (let k = 0; k <= 200; k++) {
      const u = (k / 200) * end
      if (u < least) continue
      const from = this.toWorld(i, this.leaving(i, seg.start + u * dur))
      const q = from.quaternion.clone().slerp(target, easeInOut(ramp(0, end, u)))
      const f = forward(q)
      let clear = true
      for (const t of things) {
        const to = t.at.clone().applyQuaternion(this.frames[i]!.rotation).add(this.frames[i]!.origin).sub(from.position)
        const d = to.length()
        if (f.angleTo(to) < half + Math.asin(Math.min(t.radius / d, 1)) + THREE.MathUtils.degToRad(CLEAR_DEG)) clear = false
      }
      if (clear) return u
    }
    return end
  }

  private passSeen(i: number, shape: TravelShape, slide: number, u: number): boolean {
    const seg = this.plans[i]!.seg.travel!
    const master = config.formats[config.formatKeys.master]!
    const time = seg.start + u * (seg.end - seg.start)
    const from = this.toWorld(i, this.leaving(i, time))
    const moved = this.approach[i + 1]!.clone().multiplyScalar(slide * shape.pass(u))
    return this.leavingThings(i, time).some((t) => inFrame(from.quaternion, from.vfov, master.width / master.height, t.to.sub(moved), t.radius, shape.look.clearDeg))
  }

  clearOf(i: number, shape: TravelShape, slide: number): number {
    const steps = 600
    for (let k = Math.round(shape.look.passBy * steps); k > 0; k--) if (this.passSeen(i, shape, slide, (k - 1) / steps)) return k / steps
    return 0
  }

  slideOf(i: number): number {
    return this.slide[i] ?? 0
  }

  sunSwapOf(): { span: [number, number]; bowDeg: number } {
    return { span: this.sunSwapSpan, bowDeg: this.shapes[0]?.look.bowDeg ?? 0 }
  }

  clearAtOf(i: number): number {
    return this.clear[i] ?? 0
  }

  leavingThings(i: number, time: number): { name: string; to: THREE.Vector3; radius: number }[] {
    const a = this.plans[i]!
    const from = this.toWorld(i, this.leaving(i, time))
    const f = this.frames[i]!
    const at = (p: THREE.Vector3): THREE.Vector3 => p.applyQuaternion(f.rotation).add(f.origin).sub(from.position)
    const out = [{ name: a.id, to: at(new THREE.Vector3()), radius: Math.max(1, a.fit.rings?.outer ?? 0) }]
    ;(a.fit.moons ?? []).forEach((m, k) => out.push({ name: a.id + ' moon ' + k, to: at(new THREE.Vector3(m.position[0], m.position[1], m.position[2])), radius: m.radius }))
    return out
  }

  private toWorld(i: number, p: Pose): Pose {
    const f = this.frames[i]!
    return { position: p.position.clone().applyQuaternion(f.rotation).add(f.origin), quaternion: f.rotation.clone().multiply(p.quaternion), vfov: p.vfov }
  }

  private leaving(i: number, time: number): Pose {
    const p = this.plans[i]!
    return i === 0 ? p.hold(time - p.seg.hold.start) : p.exitPose(time)
  }

  private place(i: number): void {
    const a = this.plans[i]!
    const b = this.plans[i + 1]!
    const seg = a.seg.travel!
    const dur = seg.end - seg.start
    const from = this.toWorld(i, this.leaving(i, seg.start))
    const dh = b.hold(0).position.length()
    const reach = dh * FAR_FACTOR
    this.reach.push(reach)
    const first = this.approachLocal(i + 1, 0, seg.start)
    const dLocal = forward(first.quaternion)
    if (i === 0) {
      this.sunWorld.copy(from.position).sub(this.frames[0]!.origin).normalize().negate()
      this.sunStart = from.position.distanceTo(this.frames[0]!.origin)
      this.sunSwap = 1 / Math.sin(THREE.MathUtils.degToRad(b.p.light.sunRadiusDeg))
    }
    const r0 = arc(b.sunDir, this.sunWorld)
    const fr = forward(from.quaternion)
    const camUp = Y.clone().applyQuaternion(from.quaternion)
    const want = THREE.MathUtils.degToRad(a.p.travel.turnDeg)
    const tries: { r: THREE.Quaternion; cost: number }[] = []
    for (let k = 0; k < 720; k++) {
      const r = new THREE.Quaternion().setFromAxisAngle(this.sunWorld, (k / 720) * Math.PI * 2).multiply(r0)
      const d = dLocal.clone().applyQuaternion(r)
      let cost: number
      if (i === 0) cost = from.quaternion.angleTo(r.clone().multiply(first.quaternion))
      else {
        const side = new THREE.Vector3().crossVectors(fr, d).dot(camUp)
        cost = Math.abs(fr.angleTo(d) - want) + (side * a.p.travel.side < 0 ? 0.6 : 0)
      }
      tries.push({ r, cost })
    }
    let best = tries[0]!
    for (const t of tries) if (t.cost < best.cost) best = t
    const least = best.cost
    const last = this.frames[i]!.rotation
    for (let k = 0; i > 0 && least >= 0.6 && k < 720; k++) {
      const t = tries[k]!
      if (t.cost > least + PLACE_TIE || t.cost > tries[(k + 719) % 720]!.cost || t.cost >= tries[(k + 1) % 720]!.cost) continue
      if (t.r.angleTo(last) < best.r.angleTo(last)) best = t
    }
    const begin = i === 0 ? SUN_APPROACH_START : this.clearAt(i, best.r, seg)
    this.begin.push(begin)
    const startAt = seg.start + begin * dur
    const at = i === 0 ? this.frames[0]!.origin.clone().addScaledVector(this.sunWorld, -this.sunSwap) : this.toWorld(i, this.leaving(i, startAt)).position
    const origin = at.sub(this.approachLocal(i + 1, 0, startAt).position.applyQuaternion(best.r))
    this.frames.push({ rotation: best.r, origin })
    this.approach.push(dLocal.clone().applyQuaternion(best.r))
  }

  private sizeOf(index: number, pose: Pose): number {
    const d = this.frames[index + 1]!.origin.distanceTo(pose.position)
    return 1 / (Math.sqrt(Math.max(d * d - 1, 1e-12)) * Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2))
  }

  private travelCamera(index: number, time: number): Pose {
    const pose = this.travelPath(index, time)
    const shape = this.shapes[index]!
    if (shape.look.window <= 0) return pose
    const seg = this.plans[index]!.seg.travel!
    const t = ramp(shape.open, 1, (time - seg.start) / (seg.end - seg.start))
    if (t <= 0) return pose
    const b = this.plans[index + 1]!
    const body = this.frames[index + 1]!.origin
    const hold = this.toWorld(index + 1, b.hold(time - b.seg.hold.start))
    const full = this.sizeOf(index, hold)
    const small = this.small[index]!
    const want = (small + (full - small) * smoother(t)) * Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
    const ray = pose.position.clone().sub(body).normalize()
    if (shape.look.pin[1] <= 0) {
      const hero = hold.position.clone().sub(body).normalize().applyQuaternion(hold.quaternion.clone().invert()).applyQuaternion(pose.quaternion)
      const angle = ray.angleTo(hero)
      const g = smooth(ramp(0, (PIN_FRAMES * 1.5) / ((seg.end - seg.start) * config.fps * (1 - shape.open)), t))
      if (angle > 1e-9) ray.applyAxisAngle(new THREE.Vector3().crossVectors(ray, hero).normalize(), angle * g)
    }
    return { ...pose, position: body.clone().addScaledVector(ray, Math.sqrt(1 + 1 / (want * want))) }
  }

  private travelPath(index: number, time: number): Pose {
    const seg = this.plans[index]!.seg.travel!
    const u = (time - seg.start) / (seg.end - seg.start)
    const from = this.toWorld(index, this.leaving(index, time))
    const shape = this.shapes[index]!
    const x = ramp(this.clear[index + 1]!, 1, u)
    const to = this.toWorld(index + 1, this.approachLocal(index + 1, x, time, shape))
    const start = this.toWorld(index + 1, this.approachLocal(index + 1, 0, time, shape))
    if (index === 0) {
      const g = easeInOut(ramp(SUN_PULL_FROM, SUN_PULL_END, u))
      const radial = this.frames[0]!.origin.clone().addScaledVector(this.sunWorld, -this.sunStart * Math.pow(this.sunSwap / this.sunStart, g))
      from.position.lerp(radial, smooth(u / 0.12))
    }
    const position = to.position.clone().addScaledVector(from.position.clone().sub(start.position), shape.settleLeft(x))
    const slide = this.slide[index] ?? 0
    if (slide > 0) position.addScaledVector(this.approach[index + 1]!, slide * shape.pass(u) * shape.settleLeft(x))
    const aim = index === 0 ? this.toWorld(1, this.approachLocal(1, ramp(SUN_APPROACH_START, 1, u), time, shape)).quaternion : to.quaternion
    if (index > 0 && shape.look.pin[1] > 0) {
      const b = this.plans[index + 1]!
      const hold = this.toWorld(index + 1, b.hold(time - b.seg.hold.start))
      const body = this.frames[index + 1]!.origin
      const quaternion = shape.spin(from.quaternion, hold.quaternion, u)
      const reach = body.distanceTo(position)
      const free = body.clone().sub(position).normalize()
      const hero = body.clone().sub(hold.position).normalize().applyQuaternion(hold.quaternion.clone().invert()).applyQuaternion(quaternion)
      const angle = free.angleTo(hero)
      const g = shape.pinned(u)
      if (g > 0 && angle > 1e-9) free.applyAxisAngle(new THREE.Vector3().crossVectors(free, hero).normalize(), angle * g)
      return { position: body.clone().addScaledVector(free, -reach), quaternion, vfov: mix(from.vfov, to.vfov, smooth(u)) }
    }
    return { position, quaternion: shape.turn(from.quaternion, aim, u), vfov: mix(from.vfov, to.vfov, smooth(u)) }
  }

  private pin(): void {
    const m = this.plans.findIndex((p) => p.id === world.stop)
    const at = this.frames[m]
    if (!at) return
    const rotation = new THREE.Quaternion().fromArray(world.rotation)
    const origin = new THREE.Vector3().fromArray(world.origin)
    const turn = rotation.clone().multiply(at.rotation.clone().invert())
    const base = at.origin.clone()
    this.frames.forEach((f, i) => {
      if (i === m) return
      f.origin.sub(base).applyQuaternion(turn).add(origin)
      f.rotation.premultiply(turn).normalize()
    })
    at.rotation.copy(rotation)
    at.origin.copy(origin)
    for (const a of this.approach) a.applyQuaternion(turn)
    this.sunWorld.fromArray(world.sun)
  }

  beginOf(i: number): number {
    return this.begin[i] ?? 0
  }

  private sunFor(i: number): { radius: number; glare: number; exposure: number; sky: number } {
    const l = this.plans[i]!.p.light
    return { radius: THREE.MathUtils.degToRad(l.sunRadiusDeg), glare: l.sunGlare, exposure: l.exposure, sky: l.skyExposure }
  }

  private leaveWeight(index: number, u: number): number {
    const hand = this.sunHand[index] ?? 0
    return index === 0 ? 1 - smooth(ramp(this.sunSwapSpan[0], this.sunSwapSpan[1], u)) : u < Math.max(this.clear[index + 1]!, hand > SUN_HAND.span[0] ? hand : 0) ? 1 : 0
  }

  private bright(index: number, at: number): number {
    const seg = this.plans[index]!.seg.travel!
    const time = Math.min(Math.max(at, seg.start), seg.end)
    const u = (time - seg.start) / (seg.end - seg.start)
    const pose = this.travelCamera(index, time)
    const inv = pose.quaternion.clone().invert()
    const master = config.formats[config.formatKeys.master]!
    const aspect = master.width / master.height
    const body = (i: number): number => {
      const to = this.frames[i]!.origin.clone().sub(pose.position)
      return discShare(to.clone().applyQuaternion(inv), Math.min(1 / to.length(), 1), pose.vfov, aspect)
    }
    const radius = mix(this.sunFor(index).radius, this.sunFor(index + 1).radius, smooth(ramp(0.25, 0.8, u)))
    const sun = discShare(this.sunWorld.clone().applyQuaternion(inv), Math.sin(Math.min(radius, 1.5)), pose.vfov, aspect)
    const glow = index === 0 ? smooth(ramp(SUN_GLOW_FROM, this.sunSwapSpan[1], u)) : 1
    return Math.min(this.leaveWeight(index, u) * body(index) + body(index + 1) + glow * sun, 1)
  }

  private sunSeen(index: number, time: number): number {
    const seg = this.plans[index]!.seg.travel!
    const master = config.formats[config.formatKeys.master]!
    let sum = 0
    for (let k = -SUN_DIM.taps; k <= SUN_DIM.taps; k++) {
      const pose = this.travelCamera(index, Math.min(Math.max(time + (k / SUN_DIM.taps) * SUN_DIM.window, seg.start), seg.end))
      if (inFrame(pose.quaternion, pose.vfov, master.width / master.height, this.sunWorld, 0, 0)) sum++
    }
    return sum / (2 * SUN_DIM.taps + 1)
  }

  private brightNear(index: number, time: number): number {
    let sum = 0
    for (let k = -OPEN_TAPS; k <= OPEN_TAPS; k++) sum += this.bright(index, time + (k / OPEN_TAPS) * OPEN.window)
    return sum / (2 * OPEN_TAPS + 1)
  }

  openOf(index: number, time: number): number {
    const seg = this.plans[index]!.seg.travel!
    let ref = this.openRef.get(index)
    if (ref === undefined) {
      ref = Math.min(OPEN.brightShare, this.brightNear(index, seg.start + 1 / config.fps), this.brightNear(index, seg.end - 1 / config.fps))
      this.openRef.set(index, ref)
    }
    return openSky(this.brightNear(index, time), ref)
  }

  patchSpanOf(index: number): [number, number] {
    let span = this.settled.get(index)
    if (!span) {
      const seg = this.plans[index]!.seg.travel!
      const end = this.travelCamera(index, seg.end).quaternion
      const steps = 240
      let from = 0
      for (let k = steps - 1; k >= 0 && from === 0; k--) {
        const off = THREE.MathUtils.radToDeg(this.travelCamera(index, seg.start + (k / steps) * (seg.end - seg.start)).quaternion.angleTo(end))
        if (off > OPEN.patchSettleDeg) from = (k + 1) / steps
      }
      const done = this.shapes[index]!.look.patchEnd || OPEN.patchDone
      span = [Math.min(from, (OPEN.patchFrom as Record<string, number>)[this.plans[index]!.id] ?? OPEN.patchDone - OPEN.patchSpan, done), done]
      this.settled.set(index, span)
    }
    return span
  }

  glareOf(shot: Shot): THREE.Vector3 | null {
    const seg = shot.segment
    const index = config.stopIds.indexOf(seg.stop)
    const p = this.plans[index]
    if (!p || (seg.kind !== 'dive' && seg.kind !== 'rise') || shot.sets[0]?.view !== 'orbit') return null
    const share = Math.min(p.glareCarry(seg, shot.time), 1)
    if (!(share > 0)) return null
    const c = p.coverCenter(seg)
    const at = seg.kind === 'dive' ? c : c - 1e-6
    const low = p.eyeShot(seg.kind, at)
    if (low.view !== 'terrain') return null
    const q = this.frames[index]!.rotation.clone().multiply(p.turn(at)).multiply(p.terrainFrame).multiply(low.pose.quaternion).multiply(drift(at))
    const place = this.sunWorld.clone().applyQuaternion(q.invert())
    const own = shot.sun.dir.clone().applyQuaternion(shot.camera.quaternion.clone().invert())
    return own.applyQuaternion(new THREE.Quaternion().slerp(new THREE.Quaternion().setFromUnitVectors(own, place), share)).applyQuaternion(shot.camera.quaternion).normalize()
  }

  shotAt(frame: number, time: number, forced?: ViewKind): Shot {
    shutterScales(this.shutterOf)
    const segment = segmentAtFrame(frame)
    const u = (time - segment.start) / (segment.end - segment.start)
    const post = defaultPost()
    const cover: CoverState = { amount: 0, color: [1, 1, 1] }
    let pose: Pose
    let sets: SetState[]
    let near = 0.01
    let far = 80000
    let dust = 0
    let farLight: number | undefined
    let dustLook = 0
    let light = this.sunFor(0)
    let sunWeight = 1
    let flare = 0
    let skyGlow = 1
    let skyTurn = NO_TURN
    let skyStars = 0
    let skyPatch = 1
    let skyShare: number | undefined
    let skyShareHigh: number | undefined
    let skyCarry: THREE.Quaternion | null = null
    let skyFloor: SkyFloor | null = null
    let place: PlaceState | undefined
    const index = config.stopIds.indexOf(segment.stop)
    let skyLook = bandLook(segment.stop === config.endingId ? this.plans[this.plans.length - 1]!.id : segment.stop)
    const state = (i: number, view: ViewKind, weight = 1): SetState => {
      const p = this.plans[i]!
      const f = this.frames[i]!
      const rotation = view === 'terrain' ? f.rotation.clone().multiply(p.turn(time)).multiply(p.terrainFrame) : f.rotation.clone()
      const origin = view === 'terrain' ? p.spot.clone().applyQuaternion(p.turn(time)).applyQuaternion(f.rotation).add(f.origin) : f.origin.clone()
      const turns = view === 'orbit' && p.handsOver && p.id === segment.stop && (segment.kind === 'dive' || segment.kind === 'rise')
      const bodies = view === 'orbit' ? p.nearBodies(time) : []
      return { id: p.id, origin, rotation, time, local: time - p.firstSegment.start, segment, u, weight, view, height: 0, ground: p.ground, ...(turns ? { turn: p.turn(time) } : {}), ...(bodies.length ? { near: bodies } : {}) }
    }
    const inSet = (s: SetState, p: Pose): Pose => ({ position: p.position.clone().applyQuaternion(s.rotation).add(s.origin), quaternion: s.rotation.clone().multiply(p.quaternion), vfov: p.vfov })

    if (segment.stop === config.endingId) {
      const i = this.plans.length - 1
      const p = this.plans[i]!
      const s = state(i, 'orbit')
      const look = (t: number): Pose => this.lookback(t)
      const arrived = segment.kind === 'retreat' ? smoother(ramp(OPEN.retreatGlare, 1, u)) : 1
      const lifted = riseLift(p.id)
      const open = mix(mix(p.p.light.skyExposure, OPEN.openExposure, lifted), LOOKBACK.skyExposure, lifted)
      light = { ...this.sunFor(i), glare: mix(p.p.light.sunGlare, LOOKBACK.glare, arrived), sky: segment.kind === 'retreat' ? mix(mix(p.p.light.skyExposure, OPEN.openExposure, lifted), open, smoother(ramp(OPEN.retreat[0], OPEN.retreat[1], u))) : open }
      flare = mix(p.p.light.flare, LOOKBACK.flare, arrived)
      skyStars = lifted
      if (segment.kind === 'retreat') {
        const a = p.exitPose(time)
        const b = look(time)
        const end = this.lookbackPlace(time)
        const g = LOOKBACK.glide
        const w = glide(u, g.aim)
        const lit = p.lightDir.clone().lerp(this.lookbackSun, lookbackLight(u)).normalize()
        const phase = mix(a.position.angleTo(p.lightDir), end.phase, glide(u, g.phase))
        const position = this.nightSide(phase, end.azimuth * glide(u, g.turn), a.position.length() * Math.pow(end.distance / a.position.length(), glide(u, g.pull)), lit)
        const track = (x: THREE.Vector3): THREE.Quaternion => lookAt(x, new THREE.Vector3(), this.lookbackSun)
        const held = track(a.position).invert().multiply(a.quaternion)
        const local: Pose = { position, quaternion: track(position).multiply(held.slerp(track(b.position).invert().multiply(b.quaternion), w)), vfov: mix(a.vfov, b.vfov, w) }
        pose = inSet(s, local)
        dust = Math.pow(Math.sin(Math.PI * u), 2) * RETREAT_DUST
        dustLook = smoother(ramp(DUST_LOOK.span[0], DUST_LOOK.span[1], u)) * (1 - smoother(ramp(DUST_LOOK.span[2], DUST_LOOK.span[3], u)))
      } else {
        pose = inSet(s, look(time))
        if (segment.kind === 'fade') post.fade = frame >= config.frameCount - 1 ? 0 : 1 - smooth(ramp(segment.start, segment.end - 2 / config.fps, time))
      }
      sets = [s]
      near = 0.2
      const t = this.sky.orbits[config.endingId]
      if (t) skyTurn = t
    } else if (segment.kind === 'travel' && index + 1 < this.plans.length) {
      const a = this.plans[index]!
      const b = this.plans[index + 1]!
      pose = this.travelCamera(index, time)
      const position = pose.position
      const la = this.sunFor(index)
      const lb = this.sunFor(index + 1)
      const k = smooth(ramp(SUN_HAND.span[0], SUN_HAND.span[1], u))
      const hand = smooth(ramp(this.sunHand[index]!, SUN_HAND.span[1], u))
      light = { radius: mix(la.radius, lb.radius, hand), glare: mix(la.glare, lb.glare, hand), exposure: mix(la.exposure, lb.exposure, k), sky: mix(la.sky, lb.sky, k) }
      if (index === 0) {
        light.radius = u < SUN_LEAVE ? Math.max(lb.radius, Math.asin(Math.min(1 / position.distanceTo(this.frames[0]!.origin), 1))) : lb.radius
        light.glare = lb.glare
      }
      const span = this.patchSpanOf(index)
      skyPatch = smooth(ramp(span[0], span[1], u))
      const lens = this.openOf(index, time)
      const arrive = smoother(ramp(OPEN.arriveFrom[0], OPEN.arriveFrom[1], u))
      const open = mix(lens + (1 - lens) * mix(OPEN.leave.level * smoother(ramp(OPEN.leave.from, OPEN.leave.by, u)), 1, index > 0 ? riseLift(a.id) : 0), 1 - skyPatch, arrive)
      skyLook = mix(bandLook(a.id), bandLook(b.id), bandLook(b.id) < bandLook(a.id) ? skyPatch : smooth(ramp(Math.min(span[0], OPEN.lookFrom), span[1], u)))
      light.sky = mix(light.sky, OPEN.openExposure, open)
      if (index > 0) light.sky *= 1 - SUN_DIM.level * smooth(this.sunSeen(index, time)) * (1 - smoother(ramp(SUN_DIM.back[0], SUN_DIM.back[1], u)))
      skyStars = open
      const leaveWeight = this.leaveWeight(index, u)
      if (index === 0) sunWeight = smooth(ramp(SUN_GLOW_FROM, this.sunSwapSpan[1], u))
      const arriving = state(index + 1, 'orbit')
      if (index > 0 && this.shapes[index]!.look.pin[1] > 0) farLight = Math.pow(smooth(ramp(this.lit[index]!, this.lit[index]! + FAR_LIGHT.frames / ((segment.end - segment.start) * config.fps), u)), FAR_LIGHT.power)
      const midTime = (frame + spanMid()) / config.fps
      if (Math.abs(time - midTime) > 1e-9) {
        const to = arriving.origin.clone().sub(position)
        const px = (Math.asin(Math.min(1 / to.length(), 1)) / THREE.MathUtils.degToRad(pose.vfov)) * 1080
        const steady = this.shapes[index]!.look.steady
        const lock = steady[1] > 0 ? 0 : 1 - smooth(ramp(LOCK_PX[0], LOCK_PX[1], px))
        const still = steady[1] > 0 ? 1 - smooth(ramp(steady[0], steady[1], px)) : 0
        if (still > 0) {
          const mid = this.travelCamera(index, midTime)
          const turn = pose.quaternion.clone().multiply(drift(time)).multiply(mid.quaternion.multiply(drift(midTime)).invert())
          arriving.origin.copy(to.lerp(arriving.origin.clone().sub(mid.position).applyQuaternion(turn), still).add(position))
          arriving.rotation.premultiply(new THREE.Quaternion().slerp(turn, still))
        }
        if (lock > 0) {
          const mid = this.travelCamera(index, midTime)
          const qs = pose.quaternion.clone().multiply(drift(time))
          const seen = to.clone().normalize().applyQuaternion(qs.clone().invert())
          const held = arriving.origin.clone().sub(mid.position).normalize().applyQuaternion(mid.quaternion.multiply(drift(midTime)).invert())
          const r = new THREE.Quaternion().slerp(qs.clone().multiply(new THREE.Quaternion().setFromUnitVectors(seen, held)).multiply(qs.clone().invert()), lock)
          arriving.origin.copy(to.applyQuaternion(r).add(position))
          arriving.rotation.premultiply(r)
        }
      }
      const leaving = state(index, 'orbit', leaveWeight)
      if (index > 0 && leaveWeight > 0 && u >= this.clear[index + 1]!) leaving.origin.copy(position).addScaledVector(forward(pose.quaternion), -SUN_HAND.behind)
      sets = [leaving, arriving]
      const da = position.distanceTo(this.frames[index]!.origin) - 1.2
      const db = position.distanceTo(this.frames[index + 1]!.origin) - 1.2
      near = Math.min(Math.max(0.02 * Math.min(leaveWeight > 0 ? da : db, db), 0.002), 4)
      dustLook = smoother(ramp(DUST_LOOK.span[0], DUST_LOOK.span[1], u)) * (1 - smoother(ramp(DUST_LOOK.span[2], DUST_LOOK.span[3], u)))
      dust = Math.sin(Math.PI * smooth(u)) * (1 - (1 - (index === 0 ? DUST_LOOK.first : DUST_LOOK.level)) * dustLook)
      flare = mix(a.p.light.flare, b.p.light.flare, k)
      const t = this.sky.orbits[b.id]
      if (t) skyTurn = t
    } else {
      const p = this.plans[index]!
      light = this.sunFor(index)
      flare = p.p.light.flare
      if (index === 0) sunWeight = 0
      let view: ViewKind = 'orbit'
      let local: Pose
      if (segment.kind === 'hold') local = p.hold(time - segment.start)
      else if (segment.kind === 'terrain') {
        local = p.terrain(time - segment.start)
        view = 'terrain'
      } else {
        const r: OrbitShot = p.eyeShot(segment.kind === 'dive' ? 'dive' : 'rise', time, forced)
        local = r.pose
        view = r.view
        if (view === 'orbit' && topForced()) local = p.topDown(segment.kind === 'dive' ? 'dive' : 'rise', time, local)
      }
      if ((segment.kind === 'dive' || segment.kind === 'rise') && !p.handsOver) {
        cover.amount = p.coverAmount(segment, time)
        if (p.p.coverHides !== undefined) cover.hides = p.p.coverHides
        const hidden = p.coverHidden(segment, time)
        if (hidden !== undefined) cover.hidden = hidden
        const side = p.coverSide(segment, time)
        const blend = (x: [number, number, number], y?: [number, number, number]): [number, number, number] => (y ? [x[0] + (y[0] - x[0]) * side, x[1] + (y[1] - x[1]) * side, x[2] + (y[2] - x[2]) * side] : x)
        cover.color = blend(p.p.cover, p.p.coverTerrain)
        if (p.p.coverLow) {
          cover.low = blend(p.p.coverLow, p.p.coverLowTerrain)
          if (p.p.coverTop) cover.top = p.p.coverTop[0] + (p.p.coverTop[1] - p.p.coverTop[0]) * side
          cover.horizon = p.horizon(view, local)
          const shell = p.p.coverShell
          if (shell && view === 'orbit') {
            const c = local.position.clone().negate().applyQuaternion(local.quaternion.clone().invert())
            cover.shell = { centre: [c.x, c.y, c.z], inner: shell[0], outer: shell[1] }
          }
          const sea = p.p.coverSea
          if (sea && view === 'terrain') {
            const c = new THREE.Vector3().fromArray(sea.centre).sub(local.position).divideScalar(sea.radius).applyQuaternion(local.quaternion.clone().invert())
            cover.shell = { centre: [c.x, c.y, c.z], inner: sea.edge[0], outer: sea.edge[1] }
          }
          const dt = time - p.coverCenter(segment)
          cover.flow = [0.7 * dt, (segment.kind === 'dive' ? -3 : 3) * dt]
          const k = p.p.coverRush
          if (k) {
            const h = 0.125 / config.fps
            const sign = segment.kind === 'dive' ? 1 : -1
            const c = p.coverCenter(segment)
            const at = (t: number): Pose => (segment.kind === 'dive' ? p.dive(t) : p.rise(t)).pose
            const from = at(sign > 0 ? c : c - 2 * h)
            const v = at(sign > 0 ? c + h : c - h).position.clone().sub(from.position).multiplyScalar(sign).applyQuaternion(from.quaternion.clone().invert())
            const flat = Math.hypot(v.x, v.y)
            const reach = v.z < 0 ? Math.min(flat / -v.z, k.reach) : k.reach
            cover.rush = { focus: flat > 1e-9 ? [(v.x / flat) * reach, (v.y / flat) * reach] : [0, 0], phase: sign * k.speed * dt, billow: k.billow, streak: k.streak, contrast: k.contrast }
          }
        }
      }
      const s = state(index, view)
      if (view === 'terrain') {
        skyGlow = p.p.light.terrainSkyGlow ?? 1
        const t = this.sky.turns[p.id]
        if (t) skyTurn = t
      } else {
        const t = this.sky.orbits[segment.kind === 'rise' && index > 0 ? this.plans[index + 1]?.id ?? config.endingId : p.id]
        if (t) skyTurn = t
      }
      pose = inSet(s, local)
      sets = [s]
      const hand = (segment.kind === 'dive' || segment.kind === 'rise') && p.handsOver ? handoverOf(p.id, segment.kind) : null
      if (hand && view === 'orbit' && (segment.kind === 'dive' || segment.kind === 'rise')) {
        const kind = segment.kind
        const dive = kind === 'dive'
        const carry = p.skyCarryShare(segment, time)
        if (carry !== null && !(carry >= 0 && carry <= 1)) throw new Error(p.id + ': skyCarryShare must lie from 0 to 1')
        const turned = carry ?? skyTurnWeight(segment, time)
        const own = p.skyShare(segment, time)
        if (own && !(own.low >= 0 && own.low <= 1 && (own.high === undefined || (own.high >= 0 && own.high <= 1)))) throw new Error(p.id + ': skyShare must give low and high from 0 to 1')
        skyShare = own ? own.low : skyWeight(segment, time)
        if (own && own.high !== undefined) skyShareHigh = own.high
        if (hand.skyFloor && skyShare > 0) skyFloor = this.skyFloorOf(index, kind, hand.time)
        skyGlow = mix(1, p.p.light.terrainSkyGlow ?? 1, skyShare)
        const low = this.sky.turns[p.id] ?? NO_TURN
        skyTurn = turned <= 0 ? skyTurn : turned >= 1 ? low : skyTurn.clone().slerp(low, turned)
        const f = this.frames[index]!
        if (turned > 0) {
          const from = (dive ? hand.placeFirstFrame : hand.firstFrame) / config.fps
          const to = ((dive ? hand.lastFrame : hand.placeLastFrame) + 1) / config.fps
          const tc = Math.min(Math.max(time, from), to)
          const close = p.closePose(kind, tc)
          const qc = f.rotation.clone().multiply(p.turn(tc)).multiply(p.terrainFrame).multiply(close.quaternion)
          const qt = f.rotation.clone().multiply(p.twin(close, tc).quaternion)
          skyCarry = new THREE.Quaternion().slerp(qc.multiply(qt.invert()), turned)
        }
        const weight = placeWeight(segment, time)
        const horizon = horizonWeight(hand, weight, skyShare)
        if ((weight > 0 || (horizon ?? 0) > 0) && hand.picture) {
          const tw = inSet(s, p.twin(p.closePose(kind, hand.time), time))
          tw.quaternion.multiply(drift(hand.time))
          place = { stop: p.id, kind, weight, frame: handoverFrame(hand), time: hand.time, live: hand.live, twin: tw, centre: s.origin.clone(), radius: 1, scale: hand.place.scale, margin: hand.place.margin, matte: hand.place.matte, valid: hand.place.valid, lens: hand.place.lens, seen: hand.place.seen, maxEnlarge: hand.place.maxEnlarge, enlargeSoft: hand.place.enlargeSoft, limbReachDeg: hand.place.limbReachDeg, limbHoldDeg: hand.place.limbHoldDeg, limbLap: hand.place.limbLap, edgeIn: hand.place.edgeIn, toneIn: hand.place.toneIn }
          if (horizon !== undefined) place.horizon = horizon
        }
      }
      if (segment.kind === 'dive' || segment.kind === 'rise') {
        const share = p.skyTurnShare(segment, time)
        if (share !== null) {
          const high = this.sky.orbits[segment.kind === 'rise' && index > 0 ? this.plans[index + 1]?.id ?? config.endingId : p.id] ?? NO_TURN
          const low = this.sky.turns[p.id] ?? NO_TURN
          skyTurn = share <= 0 ? high : share >= 1 ? low : high.clone().slerp(low, share)
        }
      }
      if (view === 'terrain') {
        near = 0.01
        far = 4000
      } else {
        const d = Math.abs(local.position.length() - 1)
        near = Math.min(Math.max(0.02 * d, p.handsOver ? Math.min(0.0004, 0.2 * d) : 0.0004), 1)
        const low = p.p.light.skyLow
        if (low && segment.kind !== 'hold') light = { ...light, sky: light.sky * (skyShare === undefined ? mix(low[2], 1, smooth(ramp(low[0], low[1], d))) : mix(mix(low[2], 1, smooth(ramp(low[0], low[1], d))), 1, skyShare)) }
        const lift = segment.kind === 'rise' && index > 0 ? riseLift(p.id) : 0
        if (lift > 0) {
          const w = coverWindow(segment)
          const from = p.p.light.skyLiftFrom
          const liftAt = p.skyLiftAt(segment, time)
          if (liftAt !== null && !Number.isFinite(liftAt)) throw new Error(p.id + ': skyLiftAt must give a time')
          const x = smooth(ramp(w ? (from === undefined ? w.lastFrame + 1 : mix(w.centerFrame, w.lastFrame + 1, from)) / config.fps : hand ? hand.time : segment.start, segment.end, liftAt ?? time))
          skyStars = lift * (1 - (1 - x) * (1 - x))
          light = { ...light, sky: mix(light.sky, OPEN.openExposure, skyStars) }
        }
      }
      const gain = p.skyGain(time)
      if (gain !== 1) light = { ...light, sky: light.sky * gain }
    }

    for (const s of sets) s.height = this.heightOver(s, pose)
    pose.quaternion.multiply(drift(time))
    if (cover.amount > 0) light = { ...light, sky: light.sky * this.plans[index]!.skyUnderCover(cover.amount, time) }
    post.exposure = light.exposure
    post.flare = flare
    const sun: SunState = { dir: this.sunWorld.clone(), color: SUN_COLOR, intensity: 3, angularRadius: light.radius, glare: light.glare * sunWeight }
    const out: Shot = { frame, time, segment, u, camera: pose, skyQuaternion: skyCarry ? skyCarry.multiply(pose.quaternion) : pose.quaternion.clone(), skyExposure: light.sky, skyGlow, skyTurn, skyStars, skyPatch, skyLook, near, far, sun, sets, post, cover, dust, farLight, pixel: (2 * Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)) / config.raw.formats.master.height }
    // PLAN F, the one air: by the height of the lens over the stop's own body, in every segment the stop draws that body alone.
    const own = index >= 0 && (segment.kind === 'hold' || segment.kind === 'dive' || segment.kind === 'terrain' || segment.kind === 'rise') ? sets.find((s) => s.id === segment.stop) : undefined
    const air = own ? this.plans[index]!.air(own.height) : null
    if (air) out.air = air
    if (skyShare !== undefined) out.skyShare = skyShare
    if (skyShareHigh !== undefined) out.skyShareHigh = skyShareHigh
    if (skyFloor) out.skyFloor = skyFloor
    if (place) out.place = place
    return out
  }

  // The height of the camera above the unit sphere of a set's body, in radii: the same number whichever view draws the body. The close view's
  // camera is taken through the twin of its stop.
  private heightOver(s: SetState, camera: Pose): number {
    const rel = camera.position.clone().sub(s.origin)
    if (s.view !== 'terrain') return rel.length() - 1
    const p = this.plans[config.stopIds.indexOf(s.id)]!
    return p.twin({ position: rel.applyQuaternion(s.rotation.clone().invert()), quaternion: new THREE.Quaternion(), vfov: camera.vfov }, s.time).position.length() - 1
  }

  private skyFloorOf(index: number, kind: 'dive' | 'rise', time: number): SkyFloor | null {
    const p = this.plans[index]!
    const key = p.id + '|' + kind + '|' + time
    const hit = this.skyFloors.get(key)
    if (hit !== undefined) return hit
    const aim = this.sky?.patches[p.id]?.terrain
    let out: SkyFloor | null = null
    if (aim) {
      const close = p.closePose(kind, time)
      const twin = p.twin(close, time)
      const qc = this.frames[index]!.rotation.clone().multiply(p.turn(time)).multiply(p.terrainFrame).multiply(close.quaternion)
      const turn = this.sky.turns[p.id] ?? NO_TURN
      const nadir = twin.position.clone().normalize().negate().applyQuaternion(twin.quaternion.clone().invert())
      nadir.applyQuaternion(qc).applyQuaternion(turn.clone().invert()).applyQuaternion(this.sky.frame).applyQuaternion(aim.clone().invert())
      out = { nadir, dip: Math.acos(Math.min(1 / twin.position.length(), 1)) }
    }
    if (this.skyFloors.size > 32) this.skyFloors.clear()
    if (out) this.skyFloors.set(key, out)
    return out
  }

  liveShot(c: LiveControl, frame: number): Shot {
    const i = Math.max(config.stopIds.indexOf(c.stop), 0)
    const p = this.plans[i]!
    const seg: Segment = c.view === 'terrain' ? p.seg.terrain : p.seg.hold
    const mid = (seg.start + seg.end) / 2
    const base = this.shotAt(seg.firstFrame + Math.floor(seg.frames / 2), mid)
    const s = base.sets[0]!
    s.time = c.time
    s.local = c.time - p.firstSegment.start
    const local = c.view === 'terrain' ? p.terrain(mid - seg.start) : p.hold(mid - seg.start)
    const turn = new THREE.Quaternion().setFromEuler(new THREE.Euler(c.pitch, c.yaw, 0, 'YXZ'))
    if (c.view === 'terrain') local.quaternion.multiply(turn)
    else {
      local.position.applyQuaternion(turn).multiplyScalar(c.zoom)
      local.quaternion.premultiply(turn)
    }
    base.camera = { position: local.position.applyQuaternion(s.rotation).add(s.origin), quaternion: s.rotation.clone().multiply(local.quaternion), vfov: local.vfov }
    base.skyQuaternion = base.camera.quaternion.clone()
    s.height = this.heightOver(s, base.camera)
    base.frame = frame
    base.time = c.time
    if (c.view === 'orbit') base.near = Math.min(Math.max(0.02 * Math.abs(local.position.length() - 1), 0.0004), 1)
    return base
  }
}
