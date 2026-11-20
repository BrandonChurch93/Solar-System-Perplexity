import * as THREE from 'three'
import { config, type Segment } from '../config'
import type { Director } from '../core/engine'
import type { CoverState, Pose, SetState, Shot, SunState, ViewKind } from '../core/types'
import { defaultPost } from '../post/chain'
import { StopPlan, easeInOut } from './moves'
import { arc, drift, ease, forward, lookAt, mix, ramp, slerpDir, smooth, smoother } from './rig'
import { segmentAtFrame } from './timeline'

export interface StopFrame { rotation: THREE.Quaternion; origin: THREE.Vector3 }

const FAR_FACTOR = 2600
const TURN_END = 0.46
const APPROACH_START = 0.2
const APPROACH_POWER = 2.5
const SWING_FROM = 0.3
const CLEAR_DEG = 3
const SUN_PULL_END = 0.34
const SUN_APPROACH_START = 0.42
const LOOKBACK = { neptuneDeg: 31, aimDeg: 12.5, settleDeg: 4.5, orbitDeg: 3, pullPerSecond: 0.012, distance: 9, rollDeg: 13, vfov: 34, glare: 1.5, flare: 0.22 }
const OFFSET_FROM = 0.15
const Y = new THREE.Vector3(0, 1, 0)
const easeSettle = ease('sine.out')
const SUN_COLOR = new THREE.Color(1, 0.9, 0.72)

export interface LiveControl { stop: string; view: ViewKind; yaw: number; pitch: number; zoom: number; time: number }

export class FilmDirector implements Director {
  readonly plans: StopPlan[]
  readonly frames: StopFrame[] = []
  readonly sunWorld = new THREE.Vector3()
  private readonly approach: THREE.Vector3[] = []
  private readonly reach: number[] = []
  private readonly begin: number[] = []
  private lookbackPose: Pose
  private lookbackUp = new THREE.Vector3()
  private lookbackSun = new THREE.Vector3()
  private sunStart = 1
  private sunSwap = 1

  constructor(plans: StopPlan[]) {
    this.plans = plans
    this.frames.push({ rotation: new THREE.Quaternion(), origin: new THREE.Vector3() })
    this.approach.push(new THREE.Vector3(0, 0, -1))
    this.reach.push(0)
    this.begin.push(0)
    for (let i = 0; i + 1 < plans.length; i++) this.place(i)
    const last = plans.length - 1
    const n = this.plans[last]!
    const s = n.sunDir.clone()
    const axis = new THREE.Vector3().crossVectors(s, Y).normalize()
    const up = axis.clone()
    const toNeptune = s.clone().applyAxisAngle(up, THREE.MathUtils.degToRad(LOOKBACK.neptuneDeg))
    const position = toNeptune.clone().multiplyScalar(-LOOKBACK.distance)
    this.lookbackUp = up
    this.lookbackSun = s
    this.lookbackPose = { position, quaternion: this.lookbackAim(position, 0), vfov: LOOKBACK.vfov }
  }

  private lookbackAim(position: THREE.Vector3, extraDeg: number): THREE.Quaternion {
    const aim = this.lookbackSun.clone().applyAxisAngle(this.lookbackUp, THREE.MathUtils.degToRad(LOOKBACK.aimDeg + extraDeg))
    return lookAt(position, position.clone().add(aim), this.lookbackUp, LOOKBACK.rollDeg)
  }

  private turnEnd(i: number): number {
    return this.plans[i]!.p.travel.turnEnd ?? TURN_END
  }

