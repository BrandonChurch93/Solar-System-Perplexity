import * as THREE from 'three'
import { afterAll, describe, expect, it } from 'vitest'
import { config } from '../src/config'
import type { Pose } from '../src/core/types'
import { Bend, type BendShape, type BendStart } from '../src/director/bend'
import type { MoveParams, StopPlan } from '../src/director/moves'
import { coveredParams, coveredPlan, restorePlans } from './lib/covered'

// The bend of a surface view into its rise (ruling d196): across the seam the eye's speed over its own height never dips and the eye
// never goes back the way it came.

const fps = config.fps
const deg = THREE.MathUtils.radToDeg
const X = new THREE.Vector3(1, 0, 0)
const Y = new THREE.Vector3(0, 1, 0)
const Z = new THREE.Vector3(0, 0, 1)

afterAll(() => restorePlans())

const start = (more: Partial<BendStart> = {}): BendStart => ({ time: 4, span: 2, position: new THREE.Vector3(0.3, 0.1, -2), velocity: new THREE.Vector3(0.02, -0.03, -0.2), up: Y.clone(), height: 0.5, step: 1 / (fps * 8), ...more })
const track: BendShape = { acrossDeg: [90, 0], turnDeg: 170 }
const speedAt = (b: Bend, time: number): THREE.Vector3 => b.position(time + 1e-5).sub(b.position(time - 1e-5)).multiplyScalar(1 / 2e-5)

