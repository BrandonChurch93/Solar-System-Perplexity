import * as THREE from 'three'
import { afterAll, describe, expect, it } from 'vitest'
import raw from '../config/showcase.json'
import { buildConfig, config } from '../src/config'
import type { Pose } from '../src/core/types'
import { handoverOf } from '../src/director/handover'
import type { StopPlan } from '../src/director/moves'
import { coveredPlan, restorePlans } from './lib/covered'

const fps = config.fps
const c = config.raw.handover
const L = c.limits
const kinds = ['dive', 'rise'] as const
const mid = (frame: number): number => (frame + config.shutterFraction / 2) / fps
const height = (p: Pose): number => p.position.length() - 1
const globe = (plan: StopPlan, kind: 'dive' | 'rise', time: number): Pose => (kind === 'dive' ? plan.divePose(time, 'orbit') : plan.risePose(time, 'orbit'))

// The roll of the horizon in the picture and where it lies, in half frame heights above the middle.
function horizon(p: Pose): { tiltDeg: number; above: number } {
  const out = p.position.clone().normalize()
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quaternion)
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(p.quaternion)
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(p.quaternion)
  const pitch = Math.asin(Math.min(Math.max(dir.dot(out), -1), 1))
  const dip = Math.acos(1 / p.position.length())
  return { tiltDeg: THREE.MathUtils.radToDeg(Math.atan2(out.dot(right), out.dot(up))), above: Math.tan(-dip - pitch) / Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2) }
}

// A horizon counts once it lies inside the frame and the camera is low enough for it to be a line and not the edge of a globe.
const lineDip = THREE.MathUtils.degToRad(25)
const lined = (p: Pose): boolean => Math.abs(horizon(p).above) < 1 && Math.acos(1 / p.position.length()) < lineDip

interface Aim { centre: THREE.Vector3; ahead: THREE.Vector3 }
const aim = (plan: StopPlan, kind: 'dive' | 'rise', time: number): Aim => (plan as unknown as { target(kind: string, at: number, time: number): Aim }).target(kind, handoverOf(plan.id, kind)!.time, time)

// Which way the heading of the close side at T points in the picture, in degrees from straight up, and how far the camera stands off the upright plane through the place that holds that heading.
function heading(plan: StopPlan, kind: 'dive' | 'rise', time: number): { inPictureDeg: number; offPlaneDeg: number } {
  const p = globe(plan, kind, time)
  const { centre, ahead } = aim(plan, kind, time)
  const inv = p.quaternion.clone().invert()
  const a = centre.clone().sub(p.position).applyQuaternion(inv)
  const b = centre.clone().addScaledVector(ahead, 1e-4).sub(p.position).applyQuaternion(inv)
  const off = p.position.clone().sub(centre)
  const side = new THREE.Vector3().crossVectors(centre, ahead).normalize()
  return { inPictureDeg: THREE.MathUtils.radToDeg(Math.atan2(b.x / -b.z - a.x / -a.z, b.y / -b.z - a.y / -a.z)), offPlaneDeg: THREE.MathUtils.radToDeg(Math.asin(off.dot(side) / off.length())) }
}

// The far part of a line: frames from the first frame to T in a dive, from T to the last frame in a rise.
function farRates(plan: StopPlan, kind: 'dive' | 'rise'): { rates: number[]; mean: number; first: number } {
  const s = plan.seg[kind]!
  const h = handoverOf(plan.id, kind)!
  const T = Math.floor(h.time * fps + 1e-9)
  const first = kind === 'dive' ? s.firstFrame : T
  const last = kind === 'dive' ? T : s.endFrame - 1
  const sign = kind === 'dive' ? 1 : -1
  const rates: number[] = []
  for (let f = first + 1; f <= last; f++) rates.push(sign * Math.log(height(globe(plan, kind, mid(f - 1))) / height(globe(plan, kind, mid(f)))))
  return { rates, mean: rates.reduce((a, b) => a + b, 0) / rates.length, first }
}

