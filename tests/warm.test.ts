import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import table from '../src/core/warm.json'
import { config } from '../src/config'
import { segmentAtFrame } from '../src/director/timeline'

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? sources(join(dir, e.name)) : e.name.endsWith('.ts') ? [join(dir, e.name)] : []))
}

const src = join(process.cwd(), 'src')
const callers = (pattern: RegExp): string[] => sources(src).filter((f) => pattern.test(readFileSync(f, 'utf8'))).map((f) => relative(src, f)).sort()

describe('warm start', () => {
  it('lists frames of the film outside the holds, in order, once each', () => {
    const frames = table.frames as number[]
    for (const f of frames) {
      expect(f).toBeGreaterThanOrEqual(0)
      expect(f).toBeLessThan(config.frameCount)
      expect(segmentAtFrame(f).kind).not.toBe('hold')
    }
    expect([...new Set(frames)].sort((a, b) => a - b)).toEqual(frames)
  })
  it('is started by autopilot, the live page and showcase.ahead only, never by a capture or an export', () => {
    expect(callers(/\bwarm\.run\(|\bengine\.ahead\(/)).toEqual(['capture/frame.ts', 'director/modes.ts'])
    expect(callers(/\bwarm\.step\(/)).toEqual(['core/engine.ts'])
    expect(callers(/\bwarmDraw\(/)).toEqual(['core/engine.ts', 'core/warm.ts'])
    const frame = readFileSync(join(src, 'capture/frame.ts'), 'utf8')
    expect(frame.match(/warm\.run\(/g)).toHaveLength(1)
    expect(frame).toMatch(/ahead: \(frame, t, all = false\) => engine\.warm\.run\(/)
  })
})
