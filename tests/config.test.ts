import { describe, expect, it } from 'vitest'
import raw from '../config/showcase.json'
import { buildConfig, config } from '../src/config'

const clone = (): typeof raw => JSON.parse(JSON.stringify(raw)) as typeof raw

describe('config validation', () => {
  it('accepts the shipped config', () => {
    expect(() => buildConfig(raw)).not.toThrow()
    expect(config.frameCount).toBe(raw.film.fps * raw.film.durationSeconds)
  })
  it('fails on a missing key', () => {
    const c = clone() as unknown as Record<string, unknown>
    delete c.seed
    expect(() => buildConfig(c)).toThrow(/missing key seed/)
  })
  it('fails when segments do not start at 0', () => {
    const c = clone()
    c.segments[0]!.start = 1
    expect(() => buildConfig(c)).toThrow(/do not start at 0/)
  })
  it('fails on a gap', () => {
    const c = clone()
    c.segments[1]!.start += 1
    expect(() => buildConfig(c)).toThrow(/gap/)
  })
  it('fails on an overlap', () => {
    const c = clone()
    c.segments[1]!.start -= 1
    expect(() => buildConfig(c)).toThrow(/overlap/)
  })
  it('fails when a boundary is off a whole frame', () => {
    const c = clone()
    const t = c.segments[0]!.end + 0.01
    c.segments[0]!.end = t
    c.segments[1]!.start = t
    expect(() => buildConfig(c)).toThrow(/whole frame/)
  })
  it('fails when the last segment does not end at the duration', () => {
    const c = clone()
    c.segments.pop()
    expect(() => buildConfig(c)).toThrow(/does not end/)
  })
  it('fails when an approved image is missing', () => {
    expect(() => buildConfig(raw, (p) => !p.includes('mars'))).toThrow(/approved image missing for stop mars/)
  })
})