describe('the bend of a path', () => {
  it('begins on the line it came on, without a corner', () => {
    const s = start()
    const b = new Bend(s, track)
    expect(b.position(s.time).toArray()).toEqual(s.position.toArray())
    expect(b.position(s.time - 0.5).distanceTo(s.position.clone().addScaledVector(s.velocity, -0.5))).toBeLessThan(1e-12)
    // The velocity is the path's own where the bend begins, and it has not turned yet a moment later: the turn starts from rest.
    expect(speedAt(b, s.time + 2e-5).distanceTo(s.velocity)).toBeLessThan(1e-5 * s.velocity.length())
    const early = speedAt(b, s.time + 0.02)
    expect(deg(early.angleTo(s.velocity))).toBeLessThan(0.06)
    expect(deg(b.way(s.time + 0.02).angleTo(b.from))).toBeCloseTo(170 * (3 * 1e-4 - 2 * 1e-6), 6)
  })

  it('keeps the share of its height the eye flies a second, at every time of the bend and after it', () => {
    const s = start()
    const b = new Bend(s, track)
    expect(b.rate).toBeCloseTo(s.velocity.length() / s.height, 12)
    for (const since of [0.1, 0.5, 1, 1.5, 1.99, 2.4]) {
      const p = b.position(s.time + since)
      const height = s.height + p.y - s.position.y
      expect(speedAt(b, s.time + since).length() / height).toBeCloseTo(b.rate, 6)
    }
  })

  it('turns the way in one plane, from rest to rest, as far as the stop says', () => {
    const s = start()
    const b = new Bend(s, track)
    const normal = b.from.clone().cross(b.toward)
    expect(b.from.dot(b.toward)).toBeCloseTo(0, 12)
    let last = 0
    for (let i = 0; i <= 40; i++) {
      const time = s.time + (s.span * i) / 40
      const way = b.way(time)
      expect(way.length()).toBeCloseTo(1, 12)
      expect(way.dot(normal)).toBeCloseTo(0, 12)
      const turned = deg(way.angleTo(b.from))
      expect(turned).toBeGreaterThanOrEqual(last - 1e-9)
      last = turned
      // The eye flies where the way points.
      if (i > 0 && i < 40) expect(deg(speedAt(b, time).angleTo(way))).toBeLessThan(0.01)
    }
    expect(last).toBeCloseTo(170, 9)
    expect(deg(b.way(s.time + s.span / 2).angleTo(b.from))).toBeCloseTo(85, 9)
    // After the bend the eye goes on straight.
    expect(b.way(s.time + s.span + 1).toArray()).toEqual(b.way(s.time + s.span).toArray())
    expect(deg(speedAt(b, s.time + s.span + 0.7).angleTo(b.way(s.time + s.span)))).toBeLessThan(1e-3)
    // 180 degrees ends going back along the line the eye came on.
    const back = new Bend(s, { acrossDeg: [90, 0], turnDeg: 180 })
    expect(back.way(s.time + s.span).distanceTo(b.from.clone().negate())).toBeLessThan(1e-12)
  })

  it('counts the track across from the level part of the way: 90 to its right, 270 to its left, elevation up', () => {
    const level = start({ velocity: new THREE.Vector3(0, 0, -0.2) })
    expect(new Bend(level, { acrossDeg: [90, 0], turnDeg: 90 }).toward.distanceTo(X)).toBeLessThan(1e-12)
    expect(new Bend(level, { acrossDeg: [270, 0], turnDeg: 90 }).toward.distanceTo(X.clone().negate())).toBeLessThan(1e-12)
    expect(new Bend(level, { acrossDeg: [0, 90], turnDeg: 90 }).toward.distanceTo(Y)).toBeLessThan(1e-12)
    expect(new Bend(level, { acrossDeg: [90, 45], turnDeg: 90 }).toward.distanceTo(new THREE.Vector3(1, 1, 0).normalize())).toBeLessThan(1e-12)
    // A way that sinks: the track is taken square to the way, in the plane of the way and the direction named.
    const sinking = new Bend(start({ velocity: new THREE.Vector3(0, -0.1, -0.2) }), { acrossDeg: [0, 90], turnDeg: 90 })
    expect(sinking.toward.dot(sinking.from)).toBeCloseTo(0, 12)
    expect(sinking.toward.y).toBeGreaterThan(0)
    expect(sinking.toward.x).toBeCloseTo(0, 12)
    // The ground's up need not be the frame's.
    const tilted = new Bend(start({ velocity: new THREE.Vector3(0.2, 0, 0), up: Z.clone() }), { acrossDeg: [90, 0], turnDeg: 90 })
    expect(tilted.toward.distanceTo(Y.clone().negate())).toBeLessThan(1e-12)
  })

  it('gives the eye at a time whatever was asked before', () => {
    const s = start()
    const times = [s.time + 1.37, s.time + 0.004, s.time + 1.999, s.time + 0.61, s.time + 2.5]
    const used = new Bend(s, track)
    const first = times.map((t) => used.position(t).toArray())
    for (const t of [...times].reverse()) expect(used.position(t).toArray()).toEqual(first[times.indexOf(t)])
    for (const t of times) expect(new Bend(s, track).position(t).toArray()).toEqual(first[times.indexOf(t)])
    // And it is one curve: the sums of a finer step lie on it.
    const fine = new Bend(start({ step: 1 / (fps * 64) }), track)
    for (const t of times) expect(fine.position(t).distanceTo(used.position(t))).toBeLessThan(1e-9)
  })

  it('refuses what it can not fly', () => {
    expect(() => new Bend(start({ span: 0 }), track)).toThrow(/length/)
    expect(() => new Bend(start({ step: 0 }), track)).toThrow(/step/)
    expect(() => new Bend(start({ velocity: new THREE.Vector3() }), track)).toThrow(/moves/)
    expect(() => new Bend(start({ height: 0 }), track)).toThrow(/height/)
    expect(() => new Bend(start(), { acrossDeg: [90, 0], turnDeg: 0 })).toThrow(/turnDeg/)
    expect(() => new Bend(start(), { acrossDeg: [90, 0], turnDeg: 181 })).toThrow(/turnDeg/)
    expect(() => new Bend(start({ velocity: new THREE.Vector3(0, 0, -0.2) }), { acrossDeg: [0, 0], turnDeg: 90 })).toThrow(/acrossDeg/)
    expect(() => new Bend(start({ velocity: new THREE.Vector3(0, 0.2, 0) }), track)).toThrow(/straight up/)
  })
})

