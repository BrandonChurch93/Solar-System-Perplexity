import * as THREE from 'three'
import { afterAll, describe, expect, it } from 'vitest'
import { config } from '../src/config'
import type { Pose } from '../src/core/types'
import { handoverOf } from '../src/director/handover'
import { plumbOf, plumbTurn, type MoveParams, type StopPlan } from '../src/director/moves'
import { bellShare } from '../src/director/pace'
import { plans } from '../src/director/plans'
import { coveredPlan, ownPath, restorePlans } from './lib/covered'

// path.plumb of a dive and a rise: the glide carries the angle of the body's centre off the camera's upright plane from the far end's to
// the near end's by the share its attitude turns with. Off unless the stop asks; it turns the camera and nothing else.

const fps = config.fps
const kinds = ['dive', 'rise'] as const
const DEG = 180 / Math.PI
const handover = (dive: object, rise: object): Partial<MoveParams> => ({ handover: { dive, rise } }) as Partial<MoveParams>
// The times the film and the capture draw: the middle of the shutter of every whole frame and of every half frame.
const times = (first: number, end: number, step = 0.5): number[] => {
  const out: number[] = []
  for (let f = first; f < end; f += step) out.push((f + config.shutterFraction / 2) / fps)
  return out
}
const far = (p: StopPlan, kind: 'dive' | 'rise', t: number): Pose => (kind === 'dive' ? p.hold(t - p.seg.hold.start) : p.after(t))
// The near end of the one move at a time: the surface view carried on from the seam, as the glide is handed it.
const near = (p: StopPlan, kind: 'dive' | 'rise', t: number): Pose => p.twin((p as unknown as { eyeCoast(kind: string, time: number): Pose }).eyeCoast(kind, t), t)
const beyond = (v: number, a: number, b: number): number => Math.max(Math.min(a, b) - v, v - Math.max(a, b), 0)
const pose = (position: [number, number, number], quaternion: THREE.Quaternion): { position: THREE.Vector3; quaternion: THREE.Quaternion } => ({ position: new THREE.Vector3(...position), quaternion })
const about = (x: number, y: number, z: number, angle: number): THREE.Quaternion => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(x, y, z), angle)

afterAll(() => {
  ownPath(false)
  restorePlans()
})

describe('the plumb of a pose', () => {
  it('is the angle of the body centre off the upright plane of the camera: the pan far out, the roll over the ground, none where the ball hangs plumb', () => {
    // Far out, the centre on the line of sight.
    expect(plumbOf(pose([0, 0, 5], new THREE.Quaternion()))).toBe(0)
    // A pan to the left about the camera's up puts the centre to the right by the angle of the pan, at any distance.
    for (const a of [0.3, -0.2, 1.1, 1e-6]) {
      expect(plumbOf(pose([0, 0, 5], about(0, 1, 0, a)))).toBeCloseTo(a, 12)
      expect(plumbOf(pose([0, 0, 1.0004], about(0, 1, 0, a)))).toBeCloseTo(a, 12)
    }
    // A tilt up or down leaves the centre in the upright plane.
    for (const a of [0.4, -0.9]) expect(Math.abs(plumbOf(pose([0, 0, 5], about(1, 0, 0, a))))).toBeLessThan(1e-15)
    // Over the ground, level flight, the centre straight under the camera: none; a roll about the line of sight is the plumb, against it.
    expect(Math.abs(plumbOf(pose([0, 1.05, 0], new THREE.Quaternion())))).toBeLessThan(1e-15)
    for (const a of [0.25, -0.6]) expect(plumbOf(pose([0, 1.05, 0], about(0, 0, 1, a)))).toBeCloseTo(-a, 12)
    // The centre over the camera counts as under it does.
    expect(Math.abs(plumbOf(pose([0, -1.05, 0], new THREE.Quaternion())))).toBeLessThan(1e-15)
  })

  it('is set by the least turn: the wanted angle to the last bit of a double, a turn of the difference and no more, the centre moved straight across the plane', () => {
    const eyes: [number, number, number][] = [[0, 0, 5], [0.4, 1.02, -0.3], [-2, 0.5, 1.5], [0.1, -1.3, 0.2], [1.001, 0.02, 0.01]]
    const turns = [new THREE.Quaternion(), about(0, 1, 0, 0.4), about(0.3, -0.5, 0.81, 1.9).normalize(), about(1, 0.2, -0.4, -2.6).normalize(), about(0, 0, 1, 0.7)]
    let checked = 0
    for (const e of eyes) {
      for (const q of turns) {
        const before = plumbOf(pose(e, q))
        const c0 = new THREE.Vector3(...e).negate().applyQuaternion(q.clone().invert()).normalize()
        if (Math.hypot(c0.y, c0.z) < 0.05) continue
        for (const want of [0, 0.2, -0.35, before, before + 1e-7]) {
          const t = plumbTurn(new THREE.Vector3(...e), q, want)
          const after = q.clone().multiply(t)
          expect(plumbOf(pose(e, after))).toBeCloseTo(want, 12)
          expect(2 * Math.atan2(Math.hypot(t.x, t.y, t.z), Math.abs(t.w))).toBeCloseTo(Math.abs(want - before), 12)
          // The axis is square to the camera's right: nothing of the turn is a tilt of the line of sight up or down.
          expect(Math.abs(t.x)).toBe(0)
          // The direction of the centre along the upright plane stays: it moved straight to or from the plane.
          const c1 = new THREE.Vector3(...e).negate().applyQuaternion(after.clone().invert()).normalize()
          expect(Math.atan2(c1.y, -c1.z)).toBeCloseTo(Math.atan2(c0.y, -c0.z), 12)
          checked++
        }
        expect(plumbTurn(new THREE.Vector3(...e), q, before).w).toBe(1)
      }
    }
    expect(checked).toBeGreaterThan(80)
    // The centre on the camera's right axis: there is no such axis, and no turn.
    const none = plumbTurn(new THREE.Vector3(-3, 0, 0), new THREE.Quaternion(), 0.2)
    expect([none.x, none.y, none.z, none.w]).toEqual([0, 0, 0, 1])
  })
})