function velocity(at: (t: number) => Pose, time: number, dt: number): { v: THREE.Vector3; turn: number; climb: number } {
  const a = at(time)
  const b = at(time + dt)
  return { v: b.position.clone().sub(a.position).divideScalar(dt), turn: a.quaternion.angleTo(b.quaternion) / Math.abs(dt), climb: Math.log(height(b) / height(a)) / dt }
}

afterAll(() => restorePlans())

describe('the numbers of the path in the config', () => {
  it('are refused when they do not fit', () => {
    const clone = (): typeof raw => JSON.parse(JSON.stringify(raw)) as typeof raw
    expect(() => buildConfig(clone())).not.toThrow()
    for (const name of ['descent', 'ascent'] as const) {
      const a = clone()
      a.handover[name].rise = 0.8
      expect(() => buildConfig(a)).toThrow(new RegExp('handover.' + name + '.rise'))
      const b = clone()
      b.handover[name].turnFall = 0
      expect(() => buildConfig(b)).toThrow(new RegExp('handover.' + name + '.turnRise'))
      const d = clone() as unknown as { handover: Record<string, Record<string, unknown>> }
      d.handover[name]!.level = 1
      expect(() => buildConfig(d)).toThrow(new RegExp('handover.' + name + '.level must'))
      const e = clone()
      e.handover[name].levelBy = 0
      expect(() => buildConfig(e)).toThrow(new RegExp('handover.' + name + '.levelBy'))
      const f = clone() as unknown as { handover: Record<string, Record<string, unknown>> }
      delete f.handover[name]!.levelBy
      expect(() => buildConfig(f)).toThrow(new RegExp('missing key handover.' + name + '.levelBy'))
    }
    const z = clone()
    z.handover.zenithDeg = [8, 2]
    expect(() => buildConfig(z)).toThrow(/zenithDeg/)
    const k = clone()
    k.handover.coastFrames = -1
    expect(() => buildConfig(k)).toThrow(/coastFrames/)
    for (const [key, bad] of [['maxBlurPx', 0], ['blurEaseFrames', -1], ['blurEaseFrames', 1.5]] as const) {
      const b = clone() as unknown as { handover: Record<string, unknown> }
      b.handover[key] = bad
      expect(() => buildConfig(b)).toThrow(/maxBlurPx/)
      const gone = clone() as unknown as { handover: Record<string, unknown> }
      delete gone.handover[key]
      expect(() => buildConfig(gone)).toThrow(new RegExp('missing key handover.' + key))
    }
    const f = clone()
    f.handover.skyFloor.featherDeg = 0
    expect(() => buildConfig(f)).toThrow(/skyFloor/)
  })
})

