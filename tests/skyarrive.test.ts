import { afterAll, describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { config, type Segment } from '../src/config'
import { setCapture } from '../src/core/clock'
import { skyStep } from '../src/core/skyfloor'
import type { Shot } from '../src/core/types'
import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'
import { read, seamsOf } from '../tools/seams/speeds'
import { poseRecord } from '../tools/smooth/pose'

// The aim a stop may give the sky for its way in (StopParams.skyAim.arrive). Its law, stated on the film's own plans with the aim
// laid on one stop in memory (the last stop that turns the sky to an orbit aim of its own):
//   1. a stop that gives none has no entry, and the film is the one without the word;
//   2. on the way in (the rise of the stop before and the travel) the sky has the turn it would have if the aim were the stop's
//      orbit aim, to the bit, and nothing else of a shot moves;
//   3. before that rise and from the first frame of the stop's hold on every shot is the one of the film without the aim, to the bit,
//      but for the seen turn of the sky (7), which only the film with the aim gives, from that first frame on;
//   4. the stop's orbit picture keeps its place in the lens while the stars step: on the travel it stands by the aim of the way in;
//   5. the stars step between two frames only, the last of the travel and the first of the hold, and skyStep names both to the engine,
//      which draws them only under an orbit picture of the stop that hides the stars;
//   6. the aim is refused where no rise before the stop turns the sky: on the first two stops, on a stop that follows the turn of the
//      stop before, on the stop the sky is fitted on and on a stop with no orbit aim of its own;
//   7. the sky that is seen does not step where the stars do, and a reader of the film's motion must not read their step as motion:
//      a shot from the first frame of the stop's hold on gives the seen turn of the sky (Shot.skyTurnSeen), the stars' turn with the
//      step taken out. By it the sky is carried over the step as the sky camera turns, and over every other pair of frames as the
//      stars' turn carries it. A film without the aim gives no seen turn. Where two stops give an aim, both steps are taken out,
//      each from its own hold on;
//   8. the two readers carry the sky by the seen turn (tools/smooth/pose.ts, tools/seams/speeds.ts): over the step both read what
//      they read in the film without the aim.
const ARRIVE: [number, number, number] = [40, -20, 30]
const EARLIER: [number, number, number] = [-70, 35, 10]
type Aim = NonNullable<(typeof plans)[number]['p']['skyAim']>
const degrees = (a: THREE.Quaternion, b: THREE.Quaternion): number => THREE.MathUtils.radToDeg(a.clone().normalize().angleTo(b.clone().normalize()))
// The angle between two turns that are all but one, in radians, read from the vector part so that it keeps its digits near zero.
const apart = (a: THREE.Quaternion, b: THREE.Quaternion): number => {
  const d = a.clone().invert().multiply(b)
  return 2 * Math.hypot(d.x, d.y, d.z)
}

describe('the sky aim of a stop for its way in', () => {
  afterAll(() => setCapture(1))
  const base = new FilmDirector(plans)
  const turnsItself = (p: (typeof plans)[number], i: number): boolean => i >= 2 && p.p.skyAim?.orbit !== undefined && base.sky.follows[p.id] === undefined && p.id !== base.sky.anchor
  const index = plans.reduce((found, p, i) => (turnsItself(p, i) ? i : found), -1)
  const plan = plans[index]!
  const id = plan.id
  const before = plans[index - 1]!
  const seg = (stop: string, kind: string): Segment => config.segments.find((s) => s.id === stop + '.' + kind)!
  const rise = seg(before.id, 'rise')
  const travel = seg(before.id, 'travel')
  const hold = seg(id, 'hold')
  const build = (p: (typeof plans)[number], aim: Aim | undefined): FilmDirector => {
    const kept = p.p.skyAim
    if (aim) p.p.skyAim = aim
    else delete p.p.skyAim
    try {
      return new FilmDirector(plans)
    } finally {
      if (kept) p.p.skyAim = kept
      else delete p.p.skyAim
    }
  }
  const without = (aim: Aim | undefined): Aim => {
    const own = { ...aim }
    delete own.arrive
    return own
  }
  const own = without(plan.p.skyAim)
  const none = build(plan, own)
  const film = build(plan, { ...own, arrive: ARRIVE })
  const as = build(plan, { ...own, orbit: ARRIVE })
  const at = (f: number): number => (f + config.shutterFraction / 2) / config.fps
  // The shots of a frame as the engine may ask for them: the natural one, and both sides in a dive or a rise.
  const shots = (d: FilmDirector, f: number): Shot[] => {
    const natural = d.shotAt(f, at(f))
    const kind = natural.segment.kind
    return kind === 'dive' || kind === 'rise' ? [natural, d.shotAt(f, at(f), 'orbit'), d.shotAt(f, at(f), 'terrain')] : [natural]
  }
  const turn = (s: Shot): number[] => s.skyTurn.toArray()
  const rest = (s: Shot): string => {
    const o = JSON.parse(JSON.stringify(s)) as Record<string, unknown>
    delete o.skyTurn
    return JSON.stringify(o)
  }
  const wayIn: number[] = []
  for (let f = rise.firstFrame; f < travel.endFrame; f++) wayIn.push(f)
  const outside: number[] = []
  for (let f = 0; f < config.frameCount; f++) if ((f < rise.firstFrame || f >= hold.firstFrame) && (f % 7 === 0 || Math.abs(f - rise.firstFrame) <= 30 || Math.abs(f - hold.firstFrame) <= 30)) outside.push(f)

  it('finds a stop of the film to lay the aim on, with a rise and a travel before its hold', () => {
    expect(index).toBeGreaterThanOrEqual(2)
    expect(rise.endFrame).toBe(travel.firstFrame)
    expect(travel.endFrame).toBe(hold.firstFrame)
    expect(wayIn.length).toBeGreaterThan(60)
    expect(outside.length).toBeGreaterThan(700)
  })

  it('1. a stop that gives none has no entry and the film has entries for the stops that give one alone', () => {
    expect(Object.keys(base.arrivals).sort()).toEqual(plans.filter((p) => p.p.skyAim?.arrive).map((p) => p.id).sort())
    expect(none.arrivals).toEqual({})
    expect(Object.keys(film.arrivals)).toEqual([id])
    expect(as.arrivals).toEqual({})
  })

  it('2. on the way in the sky has the turn of the aim, as if it were the orbit aim, and nothing else of a shot moves', () => {
    expect(film.arrivals[id]!.turn.toArray()).toEqual(as.sky.orbits[id]!.toArray())
    expect(film.arrivals[id]!.orbit.toArray()).toEqual(as.sky.patches[id]!.orbit.toArray())
    expect(degrees(film.arrivals[id]!.turn, none.sky.orbits[id]!)).toBeGreaterThan(10)
    let moved = 0
    let most = 0
    for (const f of wayIn) {
      const [a, b, c] = [shots(film, f), shots(as, f), shots(none, f)]
      expect(a.length).toBe(c.length)
      a.forEach((s, i) => {
        expect(turn(s)).toEqual(turn(b[i]!))
        expect(rest(s)).toBe(rest(c[i]!))
        const d = degrees(s.skyTurn, c[i]!.skyTurn)
        if (d > 1e-9) moved++
        most = Math.max(most, d)
      })
    }
    expect(moved).toBeGreaterThan(travel.frames)
    for (let f = travel.firstFrame; f < travel.endFrame; f++) expect(turn(film.shotAt(f, at(f)))).toEqual(film.arrivals[id]!.turn.toArray())
    expect(most).toBeCloseTo(degrees(film.arrivals[id]!.turn, none.sky.orbits[id]!), 9)
  })

  it('3. before the rise of the stop before and from the first frame of its hold on every shot is the film\'s without the aim, but for the seen turn', () => {
    expect(JSON.stringify(film.sky)).toBe(JSON.stringify(none.sky))
    // What a shot draws: all of it but the seen turn of the sky, which is given to readers alone.
    const drawn = (s: Shot): string => {
      const o = { ...s }
      delete o.skyTurnSeen
      return JSON.stringify(o)
    }
    for (const f of outside) {
      const [a, c] = [shots(film, f), shots(none, f)]
      expect(a.length).toBe(c.length)
      a.forEach((s, i) => expect(f < hold.firstFrame ? JSON.stringify(s) : drawn(s)).toBe(JSON.stringify(c[i]!)))
    }
    for (let f = hold.firstFrame; f < hold.endFrame; f++) expect(turn(film.shotAt(f, at(f)))).toEqual(none.sky.orbits[id]!.toArray())
  })

  it('4. the stop\'s orbit picture keeps its place in the lens on the travel and over the step of the stars', () => {
    const frame = film.sky.frame
    const way = film.arrivals[id]!
    const mine = { turn: film.sky.orbits[id]!, orbit: film.sky.patches[id]!.orbit }
    // The turn from the lens to the picture: the picture's aim taken out of the sky as the shot has it.
    const seen = (aim: THREE.Quaternion, s: Shot): THREE.Quaternion => aim.clone().invert().multiply(frame).multiply(s.skyTurn.clone().invert()).multiply(s.skyQuaternion)
    for (let f = travel.firstFrame; f < travel.endFrame; f++) {
      const s = film.shotAt(f, at(f))
      const n = none.shotAt(f, at(f))
      expect(apart(seen(way.orbit, s), seen(mine.orbit, n))).toBeLessThan(1e-6)
    }
    const last = film.shotAt(travel.endFrame - 1, hold.start - 1e-9)
    const first = film.shotAt(hold.firstFrame, hold.start)
    expect(last.segment.id).toBe(travel.id)
    expect(first.segment.id).toBe(hold.id)
    expect(degrees(last.skyTurn, first.skyTurn)).toBeGreaterThan(10)
    expect(apart(seen(way.orbit, last), seen(mine.orbit, first))).toBeLessThan(1e-6 + apart(last.skyQuaternion, first.skyQuaternion))
    // The aim of the stop's own on the travel would carry the picture off with the stars: the test has teeth.
    expect(apart(seen(mine.orbit, last), seen(mine.orbit, first))).toBeGreaterThan(0.1)
  })

  it('5. the stars step between the last frame of the travel and the first of the hold, and skyStep names the two', () => {
    const stepped: number[] = []
    for (let f = 0; f < config.frameCount; f++) {
      const s = film.shotAt(f, at(f))
      const name = skyStep(s.segment, s.frame, s.sets, film.arrivals)
      if (name !== null) {
        expect(name).toBe(id)
        stepped.push(f)
      }
      expect(skyStep(s.segment, s.frame, s.sets, none.arrivals)).toBeNull()
      expect(skyStep(s.segment, s.frame, s.sets, undefined)).toBeNull()
    }
    expect(stepped).toEqual([travel.endFrame - 1, hold.firstFrame])
    const sets = [{ id: before.id }, { id }]
    expect(skyStep(travel, travel.endFrame - 0.5, sets, film.arrivals)).toBe(id)
    expect(skyStep(travel, travel.endFrame - 1.5, sets, film.arrivals)).toBeNull()
    expect(skyStep(hold, hold.firstFrame + 0.5, [{ id }], film.arrivals)).toBe(id)
    expect(skyStep(hold, hold.firstFrame + 1, [{ id }], film.arrivals)).toBeNull()
    expect(skyStep(travel, travel.endFrame - 1, [{ id: before.id }], film.arrivals)).toBeNull()
    expect(skyStep({ ...rise, firstFrame: hold.firstFrame, endFrame: hold.endFrame, stop: id }, hold.firstFrame, [{ id }], film.arrivals)).toBeNull()
    // Between any other two frames the turn of the film with the aim moves as the turn of one of the two films it is made of.
    for (let f = rise.firstFrame - 1; f < hold.firstFrame + 2; f++) {
      const d = degrees(film.shotAt(f, at(f)).skyTurn, film.shotAt(f + 1, at(f + 1)).skyTurn)
      const whole = f + 1 < hold.firstFrame ? as : none
      const like = degrees(whole.shotAt(f, at(f)).skyTurn, whole.shotAt(f + 1, at(f + 1)).skyTurn)
      if (f === travel.endFrame - 1) expect(d).toBeGreaterThan(10)
      else expect(d).toBeCloseTo(like, 9)
    }
  })

  it('6. refuses the aim where no rise before the stop turns the sky', () => {
    const refused = (p: (typeof plans)[number]): void => expect(() => build(p, { ...without(p.p.skyAim), arrive: ARRIVE })).toThrow(/a sky aim for the way in/)
    refused(plans[0]!)
    refused(plans[1]!)
    const follower = plans.find((p) => base.sky.follows[p.id] !== undefined)!
    expect(follower).toBeDefined()
    refused(follower)
    refused(plans.find((p) => p.id === base.sky.anchor)!)
    const carried = plans.find((p, i) => i >= 2 && p.p.skyAim?.orbit === undefined && base.sky.follows[p.id] === undefined && p.id !== base.sky.anchor)
    if (carried) refused(carried)
    expect(() => build(plan, { ...own, arrive: ARRIVE })).not.toThrow()
  })

  // The lens against the sky: as a reader carries it (by the seen turn where the film gives one) and by the stars' turn alone.
  const lens = (s: Shot): THREE.Quaternion => (s.skyTurnSeen ?? s.skyTurn).clone().invert().multiply(s.skyQuaternion)
  const byStars = (s: Shot): THREE.Quaternion => s.skyTurn.clone().invert().multiply(s.skyQuaternion)
  const between = (a: THREE.Quaternion, b: THREE.Quaternion): THREE.Quaternion => a.clone().invert().multiply(b)
  // The first frame from which a film gives the seen turn: the first hold of a stop with an aim for its way in.
  const firstStep = (d: FilmDirector): number => Math.min(Infinity, ...Object.keys(d.arrivals).map((stop) => seg(stop, 'hold').firstFrame))

  it('7. the seen turn of the sky is given from the first frame of the hold on, and by it the sky is carried over the step as the sky camera turns', () => {
    expect(firstStep(film)).toBe(Math.min(firstStep(none), hold.firstFrame))
    for (const d of [base, none, film]) {
      const from = firstStep(d)
      for (let f = 0; f < config.frameCount; f++) for (const s of shots(d, f)) expect(s.skyTurnSeen !== undefined).toBe(f >= from)
    }
    const camera = (a: Shot, b: Shot): THREE.Quaternion => between(a.skyQuaternion, b.skyQuaternion)
    // The two sides of the step, at the edge itself and at the times the readers ask for.
    const edge: [Shot, Shot] = [film.shotAt(travel.endFrame - 1, hold.start - 1e-9), film.shotAt(hold.firstFrame, hold.start)]
    const asked: [Shot, Shot] = [film.shotAt(travel.endFrame - 1, at(travel.endFrame - 1)), film.shotAt(hold.firstFrame, at(hold.firstFrame))]
    for (const [a, b] of [edge, asked]) {
      expect(a.segment.id).toBe(travel.id)
      expect(b.segment.id).toBe(hold.id)
      expect(apart(between(lens(a), lens(b)), camera(a, b))).toBeLessThan(1e-9)
      // By the stars' turn the same pair reads their step: the law has teeth.
      expect(degrees(between(byStars(a), byStars(b)), camera(a, b))).toBeGreaterThan(10)
    }
    // In the hold the seen turn is the turn of the way in: the step is taken out whole.
    if (firstStep(none) > hold.firstFrame) expect(apart(edge[1].skyTurnSeen!, film.arrivals[id]!.turn)).toBeLessThan(1e-9)
    // Every other pair of frames carries the sky by the seen turn as by the stars' turn.
    let pairs = 0
    for (let f = rise.firstFrame - 1; f < config.frameCount - 1; f++) {
      if (f === travel.endFrame - 1) continue
      const [a, b] = [film.shotAt(f, at(f)), film.shotAt(f + 1, at(f + 1))]
      if (firstStep(none) <= f + 1) continue
      expect(apart(between(lens(a), lens(b)), between(byStars(a), byStars(b)))).toBeLessThan(1e-9)
      pairs++
    }
    expect(pairs).toBeGreaterThan(hold.frames)
  })

  it('7b. where two stops give an aim both steps are taken out, each from its own hold on', () => {
    const j = plans.reduce((found, p, i) => (i < index && turnsItself(p, i) ? i : found), -1)
    expect(j).toBeGreaterThanOrEqual(2)
    const first = plans[j]!
    const kept = first.p.skyAim
    first.p.skyAim = { ...without(kept), arrive: EARLIER }
    let both: FilmDirector
    try {
      both = build(plan, { ...own, arrive: ARRIVE })
    } finally {
      first.p.skyAim = kept
    }
    expect(Object.keys(both.arrivals).sort()).toEqual([first.id, id].sort())
    const pair = (f: number): [Shot, Shot] => [both.shotAt(f, at(f)), both.shotAt(f + 1, at(f + 1))]
    const steps = [seg(first.id, 'hold').firstFrame - 1, hold.firstFrame - 1]
    expect(steps[0]!).toBeLessThan(steps[1]!)
    for (const f of steps) {
      const [a, b] = pair(f)
      const camera = between(a.skyQuaternion, b.skyQuaternion)
      expect(apart(between(lens(a), lens(b)), camera)).toBeLessThan(1e-9)
      expect(degrees(between(byStars(a), byStars(b)), camera)).toBeGreaterThan(10)
    }
    expect(pair(steps[0]!).map((s) => s.skyTurnSeen !== undefined)).toEqual([false, true])
    expect(pair(steps[1]!).map((s) => s.skyTurnSeen !== undefined)).toEqual([true, true])
    // In the later hold the seen turn is the stars' turn with both steps taken out, the later one first.
    const whole = both.arrivals[id]!.turn.clone().multiply(both.sky.orbits[first.id]!.clone().invert()).multiply(both.arrivals[first.id]!.turn)
    expect(apart(pair(steps[1]!)[1].skyTurnSeen!, whole)).toBeLessThan(1e-9)
    for (let f = steps[0]! - 30; f < config.frameCount - 1; f++) {
      if (steps.includes(f)) continue
      const [a, b] = pair(f)
      expect(apart(between(lens(a), lens(b)), between(byStars(a), byStars(b)))).toBeLessThan(1e-9)
    }
  })

  it('8. the readers carry the sky by the seen turn: over the step the pose record and the seams report read what they read without the aim', () => {
    const rate = 2
    const size = { width: 1920, height: 1080 }
    const q = (a: number[]): THREE.Quaternion => new THREE.Quaternion().fromArray(a)
    const sky = (d: FilmDirector, k: number): THREE.Quaternion => q(poseRecord(d, plan, k, rate, config.fps, size).sky.q)
    try {
      for (let k = (hold.firstFrame - 3) * rate; k < (hold.firstFrame + 3) * rate; k++) expect(apart(between(sky(film, k), sky(film, k + 1)), between(sky(none, k), sky(none, k + 1)))).toBeLessThan(1e-9)
      const r = poseRecord(film, plan, hold.firstFrame * rate, rate, config.fps, size)
      const shot = film.shotAt(hold.firstFrame, r.time)
      expect(shot.skyTurnSeen).toBeDefined()
      expect(r.sky.q).toEqual(shot.skyTurnSeen!.clone().invert().multiply(shot.skyQuaternion).toArray())
      expect(degrees(q(r.sky.q), byStars(shot))).toBeGreaterThan(10)
      setCapture(rate)
      const seam = seamsOf().find((x) => x.frame === hold.firstFrame && x.stop === id)!
      expect(seam).toBeDefined()
      const [mine, plain] = [read(film, seam, { w: size.width, h: size.height, rate }), read(none, seam, { w: size.width, h: size.height, rate })]
      expect(mine.length).toBe(plain.length)
      expect(mine.some((row) => row.k === hold.firstFrame * rate - 1 && row.share < 1)).toBe(true)
      mine.forEach((row, i) => {
        const like = plain[i]!
        expect([row.k, row.on, row.share, row.middle, row.limb]).toEqual([like.k, like.on, like.share, like.middle, like.limb])
        // The turns are kept to seven places and so are not quite of length one: a point carried by two of them lands within a
        // thousandth of a px of where the other two carry it (measured: under 0.0001 px).
        expect(Math.abs(row.mean - like.mean)).toBeLessThan(1e-3)
      })
    } finally {
      setCapture(1)
    }
  })
})
