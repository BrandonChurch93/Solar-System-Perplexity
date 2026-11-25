import * as THREE from 'three'
import { afterAll, describe, expect, it } from 'vitest'
import { setCapture } from '../src/core/clock'
import { FilmDirector } from '../src/director/film'
import { sideAt } from '../src/director/handover'
import { plans } from '../src/director/plans'
import { segmentAtFrame } from '../src/director/timeline'
import { poseRecord, type Bodied, type Seated, type Shaped } from '../tools/smooth/pose'

const film = new FilmDirector(plans)
const size = { width: 1920, height: 1080 }
const q = (a: number[]): THREE.Quaternion => new THREE.Quaternion().fromArray(a)
const plan = (id: string): (typeof plans)[number] => plans.find((p) => p.id === id)!
const degrees = (a: THREE.Quaternion, b: THREE.Quaternion): number => THREE.MathUtils.radToDeg(a.clone().normalize().angleTo(b.clone().normalize()))
const apartBy = (a: THREE.Quaternion, b: THREE.Quaternion): number => Math.max(...a.toArray().map((v, i) => Math.abs(v - b.toArray()[i]!)))

describe('the pose record of a capture frame', () => {
  afterAll(() => setCapture(1))

  it('names the sky as the film draws it: the sky camera of the shot with the turn of the sky frame taken out', () => {
    for (const [id, k] of [['mercury', 1434], ['mars', 4814], ['earth', 3680], ['venus', 2516]] as [string, number][]) {
      const r = poseRecord(film, plan(id), k, 2, 30, size)
      const at = k / 2
      const seg = segmentAtFrame(at)
      const shot = film.shotAt(at, r.time, seg.stop === id && (seg.kind === 'dive' || seg.kind === 'rise') ? sideAt(seg, r.time) : undefined)
      expect(apartBy(q(r.sky.q), shot.skyTurn.clone().invert().multiply(shot.skyQuaternion))).toBeLessThan(1e-12)
    }
  })

  it('does not take the camera for the sky where the two turn apart', () => {
    const apart = (id: string, k: number): number => {
      const a = poseRecord(film, plan(id), k, 2, 30, size)
      const b = poseRecord(film, plan(id), k + 16, 2, 30, size)
      return degrees(q(a.sky.q).invert().multiply(q(b.sky.q)), q(a.camera.q).invert().multiply(q(b.camera.q)))
    }
    expect(apart('mercury', 1434)).toBeGreaterThan(8)
    expect(apart('mars', 4814)).toBeGreaterThan(1.5)
    expect(apart('venus', 2516)).toBeLessThan(0.1)
  })

  it('names the turn a body is drawn with where its plan has one, and the plan\'s turn elsewhere', () => {
    const mercury = plan('mercury') as (typeof plans)[number] & { drawn(time: number): THREE.Quaternion }
    for (const k of [1434, 1740, 2032]) {
      const r = poseRecord(film, mercury, k, 2, 30, size)
      expect(apartBy(q(r.bodies[0]!.turn), mercury.drawn(r.time))).toBeLessThan(1e-12)
    }
    const rise = poseRecord(film, mercury, 2032, 2, 30, size)
    expect(degrees(q(rise.bodies[0]!.turn), mercury.turn(rise.time))).toBeGreaterThan(4)
    const mars = poseRecord(film, plan('mars'), 4814, 2, 30, size)
    expect(apartBy(q(mars.bodies[0]!.turn), plan('mars').turn(mars.time))).toBeLessThan(1e-12)
  })

  it('names the drawn shape of a body where its plan hands one, with the view, the eye and the time of the frame, and nothing where it hands none', () => {
    const mars = plan('mars')
    const before = poseRecord(film, mars, 4814, 2, 30, size)
    expect('shape' in before.bodies[0]!).toBe(false)
    const seen: { view: string; eye: number[]; time: number }[] = []
    const squashed = [1.004, -0.004, 0, -0.004, 0.99, 0, 0, 0, 0.9975]
    const shaped = Object.assign(Object.create(mars) as typeof mars, {
      drawnShape: (view, eye, time) => {
        seen.push({ view, eye: eye.toArray(), time })
        return { shape: squashed, place: [0.01, 0, 0] }
      },
    } satisfies Shaped)
    const r = poseRecord(film, shaped, 4814, 2, 30, size)
    expect(r.bodies[0]!.shape).toEqual(squashed)
    expect(r.bodies[0]!.place).toEqual([0.01, 0, 0])
    expect(seen).toEqual([{ view: r.view, eye: r.camera.p, time: r.time }])
    expect({ ...r, bodies: [{ ...r.bodies[0]!, shape: undefined, place: [0, 0, 0] }] }).toEqual({ ...before, bodies: [{ ...before.bodies[0]!, shape: undefined }] })
    const none = Object.assign(Object.create(mars) as typeof mars, { drawnShape: () => null } satisfies Shaped)
    expect(JSON.stringify(poseRecord(film, none, 4814, 2, 30, size))).toBe(JSON.stringify(before))
  })

  it('names every further body a plan hands with its own place, turn and reach, with the view, the eye and the time of the frame', () => {
    const venus = plan('venus')
    const before = poseRecord(film, venus, 2516, 2, 30, size)
    expect(before.bodies.length).toBe(1)
    const seen: { view: string; eye: number[]; time: number }[] = []
    const moon = { id: 'moon', place: [0.4, 0.1, 1.6], turn: [0, 0.1, 0, 0.995], reach: 0.07 }
    const rings = { id: 'rings', place: [0, 0, 0], turn: [0, 0, 0, 1], reach: 2.3, sheet: { normal: [0, 1, 0], inner: 1.2, thick: 0.01 } }
    const bodied = Object.assign(Object.create(venus) as typeof venus, {
      drawnBodies: (view, eye, time) => {
        seen.push({ view, eye: eye.toArray(), time })
        return [moon, rings]
      },
    } satisfies Bodied)
    const r = poseRecord(film, bodied, 2516, 2, 30, size)
    expect(r.bodies.slice(1)).toEqual([moon, rings])
    expect(seen).toEqual([{ view: r.view, eye: r.camera.p, time: r.time }])
    expect(JSON.stringify({ ...r, bodies: r.bodies.slice(0, 1) })).toBe(JSON.stringify(before))
    const none = Object.assign(Object.create(venus) as typeof venus, { drawnBodies: () => [] } satisfies Bodied)
    expect(JSON.stringify(poseRecord(film, none, 2516, 2, 30, size))).toBe(JSON.stringify(before))
  })

  it('names the near bodies of a plan that hands no further bodies by their place alone, in the orbit view alone', () => {
    const mars = plan('mars')
    const hold = poseRecord(film, mars, 4780, 2, 30, size)
    expect(hold.view).toBe('orbit')
    const near = mars.nearBodies(hold.time)
    expect(near.length).toBe(1)
    expect(hold.bodies.length).toBe(2)
    expect(hold.bodies[1]).toEqual({ id: 'mars.near.0', place: near[0]!.centre.toArray(), reach: near[0]!.radius })
    const later = poseRecord(film, mars, 4796, 2, 30, size)
    expect(new THREE.Vector3().fromArray(later.bodies[1]!.place).distanceTo(new THREE.Vector3().fromArray(hold.bodies[1]!.place))).toBeGreaterThan(1e-4)
    let low = 0
    for (let k = 4830; k < 5400 && !low; k += 10) if (poseRecord(film, mars, k, 2, 30, size).view === 'terrain') low = k
    expect(low).toBeGreaterThan(0)
    expect(poseRecord(film, mars, low, 2, 30, size).bodies.length).toBe(1)
    const own = Object.assign(Object.create(mars) as typeof mars, { drawnBodies: () => [{ id: 'phobos', place: [1, 2, 3], turn: [0, 0, 0, 1], reach: 0.08 }] } satisfies Bodied)
    expect(poseRecord(film, own, 4780, 2, 30, size).bodies.slice(1)).toEqual([{ id: 'phobos', place: [1, 2, 3], turn: [0, 0, 0, 1], reach: 0.08 }])
  })

  it('takes the turn of a stop\'s world about the lens into the camera, and leaves the sky and every other key as they were', () => {
    const venus = plan('venus')
    const before = poseRecord(film, venus, 2516, 2, 30, size)
    const t = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0.2, 1, 0.1).normalize(), 0.004)
    const seated = Object.assign(Object.create(venus) as typeof venus, { drawnSeat: () => t.clone() } satisfies Seated)
    const r = poseRecord(film, seated, 2516, 2, 30, size)
    expect(apartBy(q(r.camera.q), q(before.camera.q).multiply(t.clone().invert()))).toBeLessThan(1e-12)
    expect(degrees(q(r.camera.q), q(before.camera.q))).toBeGreaterThan(0.2)
    expect(JSON.stringify({ ...r, camera: { ...r.camera, q: before.camera.q } })).toBe(JSON.stringify(before))
    const point = new THREE.Vector3(0.3, -0.2, 0.93)
    const inLens = (rec: typeof r, x: THREE.Vector3): THREE.Vector3 => x.clone().sub(new THREE.Vector3().fromArray(rec.camera.p)).applyQuaternion(q(rec.camera.q).invert())
    const world = point.clone().sub(new THREE.Vector3().fromArray(before.camera.p))
    const seat = q(before.camera.q).multiply(t).multiply(q(before.camera.q).invert())
    const drawn = world.applyQuaternion(seat).applyQuaternion(q(before.camera.q).invert())
    expect(inLens(r, point).distanceTo(drawn)).toBeLessThan(1e-12)
    const still = Object.assign(Object.create(venus) as typeof venus, { drawnSeat: () => new THREE.Quaternion() } satisfies Seated)
    expect(JSON.stringify(poseRecord(film, still, 2516, 2, 30, size))).toBe(JSON.stringify(before))
  })

  it('names the unit of the close view as the plan\'s own twin lays it, and the near plane of the lens in the units of the pose frame', () => {
    const still = new THREE.Quaternion()
    const along = (p: (typeof plans)[number], time: number, step: THREE.Vector3): number => p.twin({ position: step, quaternion: still, vfov: 40 }, time).position.distanceTo(p.twin({ position: new THREE.Vector3(), quaternion: still, vfov: 40 }, time).position)
    const laid = (p: (typeof plans)[number], time: number): number => along(p, time, new THREE.Vector3(1, 0, 0))
    const shotOf = (id: string, k: number, time: number): ReturnType<FilmDirector['shotAt']> => {
      const seg = segmentAtFrame(k / 2)
      return film.shotAt(k / 2, time, seg.stop === id && (seg.kind === 'dive' || seg.kind === 'rise') ? sideAt(seg, time) : undefined)
    }
    const sun = plan('sun')
    const low = poseRecord(film, sun, 368, 2, 30, size)
    expect(low.view).toBe('terrain')
    expect(low.range.units.length).toBe(2)
    expect(Math.abs(low.range.units[1]! / laid(sun, low.time) - 1)).toBeLessThan(1e-9)
    expect(Math.abs(low.range.units[1]! / sun.twinFrame(low.time).scale - 1)).toBeGreaterThan(0.3)
    expect(low.camera.near).toBeCloseTo(shotOf('sun', 368, low.time).near * low.range.units[1]!, 15)
    for (const id of ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'uranus', 'neptune']) {
      const p = plan(id)
      const r = poseRecord(film, p, Math.round(p.holdMid * 60), 2, 30, size)
      expect(r.view).toBe('orbit')
      expect(Math.abs(r.range.units[1]! / laid(p, r.time) - 1)).toBeLessThan(1e-12)
      for (const step of [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)]) expect(Math.abs(along(p, r.time, step) / laid(p, r.time) - 1)).toBeLessThan(1e-8)
      expect(Math.abs(r.range.units[1]! / p.twinFrame(r.time).scale - 1)).toBeLessThan(1e-3)
    }
    const saturn = poseRecord(film, plan('saturn'), Math.round(plan('saturn').holdMid * 60), 2, 30, size)
    expect(saturn.range.units).toEqual([1])
    const mars = poseRecord(film, plan('mars'), 5364, 2, 30, size)
    expect(mars.view).toBe('orbit')
    expect(mars.camera.near).toBe(shotOf('mars', 5364, mars.time).near)
    expect(mars.camera.near).toBeGreaterThan(0)
    expect(mars.camera.near).toBeLessThan(Math.hypot(...mars.camera.p) - 1)
  })
})
