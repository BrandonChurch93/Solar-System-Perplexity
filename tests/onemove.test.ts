import * as THREE from 'three'
import { afterAll, afterEach, describe, expect, it } from 'vitest'
import raw from '../config/showcase.json'
import { buildConfig, config } from '../src/config'
import type { Pose } from '../src/core/types'
import { applyProbe, parseProbe, probeString } from '../src/diagnostics/probe'
import { FilmDirector } from '../src/director/film'
import { forceOneMove, oneMoveForced } from '../src/director/handover'
import { StopPlan, type MoveParams } from '../src/director/moves'
import { bellStep, paceLimits, paceOf } from '../src/director/pace'
import { plans } from '../src/director/plans'
import { COVERED, coveredPlan, filmWith, restorePlans } from './lib/covered'

// Plan E: the engine's one move. One eye from the far end to the surface view, on one bell shaped rate, drawn by both views.

const fps = config.fps
const kinds = ['dive', 'rise'] as const
const own = config.raw.handover.ownPath as string[]
const handing = plans.filter((p) => p.handsOver)
const mars = plans.find((p) => p.id === 'mars')!
const deg = (a: THREE.Quaternion, b: THREE.Quaternion): number => THREE.MathUtils.radToDeg(a.angleTo(b))
const high = (p: Pose): number => p.position.length() - 1
// The times the film and the capture draw: the middle of the shutter of every whole frame and of every half frame.
const times = (first: number, end: number, step = 0.5): number[] => {
  const out: number[] = []
  for (let f = first; f < end; f += step) out.push((f + config.shutterFraction / 2) / fps)
  return out
}
const handover = (dive: object, rise: object): Partial<MoveParams> => ({ handover: { dive, rise } }) as Partial<MoveParams>

afterEach(() => forceOneMove(false))
afterAll(() => {
  applyProbe(null)
  restorePlans()
})