describe('the steady descent of the generic plan', () => {
  it('changes height by a ratio that never spikes, picks up early, holds steady and never turns back', () => {
    const plan = coveredPlan({ handover: {} })
    for (const kind of kinds) {
      const { rates, mean } = farRates(plan, kind)
      expect(mean).toBeGreaterThan(0)
      for (const r of rates) {
        expect(r).toBeLessThanOrEqual(c.maxRateOverMean * mean)
        expect(r).toBeGreaterThanOrEqual(-L.backRate * mean)
      }
      for (let i = 1; i < rates.length; i++) expect(Math.abs(rates[i]! - rates[i - 1]!)).toBeLessThan(0.25 * mean)
      const steps = rates.length
      const fifth = Math.ceil(steps * L.earlyShare)
      const early = kind === 'dive' ? rates[fifth - 1]! : rates[steps - fifth]!
      expect(early).toBeGreaterThanOrEqual(L.earlyRateOverMean * mean)
      const path = plan.handoverPath(kind)
      const x = (i: number): number => (kind === 'dive' ? (i + 0.5) / steps : 1 - (i + 0.5) / steps)
      const flat = rates.filter((_, i) => x(i) > path.rise + 0.05 && x(i) < 1 - path.fall - 0.05)
      expect(flat.length).toBeGreaterThan(steps * 0.3)
      expect(Math.max(...flat) - Math.min(...flat)).toBeLessThan(0.02 * mean)
    }
  })

  it('leaves the hold in its last pose and at its speed, and joins the travel that follows the same way', () => {
    const plan = coveredPlan({ handover: {} })
    const dt = 1e-5
    const dive = plan.seg.dive!
    const held = (t: number): Pose => plan.hold(t - plan.seg.hold.start)
    const a = globe(plan, 'dive', dive.start)
    const b = held(dive.start)
    expect(a.position.distanceTo(b.position)).toBeLessThan(1e-9)
    expect(a.quaternion.angleTo(b.quaternion)).toBeLessThan(1e-6)
    expect(a.vfov).toBeCloseTo(b.vfov, 9)
    const va = velocity((t) => globe(plan, 'dive', t), dive.start, dt)
    const vb = velocity(held, dive.start, dt)
    expect(va.v.distanceTo(vb.v)).toBeLessThan(0.02 * vb.v.length())
    expect(Math.abs(va.turn - vb.turn)).toBeLessThan(0.02 * vb.turn + 1e-6)
    const rise = plan.seg.rise
    const e = globe(plan, 'rise', rise.end)
    const f = plan.after(rise.end)
    expect(e.position.distanceTo(f.position)).toBeLessThan(1e-9)
    expect(e.quaternion.angleTo(f.quaternion)).toBeLessThan(1e-6)
    expect(e.vfov).toBeCloseTo(f.vfov, 9)
    const ve = velocity((t) => globe(plan, 'rise', t), rise.end, -dt)
    const vf = velocity((t) => plan.after(t), rise.end, -dt)
    expect(ve.v.distanceTo(vf.v)).toBeLessThan(0.02 * vf.v.length())
    expect(Math.abs(ve.turn - vf.turn)).toBeLessThan(0.02 * vf.turn + 1e-6)
  })

  it('is the twin at T with the speed, the turn rate and the climb of the close side carried onto the sphere', () => {
    const plan = coveredPlan({ handover: {} })
    const dt = 1e-5
    for (const kind of kinds) {
      const h = handoverOf(plan.id, kind)!
      const twin = (t: number): Pose => plan.twin(plan.closePose(kind, t), t)
      const at = globe(plan, kind, h.time)
      const tw = twin(h.time)
      expect(at.position.distanceTo(tw.position)).toBeLessThan(1e-12)
      expect(at.quaternion.angleTo(tw.quaternion)).toBeLessThan(1e-7)
      expect(at.vfov).toBe(tw.vfov)
      const far = kind === 'dive' ? -dt : dt
      const g = velocity((t) => globe(plan, kind, t), h.time, far)
      const k = velocity(twin, h.time, far)
      expect(g.v.distanceTo(k.v)).toBeLessThan(1e-3 * k.v.length())
      expect(Math.abs(g.turn - k.turn)).toBeLessThan(1e-3 * k.turn + 1e-6)
      expect(Math.abs(g.climb - k.climb)).toBeLessThan(1e-3 * Math.abs(k.climb) + 1e-6)
      const on = velocity((t) => globe(plan, kind, t), h.time, -far)
      const close = velocity(twin, h.time, -far)
      expect(on.v.distanceTo(close.v)).toBeLessThan(1e-9)
    }
  })

  it('keeps the place in the middle of the frame on the way down and moves it without a jump', () => {
    const plan = coveredPlan({ handover: {} })
    const s = plan.seg.dive!
    const h = handoverOf(plan.id, 'dive')!
    const master = config.formats[config.formatKeys.master]!
    const aspect = master.width / master.height
    let last: [number, number] | null = null
    for (let f = s.firstFrame; f <= h.placeFirstFrame; f++) {
      const p = globe(plan, 'dive', mid(f))
      const rel = plan.place('dive', mid(f)).sub(p.position).applyQuaternion(p.quaternion.clone().invert())
      expect(rel.z).toBeLessThan(0)
      const t = Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)
      const at: [number, number] = [rel.x / -rel.z / t / aspect, rel.y / -rel.z / t]
      if (f >= s.firstFrame + Math.ceil((Math.floor(h.time * fps) - s.firstFrame) * L.earlyShare)) expect(Math.max(Math.abs(at[0]), Math.abs(at[1]))).toBeLessThan(L.placeMiddle)
      if (last) expect(Math.hypot(at[0] - last[0], at[1] - last[1])).toBeLessThan(0.01)
      last = at
    }
  })
})