// The covered stop on the engine's one move, with a surface view of the engine.
const withBend = (bend?: object): StopPlan => {
  const p = coveredParams()
  return coveredPlan({ terrain: { ...p.terrain, ...(bend ? { bend } : {}) }, handover: { dive: {}, rise: {} } } as Partial<MoveParams>)
}
const span = (plan: StopPlan): number => plan.seg.terrain.end - plan.seg.terrain.start

// The eye of the film round the rise's seam as tools/seam.ts reads it: in the ground's own frame (back through the twin of its own time,
// out through the twin of one fixed time), the way from one capture frame to the next a film frame, over the height above the unit sphere.
function seam(plan: StopPlan, frames: number, before: number, rate = 2): { f: number; speed: number; way: THREE.Vector3; inMove: boolean }[] {
  const at = plan.seg.rise.firstFrame
  const eye = (k: number): THREE.Vector3 => {
    const time = (k + config.shutterFraction / 2) / (fps * rate)
    const pose: Pose = time < plan.seg.rise.start ? plan.twin(plan.terrain(time - plan.seg.terrain.start), time) : plan.eye('rise', time, 'orbit')
    return plan.twin(plan.untwin(pose, time), plan.seg.terrain.start).position
  }
  const out: { f: number; speed: number; way: THREE.Vector3; inMove: boolean }[] = []
  for (let k = (at - before) * rate; k < (at + frames) * rate; k++) {
    const p = eye(k)
    const q = eye(k + 1)
    const way = q.clone().sub(p).multiplyScalar(rate)
    out.push({ f: k / rate, speed: way.length() / ((p.length() + q.length()) / 2 - 1), way, inMove: k / rate >= at })
  }
  return out
}