describe('the one move of the engine', () => {
  it('is the path of every stop that hands over and is not named in handover.ownPath, and of every one of them when the harness asks', () => {
    for (const p of plans) expect(p.engineMove).toBe(p.handsOver && !own.includes(p.id))
    expect(mars.engineMove).toBe(true)
    expect(coveredPlan().engineMove).toBe(false)
    expect(coveredPlan(handover({}, {})).engineMove).toBe(true)
    forceOneMove(true)
    expect(oneMoveForced()).toBe(true)
    for (const p of plans) expect(p.engineMove).toBe(p.handsOver)
    forceOneMove(false)
    for (const p of plans) expect(p.engineMove).toBe(p.handsOver && !own.includes(p.id))
    // The harness reaches it with one word of --diag, and the word comes back out of the probe.
    const probe = parseProbe('beauty/onemove')
    expect(probe.oneMove).toBe(true)
    expect(probeString(probe)).toBe('beauty/onemove')
    expect(() => parseProbe('beauty/onemove=1')).toThrow(/unknown diagnostic option/)
    applyProbe(probe)
    expect(oneMoveForced()).toBe(true)
    applyProbe(parseProbe('beauty'))
    expect(oneMoveForced()).toBe(false)
  })

  it('cannot be replaced by the class of a stop: none of them defines the eye, its shot, its height, its law, its flanks or the switch', () => {
    for (const p of plans) {
      for (let proto = Object.getPrototypeOf(p) as object | null; proto && proto !== StopPlan.prototype; proto = Object.getPrototypeOf(proto) as object | null) {
        for (const name of ['eye', 'eyeShot', 'eyeHeight', 'eyeLaw', 'eyeFlanks', 'engineMove', 'eyeOrbit', 'eyeCoast', 'eyeSeam', 'eyeSwing', 'eyeSeamTime', 'glide', 'closePose']) expect(Object.prototype.hasOwnProperty.call(proto, name), p.id + ' defines ' + name).toBe(false)
      }
    }
  })

  it('is one eye: the close view draws the camera of the globe taken back through the twin, at every whole and half frame', () => {
    forceOneMove(true)
    for (const p of handing) {
      for (const kind of kinds) {
        const s = p.seg[kind]
        if (!s) continue
        for (const t of times(s.firstFrame, s.endFrame, 2.5)) {
          const globe = p.eye(kind, t, 'orbit')
          const close = p.eye(kind, t, 'terrain')
          const back = p.twin(close, t)
          expect(back.position.distanceTo(globe.position) / Math.max(high(globe), 1e-6), p.id + ' ' + kind).toBeLessThan(1e-6)
          expect(deg(back.quaternion, globe.quaternion)).toBeLessThan(1e-5)
          expect(back.vfov).toBe(globe.vfov)
          // The shot of the film is the same eye in the view it draws, or in the view the harness forces.
          expect(JSON.stringify(p.eyeShot(kind, t, 'orbit').pose)).toBe(JSON.stringify(globe))
          expect(JSON.stringify(p.eyeShot(kind, t, 'terrain').pose)).toBe(JSON.stringify(close))
          const drawn = p.eyeShot(kind, t)
          expect(JSON.stringify(drawn.pose)).toBe(JSON.stringify(drawn.view === 'orbit' ? globe : close))
          expect(JSON.stringify(p.closePose(kind, t))).toBe(JSON.stringify(close))
          expect(p.eyeHeight(t)).toBeCloseTo(high(globe), 12)
        }
      }
    }
  })

  it('does not move when T moves: the share of the segment at which the picture changes sides is not read by the path', () => {
    const early = coveredPlan(handover({ at: 0.5 }, { at: 0.5 }))
    const late = coveredPlan(handover({ at: 0.9 }, { at: 0.1 }))
    for (const kind of kinds) {
      const s = early.seg[kind]!
      for (const t of times(s.firstFrame, s.endFrame, 3.5)) {
        expect(JSON.stringify(late.eye(kind, t, 'orbit'))).toBe(JSON.stringify(early.eye(kind, t, 'orbit')))
        expect(JSON.stringify(late.eye(kind, t, 'terrain'))).toBe(JSON.stringify(early.eye(kind, t, 'terrain')))
      }
      expect(JSON.stringify(late.place(kind, s.start))).toBe(JSON.stringify(early.place(kind, s.start)))
    }
  })

  it('starts and ends as its neighbours: the pose of the far end where it leaves it, the pose of the surface view where it meets it', () => {
    forceOneMove(true)
    const dt = 1e-7
    for (const p of handing) {
      for (const kind of kinds) {
        const s = p.seg[kind]
        if (!s) continue
        const farTime = kind === 'dive' ? s.start : s.end
        const lowTime = kind === 'dive' ? s.end : s.start
        const inside = kind === 'dive' ? 1 : -1
        const far = kind === 'dive' ? p.hold(farTime - p.seg.hold.start) : p.after(farTime)
        const low = p.twin(p.terrain(lowTime - p.seg.terrain.start), lowTime)
        const a = p.eye(kind, farTime + inside * dt, 'orbit')
        const b = p.eye(kind, lowTime - inside * dt, 'orbit')
        expect(a.position.distanceTo(far.position), p.id + ' ' + kind + ' far').toBeLessThan(1e-5)
        expect(deg(a.quaternion, far.quaternion)).toBeLessThan(1e-4)
        expect(b.position.distanceTo(low.position) / Math.max(high(low), 1e-6), p.id + ' ' + kind + ' low').toBeLessThan(1e-4)
        expect(deg(b.quaternion, low.quaternion)).toBeLessThan(1e-4)
        expect(Math.abs(b.vfov - low.vfov)).toBeLessThan(1e-6)
      }
    }
  })

  it('carries the surface view\'s own motion out of the seam and lets it go by the share of the move still to do, with no count of frames in it', () => {
    forceOneMove(true)
    const dt = 1e-4
    for (const p of handing) {
      for (const kind of kinds) {
        const s = p.seg[kind]
        if (!s) continue
        // The eye leaves the seam at the velocity the surface view has there, each taken from its own side of the seam.
        const seam = kind === 'dive' ? s.end : s.start
        const into = kind === 'dive' ? -1 : 1
        const ground = (t: number): Pose => p.twin(p.terrain(t - p.seg.terrain.start), t)
        const at = ground(seam)
        const surface = at.position.clone().sub(ground(seam - into * dt).position).multiplyScalar(into / dt)
        const eye = p.eye(kind, seam + into * dt, 'orbit').position.clone().sub(at.position).multiplyScalar(into / dt)
        expect(eye.distanceTo(surface), p.id + ' ' + kind).toBeLessThan(0.02 * surface.length() + 1e-3 * high(at))
      }
    }
    // No count of frames: the span of the paths of the stops' own is not read by the one move.
    const sample = (): Pose[] => kinds.flatMap((kind) => times(mars.seg[kind]!.firstFrame, mars.seg[kind]!.endFrame, 7.5).map((t) => mars.eye(kind, t, 'orbit')))
    const h = config.raw.handover as { coastFrames: number; carry: { power: number; stepsPerFrame: number } }
    const kept = { coastFrames: h.coastFrames, power: h.carry.power }
    const as = sample()
    try {
      h.coastFrames = 30
      const other = sample()
      as.forEach((a, i) => {
        expect(other[i]!.position.toArray()).toEqual(a.position.toArray())
        expect(other[i]!.quaternion.toArray()).toEqual(a.quaternion.toArray())
      })
      // The power is read: with another the near end stands elsewhere inside the move, and both ends stay.
      h.carry.power = 0.5
      const more = sample()
      expect(Math.max(...as.map((a, i) => a.position.distanceTo(more[i]!.position) / high(a)))).toBeGreaterThan(1e-4)
      for (const kind of kinds) {
        const seg = mars.seg[kind]!
        const far = kind === 'dive' ? mars.hold(seg.start - mars.seg.hold.start) : mars.after(seg.end)
        expect(mars.eye(kind, kind === 'dive' ? seg.start : seg.end, 'orbit').position.distanceTo(far.position)).toBeLessThan(1e-9)
      }
    } finally {
      h.coastFrames = kept.coastFrames
      h.carry.power = kept.power
    }
    // It holds at fractions of a frame: over the first frames from the seam the eye's step changes by a small share from one sixty
    // fourth of a frame to the next, at the times the sums are taken and between them.
    for (const kind of kinds) {
      const seg = mars.seg[kind]!
      const seam = kind === 'dive' ? seg.end : seg.start
      const into = kind === 'dive' ? -1 : 1
      const at = (i: number): THREE.Vector3 => mars.eye(kind, seam + (into * i) / (64 * fps), 'orbit').position
      let worst = 0
      for (let i = 1; i < 64 * 6; i++) {
        const a = at(i).sub(at(i - 1))
        const b = at(i + 1).sub(at(i))
        worst = Math.max(worst, a.distanceTo(b) / Math.max(a.length(), b.length()))
      }
      expect(worst, kind).toBeLessThan(0.05)
    }
    for (const bad of [{ power: -1, stepsPerFrame: 8 }, { power: 9, stepsPerFrame: 8 }, { power: 2, stepsPerFrame: 0 }, { power: 2, stepsPerFrame: 2.5 }]) {
      const off = JSON.parse(JSON.stringify(raw)) as typeof raw
      off.handover.carry = bad
      expect(() => buildConfig(off)).toThrow(/handover.carry/)
    }
  })

  it('undoes the twin of every stop: a camera of the globe taken into the close view and back stands where it stood', () => {
    for (const p of handing) {
      const t = p.seg.terrain.start + 0.37
      for (const at of [new THREE.Vector3(0.3, 1.02, 0.1), new THREE.Vector3(-1.4, 0.6, 2.2)]) {
        const globe: Pose = { position: at, quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, -0.8, 0.2)), vfov: 41 }
        const back = p.twin(p.untwin(globe, t), t)
        expect(back.position.distanceTo(globe.position), p.id).toBeLessThan(1e-7)
        expect(deg(back.quaternion, globe.quaternion)).toBeLessThan(1e-4)
        expect(back.vfov).toBe(41)
      }
    }
  })
})

