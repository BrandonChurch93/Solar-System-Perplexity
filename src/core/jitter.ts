const G = 1.32471795724474602596
const A1 = 1 / G
const A2 = 1 / (G * G)

const kept = new Map<number, Float64Array>()

// The place of each sample inside its pixel, x then y, in pixels from the pixel's middle. The samples keep the order of the sequence they come
// from, and on each axis the sample of rank k of n sits at the middle of the k-th of n equal strips of the pixel: an edge that runs along an
// axis then gains one sample at a time as it crosses the pixel, where the plain sequence gave them in clumps. The mean of a count is zero, so
// the picture sits at the same place at every count. A single sample sits at the middle.
export function jitterOffsets(count: number): Float64Array {
  const was = kept.get(count)
  if (was) return was
  const out = new Float64Array(count * 2)
  if (count > 1) {
    const raw = new Float64Array(count * 2)
    for (let i = 0; i < count; i++) {
      raw[2 * i] = (0.5 + A1 * (i + 1)) % 1
      raw[2 * i + 1] = (0.5 + A2 * (i + 1)) % 1
    }
    for (let axis = 0; axis < 2; axis++) {
      const order = Array.from({ length: count }, (_, i) => i).sort((a, b) => raw[2 * a + axis]! - raw[2 * b + axis]! || a - b)
      order.forEach((i, rank) => {
        out[2 * i + axis] = (2 * rank + 1 - count) / (2 * count)
      })
    }
  }
  kept.set(count, out)
  return out
}