  private approachLocal(i: number, x: number, time: number): Pose {
    const b = this.plans[i]!
    const hold = b.hold(time - b.seg.hold.start)
    const dh = b.hold(0).position.length()
    const e = 1 - Math.pow(1 - x, b.p.arrive?.power ?? APPROACH_POWER)
    const sigma = dh * (Math.pow(this.reach[i]! / dh, 1 - e) - 1)
    const pose: Pose = { position: hold.position.clone().addScaledVector(forward(hold.quaternion), -sigma), quaternion: hold.quaternion.clone(), vfov: hold.vfov }
    const a = b.p.arrive
    if (a && a.swingDeg !== 0) {
      const left = 1 - smoother(ramp(a.from ?? SWING_FROM, 1, x))
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(a.axis[0], a.axis[1], a.axis[2]).normalize(), THREE.MathUtils.degToRad(a.swingDeg) * left)
      pose.position.applyQuaternion(q)
      pose.quaternion.premultiply(q)
    }
    if (a?.offset) {
      const left = 1 - smoother(ramp(OFFSET_FROM, 1, x))
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
    let best = new THREE.Quaternion()
    let bestCost = Infinity
    const want = THREE.MathUtils.degToRad(a.p.travel.turnDeg)
    for (let k = 0; k < 720; k++) {
      const r = new THREE.Quaternion().setFromAxisAngle(this.sunWorld, (k / 720) * Math.PI * 2).multiply(r0)
      const d = dLocal.clone().applyQuaternion(r)
      let cost: number
      if (i === 0) cost = from.quaternion.angleTo(r.clone().multiply(first.quaternion))
      else {
        const side = new THREE.Vector3().crossVectors(fr, d).dot(camUp)
        cost = Math.abs(fr.angleTo(d) - want) + (side * a.p.travel.side < 0 ? 0.6 : 0)
      }
      if (cost < bestCost) {
        bestCost = cost
        best = r
      }
    }
    const begin = i === 0 ? SUN_APPROACH_START : this.clearAt(i, best, seg)
    this.begin.push(begin)
    const startAt = seg.start + begin * dur
    const at = i === 0 ? this.frames[0]!.origin.clone().addScaledVector(this.sunWorld, -this.sunSwap) : this.toWorld(i, this.leaving(i, startAt)).position
    const origin = at.sub(this.approachLocal(i + 1, 0, startAt).position.applyQuaternion(best))
    this.frames.push({ rotation: best, origin })
    this.approach.push(dLocal.clone().applyQuaternion(best))
  }

  beginOf(i: number): number {
    return this.begin[i] ?? 0
  }

  private sunFor(i: number): { radius: number; glare: number; exposure: number; sky: number } {
    const l = this.plans[i]!.p.light
    return { radius: THREE.MathUtils.degToRad(l.sunRadiusDeg), glare: l.sunGlare, exposure: l.exposure, sky: l.skyExposure }
  }

