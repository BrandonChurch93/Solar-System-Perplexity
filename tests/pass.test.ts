import { lookbackLight, smooth, smoother, softSmooth } from '../src/director/rig'
import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'
import { CARRY, carryBend, carryWay, inFrame, landing, outsideFrame, passCurve, TRAVEL, TravelShape, travelLook } from '../src/space/travel/path'

const looks = ['base', ...Object.keys(TRAVEL)].map((id) => ({ id, look: travelLook(id) }))

describe('the slide of a travel', () => {
  it('is the old power without a lead and without a knee', () => {
    for (const p of [2, 3]) {
      const f = passCurve(p, 1, 0, 0)
      for (const t of [0, 0.1, 0.37, 1, 1.6]) expect(f(t)).toBeCloseTo(Math.pow(t, p), 12)
    }
  })

  it('ends its pass at 1 for every stop', () => {
    for (const { look } of looks) expect(passCurve(look.passPower, look.passKnee, look.passLead, look.passRound, look.passStart)(1)).toBeCloseTo(1, 12)
  })

  it('starts with no speed, no acceleration and no jerk', () => {
    for (const { id, look } of looks) {
      const f = passCurve(look.passPower, look.passKnee, look.passLead, look.passRound, look.passStart)
      const h = 1e-3
      expect(f(0), id).toBe(0)
      expect(f(h) / h, id).toBeLessThan(1e-8)
      expect((f(2 * h) - 2 * f(h)) / (h * h), id).toBeLessThan(1e-5)
      expect((f(3 * h) - 3 * f(2 * h) + 3 * f(h)) / (h * h * h), id).toBeLessThan(1e-2)
    }
  })

  it('never slows and has no step in its acceleration', () => {
    for (const { id, look } of looks) {
      const f = passCurve(look.passPower, look.passKnee, look.passLead, look.passRound, look.passStart)
      const h = 1 / 400
      const acc: number[] = []
      for (let i = 1; i < 800; i++) acc.push((f((i + 1) * h) - 2 * f(i * h) + f((i - 1) * h)) / (h * h))
      const most = Math.max(...acc)
      for (let i = 0; i < acc.length; i++) {
        expect(acc[i]!, id + ' at ' + i).toBeGreaterThan(-1e-6)
        if (i > 0) expect(Math.abs(acc[i]! - acc[i - 1]!), id + ' at ' + i).toBeLessThan(0.03 * most)
      }
    }
  })
  it('spreads its start over the given span and keeps the old curve to the bit from the end of the span on', () => {
    const was = passCurve(3, 0.6, 0.6, 0.2)
    expect(passCurve(3, 0.6, 0.6, 0.2, [0, 0])(0.37)).toBe(was(0.37))
    expect(passCurve(3, 1, 0, 0, [0.07, 1])(0.37)).toBe(passCurve(3, 1, 0, 0)(0.37))
    expect(passCurve(3, 0.6, 0.6, 0.2, [0.07, 0.6])(0.37)).toBe(was(0.37))
    for (const span of [[0.07, 1], [0, 1], [0.1, 0.9]] as [number, number][]) {
      const now = passCurve(3, 0.6, 0.6, 0.2, span)
      const [a, b] = span
      const h = 1 / 2000
      for (const t of [b, b + 0.01, 1, 1.3, 2]) expect(now(t), 'at ' + t).toBe(was(t))
      for (const t of [0, a / 2, a]) expect(now(t), 'at ' + t).toBe(0)
      expect(Math.abs(now(b - h) - (was(b) - (was(b + h) - was(b))))).toBeLessThan(1e-7)
      const bend = (f: (t: number) => number, i: number) => (f((i + 1) * h) - 2 * f(i * h) + f((i - 1) * h)) / (h * h)
      let most = 0
      let old = 0
      for (let i = 1; i < 2400; i++) {
        most = Math.max(most, bend(now, i))
        old = Math.max(old, bend(was, i))
      }
      expect(most).toBeLessThan(0.82 * old)
      for (let i = 1; i < 2400; i++) {
        expect(bend(now, i), 'at ' + i).toBeGreaterThan(-1e-6)
        if (i > 1) expect(Math.abs(bend(now, i) - bend(now, i - 1)), 'at ' + i).toBeLessThan(0.01 * most)
      }
    }
  })

  it('has the spread start on four legs and each is the old curve to the bit when its span is [0, 0]', () => {
    const set: Record<string, [number, number]> = { mercury: [0.03, 1], venus: [0.03, 1], jupiter: [0, 1], uranus: [0.07, 1] }
    for (const { id, look } of looks) {
      expect(look.passStart, id).toEqual(set[id] ?? [0, 0])
      if (!set[id]) continue
      const off = new TravelShape(id, { passStart: [0, 0] })
      const on = new TravelShape(id)
      const old = passCurve(look.passPower, look.passKnee, look.passLead, look.passRound)
      for (let k = 0; k <= 150; k++) {
        const u = k / 150
        expect(off.pass(u), id + ' at ' + u).toBe(old(u / look.passBy))
        if (u >= look.passBy) expect(on.pass(u), id + ' at ' + u).toBe(off.pass(u))
      }
      expect(on.pass(look.passBy / 2), id).not.toBe(off.pass(look.passBy / 2))
    }
  })
})

