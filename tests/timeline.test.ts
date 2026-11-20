import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { clipRange, coverWindow, judgedFrames, segmentAtFrame, segmentAtTime, setsForFrame } from '../src/director/timeline'

describe('timeline', () => {
  it('maps every boundary to the right frame', () => {
    let cursor = 0
    for (const s of config.segments) {
      expect(s.firstFrame).toBe(cursor)
      expect(s.firstFrame).toBe(s.start * config.fps)
      expect(segmentAtFrame(s.firstFrame).id).toBe(s.id)
      expect(segmentAtFrame(s.endFrame - 1).id).toBe(s.id)
      expect(segmentAtTime(s.start).id).toBe(s.id)
      cursor = s.endFrame
    }
    expect(cursor).toBe(config.frameCount)
  })
  it('follows the judged frame rule', () => {
    const j = judgedFrames()
    const frames = j.map((x) => x.frame)
    expect(frames).toContain(0)
    expect(frames).toContain(config.hookFrame)
    const fractions = config.raw.judged.fractions as Record<string, number>
    for (const s of config.segments) {
      const fr = fractions[s.kind]
      if (fr === undefined) continue
      const f = s.firstFrame + Math.floor(fr * s.frames + 1e-9)
      expect(frames).toContain(f)
      expect(segmentAtFrame(f).id).toBe(s.id)
    }
    expect([...frames].sort((a, b) => a - b)).toEqual(frames)
    expect(new Set(frames).size).toBe(frames.length)
  })
  it('keeps every cover window on whole frames inside its segment', () => {
    let seen = 0
    for (const s of config.segments) {
      const w = coverWindow(s)
      if (s.kind !== 'dive' && s.kind !== 'rise') {
        expect(w).toBeNull()
        continue
      }
      seen++
      expect(w).not.toBeNull()
      expect(Number.isInteger(w!.firstFrame)).toBe(true)
      expect(Number.isInteger(w!.lastFrame)).toBe(true)
      expect(w!.firstFrame).toBeGreaterThanOrEqual(s.firstFrame)
      expect(w!.lastFrame).toBeLessThan(s.endFrame)
      expect(w!.lastFrame - w!.firstFrame).toBe(Math.round(config.raw.cover.seconds * config.fps))
    }
    expect(seen).toBeGreaterThan(0)
  })
  it('gives each stop a clip range', () => {
    for (const id of config.stopIds) {
      const r = clipRange(id)
      expect(r.endFrame).toBeGreaterThan(r.firstFrame)
      expect(setsForFrame(r.firstFrame)).toContain(id)
    }
  })
})