describe('the level horizon of a glide', () => {
  const span = (plan: StopPlan, kind: 'dive' | 'rise'): [number, number] => {
    const s = plan.seg[kind]!
    const T = Math.floor(handoverOf(plan.id, kind)!.time * fps + 1e-9)
    return kind === 'dive' ? [s.firstFrame, T] : [T, s.endFrame - 1]
  }
  const worst = (plan: StopPlan, kind: 'dive' | 'rise'): { tilt: number; frames: number } => {
    const [first, last] = span(plan, kind)
    const low = horizon(globe(plan, kind, handoverOf(plan.id, kind)!.time)).tiltDeg
    let tilt = 0
    let frames = 0
    for (let f = first; f <= last; f++) {
      const p = globe(plan, kind, mid(f))
      if (!lined(p)) continue
      frames++
      tilt = Math.max(tilt, Math.abs(horizon(p).tiltDeg - low))
    }
    return { tilt, frames }
  }

  it('shows the horizon level on every frame that holds it, down to T and up from T, where a plain glide tilts it', () => {
    const level = coveredPlan({ handover: {} })
    const plain = coveredPlan({ handover: { dive: { path: { level: false } }, rise: { path: { level: false } } } })
    for (const kind of kinds) {
      expect(level.handoverPath(kind).level).toBe(true)
      expect(plain.handoverPath(kind).level).toBe(false)
      const l = worst(level, kind)
      expect(l.frames).toBeGreaterThan(8)
      expect(l.tilt).toBeLessThan(1)
      expect(worst(plain, kind).tilt).toBeGreaterThan(10)
    }
    for (const plan of [level, plain]) {
      const s = plan.seg.dive!
      const h = handoverOf(plan.id, 'dive')!
      const a = globe(plan, 'dive', s.start)
      const b = plan.hold(s.start - plan.seg.hold.start)
      expect(a.position.distanceTo(b.position)).toBeLessThan(1e-9)
      expect(a.quaternion.angleTo(b.quaternion)).toBeLessThan(1e-6)
      const t = globe(plan, 'dive', h.time)
      const tw = plan.twin(plan.closePose('dive', h.time), h.time)
      expect(t.position.distanceTo(tw.position)).toBeLessThan(1e-12)
    }
  })

  it('flies in the upright plane of the heading while the place picture shows, so the picture neither turns nor slides sideways', () => {
    const plan = coveredPlan({ handover: {} })
    for (const kind of kinds) {
      const h = handoverOf(plan.id, kind)!
      const at = heading(plan, kind, h.time)
      expect(Math.abs(at.offPlaneDeg)).toBeLessThan(1e-6)
      for (let f = h.placeFirstFrame; f <= h.placeLastFrame; f++) {
        const g = heading(plan, kind, mid(f))
        expect(Math.abs(g.offPlaneDeg)).toBeLessThan(0.5)
        expect(Math.abs(g.inPictureDeg - at.inPictureDeg)).toBeLessThan(2)
      }
    }
  })

  it('turns the picture one way only: the swing about the place and the roll of the far pose are spent together', () => {
    const plan = coveredPlan({ handover: {} })
    for (const kind of kinds) {
      const [first, last] = span(plan, kind)
      const turns: number[] = []
      for (let f = first; f <= last; f++) turns.push(heading(plan, kind, mid(f)).inPictureDeg)
      const far = kind === 'dive' ? turns[0]! : turns[turns.length - 1]!
      const low = kind === 'dive' ? turns[turns.length - 1]! : turns[0]!
      const lo = Math.min(far, low) - 3
      const hi = Math.max(far, low) + 3
      for (const t of turns) {
        expect(t).toBeGreaterThan(lo)
        expect(t).toBeLessThan(hi)
      }
      for (let i = 1; i < turns.length; i++) expect(Math.abs(turns[i]! - turns[i - 1]!)).toBeLessThan(8)
    }
  })

  it('turns the camera by no jump between two frames, on the way down and on the way up', () => {
    const plan = coveredPlan({ handover: {} })
    for (const kind of kinds) {
      const s = plan.seg[kind]!
      let last: Pose | null = null
      let before = 0
      for (let f = s.firstFrame; f < s.endFrame; f++) {
        const p = globe(plan, kind, mid(f))
        if (last) {
          const turn = THREE.MathUtils.radToDeg(last.quaternion.angleTo(p.quaternion))
          expect(turn).toBeLessThan(8)
          if (f > s.firstFrame + 1) expect(Math.abs(turn - before)).toBeLessThan(1)
          before = turn
        }
        last = p
      }
    }
  })

  it('swings a far pose into the upright plane of the heading, and keeps the plain turn of one that stands over the place', () => {
    const plan = coveredPlan({ handover: {} })
    const h = handoverOf(plan.id, 'dive')!
    const { centre, ahead } = aim(plan, 'dive', h.time)
    const side = new THREE.Vector3().crossVectors(centre, ahead).normalize()
    const inner = plan as unknown as { swing(kind: string, at: number, far: Pose, centre: THREE.Vector3, ahead: THREE.Vector3): number; unrolled(far: Pose, centre: THREE.Vector3, ahead: THREE.Vector3): number }
    const rad = THREE.MathUtils.degToRad
    const pose = (polarDeg: number, azimuthDeg: number, rollDeg: number): Pose => {
      const out = centre.clone().multiplyScalar(Math.cos(rad(polarDeg))).addScaledVector(ahead, Math.sin(rad(polarDeg)) * Math.cos(rad(azimuthDeg))).addScaledVector(side, Math.sin(rad(polarDeg)) * Math.sin(rad(azimuthDeg)))
      const position = centre.clone().addScaledVector(out, 2)
      const look = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(position, centre, ahead))
      return { position, quaternion: look.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rad(rollDeg))), vfov: 30 }
    }
    const [from, to] = c.zenithDeg as [number, number]
    for (const [polar, azimuth, roll] of [[to + 22, 70, 20], [to + 52, -150, -35], [to + 4, 100, 0]] as const) {
      const far = pose(polar, azimuth, roll)
      const swing = inner.swing('dive', h.time, far, centre, ahead)
      const back = far.position.clone().applyQuaternion(new THREE.Quaternion().setFromAxisAngle(centre, -swing)).sub(centre)
      expect(Math.abs(back.dot(side)) / back.length()).toBeLessThan(1e-9)
      expect(Math.abs(swing)).toBeLessThanOrEqual(Math.PI + 1e-9)
    }
    const over = pose(from * 0.5, 80, 25)
    expect(inner.swing('dive', h.time, over, centre, ahead)).toBeCloseTo(inner.unrolled(over, centre, ahead), 12)
    const between = pose((from + to) / 2, 80, 25)
    const part = inner.swing('dive', h.time, between, centre, ahead)
    const plainTurn = inner.unrolled(between, centre, ahead)
    const full = inner.swing('dive', h.time, pose(to + 1, 80, 25), centre, ahead)
    expect(Math.abs(part - plainTurn)).toBeGreaterThan(1e-3)
    expect(Math.abs(part - plainTurn)).toBeLessThan(Math.abs(full - plainTurn) + 0.2)
  })
})

