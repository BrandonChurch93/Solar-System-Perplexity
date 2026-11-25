import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'
import { bandClear, bandHeld, bandSpan, readBandSpan, setBandSpan } from '../src/space/sky'

const HOLD = config.raw.travel.sky.bandHold as Record<string, number[]>
const LEAST = config.raw.travel.sky.bandHoldLeast as number

describe('the hold of the band of the sky in a rise', () => {
  const director = new FilmDirector(plans)

  it('finds the last stretch in which the band stands off the frame', () => {
    expect(bandSpan([0, 0, 20, 20, 20, 20, 0, 0], 10, 4)).toEqual([1, 5])
    expect(bandSpan([0, 0, 20, 20, 20, 20, 20, 20], 10, 4)).toEqual([1, 7])
    expect(bandSpan([0, 20, 20, 20, 20, 0, 20, 20], 10, 4)).toEqual([0, 4])
    expect(bandSpan([0, 0, 20, 20, 20, 0, 0, 0], 10, 4)).toBeNull()
    expect(bandSpan([20, 20, 20, 20, 20, 20, 20, 20], 10, 4)).toBeNull()
    expect(bandSpan([0, 0, 0, 0], 10, 4)).toBeNull()
  })

  it('is whole before its stretch, gone at its end and never rises between, and a stop that names none has none', () => {
    setBandSpan('test', [0.4, 0.8])
    expect(bandHeld('test', 0)).toBe(1)
    expect(bandHeld('test', 0.4)).toBe(1)
    expect(bandHeld('test', 0.8)).toBe(0)
    expect(bandHeld('test', 1)).toBe(0)
    let was = 1
    for (let k = 0; k <= 1000; k++) {
      const now = bandHeld('test', k / 1000)
      expect(now).toBeLessThanOrEqual(was)
      was = now
    }
    setBandSpan('test', null)
    expect(bandHeld('test', 0.5)).toBe(0)
    expect(readBandSpan('saturn', director)).toBeNull()
  })

  for (const id of Object.keys(HOLD)) {
    it('falls in the rise of ' + id + ' only while the middle line of the band stands off the frame, and is gone at the last frame of the rise', () => {
      const span = readBandSpan(id, director)
      if (!span) {
        console.log(id + ': no hold on this path, the band keeps the lift of the stars (no stretch of ' + LEAST + ' frames with the band ' + HOLD[id]![0] + ' degrees off the frame after it stood nearer)')
        return
      }
      setBandSpan(id, span)
      const seg = config.segments.find((x) => x.stop === id && x.kind === 'rise')!
      const first = Math.ceil(seg.start * config.fps)
      const last = Math.ceil(seg.end * config.fps) - 1
      const broken: string[] = []
      let falling = 0
      let fell = 0
      for (let f = first; f <= last; f++) {
        const s = director.shotAt(f, f / config.fps)
        expect(s.segment.stop).toBe(id)
        expect(s.segment.kind).toBe('rise')
        const w = bandHeld(id, s.u)
        const c = bandClear(s, director.sky.frame)
        if (w > 0 && w < 1) {
          falling++
          if (c < HOLD[id]![0]!) broken.push('frame ' + f + ': weight ' + w.toFixed(3) + ', the band ' + c.toFixed(1) + ' degrees off the frame, wanted ' + HOLD[id]![0])
        }
        if (w < 1 && !fell) fell = f
      }
      console.log(id + ': the hold falls from frame ' + (fell - 1) + ' over ' + (falling + 1) + ' frames, progress ' + span![0].toFixed(4) + ' to ' + span![1].toFixed(4))
      expect(broken).toEqual([])
      expect(falling).toBeGreaterThanOrEqual(LEAST - 1)
      expect(bandHeld(id, director.shotAt(last, last / config.fps).u)).toBe(0)
      setBandSpan(id, null)
    })
  }
})
