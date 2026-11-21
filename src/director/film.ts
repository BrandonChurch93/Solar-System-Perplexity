import * as THREE from 'three'
import { config, type Segment } from '../config'
import type { Director } from '../core/engine'
import type { CoverState, Pose, SetState, Shot, SunState, ViewKind } from '../core/types'
import { defaultPost } from '../post/chain'
import { StopPlan, easeInOut } from './moves'
import { arc, drift, forward, lookAt, mix, ramp, slerpDir, smooth, smoother } from './rig'
import { segmentAtFrame } from './timeline'
import skyFrame from '../space/skyframe.json'
import { aimAt, type SkyAims } from '../space/aim'
import { TravelShape, inFrame } from '../space/travel/path'

const NO_TURN = new THREE.Quaternion()

export interface StopFrame { rotation: THREE.Quaternion; origin: THREE.Vector3 }

const FAR_FACTOR = 2600
const TURN_END = 0.46
const APPROACH_START = 0.2
const APPROACH_POWER = 2.5
const SWING_FROM = 0.3
const CLEAR_DEG = 3
const SUN_PULL_END = 0.34
const SUN_APPROACH_START = 0.42
const LOOKBACK = { neptuneDeg: 44, neptunePerSecond: 0.4, aimDeg: 14, aimPerSecond: -1.6, liftDeg: 0, distance: 5.6, pullPerSecond: 0.015, rollDeg: 13, rollPerSecond: 0.4, vfov: 34, glare: 3, flare: 0.35, sky: [0, 35, -5] as [number, number, number], skyExposure: 1 }
const OFFSET_FROM = 0.15
const BOW_REACH = 24
const RETREAT_DUST = 0.18
const LOCK_PX: [number, number] = [3, 40]
const Y = new THREE.Vector3(0, 1, 0)
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
  private readonly shapes: TravelShape[] = []
  private lookbackUp = new THREE.Vector3()
  private lookbackSun = new THREE.Vector3()
  private sunStart = 1
  private sunSwap = 1
  sky: SkyAims = { frame: new THREE.Quaternion(), turns: {}, orbits: {}, patches: {}, fitted: { frame: 0, terrainFrame: 0 }, anchor: '' }

  constructor(plans: StopPlan[]) {
    this.plans = plans
    this.frames.push({ rotation: new THREE.Quaternion(), origin: new THREE.Vector3() })
    this.approach.push(new THREE.Vector3(0, 0, -1))
    this.reach.push(0)
    this.begin.push(0)
    for (let i = 0; i + 1 < plans.length; i++) this.place(i)
    for (let i = 0; i + 1 < plans.length; i++) {
      const id = plans[i]!.id
      let shape = new TravelShape(id)
      let clear = i === 0 ? SUN_APPROACH_START : this.clearOf(i, shape)
      if (i > 0 && clear > shape.look.clearBy) {
        const tries: { shape: TravelShape; clear: number; off: number }[] = []
        for (let b = -BOW_REACH; b <= BOW_REACH; b += 2) {
          const t = new TravelShape(id, { bowDeg: b })
          tries.push({ shape: t, clear: this.clearOf(i, t), off: Math.abs(b - shape.look.bowDeg) })
        }
        const limit = Math.max(shape.look.clearBy, Math.min(...tries.map((t) => t.clear)) + 0.02)
        const pick = tries.filter((t) => t.clear <= limit).sort((p, q) => p.off - q.off)[0]
        if (pick) {
          shape = pick.shape
          clear = pick.clear
        }
      }
      this.shapes.push(shape)
      this.clear.push(clear)
    }
    const last = plans.length - 1
    const n = this.plans[last]!
    const s = n.sunDir.clone()
    const axis = new THREE.Vector3().crossVectors(s, Y).normalize()
    const up = axis.clone()
    this.lookbackUp = up
    this.lookbackSun = s
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
    const out: SkyAims = { frame: round(f), turns: {}, orbits: {}, patches: {}, fitted: { frame, terrainFrame: judged(a.tstop + '.terrain')! }, anchor: a.stop }
    const own = this.plans.map((p, i): THREE.Quaternion | null | undefined => {
      if (p.id === a.stop) return null
      const hold = judged(p.id + '.hold')
      const want = p.p.skyAim?.orbit
      if (!want || hold === null || this.plans[i - 1]?.id === a.stop) return undefined
      return round(cam(hold).multiply(aimAt(want[0], want[1], want[2]).invert()).multiply(f))
    })
    let carry: THREE.Quaternion | null = null
    this.plans.forEach((p, i) => {
      const hold = judged(p.id + '.hold')
      const terrain = judged(p.id + '.terrain')
      const want = p.id === a.tstop ? [a.talong, a.ttilt, a.tlift] : p.p.skyAim?.terrain
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
    if (back !== null) out.orbits[config.endingId] = round(cam(back).multiply(aimAt(LOOKBACK.sky[0], LOOKBACK.sky[1], LOOKBACK.sky[2]).invert()).multiply(f))
    return out
  }

  private lookback(t: number): Pose {
    const lb = config.segments.find((x) => x.kind === 'lookback')!
    const s = t - (lb.start + lb.end) / 2
    const rad = THREE.MathUtils.degToRad
    const up = this.lookbackUp
    const position = this.lookbackSun.clone().applyAxisAngle(up, rad(LOOKBACK.neptuneDeg + LOOKBACK.neptunePerSecond * s)).multiplyScalar(-LOOKBACK.distance * Math.exp(LOOKBACK.pullPerSecond * s))
    const flat = this.lookbackSun.clone().applyAxisAngle(up, rad(LOOKBACK.aimDeg + LOOKBACK.aimPerSecond * s))
    const aim = flat.clone().applyAxisAngle(new THREE.Vector3().crossVectors(flat, up).normalize(), rad(LOOKBACK.liftDeg))
    return { position, quaternion: lookAt(position, position.clone().add(aim), up, LOOKBACK.rollDeg + LOOKBACK.rollPerSecond * s), vfov: LOOKBACK.vfov }
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

  clearOf(i: number, shape: TravelShape): number {
    const a = this.plans[i]!
    const seg = a.seg.travel!
    const dur = seg.end - seg.start
    const master = config.formats[config.formatKeys.master]!
    const steps = 600
    for (let k = 1; k < steps; k++) {
      const u = k / steps
      const time = seg.start + u * dur
      const from = this.toWorld(i, this.leaving(i, time))
      const to = this.toWorld(i + 1, this.approachLocal(i + 1, 0, time, shape))
      const q = shape.turn(from.quaternion, to.quaternion, u)
      if (!this.leavingThings(i, time).some((t) => inFrame(q, from.vfov, master.width / master.height, t.to, t.radius, shape.look.clearDeg))) return u
    }
    return 1 - 1 / steps
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

  private travelCamera(index: number, time: number): Pose {
    const seg = this.plans[index]!.seg.travel!
    const u = (time - seg.start) / (seg.end - seg.start)
    const from = this.toWorld(index, this.leaving(index, time))
    const shape = this.shapes[index]!
    const x = ramp(this.clear[index + 1]!, 1, u)
    const to = this.toWorld(index + 1, this.approachLocal(index + 1, x, time, shape))
    const start = this.toWorld(index + 1, this.approachLocal(index + 1, 0, time, shape))
    if (index === 0) {
      const g = easeInOut(ramp(0, SUN_PULL_END, u))
      const radial = this.frames[0]!.origin.clone().addScaledVector(this.sunWorld, -this.sunStart * Math.pow(this.sunSwap / this.sunStart, g))
      from.position.lerp(radial, smooth(u / 0.12))
    }
    const position = to.position.clone().addScaledVector(from.position.clone().sub(start.position), shape.settleLeft(x))
    return { position, quaternion: shape.turn(from.quaternion, to.quaternion, u), vfov: mix(from.vfov, to.vfov, smooth(u)) }
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
    let skyGlow = 1
    let skyTurn = NO_TURN
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
      const look = (t: number): Pose => this.lookback(t)
      const arrived = segment.kind === 'retreat' ? smooth(ramp(0.5, 1, u)) : 1
      light = { ...this.sunFor(i), glare: mix(p.p.light.sunGlare, LOOKBACK.glare, arrived), sky: mix(p.p.light.skyExposure, LOOKBACK.skyExposure, arrived) }
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
        dust = Math.pow(Math.sin(Math.PI * u), 2) * RETREAT_DUST
        dustOffset.copy(forward(pose.quaternion)).multiplyScalar(-6 * wp)
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
      const begin = this.clear[index + 1]!
      pose = this.travelCamera(index, time)
      const position = pose.position
      const la = this.sunFor(index)
      const lb = this.sunFor(index + 1)
      const k = smooth(ramp(0.25, 0.8, u))
      light = { radius: mix(la.radius, lb.radius, k), glare: mix(la.glare, lb.glare, k), exposure: mix(la.exposure, lb.exposure, k), sky: mix(la.sky, lb.sky, k) }
      const leaveWeight = index === 0 ? 1 - smooth(ramp(0.3, 0.42, u)) : u < begin ? 1 : 0
      if (index === 0) sunWeight = smooth(ramp(0.3, 0.42, u))
      const arriving = state(index + 1, 'orbit')
      const midTime = (frame + config.shutterFraction * 0.5) / config.fps
      if (Math.abs(time - midTime) > 1e-9) {
        const to = arriving.origin.clone().sub(position)
        const px = (Math.asin(Math.min(1 / to.length(), 1)) / THREE.MathUtils.degToRad(pose.vfov)) * 1080
        const lock = 1 - smooth(ramp(LOCK_PX[0], LOCK_PX[1], px))
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
      sets = [state(index, 'orbit', leaveWeight), arriving]
      const da = position.distanceTo(this.frames[index]!.origin) - 1.2
      const db = position.distanceTo(this.frames[index + 1]!.origin) - 1.2
      near = Math.min(Math.max(0.02 * Math.min(leaveWeight > 0 ? da : db, db), 0.002), 4)
      dust = Math.sin(Math.PI * smooth(u))
      dustOffset.copy(this.approach[index + 1]!).multiplyScalar(-28 * smoother(ramp(0.1, 1, u)))
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
        const r = segment.kind === 'dive' ? p.dive(time) : p.rise(time)
        local = r.pose
        view = r.view
        cover.amount = p.coverAmount(segment, time)
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
      if (view === 'terrain') {
        near = 0.01
        far = 4000
      } else {
        const d = Math.abs(local.position.length() - 1)
        near = Math.min(Math.max(0.02 * d, 0.0004), 1)
        const low = p.p.light.skyLow
        if (low && segment.kind !== 'hold') light = { ...light, sky: light.sky * mix(low[2], 1, smooth(ramp(low[0], low[1], d))) }
      }
    }

    pose.quaternion.multiply(drift(time))
    if (cover.amount > 0) light = { ...light, sky: light.sky * Math.pow(1 - cover.amount, 2) }
    post.exposure = light.exposure
    post.flare = flare
    const sun: SunState = { dir: this.sunWorld.clone(), color: SUN_COLOR, intensity: 3, angularRadius: light.radius, glare: light.glare * sunWeight }
    return { frame, time, segment, u, camera: pose, skyQuaternion: pose.quaternion.clone(), skyExposure: light.sky, skyGlow, skyTurn, near, far, sun, sets, post, cover, dust, dustOffset }
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