describe('softSmooth', () => {
  it('is smooth to the bit from the lead on and starts with no acceleration', () => {
    for (let x = 0.3; x <= 1.2; x += 0.0173) expect(softSmooth(x, 0.3)).toBe(smooth(x))
    const h = 1e-3
    expect((softSmooth(2 * h, 0.3) - 2 * softSmooth(h, 0.3)) / (h * h)).toBeLessThan(0.4)
    expect((smooth(2 * h) - 2 * smooth(h)) / (h * h)).toBeGreaterThan(5.9)
    for (let u = 0.2; u <= 1; u += 0.0131) expect(lookbackLight(u)).toBe(smooth(u * 1.5))
    let last = 0
    for (let x = h; x <= 1; x += h) {
      const v = softSmooth(x, 0.3)
      expect(v).toBeGreaterThanOrEqual(last)
      last = v
    }
  })
})

describe('the landing of a travel', () => {
  const legs = Object.keys(TRAVEL).filter((id) => travelLook(id).land > 0)
  const shapeOf = (id: string, over = {}): TravelShape => {
    const shape = new TravelShape(id, over)
    shape.from = 0.3
    shape.open = 1 - shape.look.window / 75
    return shape
  }

  it('is set on the seven legs mercury to uranus and enters in the last third', () => {
    expect(legs).toEqual(['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus'])
    for (const id of legs) expect(travelLook(id).land, id).toBeGreaterThan(2 / 3)
  })

  it('takes over the distance, the speed and the acceleration and ends at rest', () => {
    const h = 1e-4
    for (const [left, speed, bend] of [[0.45, 0.9, 1.5], [1, 1.9, 0], [0.2, 0.4, 3]] as const) {
      for (const law of [[19, 0.05, 0.34, 9.6, 18.5], [30, 0.2, 0.16, 16, 18.5], [20, 0, 0, 0, 0]] as const) {
        const f = landing(left, speed, bend, [...law])
        expect(f(1)).toBeCloseTo(left, 9)
        expect((3 * f(1) - 4 * f(1 - h) + f(1 - 2 * h)) / (2 * h)).toBeCloseTo(speed, 4)
        expect((f(1) - 2 * f(1 - h) + f(1 - 2 * h)) / (h * h)).toBeCloseTo(bend, 1)
        expect(f(0)).toBe(0)
        expect(f(h) / h).toBeLessThan(1e-5)
        expect(Math.abs(f(2 * h) - 2 * f(h)) / (h * h)).toBeLessThan(1e-2)
      }
    }
  })

  it('joins the old curve with no step in place, speed or acceleration and ends on the hold', () => {
    const h = 1e-3
    for (const id of legs) {
      const shape = shapeOf(id)
      const old = shapeOf(id, { land: 0 })
      const u = shape.look.land
      const t = Math.max((u - shape.open) / (1 - shape.open), 0.5)
      for (const [now, was, at] of [[(x: number) => shape.pan(x), (x: number) => old.pan(x), u], [(x: number) => shape.arrive(x), (x: number) => old.arrive(x), t]] as const) {
        const speed = (f: (x: number) => number, x: number): number => (f(x + h) - f(x - h)) / (2 * h)
        const bend = (f: (x: number) => number, x: number): number => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h)
        const top = Math.abs(speed(was, at))
        expect(now(at - h), id).toBe(was(at - h))
        expect(Math.abs(now(at + 2 * h) - was(at + 2 * h)), id).toBeLessThan(1e-6)
        expect(Math.abs(speed(now, at + 2 * h) - speed(was, at + 2 * h)), id).toBeLessThan(2e-3 * top)
        expect(Math.abs(bend(now, at + 2 * h) - bend(was, at + 2 * h)), id).toBeLessThan(0.3 * top)
        expect(now(1), id).toBe(1)
        expect(speed(now, 1 - h) / top, id).toBeLessThan(1e-3)
        expect(Math.abs(bend(now, 1 - h)) / top, id).toBeLessThan(0.1)
        expect(Math.abs(bend(now, 1 - h)), id).toBeLessThan(0.6 * Math.abs(bend(now, 1 - 2 * h)))
        let last = now(at)
        for (let k = 1; k <= 600; k++) {
          const x = at + ((1 - at) * k) / 600
          expect(now(x), id + ' at ' + x).toBeGreaterThanOrEqual(last)
          last = now(x)
        }
      }
    }
  })

  it('keeps the old curves to the bit when it is off', () => {
    const shape = shapeOf('sun')
    expect(shape.look.land).toBe(0)
    for (const t of [0, 0.2, 0.5, 0.77, 0.99, 1]) expect(shape.arrive(t)).toBe(smoother(t))
    for (const id of legs) {
      const off = shapeOf(id, { land: 0 })
      const on = shapeOf(id)
      for (const u of [0, 0.1, 0.33, 0.5, 0.66]) expect(on.pan(u), id).toBe(off.pan(u))
    }
  })
})