describe('the pace of the one move', () => {
  const film = new FilmDirector(plans)

  it('holds the dive of Mars to the limits of the harness at whole and half frames and across both seams: fall, turn and the speed of the picture', () => {
    for (const rate of [1, 2]) {
      const pace = paceOf(film, mars, 'dive', rate)!
      expect(pace.faults).toEqual([])
      expect(pace.ok).toBe(true)
    }
  })

  // Before the law of the rise (eyeLaw: the eye's direction on a bell of its own and the lift of that direction in the height) the speed of
  // the picture changed by 0.097 of the mean at 2695 and by 0.089 at 2726 against a limit of 0.08, on a rate of fall that held 0.073: the
  // eye swings up from low over the ground while it climbs, and the ground at the place opens faster than the height grows.
  it('holds the rise of Mars to the limits of the harness at whole and half frames and across both seams: climb, turn and the speed of the picture', () => {
    for (const rate of [1, 2]) {
      const pace = paceOf(film, mars, 'rise', rate)!
      expect(pace.faults).toEqual([])
      expect(pace.ok).toBe(true)
    }
  })

  it('carries the fall of the height on the bell alone where the law has no lift in it, for every stop but Saturn, whose close view stands radii above its body', () => {
    forceOneMove(true)
    const all = new FilmDirector(plans)
    let seen = 0
    for (const p of handing) {
      if (p.id === 'saturn') continue
      for (const kind of kinds) {
        if (!p.seg[kind] || p.eyeLaw(kind).liftPower !== 0) continue
        const pace = paceOf(all, p, kind)
        if (!pace) continue
        seen++
        expect(pace.curves.fall.faults, p.id + ' ' + kind).toEqual([])
        // The steepest change of the fall is that of the bell, within a tenth.
        expect(pace.curves.fall.worstStep!.value).toBeLessThan(bellStep(p.eyeFlanks(kind), p.seg[kind]!.frames) * 1.1 + 0.002)
      }
    }
    expect(seen).toBeGreaterThan(0)
  })

  it('reads its flanks from handover.pace, from the film\'s own for that side and from the stop, and refuses flanks too short for the segment where the number is read', () => {
    const base = config.raw.handover.pace
    const side = (kind: 'dive' | 'rise'): { rise: number; fall: number; corner: number } => (config.raw.handover[kind] as { pace?: { rise: number; fall: number; corner: number } }).pace ?? base
    const plain = coveredPlan(handover({}, {}))
    for (const kind of kinds) expect(plain.eyeFlanks(kind)).toEqual({ rise: side(kind).rise, fall: side(kind).fall, corner: side(kind).corner })
    const set = coveredPlan(handover({ pace: { rise: 0.5, fall: 0.35 } }, { pace: { corner: 0.1 } }))
    expect(set.eyeFlanks('dive')).toEqual({ rise: 0.5, fall: 0.35, corner: side('dive').corner })
    expect(set.eyeFlanks('rise')).toEqual({ rise: side('rise').rise, fall: side('rise').fall, corner: 0.1 })
    const steep = coveredPlan(handover({ pace: { rise: 0.15, fall: 0.15 } }, {}))
    expect(bellStep({ rise: 0.15, fall: 0.15, corner: side('dive').corner }, steep.seg.dive!.frames)).toBeGreaterThan(paceLimits().maxStep)
    expect(() => steep.eyeFlanks('dive')).toThrow(/the rate changes by .* the limit is/)
    expect(() => steep.eye('dive', steep.seg.dive!.start + 1, 'orbit')).toThrow(/the limit is/)
    expect(() => coveredPlan(handover({ pace: { rise: 0.7, fall: 0.5 } }, {})).eyeFlanks('dive')).toThrow()
    // The film's own flanks and the list of stops on a path of their own are checked with the film's other numbers.
    for (const bad of [{ rise: 0, fall: 0.4, corner: 0.2 }, { rise: 0.6, fall: 0.5, corner: 0.2 }, { rise: 0.4, fall: 0.4, corner: 0 }, { rise: 0.4, fall: 0.4, corner: 0.6 }]) {
      const off = JSON.parse(JSON.stringify(raw)) as typeof raw
      off.handover.pace = bad
      expect(() => buildConfig(off)).toThrow(/handover.pace/)
    }
    for (const bad of [['pluto'], ['earth', 'earth'], 'earth']) {
      const off = JSON.parse(JSON.stringify(raw)) as typeof raw
      ;(off.handover as { ownPath: unknown }).ownPath = bad
      expect(() => buildConfig(off)).toThrow(/handover.ownPath/)
    }
    const gone = JSON.parse(JSON.stringify(raw)) as typeof raw
    delete (gone.handover as { pace?: unknown }).pace
    expect(() => buildConfig(gone)).toThrow(/missing key handover.pace/)
  })

  it('has one law for a side, three things: the bell of the height, the bell of the eye\'s direction and the power of the lift, each the stop\'s, else the film\'s for that side, else handover.pace and no lift', () => {
    const base = config.raw.handover.pace
    type Side = { pace?: { rise: number; fall: number; corner: number }; turn?: { rise: number; fall: number; corner: number }; liftPower?: number }
    const plain = coveredPlan(handover({}, {}))
    for (const kind of kinds) {
      const film = config.raw.handover[kind] as Side
      const law = plain.eyeLaw(kind)
      expect(law.pace).toEqual(film.pace ?? base)
      expect(law.turn).toEqual(film.turn ?? film.pace ?? base)
      expect(law.liftPower).toBe(film.liftPower ?? 0)
      // Where neither the film nor the stop names a turn there is one share for the height and the direction, not two that happen to agree.
      if (!film.turn) expect(law.turn).toBe(law.pace)
      expect(plain.eyeLaw(kind)).toBe(law)
    }
    // The film's law of the rise is the one Mars flies; the dive has none of its own.
    const rise = config.raw.handover.rise as Side
    expect(rise.pace && rise.turn && rise.liftPower! > 0).toBeTruthy()
    expect((config.raw.handover.dive as Side).turn).toBeUndefined()
    expect((config.raw.handover.dive as Side).liftPower).toBeUndefined()
    expect(mars.eyeLaw('rise')).toEqual({ pace: rise.pace, turn: rise.turn, liftPower: rise.liftPower })
    expect(mars.eyeLaw('dive')).toEqual({ pace: base, turn: base, liftPower: 0 })
    // The stop's own, field by field: what it does not name it takes from the film's law of that side.
    const own = coveredPlan(handover({ turn: { fall: 0.5 }, liftPower: 0.3 }, { turn: { rise: 0.4 }, liftPower: 0 }))
    expect(own.eyeLaw('dive')).toEqual({ pace: base, turn: { rise: base.rise, fall: 0.5, corner: base.corner }, liftPower: 0.3 })
    expect(own.eyeLaw('rise')).toEqual({ pace: rise.pace, turn: { rise: 0.4, fall: rise.turn!.fall, corner: rise.turn!.corner }, liftPower: 0 })
    // Refused where the number is read: a turn too steep for the segment, a power out of range.
    const steep = coveredPlan(handover({ turn: { rise: 0.15, fall: 0.15 } }, {}))
    expect(() => steep.eyeLaw('dive')).toThrow(/the turn changes by .* the limit is/)
    expect(() => steep.eye('dive', steep.seg.dive!.start + 1, 'orbit')).toThrow(/the limit is/)
    expect(() => coveredPlan(handover({ turn: { rise: 0.7, fall: 0.5 } }, {})).eyeLaw('dive')).toThrow()
    for (const bad of [-0.1, 2.5, Number.NaN]) expect(() => coveredPlan(handover({}, { liftPower: bad })).eyeLaw('rise')).toThrow(/liftPower/)
    // And with the film's other numbers.
    for (const name of ['pace', 'turn'] as const) {
      for (const bad of [{ rise: 0, fall: 0.4, corner: 0.2 }, { rise: 0.6, fall: 0.5, corner: 0.2 }, { rise: 0.4, fall: 0.4, corner: 0 }, { rise: 0.4, fall: 0.4, corner: 0.6 }]) {
        const off = JSON.parse(JSON.stringify(raw)) as typeof raw
        ;(off.handover.rise as Side)[name] = bad
        expect(() => buildConfig(off)).toThrow(new RegExp('handover.rise.' + name))
        ;(off.handover.rise as Side)[name] = (raw.handover.rise as Side)[name]
        ;(off.handover.dive as Side)[name] = bad
        expect(() => buildConfig(off)).toThrow(new RegExp('handover.dive.' + name))
      }
    }
    for (const bad of [-0.1, 2.5]) {
      const off = JSON.parse(JSON.stringify(raw)) as typeof raw
      ;(off.handover.rise as Side).liftPower = bad
      expect(() => buildConfig(off)).toThrow(/handover.rise.liftPower/)
    }
    const bare = JSON.parse(JSON.stringify(raw)) as typeof raw
    for (const name of ['pace', 'turn', 'liftPower'] as const) delete (bare.handover.rise as Side)[name]
    expect(() => buildConfig(bare)).not.toThrow()
  })

  it('takes two corners a flank from the stop, for the bell that names them, and both ends of the move stay where they were', () => {
    const corners = { rise: [0.6, 0.1] as [number, number], fall: [0.05, 0.2] as [number, number] }
    const pace = { rise: 0.55, fall: 0.4, corner: 0.2 }
    const turn = { rise: 0.475, fall: 0.5, corner: 0.2 }
    const plain = coveredPlan(handover({}, { pace, turn, liftPower: 0 }))
    const set = coveredPlan(handover({}, { pace: { ...pace, corners }, turn: { ...turn, corners: { fall: [0.3, 0.05] } }, liftPower: 0 }))
    const law = set.eyeLaw('rise')
    expect(law.pace).toEqual({ ...pace, corners })
    expect(law.turn).toEqual({ ...turn, corners: { fall: [0.3, 0.05] } })
    // A bell that names none keeps its three numbers and no fourth: the dive of the same stop, and the stop without the option.
    expect(Object.keys(set.eyeLaw('dive').pace).sort()).toEqual(['corner', 'fall', 'rise'])
    expect(Object.keys(plain.eyeLaw('rise').pace).sort()).toEqual(['corner', 'fall', 'rise'])
    // Where no turn is named and the film has none for the side, the direction rides the bell of the height, corners and all.
    const dive = coveredPlan(handover({ pace: { corners: { rise: [0.3, 0.1] } } }, {})).eyeLaw('dive')
    expect(dive.turn).toBe(dive.pace)
    expect(dive.pace.corners).toEqual({ rise: [0.3, 0.1] })
    // The ends are the neighbours' whatever the bell; between them the eye is elsewhere.
    const s = plain.seg.rise
    for (const view of ['orbit', 'terrain'] as const) {
      for (const t of [s.start, s.end]) {
        const a = plain.eye('rise', t, view)
        const b = set.eye('rise', t, view)
        expect(a.position.distanceTo(b.position)).toBeLessThan(1e-9)
        expect(deg(a.quaternion, b.quaternion)).toBeLessThan(1e-6)
      }
    }
    const mid = (s.start + s.end) / 2
    expect(Math.abs(Math.log(high(set.eye('rise', mid, 'orbit')) / high(plain.eye('rise', mid, 'orbit'))))).toBeGreaterThan(0.01)
    // Refused where the number is read: corners that make a flank too steep for the segment, corners that leave a flank no room.
    expect(() => coveredPlan(handover({}, { pace: { rise: 0.3, fall: 0.3, corner: 0.2, corners: { rise: [0.9, 0.1] } } })).eyeLaw('rise')).toThrow(/the limit is/)
    expect(() => coveredPlan(handover({}, { pace: { corners: { rise: [0.7, 0.6] } } })).eyeLaw('rise')).toThrow(/two corners of the rise flank/)
    expect(() => coveredPlan(handover({}, { turn: { corners: { fall: [0.5, 0] } } })).eyeLaw('rise')).toThrow(/two corners of the fall flank/)
  })

  it('is the move as it was where a stop names the old law: the bell of handover.pace for both and no lift give the pose of one share to the last bit', () => {
    const base = config.raw.handover.pace
    const flanks = { rise: base.rise, fall: base.fall, corner: base.corner }
    const plain = coveredPlan(handover({}, {}))
    const named = coveredPlan(handover({ pace: flanks, turn: flanks, liftPower: 0 }, {}))
    expect(named.eyeLaw('dive').turn).not.toBe(named.eyeLaw('dive').pace)
    const s = plain.seg.dive!
    for (const t of times(s.firstFrame, s.endFrame, 0.5)) {
      expect(JSON.stringify(named.eye('dive', t, 'orbit'))).toBe(JSON.stringify(plain.eye('dive', t, 'orbit')))
      expect(JSON.stringify(named.eye('dive', t, 'terrain'))).toBe(JSON.stringify(plain.eye('dive', t, 'terrain')))
    }
  })

  it('carries the lift of the eye in the height and nowhere else: the direction from the place is that of no lift, the height differs by the lift to the power, and both ends stay', () => {
    const flanks = { rise: 0.42, fall: 0.49, corner: 0.05 }
    const turn = { rise: 0.38, fall: 0.59, corner: 0.05 }
    const none = coveredPlan(handover({}, { pace: flanks, turn, liftPower: 0 }))
    const half = coveredPlan(handover({}, { pace: flanks, turn, liftPower: 0.5 }))
    const full = coveredPlan(handover({}, { pace: flanks, turn, liftPower: 1 }))
    const s = none.seg.rise
    const from = (plan: StopPlan, t: number): { out: THREE.Vector3; h: number; q: THREE.Quaternion } => {
      const eye = plan.eye('rise', t, 'orbit')
      return { out: eye.position.clone().sub(plan.place('rise', t)).normalize(), h: high(eye), q: eye.quaternion }
    }
    let moved = 0
    for (const t of times(s.firstFrame, s.endFrame, 1.5)) {
      const a = from(none, t)
      const b = from(half, t)
      const c = from(full, t)
      // One direction from the place and one uprightness for the three: the lift changes how far out the eye stands, not where it looks from.
      expect(THREE.MathUtils.radToDeg(a.out.angleTo(b.out))).toBeLessThan(1e-4)
      expect(THREE.MathUtils.radToDeg(a.out.angleTo(c.out))).toBeLessThan(1e-4)
      // The height over the height of no lift is one number to the power: the log of it at power 1 is twice the log at a half.
      const lb = Math.log(b.h / a.h)
      const lc = Math.log(c.h / a.h)
      expect(Math.abs(lc - 2 * lb)).toBeLessThan(1e-6 + 1e-6 * Math.abs(lc))
      moved = Math.max(moved, Math.abs(lc))
    }
    expect(moved).toBeGreaterThan(0.05)
    // At both ends of the segment the three stand where the neighbours stand.
    for (const t of [s.start + 1e-7, s.end - 1e-7]) {
      const a = none.eye('rise', t, 'orbit')
      const c = full.eye('rise', t, 'orbit')
      expect(c.position.distanceTo(a.position) / Math.max(high(a), 1e-6)).toBeLessThan(1e-4)
      expect(deg(c.quaternion, a.quaternion)).toBeLessThan(1e-4)
    }
  })

  it('steps aside by the share of the time of the segment: at rest in the far pose, complete at its share, and nothing of it left at the surface', () => {
    const by = 0.25
    const plain = coveredPlan(handover({}, {}))
    const aside = coveredPlan(handover({ path: { sidestep: { right: 0.3, up: 0.1, by } } }, {}))
    const s = plain.seg.dive!
    const span = s.end - s.start
    const apart = (x: number): number => aside.eye('dive', s.start + x * span, 'orbit').position.distanceTo(plain.eye('dive', s.start + x * span, 'orbit').position)
    expect(apart(1e-6)).toBeLessThan(1e-9)
    expect(apart(0.01)).toBeLessThan(apart(0.05))
    expect(apart(0.05)).toBeLessThan(apart(0.12))
    expect(apart(0.12)).toBeGreaterThan(0.01)
    // The start is at rest: the first hundredth of the segment moves the camera by less than a thousandth of the whole step.
    expect(apart(0.0025) / Math.hypot(0.3, 0.1)).toBeLessThan(1e-3)
    expect(apart(1 - 1e-6) / high(plain.eye('dive', s.end - 1e-6 * span, 'orbit'))).toBeLessThan(1e-3)
    // The rise is not touched by the sidestep of the dive.
    const r = plain.seg.rise
    for (const t of times(r.firstFrame, r.endFrame, 7.5)) expect(JSON.stringify(aside.eye('rise', t, 'orbit'))).toBe(JSON.stringify(plain.eye('rise', t, 'orbit')))
  })
})

