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
// was, to the bit. A set that needs the place or the weight of the sample it is drawn for reads them from its view (RenderView.jitterX,
// jitterY, weight, weights): the list of samplesFor(view.samples) is the frame's own only under a shutter without ends.
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

// The view of each sample of a frame that draws two views, by the light each sample brings (FramePlan.sides): true where the sample is
// the first view's, and share is the share of the frame's light the first view is to have. The samples are taken in the order of their
// times. The first view is owed its share of the weight of each, and takes a sample when it is owed half of that sample's weight or more.
// So at every time inside the shutter each view has had its share of the light so far to within half a sample, the samples of each view
// lie over the whole shutter, and what is left owed at the end is worked off by the last samples, which under a shutter that closes
// weigh next to nothing. At a share of a half every other sample is the first view's; with a count that is even and weights that read
// the same from both ends the two views then have one half of the light each, to the last bit of the sum.
export function splitSides(weights: ArrayLike<number>, share: number): boolean[] {
  const out: boolean[] = []
  let owed = 0
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i]!
    owed += share * w
    const first = owed >= w / 2 - OWED
    if (first) owed -= w
    out.push(first)
  }
  return out
}

// What a sum of weights may be off by in its last bits: a sample that is owed exactly its half is taken.
const OWED = 1e-12

// Where a sample stands, 0 to 1, in an order of the samples of a frame that is spread over the shutter: the samples are put in the order
// of (index * stride) % count, with a stride that shares no factor with the count, and the sample stands at the summed weight of all
// that come before it there plus half of its own. A set that shows one thing in a share of its samples and another in the rest (order
// under the share: the one, else the other) then gives each its share of the light of the frame and not of the count of the samples.
// With samples that weigh alike it is ((index * stride) % count + 0.5) / count.
export function sampleOrder(weights: ArrayLike<number>, index: number, stride: number): number {
  const count = weights.length
  const rank = (index * stride) % count
  let before = 0
  for (let i = 0; i < count; i++) if ((i * stride) % count < rank) before += weights[i]!
  return before + weights[index]! / 2
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
