export interface Trim {
  hide(): void
  show(): void
}

export const HAZE_DISC = 0.99
const MARGIN = 1e-3

export function hazeHidden(position: ArrayLike<number>, e: ArrayLike<number>, cx: number, cy: number, cz: number, out: Uint8Array): void {
  const r2 = cx * cx + cy * cy + cz * cz
  const limit = Math.sqrt(Math.max(r2 - HAZE_DISC, 0)) + MARGIN * (1 + Math.sqrt(r2))
  for (let v = 0, q = 0; v < out.length; v++, q += 3) {
    const x = position[q]!
    const y = position[q + 1]!
    const z = position[q + 2]!
    const wx = e[0]! * x + e[4]! * y + e[8]! * z + e[12]!
    const wy = e[1]! * x + e[5]! * y + e[9]! * z + e[13]!
    const wz = e[2]! * x + e[6]! * y + e[10]! * z + e[14]!
    const len = Math.sqrt(wx * wx + wy * wy + wz * wz)
    out[v] = len > 0 && -(cx * wx + cy * wy + cz * wz) / len > limit ? 1 : 0
  }
}

export function keepTriangles(index: ArrayLike<number>, hidden: Uint8Array, out: Uint16Array | Uint32Array): number {
  let n = 0
  for (let t = 0; t < index.length; t += 3) {
    const a = index[t]!
    const b = index[t + 1]!
    const c = index[t + 2]!
    if (hidden[a]! & hidden[b]! & hidden[c]!) continue
    out[n++] = a
    out[n++] = b
    out[n++] = c
  }
  return n
}
