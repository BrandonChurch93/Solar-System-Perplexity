import { config, type Segment } from '../../src/config'
import { framePlan, frameSamples, type FramePlan } from '../../src/core/motion'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

const director = new FilmDirector(plans)

export const samplesOf = (frame: number, tier: string): number => frameSamples(director, frame, tier)

export const planOf = (frame: number, tier: string): FramePlan => framePlan(director, frame, tier)

export const samplesOfSpan = (first: number, end: number, tier: string): number => {
  let sum = 0
  for (let f = first; f < end; f++) sum += samplesOf(f, tier)
  return sum
}

export function stressSpan(seg: Segment, seconds: number): { judged: number; first: number; end: number; fraction: number | undefined } {
  const fraction = (config.raw.judged.fractions as Record<string, number>)[seg.kind]
  const judged = fraction === undefined ? seg.firstFrame + Math.floor(seg.frames / 2) : seg.firstFrame + Math.floor(fraction * seg.frames + 1e-9)
  const len = Math.min(Math.max(1, Math.round(seconds * config.fps)), seg.frames)
  const first = Math.min(Math.max(judged - Math.floor(len / 2), seg.firstFrame), seg.endFrame - len)
  return { judged, first, end: first + len, fraction }
}
