import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'
import * as THREE from 'three'
import { faceLaw, holdFrame } from '../src/space/farsun/farsun'
import { HOLD } from '../src/space/farsun/hold'
import look from '../src/space/farsun/look.json'
import { globeShare, spans, swapDistance, wearShare } from '../src/space/farsun/share'

const swapOf = (deg: number): number => 1 / Math.sin((deg * Math.PI) / 180)

describe('the handover and the wear of the far Sun', () => {
  const film = new FilmDirector(plans)
  const far = (frame: number): { share: number; burn: number } => {
    const f = film.shotAt(frame, frame / config.fps).sun.far
    if (!f) throw new Error('no far Sun at ' + frame)
    return { share: f.share, burn: f.burn }
  }

  const handoverSpan = spans(swapDistance).handover
  const wearSpan = spans(swapDistance).wear
  const sunStart = (film as unknown as { sunStart: number }).sunStart

  it('starts from the distance of the last view of the Sun stop: the typed stand-in stands within 0.005 of the distance of the film, and the distance of the film is taken when it is handed over', () => {
    expect(Math.abs(look.sunStart - sunStart)).toBeLessThan(0.005)
    const handed = spans(swapDistance, sunStart)
    const typed = spans(swapDistance, look.sunStart)
    for (const key of ['handover', 'wear'] as const) {
      expect(handed[key][0]).toBeGreaterThanOrEqual(sunStart)
      expect(handed[key][1]).toBeGreaterThan(handed[key][0])
      expect(handed[key][1]).toBeLessThanOrEqual(swapDistance)
      expect(Math.abs(handed[key][0] - typed[key][0])).toBeLessThan(0.005)
      expect(Math.abs(handed[key][1] - typed[key][1])).toBeLessThan(0.005)
    }
  })

  it('reads the swap distance the film reads, from the plan of the first stop after the Sun', () => {
    expect(swapDistance).toBeCloseTo(swapOf(plans[1]!.p.light.sunRadiusDeg), 12)
    expect(swapDistance).toBeCloseTo((film as unknown as { sunSwap: number }).sunSwap, 12)
  })

  it('holds both ends as shares of the way from the last view of the Sun stop to the swap, with no distance of an end in the look', () => {
    for (const span of [look.handover, look.wear]) {
      expect(span[0]).toBeGreaterThanOrEqual(0)
      expect(span[1]).toBeGreaterThan(span[0]!)
      expect(span[1]).toBeLessThanOrEqual(1)
    }
  })

  it('ends the wear and the handover at or before the swap distance of every stop', () => {
    for (const plan of plans) {
      const swap = swapOf(plan.p.light.sunRadiusDeg)
      const { handover, wear } = spans(swap)
      expect(handover[1], plan.id).toBeLessThanOrEqual(swap)
      expect(wear[1], plan.id).toBeLessThanOrEqual(swap)
    }
    for (const deg of [5, 9.2, 11.69, 12, 14, 30]) {
      const swap = swapOf(deg)
      const { handover, wear } = spans(swap)
      expect(handover[1], String(deg)).toBeLessThanOrEqual(swap)
      expect(wear[1], String(deg)).toBeLessThanOrEqual(swap)
    }
  })

  it('has worn out where the globe of the Sun stop has gone, so no frame hangs on what is loaded', () => {
    expect(wearSpan[1]).toBeLessThanOrEqual(handoverSpan[1])
    expect(handoverSpan[1]).toBeGreaterThan(handoverSpan[0])
    for (let k = 0; k <= 400; k++) {
      const d = handoverSpan[0] + ((swapDistance * 1.5 - handoverSpan[0]) * k) / 400
      if (globeShare(d) === 0) expect(wearShare(d), String(d)).toBe(0)
    }
    expect(globeShare(swapDistance)).toBe(0)
    expect(wearShare(swapDistance)).toBe(0)
  })

  it('has no step in the share or in the burn at any sixteenth of a frame of the way out of the Sun', () => {
    const seg = config.segments.find((s) => s.id === 'sun.travel')!
    let share = 0
    let burn = 0
    for (let k = 0; k < (seg.end - seg.start) * config.fps * 16; k++) {
      const a = far(seg.start * config.fps + k / 16)
      const b = far(seg.start * config.fps + (k + 1) / 16)
      share = Math.max(share, Math.abs(b.share - a.share))
      burn = Math.max(burn, Math.abs(b.burn - a.burn))
    }
    expect(share).toBeLessThan(0.02)
    expect(burn).toBeLessThan(0.004)
  })

  it('is whole and fully burnt before the pull ends and stays so through the leave', () => {
    for (const frame of [489, 495, 499, 499.4375, 499.5, 499.5625, 500, 500.5]) {
      const a = far(frame)
      const b = far(499)
      expect(a.share, String(frame)).toBe(1)
      expect(a.burn, String(frame)).toBeCloseTo(b.burn, 6)
    }
  })

  it('keeps the face of the Sun stop through the handover: the spots and the fields go out with the exposure after it and never before', () => {
    for (const frame of [471, 475, 480, 484, 485, 495, 500]) {
      const law = faceLaw(far(frame).burn)
      expect(law.flat, String(frame)).toBeLessThan(1e-6)
      expect(law.power, String(frame)).toBeCloseTo(look.spots.power[0]!, 6)
      expect(law.plage, String(frame)).toBeCloseTo(look.plage.gain[0]!, 6)
    }
    const full = faceLaw(1)
    expect(full).toEqual({ flat: look.spots.flat[0], power: look.spots.power[1], plage: look.plage.gain[1] })
    let step = 0
    for (let k = 0; k < 400; k++) step = Math.max(step, Math.abs(faceLaw((k + 1) / 400).flat - faceLaw(k / 400).flat))
    expect(step).toBeLessThan(0.004)
  })

  it('reads the map of place from the eye of the middle of the hold of the first stop after the Sun, as the film stands there', () => {
    const seg = config.segments.find((s) => s.id === plans[1]!.id + '.hold')!
    const frame = ((seg.start + seg.end) / 2) * config.fps
    const shot = film.shotAt(frame, frame / config.fps)
    const f = shot.sun.far
    if (!f) throw new Error('no far Sun at ' + frame)
    const eye = shot.sun.dir.clone().normalize().multiplyScalar(-1 / Math.sin(shot.sun.angularRadius)).applyQuaternion(f.body.clone().invert())
    const held = holdFrame(f.spin)
    expect(held.eye.distanceTo(eye)).toBeLessThan(2e-3)
    expect(new THREE.Vector3().fromArray(HOLD.eye).length()).toBeCloseTo(swapDistance, 3)
    expect(Math.abs(held.x.dot(held.axis))).toBeLessThan(1e-9)
    expect(Math.abs(held.y.dot(held.axis))).toBeLessThan(1e-9)
    expect(HOLD.data.length).toBe(Math.ceil((HOLD.width * HOLD.height * 2) / 3) * 4)
  })
})
