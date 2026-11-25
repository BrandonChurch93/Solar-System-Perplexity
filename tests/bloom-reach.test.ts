import type * as THREE from 'three'
import { afterEach, describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { setFrame } from '../src/core/frame'
import { PostChain } from '../src/post/chain'
import { bloomPlan } from '../src/post/reach'

const MASTER = config.raw.formats.master.height
const LEVELS = 6
const format = (key: 'master' | 'uhd' | 'preview'): { width: number; height: number } => config.formats[config.formatKeys[key]]!
const plan = (key: 'master' | 'uhd' | 'preview'): ReturnType<typeof bloomPlan> => bloomPlan(format(key).width, format(key).height, format(key).height / MASTER, LEVELS)

interface Inside {
  downs: THREE.WebGLRenderTarget[]
  ups: THREE.WebGLRenderTarget[]
  streaks: THREE.WebGLRenderTarget[]
  halves: THREE.WebGLRenderTarget[]
  step: number
}

const built = (key: 'master' | 'uhd' | 'preview'): Inside => {
  const f = format(key)
  setFrame(f.height, MASTER)
  const chain = new PostChain()
  chain.resize(f.width, f.height)
  return chain as unknown as Inside
}

const sizes = (list: THREE.WebGLRenderTarget[]): [number, number][] => list.map((t) => [t.width, t.height])

describe('the reach of the bloom', () => {
  afterEach(() => setFrame(MASTER, MASTER))

  it('keeps the master as it was: six halvings of the frame, no picture in between, a step of one texel', () => {
    const p = plan('master')
    expect(p.levels).toEqual([[960, 540], [480, 270], [240, 135], [120, 68], [60, 34], [30, 17]])
    expect(p.halves).toEqual([])
    expect(p.step).toBe(1)
  })

  it('counts the levels from the master at every frame size, so a level is the same angle wide', () => {
    expect(plan('uhd').levels).toEqual(plan('master').levels)
    expect(plan('preview').levels).toEqual(plan('master').levels)
  })

  it('reads the first level from a picture where the step is one master pixel', () => {
    for (const key of ['master', 'uhd', 'preview'] as const) {
      const p = plan(key)
      const read = p.halves.length > 0 ? p.halves[p.halves.length - 1]![1] : format(key).height
      expect(read / p.step).toBe(MASTER)
    }
    expect(plan('uhd').halves).toEqual([[1920, 1080]])
    expect(plan('uhd').step).toBe(1)
    expect(plan('preview').halves).toEqual([])
    expect(plan('preview').step).toBe(0.5)
  })

  it('without the factor the levels of the large frame are twice as fine, which is the fault', () => {
    const blind = bloomPlan(format('uhd').width, format('uhd').height, 1, LEVELS)
    expect(blind.levels[LEVELS - 1]).toEqual([60, 34])
    expect(plan('uhd').levels[LEVELS - 1]).toEqual([30, 17])
  })

  it('halves a frame of any whole power of two and leaves the rest to the step', () => {
    expect(bloomPlan(7680, 4320, 4, LEVELS).halves).toEqual([[3840, 2160], [1920, 1080]])
    const odd = bloomPlan(2880, 1620, 1.5, LEVELS)
    expect(odd.halves).toEqual([[1440, 810]])
    expect(odd.step).toBe(0.75)
    expect(odd.levels).toEqual(plan('master').levels)
    expect(() => bloomPlan(1920, 1080, 0, LEVELS)).toThrow('no frame')
  })

  it('builds the chain by the plan: the same targets at every frame size, one more picture at uhd', () => {
    const master = built('master')
    const uhd = built('uhd')
    const preview = built('preview')
    expect(sizes(master.downs)).toEqual(plan('master').levels)
    expect(sizes(uhd.downs)).toEqual(sizes(master.downs))
    expect(sizes(preview.downs)).toEqual(sizes(master.downs))
    expect(sizes(uhd.ups)).toEqual(sizes(master.ups))
    expect(sizes(uhd.streaks)).toEqual([[120, 68], [120, 68]])
    expect(sizes(master.streaks)).toEqual([[120, 68], [120, 68]])
    expect(sizes(master.halves)).toEqual([])
    expect(sizes(uhd.halves)).toEqual([[1920, 1080]])
    expect([master.step, uhd.step, preview.step]).toEqual([1, 1, 0.5])
  })
})
