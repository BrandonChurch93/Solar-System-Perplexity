import { config, type SegmentKind } from '../config'

export interface Sample { jitterX: number; jitterY: number; timeOffset: number; weight: number }

const G = 1.32471795724474602596
const A1 = 1 / G
const A2 = 1 / (G * G)

export function sampleCount(tier: string, kind: SegmentKind): number {
  const t = config.tiers[tier]
  if (!t) throw new Error('unknown tier ' + tier)
  return config.fastKinds.includes(kind) ? t.fastSamplesPerFrame : t.samplesPerFrame
}

export function samplesFor(count: number): Sample[] {
  const out: Sample[] = []
  for (let i = 0; i < count; i++) {
    const jx = count === 1 ? 0 : ((0.5 + A1 * (i + 1)) % 1) - 0.5
    const jy = count === 1 ? 0 : ((0.5 + A2 * (i + 1)) % 1) - 0.5
    const timeOffset = ((i + 0.5) / count) * config.shutterFraction
    out.push({ jitterX: jx, jitterY: jy, timeOffset, weight: 1 / count })
  }
  return out
}

export function shutterMid(): number {
  return config.shutterFraction * 0.5
}
