const G = 1.32471795724474602596
const A1 = 1 / G
const A2 = 1 / (G * G)

const kept = new Map<number, Float64Array>()

// The place of each sample inside its pixel, x then y, in pixels from the pixel's middle. The offsets of a count are taken less their own mean,
// so the whole picture sits at the same place at every count and does not step where the count changes. One sample sits at the middle.
export function jitterOffsets(count: number): Float64Array {
  const was = kept.get(count)
  if (was) return was
  const out = new Float64Array(count * 2)
  if (count > 1) {
    let sx = 0
    let sy = 0
    for (let i = 0; i < count; i++) {
      out[2 * i] = ((0.5 + A1 * (i + 1)) % 1) - 0.5
      out[2 * i + 1] = ((0.5 + A2 * (i + 1)) % 1) - 0.5
      sx += out[2 * i]!
      sy += out[2 * i + 1]!
    }
    const mx = sx / count
    const my = sy / count
    for (let i = 0; i < count; i++) {
      out[2 * i] = out[2 * i]! - mx
      out[2 * i + 1] = out[2 * i + 1]! - my
    }
  }
  kept.set(count, out)
  return out
}