describe('the path options of a stop', () => {
  it('come from the config unless the stop gives its own, per kind', () => {
    const plain = coveredPlan({ handover: {} })
    expect(plain.handoverPath('dive')).toEqual({ rise: c.descent.rise, fall: c.descent.fall, turnRise: c.descent.turnRise, turnFall: c.descent.turnFall, level: c.descent.level, levelBy: c.descent.levelBy })
    expect(plain.handoverPath('rise')).toEqual({ rise: c.ascent.rise, fall: c.ascent.fall, turnRise: c.ascent.turnRise, turnFall: c.ascent.turnFall, level: c.ascent.level, levelBy: c.ascent.levelBy })
    const own = coveredPlan({ handover: { dive: { path: { turnFall: 0.25, level: false } }, rise: { path: { rise: 0.1, fall: 0.5, levelBy: 0.3 } } } })
    expect(own.handoverPath('dive')).toEqual({ rise: c.descent.rise, fall: c.descent.fall, turnRise: c.descent.turnRise, turnFall: 0.25, level: false, levelBy: c.descent.levelBy })
    expect(own.handoverPath('rise')).toEqual({ rise: 0.1, fall: 0.5, turnRise: c.ascent.turnRise, turnFall: c.ascent.turnFall, level: c.ascent.level, levelBy: 0.3 })
    const s = own.seg.dive!
    const h = handoverOf(own.id, 'dive')!
    const t = mid(Math.floor((s.firstFrame + Math.floor(h.time * fps)) / 2))
    expect(globe(own, 'dive', t).position.distanceTo(globe(coveredPlan({ handover: {} }), 'dive', t).position)).toBeGreaterThan(1e-4)
  })

  it('are refused when a pair of shares does not fit', () => {
    for (const path of [{ rise: 0.6, fall: 0.5 }, { fall: 0 }, { turnRise: 0.5, turnFall: 0.6 }, { turnFall: 0 }, { rise: -0.1 }, { turnRise: -0.1 }, { levelBy: 0 }, { levelBy: 1.2 }]) {
      const plan = coveredPlan({ handover: { dive: { path } } })
      expect(() => plan.handoverPath('dive')).toThrow(/handover path/)
      expect(() => plan.handoverPath('rise')).not.toThrow()
    }
  })
})

