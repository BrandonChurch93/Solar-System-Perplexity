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
  delete p.light.bandLow
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

describe('hidden share of a stop that draws its own cover', () => {
  it('is not set by the base plan, so the sample rule reads the cover amount as before', () => {
    for (const kind of moves) {
      const s = seg('mars', kind)
      expect(base.coverHidden(s, (s.start + s.end) / 2)).toBeUndefined()
      for (let f = s.firstFrame; f < s.endFrame; f++) {
        const shot = at(plain, f + config.shutterFraction / 2)
        expect(shot.cover.hidden).toBeUndefined()
        expect(plain.glareOf(shot)).toBeNull()
        expect(seenShare(shot)).toBe(Math.max(1 - shot.cover.amount * (shot.cover.hides ?? 1), 0))
      }
    }
    const shot = at(plain, seg('mars', 'rise').firstFrame)
    expect(seenShare({ ...shot, cover: { ...shot.cover, amount: 0.02, hides: 1, hidden: 0.7 } })).toBeCloseTo(0.3, 12)
    expect(seenShare({ ...shot, cover: { ...shot.cover, amount: 0.02, hides: 1, hidden: 1.4 } })).toBe(0)
  })
  it('replaces the cover amount in the sample rule and nowhere else', () => {
    class Veiled extends StopPlan {
      override coverHidden(s: Segment, time: number): number {
        return s.kind === 'rise' ? 0.6 : 1.5 * this.coverAmount(s, time)
      }
    }
    const other = withMars(new Veiled('mars', fit as Fit, bare()))
    for (const kind of moves) {
      const s = seg('mars', kind)
      for (let f = s.firstFrame; f < s.endFrame; f++) {
        const a = at(plain, f)
        const b = at(other, f)
        expect(b.cover.amount).toBe(a.cover.amount)
        expect(b.skyExposure).toBe(a.skyExposure)
        expect(b.cover.hidden).toBe(kind === 'rise' ? 0.6 : 1.5 * a.cover.amount)
        expect(seenShare(b)).toBe(kind === 'rise' ? 0.4 : Math.max(1 - 1.5 * a.cover.amount, 0))
      }
    }
    expect(at(other, seg('mars', 'hold').firstFrame).cover.hidden).toBeUndefined()
  })
})

describe('sky turn across a cover', () => {
  const rise = seg('mars', 'rise')
  const dive = seg('mars', 'dive')
  const hold = seg('mars', 'hold')
  it('switches at the centre unless the plan asks for the ease', () => {
    for (const s of [dive, rise]) {
      const w = coverWindow(s)!
      for (let f = s.firstFrame; f < s.endFrame; f++) expect(base.skyTurnShare(s, f / config.fps)).toBeNull()
      expect(apart(at(plain, w.centerFrame - 1).skyTurn, at(plain, w.centerFrame).skyTurn)).toBeGreaterThan(1e-3)
      expect(at(plain, w.firstFrame).skyTurn.toArray()).toEqual(at(plain, w.centerFrame - 1).skyTurn.toArray())
      expect(at(plain, w.centerFrame).skyTurn.toArray()).toEqual(at(plain, w.lastFrame).skyTurn.toArray())
    }
  })
  it('eases from the terrain turn to the orbit turn over the cover window of the move that asks, and leaves the other move alone', () => {
    const eased = new StopPlan('mars', fit as Fit, { ...bare(), skyTurnEase: { rise: true } })
    const film = withMars(eased)
    const w = coverWindow(rise)!
    const low = at(plain, w.firstFrame).skyTurn
    const high = at(plain, w.lastFrame + 1).skyTurn
    const whole = apart(low, high)
    expect(eased.skyTurnShare(rise, w.firstFrame / config.fps)).toBe(1)
    expect(eased.skyTurnShare(rise, (w.lastFrame + 1) / config.fps)).toBe(0)
    expect(eased.skyTurnShare(dive, eased.coverCenter(dive))).toBeNull()
    let last = 0
    let step = 0
    for (let f = rise.firstFrame; f < rise.endFrame; f++) {
      const turn = at(film, f).skyTurn
      if (f <= w.firstFrame || f > w.lastFrame) expect(turn.toArray()).toEqual(at(plain, f).skyTurn.toArray())
      const gone = apart(turn, low)
      expect(gone).toBeGreaterThanOrEqual(last - 1e-7)
      step = Math.max(step, gone - last)
      last = gone
    }
    expect(last).toBeCloseTo(whole, 6)
    expect(step).toBeLessThan(0.2 * whole)
    for (let f = dive.firstFrame; f < dive.endFrame; f++) expect(at(film, f).skyTurn.toArray()).toEqual(at(plain, f).skyTurn.toArray())
    expect(at(film, hold.firstFrame + 3).skyTurn.toArray()).toEqual(at(plain, hold.firstFrame + 3).skyTurn.toArray())
    const both = withMars(new StopPlan('mars', fit as Fit, { ...bare(), skyTurnEase: { dive: true, rise: true } }))
    const d = coverWindow(dive)!
    expect(at(both, d.firstFrame).skyTurn.toArray()).toEqual(at(plain, d.firstFrame).skyTurn.toArray())
    expect(at(both, d.lastFrame + 1).skyTurn.toArray()).toEqual(at(plain, d.lastFrame + 1).skyTurn.toArray())
    const part = apart(at(both, d.centerFrame).skyTurn, at(plain, d.firstFrame).skyTurn)
    expect(part).toBeGreaterThan(0.2 * whole)
    expect(part).toBeLessThan(0.8 * whole)
  })
})

