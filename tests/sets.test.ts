import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { config } from '../src/config'
import { SetLoader, planLoads } from '../src/core/sets'
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

describe('set loader after a restored drawing context', () => {
  const make = (): { loader: SetLoader; built: string[]; freed: string[]; gate: { wait: Promise<void> | null } } => {
    vi.stubGlobal('document', { baseURI: 'http://localhost/' })
    const loader = new SetLoader({} as THREE.WebGLRenderer, () => config.formats[config.formatKeys.master]!, 1)
    const built: string[] = []
    const freed: string[] = []
    const gate: { wait: Promise<void> | null } = { wait: null }
    let n = 0
    for (const id of ['a', 'b']) {
      loader.register(id, async () => {
        const name = id + ++n
        built.push(name)
        if (gate.wait) await gate.wait
        return { id, world: new THREE.Group(), update: () => undefined, dispose: () => void freed.push(name) }
      })
    }
    return { loader, built, freed, gate }
  }

  it('frees every set on reset and loads it again when asked', async () => {
    const { loader, built, freed } = make()
    await loader.ensure(['a', 'b'], 'web')
    const first = loader.get('a')
    loader.reset()
    expect(loader.loadedIds()).toEqual([])
    expect(freed).toEqual(['a1', 'b2'])
    await loader.ensure(['a', 'b'], 'web')
    expect(built).toEqual(['a1', 'b2', 'a3', 'b4'])
    expect(loader.get('a')).not.toBe(first)
    expect(loader.has('b', 'web')).toBe(true)
  })

  it('throws away a set that was being built across a reset and builds it again', async () => {
    const { loader, built, freed, gate } = make()
    let open = (): void => undefined
    gate.wait = new Promise<void>((r) => (open = r))
    const job = loader.ensure(['a'], 'web')
    await Promise.resolve()
    loader.reset()
    gate.wait = null
    open()
    await job
    expect(built).toEqual(['a1', 'a2'])
    expect(freed).toEqual(['a1'])
    expect(loader.has('a', 'web')).toBe(true)
  })
})
