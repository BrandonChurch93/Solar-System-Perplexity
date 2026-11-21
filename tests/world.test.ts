import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import world from '../src/director/world.json'
import { config } from '../src/config'
import { FilmDirector } from '../src/director/film'
import { StopPlan } from '../src/director/moves'
import { plans } from '../src/director/plans'

describe('world pin', () => {
  const m = plans.findIndex((p) => p.id === world.stop)
  const turned = plans.map((p, i) => (i < m ? new StopPlan(p.id, p.fit, { ...p.p, light: { ...p.p.light, sunDir: [-0.692237 + 0.01 * i, 0.508, 0.512586] } }) : p))
  const a = new FilmDirector(plans)
  const b = new FilmDirector(turned)
  const frames = config.segments.filter((s) => s.stop === world.stop && s.kind !== 'travel').flatMap((s) => [s.firstFrame, s.firstFrame + Math.floor(s.frames / 2), s.endFrame - 1])

  it('the pinned stop sits on the stored frame, bit for bit', () => {
    for (const d of [a, b]) {
      expect(d.frames[m]!.rotation.toArray()).toEqual(world.rotation)
      expect(d.frames[m]!.origin.toArray()).toEqual(world.origin)
      expect(d.sunWorld.toArray()).toEqual(world.sun)
    }
  })

  it('the stored Sun direction is the one the pinned stop is lit from', () => {
    const lit = plans[m]!.sunDir.clone().applyQuaternion(new THREE.Quaternion().fromArray(world.rotation))
    expect(lit.distanceTo(new THREE.Vector3().fromArray(world.sun))).toBeLessThan(1e-9)
  })

  it('no stop before the pinned one can move its shots or its sky', () => {
    expect(frames.length).toBeGreaterThan(8)
    for (const f of frames) {
      const x = a.shotAt(f, f / config.fps)
      const y = b.shotAt(f, f / config.fps)
      expect(y.camera.position.toArray()).toEqual(x.camera.position.toArray())
      expect(y.camera.quaternion.toArray()).toEqual(x.camera.quaternion.toArray())
      expect(y.sets.map((s) => [s.origin.toArray(), s.rotation.toArray()])).toEqual(x.sets.map((s) => [s.origin.toArray(), s.rotation.toArray()]))
      expect(y.sun.dir.toArray()).toEqual(x.sun.dir.toArray())
      expect(y.skyTurn.toArray()).toEqual(x.skyTurn.toArray())
    }
    expect(b.sky.frame.toArray()).toEqual(a.sky.frame.toArray())
    expect(b.sky.turns[world.stop]?.toArray()).toEqual(a.sky.turns[world.stop]?.toArray())
  })

  it('the stops before it keep their place relative to each other', () => {
    for (const d of [a, b]) {
      for (let i = 0; i + 1 < d.frames.length; i++) {
        const lit = d.plans[i + 1]!.sunDir.clone().applyQuaternion(d.frames[i + 1]!.rotation)
        expect(lit.distanceTo(d.sunWorld)).toBeLessThan(1e-9)
      }
    }
  })
})