  shotAt(frame: number, time: number): Shot {
    const segment = segmentAtFrame(frame)
    const u = (time - segment.start) / (segment.end - segment.start)
    const post = defaultPost()
    const cover: CoverState = { amount: 0, color: [1, 1, 1] }
    let pose: Pose
    let sets: SetState[]
    let near = 0.01
    let far = 80000
    let dust = 0
    const dustOffset = new THREE.Vector3()
    let light = this.sunFor(0)
    let sunWeight = 1
    let flare = 0
    const index = config.stopIds.indexOf(segment.stop)
    const state = (i: number, view: ViewKind, weight = 1): SetState => {
      const p = this.plans[i]!
      const f = this.frames[i]!
      const rotation = view === 'terrain' ? f.rotation.clone().multiply(p.turn(time)).multiply(p.terrainFrame) : f.rotation.clone()
      const origin = view === 'terrain' ? p.spot.clone().applyQuaternion(p.turn(time)).applyQuaternion(f.rotation).add(f.origin) : f.origin.clone()
      return { id: p.id, origin, rotation, time, local: time - p.firstSegment.start, segment, u, weight, view }
    }
    const inSet = (s: SetState, p: Pose): Pose => ({ position: p.position.clone().applyQuaternion(s.rotation).add(s.origin), quaternion: s.rotation.clone().multiply(p.quaternion), vfov: p.vfov })

    if (segment.stop === config.endingId) {
      const i = this.plans.length - 1
      const p = this.plans[i]!
      const s = state(i, 'orbit')
      const lb = config.segments.find((x) => x.kind === 'lookback')!
      const look = (t: number): Pose => {
        const left = 1 - easeSettle(ramp(lb.start - 1, config.durationSeconds, t))
        const position = this.lookbackPose.position.clone().multiplyScalar(1 + LOOKBACK.pullPerSecond * (t - lb.start)).applyAxisAngle(this.lookbackUp, THREE.MathUtils.degToRad(LOOKBACK.orbitDeg * left))
        return { position, quaternion: this.lookbackAim(position, LOOKBACK.settleDeg * left), vfov: this.lookbackPose.vfov }
      }
      const arrived = segment.kind === 'retreat' ? smooth(ramp(0.5, 1, u)) : 1
      light = { ...this.sunFor(i), glare: mix(p.p.light.sunGlare, LOOKBACK.glare, arrived) }
      flare = mix(p.p.light.flare, LOOKBACK.flare, arrived)
      if (segment.kind === 'retreat') {
        const a = p.exitPose(time)
        const b = look(time)
        const w = smoother(ramp(0, 1, u))
        const wp = easeInOut(u)
        const dir = slerpDir(a.position.clone().normalize(), b.position.clone().normalize(), wp)
        const dist = a.position.length() * Math.pow(b.position.length() / a.position.length(), wp)
        const local: Pose = { position: dir.multiplyScalar(dist), quaternion: a.quaternion.clone().slerp(b.quaternion, w), vfov: mix(a.vfov, b.vfov, w) }
        pose = inSet(s, local)
        dust = Math.sin(Math.PI * u) * 0.6
        dustOffset.copy(forward(pose.quaternion)).multiplyScalar(-6 * wp)
      } else {
        pose = inSet(s, look(time))
        if (segment.kind === 'fade') post.fade = frame >= config.frameCount - 1 ? 0 : 1 - smooth(ramp(segment.start, segment.end - 2 / config.fps, time))
      }
      sets = [s]
      near = 0.2
    } else if (segment.kind === 'travel' && index + 1 < this.plans.length) {
      const a = this.plans[index]!
      const b = this.plans[index + 1]!
      const from = this.toWorld(index, this.leaving(index, time))
      const begin = this.begin[index + 1]!
      const to = this.toWorld(index + 1, this.approachLocal(index + 1, ramp(begin, 1, u), time))
      if (index === 0) {
        const g = easeInOut(ramp(0, SUN_PULL_END, u))
        const radial = this.frames[0]!.origin.clone().addScaledVector(this.sunWorld, -this.sunStart * Math.pow(this.sunSwap / this.sunStart, g))
        from.position.lerp(radial, smooth(u / 0.12))
      }
      const position = u < begin ? from.position.clone() : to.position.clone()
      const quaternion = from.quaternion.clone().slerp(to.quaternion, easeInOut(ramp(0, this.turnEnd(index), u)))
      pose = { position, quaternion, vfov: mix(from.vfov, to.vfov, smooth(u)) }
      const la = this.sunFor(index)
      const lb = this.sunFor(index + 1)
      const k = smooth(ramp(0.25, 0.8, u))
      light = { radius: mix(la.radius, lb.radius, k), glare: mix(la.glare, lb.glare, k), exposure: mix(la.exposure, lb.exposure, k), sky: mix(la.sky, lb.sky, k) }
      const leaveWeight = index === 0 ? 1 - smooth(ramp(0.3, 0.42, u)) : u < begin ? 1 : 0
      if (index === 0) sunWeight = smooth(ramp(0.3, 0.42, u))
      sets = [state(index, 'orbit', leaveWeight), state(index + 1, 'orbit')]
      const da = position.distanceTo(this.frames[index]!.origin) - 1.2
      const db = position.distanceTo(this.frames[index + 1]!.origin) - 1.2
      near = Math.min(Math.max(0.02 * Math.min(leaveWeight > 0 ? da : db, db), 0.002), 4)
      dust = Math.sin(Math.PI * smooth(u))
      dustOffset.copy(this.approach[index + 1]!).multiplyScalar(-28 * smoother(ramp(0.1, 1, u)))
      flare = mix(a.p.light.flare, b.p.light.flare, k)
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
        const r = segment.kind === 'dive' ? p.dive(time) : p.rise(time)
        local = r.pose
        view = r.view
        cover.amount = p.coverAmount(segment, time)
        cover.color = p.p.cover
      }
      const s = state(index, view)
      pose = inSet(s, local)
      sets = [s]
      if (view === 'terrain') {
        near = 0.01
        far = 4000
      } else {
        const d = Math.abs(local.position.length() - 1)
        near = Math.min(Math.max(0.02 * d, 0.0004), 1)
      }
    }

    pose.quaternion.multiply(drift(time))
    post.exposure = light.exposure
    post.flare = flare
    const sun: SunState = { dir: this.sunWorld.clone(), color: SUN_COLOR, intensity: 3, angularRadius: light.radius, glare: light.glare * sunWeight }
    return { frame, time, segment, u, camera: pose, skyQuaternion: pose.quaternion.clone(), skyExposure: light.sky, near, far, sun, sets, post, cover, dust, dustOffset }
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
    base.frame = frame
    base.time = c.time
    if (c.view === 'orbit') base.near = Math.min(Math.max(0.02 * Math.abs(local.position.length() - 1), 0.0004), 1)
    return base
  }
}