describe('the dim of the sky while the Sun comes into the frame of a travel', () => {
  const film = new FilmDirector(plans)
  const level = (p: number): number => film.shotAt(Math.floor(p), p / config.fps).skyExposure
  const legs = config.segments.filter((s) => s.kind === 'travel')

  it('is nothing at the first instant of every leg, wherever the Sun stands in the frame', () => {
    const seen = film as unknown as { sunSeen(index: number, time: number): number }
    legs.forEach((seg, index) => {
      if (index > 0) expect(seen.sunSeen(index, seg.firstFrame / config.fps)).toBe(0)
    })
  })

  it('leaves the level of the sky without a step out of the rise and into the hold', () => {
    for (const seg of legs) {
      for (const seam of [seg.firstFrame, seg.endFrame]) {
        const before = level(seam - 0.25)
        expect(Math.abs(level(seam) - before) / before).toBeLessThan(0.002)
        expect(Math.abs(level(seam + 0.25) - before) / before).toBeLessThan(0.002)
      }
    }
  })

  it('follows the place of the Sun in the frame and has no stairs', () => {
    const mercury = legs.find((s) => s.id === 'mercury.travel')!
    for (let p = mercury.firstFrame; p < mercury.endFrame - 0.5; p += 0.5) expect(Math.abs(level(p + 0.5) - level(p)) / level(p)).toBeLessThan(0.005)
    const uranus = legs.find((s) => s.id === 'uranus.travel')!
    for (let p = uranus.firstFrame; p < uranus.endFrame - 0.25; p += 0.25) expect(level(p + 0.25)).toBeGreaterThanOrEqual(level(p) - 1e-9)
  })

  it('measures the same edge of the frame as inFrame', () => {
    const to = new THREE.Vector3(0.3, -0.2, -1)
    for (let k = 0; k < 40; k++) {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.03 * k - 0.6, 0.05 * k - 1, 0.01 * k))
      expect(inFrame(q, 30, 16 / 9, to, 0, 0)).toBe(outsideFrame(q, 30, 16 / 9, to) < 0)
      expect(inFrame(q, 30, 16 / 9, to, 0, 3)).toBe(THREE.MathUtils.radToDeg(outsideFrame(q, 30, 16 / 9, to)) < 3)
    }
  })
})

