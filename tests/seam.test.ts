import { afterEach, describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { captureRate, setCapture, shutterAsked, spanMid } from '../src/core/clock'
import { FilmDirector } from '../src/director/film'
import { paceLimits } from '../src/director/pace'
import { plans } from '../src/director/plans'
import { eyeOf } from '../tools/lib/pace'
import { seamOf } from '../tools/lib/seam'
import { SEAM_REACH, carriedCamera, ringPlane } from '../tools/smooth/camera'

// The seam tool (tools/seam.ts on tools/lib/seam.ts) against the eye line of the judge (npm run smooth, the path part, read through
// eyeOf of tools/lib/pace.ts). A builder shapes a surface view on the tool and is judged by the harness: the two may not read two eyes.

describe('the seam tool', () => {
  const film = new FilmDirector(plans)
  const rate = paceLimits().rate
  const kinds = ['dive', 'rise'] as const

  afterEach(() => setCapture(1))

  it('reads the eye the judge reads: on every seam of the film its steps, the surface view\'s own number and the lowest inside the move are those of npm run smooth', () => {
    let seams = 0
    for (const plan of plans) {
      for (const kind of kinds) {
        const mine = seamOf(film, plan, kind, { rate, frames: SEAM_REACH })
        const judge = eyeOf(film, plan, kind, rate)
        if (!judge) {
          expect(mine, plan.id + ' ' + kind).toBeNull()
          continue
        }
        seams++
        const name = plan.id + ' ' + kind
        expect(mine, name).not.toBeNull()
        expect(mine!.seam, name).toBe(judge.seam)
        if (judge.own === null || !judge.inMove) {
          expect(mine!.still, name).toBe(true)
          continue
        }
        expect(mine!.still, name).toBe(false)
        expect(mine!.own, name).toBeCloseTo(judge.own, 12)
        // Every step of the tool is a step of the judge: the same frame, the same speed and the same part along the surface view's way.
        for (const row of mine!.rows) {
          const i = Math.round(row.f * rate) - judge.k0
          expect(judge.speed[i], name + ' at ' + row.f).not.toBeNull()
          expect(row.speed / mine!.own, name + ' at ' + row.f).toBeCloseTo(judge.speed[i]!, 9)
          expect(row.along, name + ' at ' + row.f).toBeCloseTo(judge.along[i]!, 9)
        }
        expect(mine!.lowest.over, name).toBeCloseTo(judge.inMove.value, 9)
        expect(Math.round(mine!.lowest.f * rate), name).toBe(judge.inMove.k)
        // The judge's lowest also covers the surface view's side, so it is never above the tool's.
        expect(judge.lowest!.value, name).toBeLessThanOrEqual(mine!.lowest.over + 1e-9)
      }
    }
    expect(seams).toBe(17)
  })

  it('names a step by the frame it ends on: a rise is the move from the first step after the seam, a dive up to the step that ends on it', () => {
    const mars = plans.find((p) => p.id === 'mars')!
    for (const kind of kinds) {
      const r = seamOf(film, mars, kind, { rate, frames: 4, before: 3 })!
      const first = kind === 'rise' ? r.seam - 3 : r.seam - 4
      expect(r.rows.length).toBe(7 * rate)
      expect(r.rows[0]!.f).toBeCloseTo(first, 12)
      expect(r.rows[r.rows.length - 1]!.f).toBeCloseTo(first + 7 - 1 / rate, 12)
      for (const row of r.rows) expect(row.inMove, kind + ' at ' + row.f).toBe(kind === 'rise' ? row.f > r.seam + 1e-9 : row.f <= r.seam + 1e-9)
    }
  })

  it('takes the height of a place on the rings above the plane of the rings, as the judge does, and of any other place above the unit sphere', () => {
    let rings = 0
    for (const plan of plans) {
      const plane = ringPlane(plan)
      const r = seamOf(film, plan, 'rise', { rate, frames: 2, before: 2 })
      if (!r) continue
      expect(r.onRings, plan.id).toBe(plane !== null)
      setCapture(rate)
      const pose = (k: number) => carriedCamera(film, plan, plan.id, k / rate, (k / rate + spanMid()) / config.fps).pose
      const row = r.rows[0]!
      const k = Math.round(row.f * rate)
      const a = pose(k - 1).position
      const b = pose(k).position
      const sphere = (a.length() - 1 + b.length() - 1) / 2
      if (plane) {
        rings++
        expect(row.height, plan.id).toBeCloseTo((Math.abs(a.dot(plane.normal)) + Math.abs(b.dot(plane.normal))) / 2, 12)
        expect(Math.abs(row.height - sphere), plan.id).toBeGreaterThan(1e-6)
      } else {
        expect(row.height, plan.id).toBeCloseTo(sphere, 12)
      }
    }
    expect(rings).toBe(1)
  })

  it('leaves the capture rate and the shutter as it found them', () => {
    const mars = plans.find((p) => p.id === 'mars')!
    setCapture(1)
    seamOf(film, mars, 'rise', { rate: 2 })
    expect(captureRate()).toBe(1)
    expect(shutterAsked()).toBeNull()
    setCapture(4, 90)
    seamOf(film, mars, 'dive', { rate: 2 })
    expect(captureRate()).toBe(4)
    expect(shutterAsked()).toBe(90)
    expect(seamOf(film, plans[0]!, 'dive', { rate: 2 })).toBeNull()
    expect(captureRate()).toBe(4)
  })
})
