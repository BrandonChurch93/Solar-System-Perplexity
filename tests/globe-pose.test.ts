import * as THREE from 'three'
import { afterAll, describe, expect, it } from 'vitest'
import { setCapture } from '../src/core/clock'
import { FilmDirector } from '../src/director/film'
import { sideAt } from '../src/director/handover'
import { plans } from '../src/director/plans'
import { segmentAtFrame } from '../src/director/timeline'
import { poseRecord } from '../tools/smooth/pose'

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
})