describe('the sidestep of a path', () => {
  const step = { right: -0.15, up: 0.05, by: 0.11 }
  const master = config.formats[config.formatKeys.master]!

  it('starts at rest in the far pose, is complete at its share of the way and moves the camera where it was asked to', () => {
    const plain = coveredPlan({ handover: {} })
    const own = coveredPlan({ handover: { dive: { path: { sidestep: step } } } })
    expect(own.handoverPath('dive').sidestep).toEqual(step)
    expect(own.handoverPath('rise').sidestep).toBeUndefined()
    const s = own.seg.dive!
    const h = handoverOf(own.id, 'dive')!
    const dt = 1e-5
    const a = globe(own, 'dive', s.start)
    const b = globe(plain, 'dive', s.start)
    expect(a.position.distanceTo(b.position)).toBeLessThan(1e-9)
    expect(a.quaternion.angleTo(b.quaternion)).toBeLessThan(1e-6)
    const va = velocity((t) => globe(own, 'dive', t), s.start, dt)
    const vb = velocity((t) => globe(plain, 'dive', t), s.start, dt)
    expect(va.v.distanceTo(vb.v)).toBeLessThan(0.02 * vb.v.length())
    const at = s.start + step.by * (h.time - s.start)
    const moved = globe(own, 'dive', at).position.sub(globe(plain, 'dive', at).position)
    const far = plain.hold(at - plain.seg.hold.start)
    const want = new THREE.Vector3(step.right, step.up, 0).applyQuaternion(far.quaternion)
    expect(moved.length()).toBeGreaterThan(0.6 * want.length())
    expect(moved.length()).toBeLessThan(1.05 * want.length())
    expect(moved.clone().normalize().dot(want.clone().normalize())).toBeGreaterThan(0.95)
    const aspect = master.width / master.height
    const seen = (plan: StopPlan, t: number): [number, number] => {
      const p = globe(plan, 'dive', t)
      const rel = plan.place('dive', t).sub(p.position).applyQuaternion(p.quaternion.clone().invert())
      const k = Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)
      return [rel.x / -rel.z / k / aspect, rel.y / -rel.z / k]
    }
    let last: Pose | null = null
    for (let f = s.firstFrame; f <= Math.floor(h.time * fps); f++) {
      const [x, y] = seen(own, mid(f))
      const [px, py] = seen(plain, mid(f))
      expect(Math.hypot(x - px, y - py)).toBeLessThan(0.02)
      const p = globe(own, 'dive', mid(f))
      if (last) expect(THREE.MathUtils.radToDeg(last.quaternion.angleTo(p.quaternion))).toBeLessThan(8)
      last = p
    }
    const end = globe(own, 'dive', h.time)
    const tw = own.twin(own.closePose('dive', h.time), h.time)
    expect(end.position.distanceTo(tw.position)).toBeLessThan(1e-12)
    expect(end.quaternion.angleTo(tw.quaternion)).toBeLessThan(1e-7)
  })

  it('is the mirror in a rise: nothing where the travel takes over, complete towards T', () => {
    const plain = coveredPlan({ handover: {} })
    const own = coveredPlan({ handover: { rise: { path: { sidestep: step } } } })
    const s = own.seg.rise
    const h = handoverOf(own.id, 'rise')!
    expect(globe(own, 'rise', s.end).position.distanceTo(globe(plain, 'rise', s.end).position)).toBeLessThan(1e-9)
    const at = s.end - step.by * (s.end - h.time)
    expect(globe(own, 'rise', at).position.distanceTo(globe(plain, 'rise', at).position)).toBeGreaterThan(0.05)
    const end = globe(own, 'rise', h.time)
    const tw = own.twin(own.closePose('rise', h.time), h.time)
    expect(end.position.distanceTo(tw.position)).toBeLessThan(1e-12)
    const d = plain.seg.dive!
    for (let f = d.firstFrame; f < d.firstFrame + 12; f++) expect(globe(own, 'dive', mid(f)).position.distanceTo(globe(plain, 'dive', mid(f)).position)).toBe(0)
  })

  it('is refused when its share or its amounts do not fit', () => {
    for (const sidestep of [{ right: 0.1, up: 0, by: 0 }, { right: 0.1, up: 0, by: 1.5 }, { right: Number.NaN, up: 0, by: 0.2 }, { right: 0, up: Number.POSITIVE_INFINITY, by: 0.2 }]) {
      const plan = coveredPlan({ handover: { dive: { path: { sidestep } } } })
      expect(() => plan.handoverPath('dive')).toThrow(/sidestep/)
      expect(() => plan.handoverPath('rise')).not.toThrow()
    }
  })
})

