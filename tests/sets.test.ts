import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { planLoads } from '../src/core/sets'
import { segmentAtFrame, setsForFrame } from '../src/director/timeline'

describe('sets', () => {
  it('names the sets each frame needs', () => {
    const last = config.stopIds[config.stopIds.length - 1]!
    for (let f = 0; f < config.frameCount; f++) {
      const s = segmentAtFrame(f)
      const sets = setsForFrame(f)
      expect(sets.length).toBeLessThanOrEqual(config.maxLoadedSets)
      if (s.stop === config.endingId) expect(sets).toEqual([last])
      else if (s.kind === 'travel') {
        const i = config.stopIds.indexOf(s.stop)
        expect(sets).toEqual(config.stopIds[i + 1] ? [s.stop, config.stopIds[i + 1]] : [s.stop])
      } else expect(sets).toEqual([s.stop])
    }
  })
  it('never holds more than the limit', () => {
    let loaded: string[] = []
    let peak = 0
    for (let f = 0; f < config.frameCount; f += 3) {
      const plan = planLoads(loaded, setsForFrame(f), config.maxLoadedSets)
      loaded = plan.after
      peak = Math.max(peak, plan.peak)
      for (const id of setsForFrame(f)) expect(loaded).toContain(id)
    }
    expect(peak).toBeLessThanOrEqual(config.maxLoadedSets)
    const back = planLoads(['neptune', 'uranus'], ['sun'], config.maxLoadedSets)
    expect(back.peak).toBeLessThanOrEqual(config.maxLoadedSets)
    expect(back.after).toContain('sun')
  })
})
