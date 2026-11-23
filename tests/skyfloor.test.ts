import * as THREE from 'three'
import { afterAll, describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { floorRing, ringWeight } from '../src/core/skyfloor'
import type { SkyFloor } from '../src/core/types'
import { FilmDirector } from '../src/director/film'
import { handoverOf } from '../src/director/handover'
import { plans } from '../src/director/plans'
import { coveredPlan, filmWith, restorePlans } from './lib/covered'

const rad = Math.PI / 180
const numbers = config.raw.handover.skyFloor
const tan: [number, number] = [Math.tan(30 * rad) * 1.25 * (16 / 9), Math.tan(30 * rad) * 1.25]

// A plate that looks pitchDeg above the level and is rolled by rollDeg: the nadir in its frame.
function nadirOf(pitchDeg: number, rollDeg: number): THREE.Vector3 {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitchDeg * rad, 0, rollDeg * rad, 'YXZ'))
  return new THREE.Vector3(0, -1, 0).applyQuaternion(q.invert())
}

// Directions of the plate at a given angle under the level, inside the plate.
function under(nadir: THREE.Vector3, angle: number, tanOf: [number, number]): THREE.Vector3[] {
  const e1 = new THREE.Vector3().crossVectors(nadir, new THREE.Vector3(0, 0, 1)).normalize()
  const e2 = new THREE.Vector3().crossVectors(nadir, e1)
  const out: THREE.Vector3[] = []
  for (let i = 0; i < 2000; i++) {
    const phi = (i / 2000) * 2 * Math.PI
    const d = nadir.clone().multiplyScalar(Math.sin(angle)).addScaledVector(e1, Math.cos(angle) * Math.cos(phi)).addScaledVector(e2, Math.cos(angle) * Math.sin(phi))
    if (d.z < -1e-3 && Math.abs(d.x / -d.z) <= tanOf[0] && Math.abs(d.y / -d.z) <= tanOf[1]) out.push(d)
  }
  return out
}

describe('the floor of a carried sky plate', () => {
  it('keeps the plate whole down to its margin under the horizon and takes it away under the feather', () => {
    for (const [pitch, roll, dipDeg] of [[-20, 0, 2.2], [-18, 0, 3.4], [-21, 7, 2.6], [-10, -12, 1.2], [5, 3, 4], [-35, 0, 8]] as const) {
      const floor: SkyFloor = { nadir: nadirOf(pitch, roll), dip: dipDeg * rad }
      const ring = floorRing(floor, tan, numbers)!
      expect(ring).not.toBeNull()
      expect(ring[2]).toBeLessThan(ring[3])
      for (const up of [0, 0.5, 2, 10, 30]) {
        const dirs = under(floor.nadir, floor.dip - up * rad, tan)
        for (const d of dirs) expect(ringWeight(ring, tan, d)).toBe(1)
      }
      const edge = under(floor.nadir, floor.dip + numbers.marginDeg * rad, tan)
      expect(edge.length).toBeGreaterThan(10)
      for (const d of edge) expect(ringWeight(ring, tan, d)).toBeGreaterThan(1 - 1e-9)
      const gone = under(floor.nadir, floor.dip + (numbers.marginDeg + 2 * numbers.featherDeg) * rad, tan)
      for (const d of gone) expect(ringWeight(ring, tan, d)).toBe(0)
      const part = under(floor.nadir, floor.dip + (numbers.marginDeg + 0.5 * numbers.featherDeg) * rad, tan)
      const mid = part.map((d) => ringWeight(ring, tan, d))
      expect(Math.min(...mid)).toBeGreaterThan(0)
      expect(Math.max(...mid)).toBeLessThan(1)
      const below = under(floor.nadir, floor.dip + 0.6 * rad + numbers.marginDeg * rad, tan).map((d) => ringWeight(ring, tan, d))
      expect(Math.min(...below)).toBeGreaterThan(0.85)
    }
  })

  it('leaves a plate alone that lies above the cut and hides one that lies under it', () => {
    expect(floorRing({ nadir: nadirOf(60, 0), dip: 2 * rad }, tan, numbers)).toBeNull()
    const ring = floorRing({ nadir: nadirOf(-80, 0), dip: 2 * rad }, [0.1, 0.1], numbers)!
    for (const d of [new THREE.Vector3(0, 0, -1), new THREE.Vector3(0.05, 0.05, -1).normalize(), new THREE.Vector3(-0.09, 0.09, -1).normalize()]) expect(ringWeight(ring, [0.1, 0.1], d)).toBe(0)
  })
})

describe('the sky floor of a stop', () => {
  afterAll(() => restorePlans())

  it('is given only on the globe side of a stop that asked, and is the horizon of the twin at T in the frame of its terrain plate', () => {
    const film = new FilmDirector(plans)
    for (const p of plans) {
      for (const kind of ['dive', 'rise'] as const) {
        const s = p.seg[kind]
        const h = handoverOf(p.id, kind)
        if (!s) continue
        for (let f = s.firstFrame; f < s.endFrame; f += 5) {
          const shot = film.shotAt(f, (f + config.shutterFraction / 2) / config.fps)
          if (!h?.skyFloor) expect(shot.skyFloor).toBeUndefined()
        }
      }
    }
    const plan = coveredPlan({ handover: { dive: { skyFloor: true }, rise: { skyFloor: true } } })
    const own = filmWith(plan)
    for (const kind of ['dive', 'rise'] as const) {
      const h = handoverOf(plan.id, kind)!
      expect(h.skyFloor).toBe(true)
      const frame = Math.floor(h.time * config.fps + 1e-9)
      const close = own.shotAt(frame, h.time, 'terrain')
      expect(close.skyFloor).toBeUndefined()
      const globe = own.shotAt(frame, h.time, 'orbit')
      const floor = globe.skyFloor!
      expect(floor).toBeDefined()
      const centre = globe.sets[0]!.origin
      const height = globe.camera.position.distanceTo(centre) - 1
      expect(floor.dip).toBeCloseTo(Math.acos(1 / (1 + height)), 9)
      const toPlate = own.sky.patches[plan.id]!.terrain.clone().invert().multiply(own.sky.frame).multiply(globe.skyTurn.clone().invert()).multiply(globe.skyQuaternion).multiply(globe.camera.quaternion.clone().invert())
      const nadir = centre.clone().sub(globe.camera.position).normalize().applyQuaternion(toPlate)
      expect(nadir.angleTo(floor.nadir)).toBeLessThan(1e-6)
      const s = plan.seg[kind]!
      const far = kind === 'dive' ? s.firstFrame : s.endFrame - 1
      const off = own.shotAt(far, (far + config.shutterFraction / 2) / config.fps, 'orbit')
      expect(off.skyShare).toBe(0)
      expect(off.skyFloor).toBeUndefined()
      const near = kind === 'dive' ? frame - 3 : frame + 3
      const on = own.shotAt(near, (near + config.shutterFraction / 2) / config.fps, 'orbit')
      expect(on.skyFloor).toBe(floor)
    }
  })
})
