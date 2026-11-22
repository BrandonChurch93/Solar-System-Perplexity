import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { config, type Segment } from '../src/config'
import { seenShare } from '../src/core/motion'
import type { CoverState, Shot } from '../src/core/types'
import { FilmDirector } from '../src/director/film'
import { StopPlan, type Fit, type MoveParams } from '../src/director/moves'
import { plans } from '../src/director/plans'
import { coverWindow } from '../src/director/timeline'
import { params } from '../src/stops/mars/plan'
import fit from '../src/stops/mars/fit.json'
import { coverReaches } from '../src/terrain/cover'

const seg = (stop: string, kind: string): Segment => config.segments.find((s) => s.stop === stop && s.kind === kind)!
const at = (d: FilmDirector, f: number): Shot => d.shotAt(Math.floor(f), f / config.fps)
const withMars = (plan: StopPlan): FilmDirector => new FilmDirector(plans.map((p) => (p.id === 'mars' ? plan : p)))
const bare = (): MoveParams => {
  const p: MoveParams = { ...params, light: { ...params.light } }
  delete p.skyTurnEase
  delete p.light.glareCarry
  return p
}
const base = new StopPlan('mars', fit as Fit, bare())
const plain = withMars(base)
const moves = ['dive', 'rise'] as const
const apart = (a: THREE.Quaternion, b: THREE.Quaternion): number => {
  const dot = Math.abs(a.clone().normalize().dot(b.clone().normalize()))
  return 2 * Math.atan2(Math.sqrt(Math.max(1 - dot * dot, 0)), dot)
}
const inCamera = (shot: Shot, dir: THREE.Vector3): THREE.Vector3 => dir.clone().applyQuaternion(shot.camera.quaternion.clone().invert())

describe('sky gain of a stop', () => {
  it('is 1 in the base plan and scales the sky of the stop only', () => {
    class Dimmed extends StopPlan {
      override skyGain(time: number): number {
        return time < seg('mars', 'terrain').start ? 0.5 : 0.25
      }
    }
    expect(base.skyGain(0)).toBe(1)
    for (const p of plans) expect(p.skyGain(p.seg.hold.start)).toBe(1)
    const other = withMars(new Dimmed('mars', fit as Fit, bare()))
    for (const kind of ['hold', 'dive', 'terrain', 'rise']) {
      const s = seg('mars', kind)
      for (let f = s.firstFrame; f < s.endFrame; f += 7) {
        const a = at(plain, f)
        const b = at(other, f)
        expect(b.skyExposure).toBeCloseTo(a.skyExposure * (kind === 'hold' || kind === 'dive' ? 0.5 : 0.25), 12)
        expect(b.post.exposure).toBe(a.post.exposure)
        expect(b.cover.amount).toBe(a.cover.amount)
      }
    }
    for (const s of [seg('mars', 'travel'), seg('earth', 'rise'), seg('jupiter', 'hold')]) {
      for (let f = s.firstFrame; f < s.endFrame; f += 11) expect(at(other, f).skyExposure).toBe(at(plain, f).skyExposure)
    }
  })
})