describe('the bend of the surface view of a stop', () => {
  const shape = { frames: 60, acrossDeg: [90, 0], turnDeg: 170 }

  it('changes nothing before it begins and never the lens', () => {
    const plain = withBend()
    const bent = withBend(shape)
    const dur = span(plain)
    const begin = dur - shape.frames / fps
    for (let i = 0; i <= 200; i++) {
      const t = (dur * i) / 200
      const a = plain.terrain(t)
      const b = bent.terrain(t)
      expect(b.quaternion.toArray()).toEqual(a.quaternion.toArray())
      expect(b.vfov).toBe(a.vfov)
      if (t <= begin) expect(b.position.toArray()).toEqual(a.position.toArray())
    }
    expect(bent.terrain(begin).position.toArray()).toEqual(plain.terrain(begin).position.toArray())
    expect(bent.terrain(begin + 1 / fps).position.distanceTo(plain.terrain(begin + 1 / fps).position)).toBeGreaterThan(0)
    // A stop that names no bend flies the straight path: the same poses whether the key is absent or the plan is built again.
    const again = withBend()
    for (let i = 0; i <= 20; i++) expect(again.terrain((dur * i) / 20).position.toArray()).toEqual(plain.terrain((dur * i) / 20).position.toArray())
  })

  it('reads the ground of the close view through the twin', () => {
    const plan = withBend()
    const here = plan.terrain(span(plan) / 2).position
    const time = plan.seg.terrain.start + span(plan) / 2
    const g = plan.closeGround(here, time)
    expect(g.up.length()).toBeCloseTo(1, 12)
    expect(deg(g.up.angleTo(plan.closeUp().up))).toBeLessThan(0.2)
    const globe = plan.twin({ position: here, quaternion: new THREE.Quaternion(), vfov: 60 }, time).position
    expect(g.height * plan.twinFrame(time).scale).toBeCloseTo(globe.length() - 1, 9)
    // One height up along it doubles the height above the sphere.
    const lifted = plan.twin({ position: here.clone().addScaledVector(g.up, g.height), quaternion: new THREE.Quaternion(), vfov: 60 }, time).position
    expect(lifted.length() - 1).toBeCloseTo(2 * (globe.length() - 1), 9)
  })

  it('cures the dent of the rise: the speed over the height never dips and the eye never goes back', () => {
    const own = (rows: ReturnType<typeof seam>): number => {
      const near = rows.filter((r) => !r.inMove).slice(-4)
      return near.reduce((s, r) => s + r.speed, 0) / near.length
    }
    // Without the bend the surface view pushes into a rise that pulls back: the eye all but stops and turns round.
    const plain = seam(withBend(), 16, 3)
    const lowest = Math.min(...plain.filter((r) => r.inMove).map((r) => r.speed)) / own(plain)
    expect(lowest).toBeLessThan(0.6)
    const way = plain.filter((r) => !r.inMove).slice(-1)[0]!.way
    expect(plain.filter((r) => r.inMove).some((r) => r.way.dot(way) < 0)).toBe(true)
    // With it, to the right and to the left, level and climbing.
    for (const acrossDeg of [[90, 0], [270, 0], [80, 35]]) {
      const rows = seam(withBend({ ...shape, acrossDeg }), 16, shape.frames + 3)
      const view = rows.filter((r) => !r.inMove)
      const move = rows.filter((r) => r.inMove)
      const base = own(rows)
      expect(Math.min(...move.map((r) => r.speed)) / base).toBeGreaterThan(0.995)
      const last = view[view.length - 1]!.way
      for (const r of move) expect(r.way.dot(last)).toBeGreaterThan(0)
      // The surface view itself loses no speed in the bend: no step from one film frame to the next above half a percent of its own.
      for (let i = 2; i < view.length; i++) expect(Math.abs(view[i]!.speed - view[i - 2]!.speed) / base).toBeLessThan(0.008)
      // The rise goes on rising from its first frame.
      for (let i = 1; i < move.length; i++) expect(move[i]!.speed).toBeGreaterThan(move[i - 1]!.speed * 0.999)
    }
  })

  it('names the way the one move alone takes the eye from the seam, and a bend that ends on it meets it', () => {
    const plain = withBend()
    const first = plain.eyeFirstWay('rise')
    expect(first.length()).toBeCloseTo(1, 12)
    const dur = span(plain)
    const way = plain.terrain(dur).position.sub(plain.terrain(dur - 1e-4).position).normalize()
    // The fault the bend cures: the move alone pulls back against the way of the surface view.
    expect(deg(first.angleTo(way))).toBeGreaterThan(150)
    // The bend that ends on that way, as tools/seam.ts prints it.
    const begin = dur - shape.frames / fps
    const up = plain.closeGround(plain.terrain(begin).position, plain.seg.terrain.start + begin).up
    const level = way.clone().addScaledVector(up, -way.dot(up)).normalize()
    const right = level.clone().cross(up).normalize()
    const across = first.clone().addScaledVector(way, -first.dot(way)).normalize()
    const bent = withBend({ frames: shape.frames, acrossDeg: [deg(Math.atan2(across.dot(right), across.dot(level))), deg(Math.asin(across.dot(up)))], turnDeg: deg(first.angleTo(way)) })
    const out = bent.terrain(dur).position.sub(bent.terrain(dur - 1e-4).position).normalize()
    expect(deg(out.angleTo(first))).toBeLessThan(1e-3)
    // From the bent seam the move's own first way has hardly moved.
    expect(deg(bent.eyeFirstWay('rise').angleTo(out))).toBeLessThan(3)
    // The dive has a way of its own into the seam.
    expect(plain.eyeFirstWay('dive').length()).toBeCloseTo(1, 12)
  })

  it('refuses a bend it can not fly, by the name of the stop', () => {
    const fly = (bend: object): Pose => {
      const plan = withBend(bend)
      return plan.terrain(span(plan))
    }
    expect(() => fly({ ...shape, frames: 0 })).toThrow(/mars: frames of terrain.bend/)
    expect(() => fly({ ...shape, frames: 181 })).toThrow(/mars: frames of terrain.bend/)
    expect(() => fly({ frames: 60, turnDeg: 170, acrossDeg: [90] })).toThrow(/mars: terrain.bend needs/)
    expect(() => fly({ ...shape, turnDeg: 200 })).toThrow(/mars: turnDeg/)
    expect(() => fly({ ...shape, acrossDeg: [0, -18.63] })).toThrow(/mars: acrossDeg/)
  })
})