describe('Sun glare carried through the swap', () => {
  it('is off in the base plan', () => {
    for (const kind of moves) {
      const s = seg('mars', kind)
      for (let f = s.firstFrame; f < s.endFrame; f++) expect(base.glareCarry(s, f / config.fps)).toBe(0)
    }
  })
  it('starts at the place the Sun had on the terrain side and returns to the Sun over the asked seconds', () => {
    const span = 0.5
    const p = bare()
    p.light.glareCarry = { rise: span, dive: span }
    const target = new StopPlan('mars', fit as Fit, p)
    const film = withMars(target)
    for (const kind of moves) {
      const s = seg('mars', kind)
      const c = target.coverCenter(s)
      const sign = kind === 'rise' ? 1 : -1
      const low = film.shotAt(Math.floor((c - sign * 2e-6) * config.fps), kind === 'rise' ? c - 1e-6 : c)
      expect(low.sets[0]!.view).toBe('terrain')
      expect(film.glareOf(low)).toBeNull()
      const edgeTime = kind === 'rise' ? c : c - 1e-6
      const edge = film.shotAt(Math.floor(edgeTime * config.fps + 1e-9), edgeTime)
      expect(edge.sets[0]!.view).toBe('orbit')
      expect(film.glareOf(edge)).not.toBeNull()
      const place = inCamera(low, low.sun.dir)
      expect(inCamera(edge, film.glareOf(edge)!).angleTo(place)).toBeLessThan(1e-4)
      expect(inCamera(edge, edge.sun.dir).angleTo(place)).toBeGreaterThan(1e-2)
      for (let k = 0; k <= 20; k++) {
        const time = c + sign * (kind === 'rise' ? 0 : 1e-6) + sign * (k / 20) * span
        const shot = film.shotAt(Math.floor(time * config.fps + 1e-9), time)
        const share = target.glareCarry(s, time)
        const own = inCamera(shot, shot.sun.dir)
        expect(shot.sun.dir.toArray()).toEqual(low.sun.dir.toArray())
        expect(shot).toEqual(plain.shotAt(shot.frame, time))
        if (share <= 0) expect(film.glareOf(shot)).toBeNull()
        else {
          const glare = inCamera(shot, film.glareOf(shot)!)
          expect(glare.angleTo(own)).toBeCloseTo(share * own.angleTo(place), 4)
          expect(glare.angleTo(place)).toBeCloseTo((1 - share) * own.angleTo(place), 4)
        }
      }
      expect(target.glareCarry(s, c + sign * span)).toBe(0)
      expect(target.glareCarry(s, c - sign * 0.1)).toBe(1)
      const past = c + sign * (span + 1 / config.fps)
      expect(film.glareOf(film.shotAt(Math.floor(past * config.fps), past))).toBeNull()
    }
  })
})

describe('band only factor of the sky', () => {
  it('is 1 in the base plan on every frame of the stop', () => {
    for (const kind of ['hold', 'dive', 'terrain', 'rise']) {
      const s = seg('mars', kind)
      for (let f = s.firstFrame; f < s.endFrame; f++) {
        expect(base.skyBand(s, f / config.fps)).toBe(1)
        expect(plain.bandOf(at(plain, f))).toBe(1)
      }
    }
    const t = seg('mars', 'travel')
    expect(plain.bandOf(at(plain, t.firstFrame + 5))).toBe(1)
  })
  it('rises with altitude from the given level to 1 on the orbit side of a dive or rise, and changes nothing else of a shot', () => {
    const p = bare()
    const rise = seg('mars', 'rise')
    const far = Math.abs(base.rise(rise.end - 1e-6).pose.position.length() - 1)
    p.light.bandLow = [0, far, 0.4]
    const low = new StopPlan('mars', fit as Fit, p)
    const film = withMars(low)
    for (const kind of moves) {
      const s = seg('mars', kind)
      const c = low.coverCenter(s)
      let last = kind === 'rise' ? 0 : 2
      let least = 2
      for (let f = s.firstFrame; f < s.endFrame; f++) {
        const shot = at(film, f)
        expect(shot).toEqual(at(plain, f))
        const band = film.bandOf(shot)
        const orbit = kind === 'rise' ? f / config.fps >= c : f / config.fps < c
        if (!orbit) expect(band).toBe(1)
        else {
          expect(band).toBeGreaterThanOrEqual(0.4)
          expect(band).toBeLessThanOrEqual(1)
          if (kind === 'rise') expect(band).toBeGreaterThanOrEqual(last - 1e-9)
          else expect(band).toBeLessThanOrEqual(last + 1e-9)
          last = band
          least = Math.min(least, band)
        }
      }
      expect(least).toBeLessThan(0.7)
    }
    expect(low.skyBand(rise, rise.end - 1e-6)).toBeCloseTo(1, 9)
    const hold = seg('mars', 'hold')
    expect(film.bandOf(at(film, hold.firstFrame + 9))).toBe(1)
    expect(film.bandOf(at(film, seg('mars', 'terrain').firstFrame + 9))).toBe(1)
  })
})

