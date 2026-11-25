import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'
import look from '../src/space/farsun/look.json'
import { globeShare, handoverSpan, spans, swapDistance, wearShare, wearSpan } from '../src/space/farsun/share'

const swapOf = (deg: number): number => 1 / Math.sin((deg * Math.PI) / 180)

describe('the handover and the wear of the far Sun', () => {
  const film = new FilmDirector(plans)
  const far = (frame: number): { share: number; burn: number } => {
    const f = film.shotAt(frame, frame / config.fps).sun.far
    if (!f) throw new Error('no far Sun at ' + frame)
    return { share: f.share, burn: f.burn }
  }

  it('reads the swap distance the film reads, from the plan of the first stop after the Sun', () => {
    expect(swapDistance).toBeCloseTo(swapOf(plans[1]!.p.light.sunRadiusDeg), 12)
    expect(swapDistance).toBeCloseTo((film as unknown as { sunSwap: number }).sunSwap, 12)
  })

  it('holds its ends as shares of the way, with no distance of an end in the look', () => {
    for (const span of [look.handover, look.wear]) {
      expect(span[1]).toBeGreaterThan(0)
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
})