describe('the way out of the hold of the Sun', () => {
  const film = new FilmDirector(plans)
  const leg = config.segments.find((s) => s.stop === config.stopIds[0] && s.kind === 'travel')!
  const place = (p: number): THREE.Vector3 => {
    const shot = film.shotAt(Math.floor(p), p / config.fps)
    return shot.camera.position.clone().sub(shot.sets.find((s) => s.id === leg.stop)?.origin ?? film.frames[0]!.origin)
  }
  const h = 0.05
  const far = place(leg.firstFrame).length()
  const push = (p: number): THREE.Vector3 => place(p + h).add(place(p - h)).addScaledVector(place(p), -2).multiplyScalar(1 / (h * h * far))

  it('has no step in the acceleration of the camera from the hold to the end of the pull', () => {
    let last = push(leg.firstFrame - 1)
    for (let p = leg.firstFrame - 1 + h; p < leg.firstFrame + 0.45 * leg.frames; p += h) {
      const now = push(p)
      expect(now.distanceTo(last), 'frame ' + p.toFixed(2)).toBeLessThan(1e-4)
      last = now
    }
  })

  it('does not come nearer to the Sun and ends the pull where it always did', () => {
    for (let p = leg.firstFrame; p < leg.firstFrame + 0.45 * leg.frames; p += 0.25) expect(place(p + 0.25).length(), 'frame ' + p).toBeGreaterThanOrEqual(place(p).length() - 1e-5 * far)
    expect(place(leg.firstFrame + 0.43 * leg.frames).length() / far).toBeCloseTo(6.2546 / 4.5741, 3)
  })
})

