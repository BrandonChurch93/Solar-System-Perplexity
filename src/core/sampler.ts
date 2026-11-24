import { config, type SegmentKind } from '../config'
import { captureRate, shutterSpan } from './clock'

export interface Sample { jitterX: number; jitterY: number; timeOffset: number; weight: number }

const G = 1.32471795724474602596
const A1 = 1 / G
const A2 = 1 / (G * G)

export function sampleCount(tier: string, kind: SegmentKind): number {
  const t = config.tiers[tier]
  if (!t) throw new Error('unknown tier ' + tier)
  return config.fastKinds.includes(kind) ? t.fastSamplesPerFrame : t.samplesPerFrame
}

// shutter is the share of the film's shutter a frame keeps (E6, the capped shutter of a dive or a rise): the samples are spread over that share
// around the middle of the full shutter, so the middle of the frame stays where it is. At 1 the times are the expression they always were.
export function samplesFor(count: number, shutter = 1): Sample[] {
  const out: Sample[] = []
  for (let i = 0; i < count; i++) {
    const jx = count === 1 ? 0 : ((0.5 + A1 * (i + 1)) % 1) - 0.5
    const jy = count === 1 ? 0 : ((0.5 + A2 * (i + 1)) % 1) - 0.5
    const timeOffset = shutter === 1 ? ((i + 0.5) / count) * shutterSpan() : shutterOffset((i + 0.5) / count, shutter)
    out.push({ jitterX: jx, jitterY: jy, timeOffset, weight: 1 / count })
  }
  return out
}

// The time inside a frame, in frames, of the position 0 to 1 inside a shutter that keeps the given share of the film's shutter around its middle.
export function shutterOffset(position: number, shutter: number): number {
  return (0.5 + (position - 0.5) * shutter) * shutterSpan()
}

// The way back: the position 0 to 1 inside the shortened shutter of a time inside a frame, in frames.
export function shutterPosition(offset: number, shutter: number): number {
  const rate = captureRate()
  const own = rate === 1 ? offset : offset - Math.floor(offset * rate + 1e-9) / rate
  return shutter === 1 ? own / shutterSpan() : 0.5 + (own / shutterSpan() - 0.5) / shutter
}

export function shutterMid(): number {
  return config.shutterFraction * 0.5
}