describe('the height of the camera above a body', () => {
  it('is one number for both views of a stop on the one move, and the film hands it to the set', () => {
    const film = new FilmDirector(plans)
    for (const kind of kinds) {
      const s = mars.seg[kind]!
      const heights: number[] = []
      for (let f = s.firstFrame; f < s.endFrame; f += 4) {
        const t = (f + config.shutterFraction / 2) / fps
        const globe = film.shotAt(f, t, 'orbit').sets.find((x) => x.id === 'mars')!
        const close = film.shotAt(f, t, 'terrain').sets.find((x) => x.id === 'mars')!
        const drawn = film.shotAt(f, t).sets.find((x) => x.id === 'mars')!
        const h = mars.eyeHeight(t)
        expect(h).toBeGreaterThan(0)
        expect(Math.abs(globe.height - h) / h).toBeLessThan(1e-3)
        expect(Math.abs(close.height - h) / h).toBeLessThan(1e-3)
        expect(Math.abs(drawn.height - h) / h).toBeLessThan(1e-3)
        heights.push(h)
      }
      // It falls all the way down and climbs all the way up, and between the flanks of the bell it does so on every frame. At the surface
      // the eye still moves as the surface view does, which may sink or lift a little of its own.
      const far = kind === 'dive' ? heights[0]! : heights[heights.length - 1]!
      const low = kind === 'dive' ? heights[heights.length - 1]! : heights[0]!
      expect(far / low).toBeGreaterThan(1000)
      const third = Math.floor(heights.length / 3)
      for (let i = third + 1; i < 2 * third; i++) expect(kind === 'dive' ? heights[i]! < heights[i - 1]! : heights[i]! > heights[i - 1]!).toBe(true)
    }
    // In the hold and in the surface view it is the height of the camera the film draws.
    const hold = mars.seg.hold
    const terrain = mars.seg.terrain
    expect(mars.eyeHeight(hold.start + 1)).toBeCloseTo(high(mars.hold(1)), 12)
    expect(mars.eyeHeight(terrain.start + 1)).toBeCloseTo(high(mars.twin(mars.terrain(1), terrain.start + 1)), 12)
    const f = terrain.firstFrame + 30
    const t = (f + config.shutterFraction / 2) / fps
    const set = film.shotAt(f, t).sets.find((x) => x.id === 'mars')!
    expect(Math.abs(set.height - mars.eyeHeight(t)) / mars.eyeHeight(t)).toBeLessThan(0.05)
  })

  it('is the height above its own sphere for a body the camera only passes', () => {
    const film = new FilmDirector(plans)
    const f = mars.seg.hold.firstFrame + 10
    const shot = film.shotAt(f, (f + config.shutterFraction / 2) / fps)
    for (const s of shot.sets) {
      expect(Number.isFinite(s.height)).toBe(true)
      if (s.view !== 'terrain') expect(s.height).toBeCloseTo(shot.camera.position.distanceTo(s.origin) - 1, 9)
    }
  })

  it('keeps the covered stop of the tests on the one move through a film of its own', () => {
    const plan = coveredPlan(handover({}, {}))
    const film = filmWith(plan)
    expect(plan.id).toBe(COVERED)
    const pace = paceOf(film, plan, 'dive')!
    expect(pace.curves.fall.faults).toEqual([])
  })
})