describe('the carry of a rise into its travel', () => {
  const legs = plans.map((p, i) => ({ p, i })).filter(({ p, i }) => i > 0 && p.seg.travel)
  const standIn = (id: string, speed: number, brake: number): typeof plans =>
    plans.map((p) => {
      if (p.id !== id) return p
      const q = Object.create(p) as typeof p
      const end = p.seg.rise.end
      q.eyeShot = (kind, time, forced) => {
        if (kind !== 'rise' || time < end - 0.05 || time >= end) return p.eyeShot(kind, time, forced)
        const pose = p.exitPose(time)
        const t = time - end
        pose.position.addScaledVector(p.riseOut, speed * t + (brake * t * t) / 2)
        return { pose, view: 'orbit' }
      }
      return q
    })
  const camera = (film: FilmDirector, time: number): THREE.Vector3 => film.shotAt(Math.floor(time * config.fps + 1e-9), time).camera.position.clone()

  it('starts with the whole speed and the whole rate, with no kink, and is at rest at its end', () => {
    const h = 1e-3
    expect(carryWay(0)).toBe(0)
    expect(carryWay(h) / h).toBeCloseTo(1, 8)
    expect(Math.abs(carryWay(3e-4) - 3 * carryWay(2e-4) + 3 * carryWay(1e-4)) / 1e-12).toBeLessThan(2e-2)
    expect((carryWay(2 * h) - 2 * carryWay(h)) / (h * h)).toBeCloseTo(0, 4)
    expect(carryWay(1)).toBeCloseTo(0.5, 12)
    expect((carryWay(1) - carryWay(1 - h)) / h).toBeLessThan(1e-8)
    expect(carryWay(1.7)).toBe(carryWay(1))
    expect(carryBend(0)).toBe(0)
    expect(carryBend(h) / h).toBeLessThan(1e-3)
    expect((carryBend(2 * h) - 2 * carryBend(h)) / (h * h)).toBeCloseTo(1, 1)
    expect(carryBend(1)).toBeCloseTo(0.05, 12)
    expect((carryBend(1) - carryBend(1 - h)) / h).toBeLessThan(1e-8)
    expect(carryBend(1.7)).toBe(carryBend(1))
  })

  it('falls once and never turns back while the brake it takes over is at most 7.5 times the speed over the time', () => {
    const d = 1e-4
    for (const brake of [0, 1, 4, 7.5]) {
      let last = Infinity
      for (let s = 0; s < 1; s += 0.01) {
        const speed = (carryWay(s + d) - carryWay(s)) / d - (brake * (carryBend(s + d) - carryBend(s))) / d
        expect(speed, 'brake ' + brake + ' at ' + s.toFixed(2)).toBeGreaterThan(-1e-6)
        expect(speed, 'brake ' + brake + ' at ' + s.toFixed(2)).toBeLessThan(last + 1e-6)
        last = speed
      }
    }
  })

  it('is off on a leg whose rise ends at the drift of its exit, and on where it ends faster', () => {
    const film = new FilmDirector(plans)
    const carries = (film as unknown as { carryOf(i: number): unknown }).carryOf.bind(film)
    for (const { p, i } of legs) {
      const end = p.seg.rise.end
      const h = CARRY.step
      const at = (t: number): THREE.Vector3 => p.eyeShot('rise', t, 'orbit').pose.position
      const p0 = p.exitPose(end).position
      const excess = p0.clone().multiplyScalar(3).addScaledVector(at(end - h), -4).add(at(end - 2 * h)).multiplyScalar(1 / (2 * h)).sub(p.exitPose(end + h).position.sub(p0).multiplyScalar(1 / h)).length()
      expect(Math.abs(excess - CARRY.from), p.id + ' stands too near the edge to be told').toBeGreaterThan(CARRY.from / 2)
      expect(carries(i) === null, p.id).toBe(excess < CARRY.from)
    }
  })

  for (const id of ['venus', 'mars', 'saturn']) {
    it('takes over the speed and the brake of a rise of ' + id + ' that ends in the middle of its brake, and moves no world and no landing', () => {
      const p = plans.find((x) => x.id === id)!
      const [speed, brake] = [4, -8]
      const real = new FilmDirector(plans)
      const film = new FilmDirector(standIn(id, speed, brake))
      const end = p.seg.rise.end
      const far = p.exitPose(end).position.length()
      expect(camera(film, end).distanceTo(camera(real, end)) / far).toBeLessThan(1e-12)
      const h = 2e-3
      const before = camera(film, end).multiplyScalar(3).addScaledVector(camera(film, end - h), -4).add(camera(film, end - 2 * h)).multiplyScalar(1 / (2 * h))
      const after = camera(film, end).multiplyScalar(-3).addScaledVector(camera(film, end + h), 4).sub(camera(film, end + 2 * h)).multiplyScalar(1 / (2 * h))
      expect(before.length()).toBeCloseTo(speed + p.p.rise.driftSpeed, 3)
      expect(after.distanceTo(before) / before.length(), 'speed').toBeLessThan(2e-3)
      const bent = camera(film, end).addScaledVector(camera(film, end - h), -2).add(camera(film, end - 2 * h)).multiplyScalar(1 / (h * h))
      const bends = camera(film, end).addScaledVector(camera(film, end + h), -2).add(camera(film, end + 2 * h)).multiplyScalar(1 / (h * h))
      expect(bent.length()).toBeCloseTo(-brake, 2)
      expect(bends.distanceTo(bent) / bent.length(), 'brake').toBeLessThan(5e-2)
      const seg = p.seg.travel!
      const land = seg.start + travelLook(id).land * (seg.end - seg.start)
      const next = real.frames[plans.indexOf(p) + 1]!.origin
      for (let t = land; t < seg.end; t += 0.05) expect(camera(film, t).distanceTo(camera(real, t)) / camera(real, t).distanceTo(next), 'at ' + t.toFixed(2)).toBeLessThan(1e-6)
      expect(film.frames.map((f) => [...f.origin.toArray(), ...f.rotation.toArray()])).toEqual(real.frames.map((f) => [...f.origin.toArray(), ...f.rotation.toArray()]))
    })
  }
})
