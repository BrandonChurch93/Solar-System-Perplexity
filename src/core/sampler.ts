import { config, type SegmentKind } from '../config'
import { captureRate, shutterSpan } from './clock'
import { jitterOffsets } from './jitter'

export interface Sample { jitterX: number; jitterY: number; timeOffset: number; weight: number }

export function sampleCount(tier: string, kind: SegmentKind): number {
  const t = config.tiers[tier]
  if (!t) throw new Error('unknown tier ' + tier)
  return config.fastKinds.includes(kind) ? t.fastSamplesPerFrame : t.samplesPerFrame
}

// shutter is the share of the film's shutter a frame keeps (E6, the capped shutter of a dive or a rise): the samples are spread over that share
// around the middle of the full shutter, so the middle of the frame stays where it is. At 1 the times are the expression they always were.
//
// ends is the share of its time over which the shutter opens, and the same share over which it closes (handover.shutterEnds, by stop). A
// shutter that is open at once and shut at once draws a small light that moves as a bar with hard ends, and a field of such lights as a
// mosaic of bars. With ends each sample weighs as far as the shutter is open at its time (shutterOpen), so the bar fades in and out. The
// times of the samples are the same at every ends. Their places are taken less their weighed middle, as jitterOffsets takes them less
// their plain mean: the picture sits where it sat, at every count. At 0 every sample weighs 1 / count and the list is the one it always
// was, to the bit. A set that reads the place of a sample from this list itself must ask with the ends of the frame it draws.
export function samplesFor(count: number, shutter = 1, ends = 0): Sample[] {
  const out: Sample[] = []
  const at = jitterOffsets(count)
  const open = ends > 0 && count > 1 ? shutterWeights(count, ends) : null
  let mx = 0
  let my = 0
  if (open) {
    for (let i = 0; i < count; i++) {
      mx += open[i]! * at[2 * i]!
      my += open[i]! * at[2 * i + 1]!
    }
  }
  for (let i = 0; i < count; i++) {
    const jx = open ? at[2 * i]! - mx : at[2 * i]!
    const jy = open ? at[2 * i + 1]! - my : at[2 * i + 1]!
    const timeOffset = shutter === 1 ? ((i + 0.5) / count) * shutterSpan() : shutterOffset((i + 0.5) / count, shutter)
    out.push({ jitterX: jx, jitterY: jy, timeOffset, weight: open ? open[i]! : 1 / count })
  }
  return out
}

// How far the shutter is open, 0 to 1, at the position 0 to 1 inside its time: it opens over the share ends at its start and closes over
// the same share at its end, each as half a wave of a cosine, and is wide open between. At a share of a half it opens and closes without
// a rest; at 0 it is wide open all the time.
export function shutterOpen(position: number, ends: number): number {
  if (!(ends > 0)) return 1
  const x = Math.min(position, 1 - position) / ends
  return x >= 1 ? 1 : x <= 0 ? 0 : 0.5 - 0.5 * Math.cos(Math.PI * x)
}

// The weights of the samples of a count under a shutter with ends: how far the shutter is open at the time of each, over the sum of all,
// so that they add up to 1 and the light of the frame is the light it had.
export function shutterWeights(count: number, ends: number): number[] {
  const open = Array.from({ length: count }, (_, i) => shutterOpen((i + 0.5) / count, ends))
  const whole = open.reduce((a, b) => a + b, 0)
  return open.map((w) => w / whole)
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