describe('cover pass that cannot reach a pixel', () => {
  const cover = (amount: number, more: Partial<CoverState> = {}): CoverState => ({ amount, color: [1, 1, 1], ...more })
  const aspect = 16 / 9
  it('is skipped for an amount too small for any alpha and drawn otherwise', () => {
    expect(coverReaches(cover(0), 40, aspect)).toBe(false)
    expect(coverReaches(cover(0.02), 40, aspect)).toBe(false)
    expect(coverReaches(cover(0.09), 40, aspect)).toBe(false)
    expect(coverReaches(cover(0.12), 40, aspect)).toBe(true)
    expect(coverReaches(cover(0.5), 40, aspect)).toBe(true)
    expect(coverReaches(cover(1), 40, aspect)).toBe(true)
    const rush = { focus: [0, 0] as [number, number], phase: 0, billow: [3.5, 3.5, 1] as [number, number, number], streak: [9, 6, 1.6] as [number, number, number], contrast: [1.7, 1.2] as [number, number] }
    expect(coverReaches(cover(0.02, { rush }), 40, aspect)).toBe(false)
    expect(coverReaches(cover(0.06, { rush }), 40, aspect)).toBe(true)
  })
  it('is skipped when the shell lies outside the frame, and never when a ray of the frame passes inside it', () => {
    expect(coverReaches(cover(0.5, { shell: { centre: [0, 0, -5], inner: -2, outer: -1 } }), 40, aspect)).toBe(false)
    expect(coverReaches(cover(0.5, { shell: { centre: [0, 0, -5], inner: 1, outer: 1 } }), 40, aspect)).toBe(true)
    expect(coverReaches(cover(0.5, { shell: { centre: [0, 0, -5], inner: 0.99, outer: 1.01 } }), 40, aspect)).toBe(true)
    expect(coverReaches(cover(0.5, { shell: { centre: [10, 0, -1], inner: 1, outer: 1.2 } }), 40, aspect)).toBe(false)
    expect(coverReaches(cover(0.5, { shell: { centre: [10, 0, -1], inner: 1, outer: 9 } }), 40, aspect)).toBe(true)
    expect(coverReaches(cover(0.5, { shell: { centre: [0, 0, 3], inner: 1, outer: 1.5 } }), 40, aspect)).toBe(false)
    let seed = 12345
    const next = (): number => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }
    let skipped = 0
    let empty = 0
    for (let n = 0; n < 400; n++) {
      const vfov = 20 + 60 * next()
      const far = 0.5 + 12 * next()
      const dir = new THREE.Vector3(next() * 2 - 1, next() * 2 - 1, next() * 2 - 1).normalize().multiplyScalar(far)
      const inner = 0.2 + 3 * next()
      const outer = inner + 0.01 + next()
      const ty = Math.tan(THREE.MathUtils.degToRad(vfov) / 2)
      let least = Infinity
      for (let j = 0; j <= 60; j++) {
        for (let i = 0; i <= 100; i++) {
          const ray = new THREE.Vector3((i / 50 - 1) * ty * aspect, (j / 30 - 1) * ty, -1).normalize()
          const reach = dir.dot(ray)
          least = Math.min(least, reach > 0 ? Math.sqrt(Math.max(far * far - reach * reach, 0)) : far)
        }
      }
      const reaches = coverReaches(cover(0.5, { shell: { centre: [dir.x, dir.y, dir.z], inner, outer } }), vfov, aspect)
      if (least < outer) expect(reaches).toBe(true)
      else empty++
      if (!reaches) skipped++
    }
    expect(empty).toBeGreaterThan(40)
    expect(skipped).toBeGreaterThan(0.8 * empty)
  })
})
