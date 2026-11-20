import type { Pixels } from '../lib/frames'

export interface TexelCount { counted: number; soft: number; fraction: number; meanTexels: number; minTexels: number }

export function countTexels(p: Pixels, minTexelsPerPixel: number): TexelCount {
  const ch = p.channels
  if (ch < 3) throw new Error('texels view needs an RGB image')
  const softBelow = 127.5 * minTexelsPerPixel
  let counted = 0
  let soft = 0
  let sum = 0
  let min = Infinity
  for (let i = 0; i < p.data.length; i += ch) {
    if (p.data[i + 1]! <= 127.5) continue
    counted++
    const r = p.data[i]!
    if (r < softBelow) soft++
    const t = (r / 255) * 2
    sum += t
    if (t < min) min = t
  }
  return { counted, soft, fraction: counted ? soft / counted : 0, meanTexels: counted ? sum / counted : 0, minTexels: counted ? min : 0 }
}