describe('the coast of the close side past T', () => {
  it('is the close pose at T, leaves it at its own speed and turn, and stays within the reach the config gives', () => {
    const plan = coveredPlan({ handover: {} })
    const dt = 1e-5
    for (const kind of kinds) {
      const h = handoverOf(plan.id, kind)!
      const at = plan.closePose(kind, h.time)
      const co = plan.coast(kind, h.time)
      expect(co.position.distanceTo(at.position)).toBeLessThan(1e-12)
      expect(co.quaternion.angleTo(at.quaternion)).toBeLessThan(1e-7)
      expect(co.vfov).toBe(at.vfov)
      const far = kind === 'dive' ? -dt : dt
      const cv = velocity((t) => plan.coast(kind, t), h.time, far)
      const kv = velocity((t) => plan.closePose(kind, t), h.time, far)
      expect(cv.v.distanceTo(kv.v)).toBeLessThan(1e-3 * kv.v.length())
      expect(Math.abs(cv.turn - kv.turn)).toBeLessThan(1e-3 * kv.turn + 1e-6)
      const span = c.coastFrames / fps
      const speed = kv.v.length()
      const s = plan.seg[kind]!
      let most = 0
      for (let f = s.firstFrame; f < s.endFrame; f++) {
        const p = plan.coast(kind, mid(f))
        const gone = p.position.distanceTo(at.position)
        expect(gone).toBeLessThanOrEqual(speed * span * (1 + 1e-3))
        expect(gone).toBeLessThanOrEqual(speed * Math.abs(mid(f) - h.time) * (1 + 1e-3) + 1e-12)
        expect(p.quaternion.angleTo(at.quaternion)).toBeLessThanOrEqual(kv.turn * span * (1 + 1e-3) + 1e-9)
        most = Math.max(most, gone)
      }
      expect(most).toBeGreaterThan(0.9 * speed * span)
    }
  })
})