describe('path.plumb of a dive and a rise', () => {
  const plain = coveredPlan(handover({}, {}))
  const both = coveredPlan(handover({ path: { plumb: true } }, { path: { plumb: true } }))

  it('is off unless the stop asks, for each side alone, and a stop that does not ask flies the poses it flew', () => {
    for (const kind of kinds) {
      expect(plain.handoverPath(kind).plumb).toBeUndefined()
      expect(both.handoverPath(kind).plumb).toBe(true)
    }
    const dive = coveredPlan(handover({ path: { plumb: true } }, {}))
    const rise = coveredPlan(handover({}, { path: { plumb: true } }))
    expect([dive.handoverPath('dive').plumb === true, dive.handoverPath('rise').plumb === true]).toEqual([true, false])
    expect([rise.handoverPath('dive').plumb === true, rise.handoverPath('rise').plumb === true]).toEqual([false, true])
    // Every stop of the film has what its own params say and nothing else.
    for (const p of plans.filter((x) => x.handsOver)) for (const kind of kinds) expect(p.handoverPath(kind).plumb === true, p.id + ' ' + kind).toBe(p.p.handover?.[kind]?.path?.plumb === true)
    // Named false is not named, and the side that did not ask is the plain one, to the bit, in both views.
    const named = coveredPlan(handover({ path: { plumb: false } }, { path: { plumb: false } }))
    for (const kind of kinds) expect(named.handoverPath(kind).plumb).toBeUndefined()
    for (const kind of kinds) {
      const s = plain.seg[kind]!
      const other = kind === 'dive' ? rise : dive
      for (const t of times(s.firstFrame, s.endFrame, 3.5)) {
        for (const view of ['orbit', 'terrain'] as const) {
          expect(JSON.stringify(named.eye(kind, t, view))).toBe(JSON.stringify(plain.eye(kind, t, view)))
          expect(JSON.stringify(other.eye(kind, t, view))).toBe(JSON.stringify(plain.eye(kind, t, view)))
        }
      }
    }
  })

  it('on the one move is the mix of the two ends as they stand, by the share of the turn, at every whole and half frame, where the plain glide swells', () => {
    expect(both.engineMove).toBe(true)
    const swell = { dive: 0, rise: 0 }
    for (const kind of kinds) {
      const s = plain.seg[kind]!
      const law = both.eyeLaw(kind)
      let moved = 0
      for (const t of times(s.firstFrame, s.endFrame)) {
        const x = kind === 'dive' ? (t - s.start) / (s.end - s.start) : (s.end - t) / (s.end - s.start)
        const a = plumbOf(far(both, kind, t))
        const b = plumbOf(near(both, kind, t))
        const share = bellShare(x, law.turn)
        const got = plumbOf(both.eye(kind, t, 'orbit'))
        expect(Math.abs(got - (a + (b - a) * share)), kind + ' at ' + t).toBeLessThan(1e-9)
        expect(beyond(got, a, b)).toBeLessThan(1e-9)
        swell[kind] = Math.max(swell[kind], beyond(plumbOf(plain.eye(kind, t, 'orbit')), a, b) * DEG)
        moved = Math.max(moved, Math.abs(a - b) * DEG)
        // The close view draws the same eye through the twin, so it has the same plumb.
        expect(Math.abs(plumbOf(both.twin(both.eye(kind, t, 'terrain'), t)) - got)).toBeLessThan(1e-6)
      }
      // The two ends differ, so the mix is a carry and not a constant.
      expect(moved).toBeGreaterThan(0.3)
    }
    // What it is for: without it the covered dive leaves the span of its two ends by 2 degrees and the rise by more than 6.
    expect(swell.dive).toBeGreaterThan(1.5)
    expect(swell.rise).toBeGreaterThan(5)
  })

  it('turns the camera and nothing else: the eye and the lens of the plain glide, a turn of the difference of the plumb and no more, both ends on the neighbours', () => {
    for (const kind of kinds) {
      const s = plain.seg[kind]!
      let turned = 0
      for (const t of times(s.firstFrame, s.endFrame)) {
        const a = plain.eye(kind, t, 'orbit')
        const b = both.eye(kind, t, 'orbit')
        expect(JSON.stringify(b.position)).toBe(JSON.stringify(a.position))
        expect(b.vfov).toBe(a.vfov)
        const angle = a.quaternion.angleTo(b.quaternion)
        expect(Math.abs(angle - Math.abs(plumbOf(b) - plumbOf(a)))).toBeLessThan(1e-7)
        turned = Math.max(turned, angle * DEG)
      }
      expect(turned).toBeGreaterThan(1.5)
      // Where the move leaves the far end and where it meets the surface view it stands on the plain glide, which stands on its neighbours.
      for (const t of [s.start + 1e-7, s.end - 1e-7]) expect(plain.eye(kind, t, 'orbit').quaternion.angleTo(both.eye(kind, t, 'orbit').quaternion) * DEG).toBeLessThan(1e-4)
      // And it leaves and meets them at rest: what the plumb turns the camera by against the plain glide grows over the first and the
      // last frame of the segment by less than a hundredth of what it grows by over its fastest frame.
      const own = (t: number): THREE.Quaternion => plain.eye(kind, t, 'orbit').quaternion.clone().invert().multiply(both.eye(kind, t, 'orbit').quaternion)
      const frames = Math.round((s.end - s.start) * fps)
      const grown: number[] = []
      for (let i = 0; i < frames; i++) grown.push(own(s.start + i / fps + 1e-7).angleTo(own(s.start + (i + 1) / fps - 1e-7)))
      const fastest = Math.max(...grown)
      expect(fastest * DEG).toBeGreaterThan(0.1)
      expect(grown[0]! / fastest).toBeLessThan(0.01)
      expect(grown[frames - 1]! / fastest).toBeLessThan(0.01)
    }
  })

  it('on the path of a class is carried by the same glide, between the two ends at every frame the glide flies', () => {
    ownPath(true)
    try {
      const flat = coveredPlan(handover({}, {}))
      const hung = coveredPlan(handover({ path: { plumb: true } }, { path: { plumb: true } }))
      expect(hung.engineMove).toBe(false)
      for (const kind of kinds) {
        const s = flat.seg[kind]!
        const T = handoverOf(flat.id, kind)!.time
        let count = 0
        for (const t of times(s.firstFrame, s.endFrame)) {
          const a = flat.eye(kind, t, 'orbit')
          const b = hung.eye(kind, t, 'orbit')
          expect(JSON.stringify(b.position)).toBe(JSON.stringify(a.position))
          // The close side of T is the close path of the class, which the glide does not fly: the same pose with and without.
          if (kind === 'dive' ? t >= T : t <= T) {
            expect(JSON.stringify(b)).toBe(JSON.stringify(a))
            continue
          }
          const f = plumbOf(far(hung, kind, t))
          const n = plumbOf(hung.twin(hung.coast(kind, t), t))
          expect(beyond(plumbOf(b), f, n), kind + ' at ' + t).toBeLessThan(1e-9)
          count++
        }
        expect(count).toBeGreaterThan(20)
      }
    } finally {
      ownPath(false)
    }
  })
})
