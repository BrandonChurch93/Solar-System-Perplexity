import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'

// MAIL 754: the dive of Venus threw "skyCarryShare must lie from 0 to 1" at frame 1266 + 3/8. The share by height came out
// minus 1.1e-15 there: the quintic of the ease gave 1 + 1.1e-15 just under the upper height of plates.json (sky.carry). The film's
// own sample times do not hit it, a tool that asks an odd instant did. The shares by height of src/stops/venus/plan.ts (below) are
// held to 0 to 1 where they are made; this asks that instant and every eighth of a frame of the dive and the rise.
const venus = plans.find((p) => p.id === 'venus')!
const moves = config.segments.filter((s) => s.stop === 'venus' && (s.kind === 'dive' || s.kind === 'rise'))

describe('venus: the shares of the sky by height lie from 0 to 1 at any instant', () => {
  it('the instant that threw: frame 1266 + 3/8 of the dive', () => {
    const dive = moves.find((s) => s.kind === 'dive')!
    const time = (1266 + 0.375) / config.fps
    const carry = venus.skyCarryShare(dive, time)
    expect(carry).not.toBeNull()
    expect(carry!).toBeGreaterThanOrEqual(0)
    expect(carry!).toBeLessThanOrEqual(1)
    expect(() => new FilmDirector(plans).shotAt(1266, time, 'orbit')).not.toThrow()
  })

  it('every eighth of a frame of the dive and the rise', () => {
    expect(moves.length).toBe(2)
    const out: string[] = []
    for (const seg of moves) {
      for (let f = seg.firstFrame; f < seg.endFrame; f++) {
        for (let i = 0; i < 8; i++) {
          const time = (f + i / 8) / config.fps
          const carry = venus.skyCarryShare(seg, time)
          const low = venus.skyShare(seg, time)?.low
          if (!(carry !== null && carry >= 0 && carry <= 1)) out.push(seg.kind + ' ' + f + ' + ' + i + '/8: carry ' + carry)
          if (!(low !== undefined && low >= 0 && low <= 1)) out.push(seg.kind + ' ' + f + ' + ' + i + '/8: low ' + low)
        }
      }
    }
    expect(out).toEqual([])
  })
})