describe('a rise that leaves from the eye of the dive', () => {
  const power = 2.2
  const lead = { handover: { rise: { path: { fromDive: power } } } }

  it('stands at T where the twin of the dive stood, with its look and its field, and the globe side takes over there', () => {
    const own = coveredPlan(lead)
    const h = handoverOf(own.id, 'rise')!
    const d = handoverOf(own.id, 'dive')!
    const at = own.closePose('rise', h.time)
    const from = own.closePose('dive', d.time)
    expect(at.position.distanceTo(from.position)).toBeLessThan(1e-12)
    expect(at.quaternion.angleTo(from.quaternion)).toBeLessThan(1e-7)
    expect(at.vfov).toBe(from.vfov)
    const tw = own.twin(at, h.time)
    expect(globe(own, 'rise', h.time).position.distanceTo(tw.position)).toBeLessThan(1e-12)
    const onBody = (p: Pose, time: number): THREE.Vector3 => p.position.clone().applyQuaternion(own.turn(time).invert())
    expect(onBody(tw, h.time).distanceTo(onBody(own.twin(from, d.time), d.time))).toBeLessThan(1e-12)
  })

  it('starts as the own close path of the stop at its own speed, and passes T moving away from that path at the rate its power gives', () => {
    const plain = coveredPlan({ handover: {} })
    const own = coveredPlan(lead)
    const s = own.seg.rise
    const h = handoverOf(own.id, 'rise')!
    const d = handoverOf(own.id, 'dive')!
    const dt = 1e-5
    for (const t of [s.start - 0.2, s.start]) expect(JSON.stringify(own.closePose('rise', t))).toBe(JSON.stringify(plain.closePose('rise', t)))
    const v0 = velocity((t) => own.closePose('rise', t), s.start, dt)
    const p0 = velocity((t) => plain.closePose('rise', t), s.start, dt)
    expect(v0.v.distanceTo(p0.v)).toBeLessThan(1e-3 * p0.v.length())
    const to = own.closePose('dive', d.time)
    const gap = to.position.clone().sub(plain.closePose('rise', h.time).position)
    expect(gap.length()).toBeGreaterThan(0)
    for (const far of [-dt, dt]) {
      const kv = velocity((t) => own.closePose('rise', t), h.time, far)
      expect(kv.v.distanceTo(gap.clone().multiplyScalar(power / (h.time - s.start)))).toBeLessThan(1e-3 * kv.v.length())
    }
    let last = Number.POSITIVE_INFINITY
    const half = Math.ceil((s.firstFrame + Math.floor(h.time * fps)) / 2)
    for (let f = half; f <= Math.floor(h.time * fps); f++) {
      const gone = own.closePose('rise', Math.min(mid(f), h.time)).position.distanceTo(to.position)
      expect(gone).toBeLessThan(last)
      last = gone
    }
  })

  it('leaves the close path of the rise and every pose of the dive untouched when the stop does not ask for it', () => {
    const plain = coveredPlan({ handover: {} })
    const own = coveredPlan(lead)
    const other = coveredPlan({ handover: { rise: { path: { levelBy: c.ascent.levelBy } } } })
    const s = plain.seg.rise
    const d = plain.seg.dive!
    for (let f = s.firstFrame; f < s.endFrame; f += 3) expect(JSON.stringify(other.closePose('rise', mid(f)))).toBe(JSON.stringify(plain.closePose('rise', mid(f))))
    for (let f = d.firstFrame; f < d.endFrame; f += 3) for (const view of ['orbit', 'terrain'] as const) expect(JSON.stringify(own.divePose(mid(f), view))).toBe(JSON.stringify(plain.divePose(mid(f), view)))
  })

  it('is refused on a dive, under a power of 1 and without a number', () => {
    expect(() => handoverOf(coveredPlan({ handover: { dive: { path: { fromDive: 2 } } } }).id, 'dive')).toThrow(/fromDive/)
    for (const fromDive of [0.5, 0, Number.NaN, Number.POSITIVE_INFINITY]) expect(() => handoverOf(coveredPlan({ handover: { rise: { path: { fromDive } } } }).id, 'rise')).toThrow(/fromDive/)
    expect(() => handoverOf(coveredPlan(lead).id, 'rise')).not.toThrow()
  })
})
