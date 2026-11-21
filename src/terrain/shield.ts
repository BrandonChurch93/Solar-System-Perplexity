export const REACH_CAP = 255

export interface CellFlags {
  one: Uint8Array
  zero: Uint8Array
}

export function uniformCells(rgba: Uint8Array, width: number, height: number, nx: number, ny: number): CellFlags {
  const lo = new Uint8Array(nx * ny).fill(255)
  const hi = new Uint8Array(nx * ny)
  const column = new Int32Array(width)
  for (let x = 0; x < width; x++) column[x] = Math.min(nx - 1, Math.floor((x * nx) / width))
  for (let y = 0; y < height; y++) {
    const row = (ny - 1 - Math.min(ny - 1, Math.floor((y * ny) / height))) * nx
    const base = y * width * 4
    for (let x = 0; x < width; x++) {
      const v = rgba[base + x * 4]!
      const c = row + column[x]!
      if (v < lo[c]!) lo[c] = v
      if (v > hi[c]!) hi[c] = v
    }
  }
  const one = new Uint8Array(nx * ny)
  const zero = new Uint8Array(nx * ny)
  for (let c = 0; c < nx * ny; c++) {
    one[c] = lo[c] === 255 ? 1 : 0
    zero[c] = hi[c] === 0 ? 1 : 0
  }
  return { one, zero }
}

export function reach(flag: Uint8Array, nx: number, ny: number): Uint8Array {
  const d = new Uint8Array(nx * ny)
  const at = (i: number, j: number): number => (i < 0 || j < 0 || i >= nx || j >= ny ? 0 : d[j * nx + i]!)
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      d[j * nx + i] = flag[j * nx + i] ? Math.min(REACH_CAP, 1 + Math.min(at(i - 1, j), at(i - 1, j - 1), at(i, j - 1), at(i + 1, j - 1))) : 0
    }
  }
  for (let j = ny - 1; j >= 0; j--) {
    for (let i = nx - 1; i >= 0; i--) {
      const c = j * nx + i
      if (d[c]) d[c] = Math.min(d[c]!, 1 + Math.min(at(i + 1, j), at(i + 1, j + 1), at(i, j + 1), at(i - 1, j + 1)))
    }
  }
  return d
}

const HALF = [0, 0x3c00, 0x4000, 0x4200, 0x4400, 0x4500, 0x4600, 0x4700, 0x4800, 0x4880, 0x4900, 0x4980, 0x4a00, 0x4a80, 0x4b00, 0x4b80]

export const MAX_MARK = HALF.length - 1

export function marksIn(alpha: Uint16Array, width: number, height: number, tile: number): Uint16Array {
  const cols = Math.ceil(width / tile)
  const rows = Math.ceil(height / tile)
  const out = new Uint16Array(cols * rows)
  let last = 0
  let bit = 1
  for (let y = 0; y < height; y++) {
    const row = y * width * 4 + 3
    const base = Math.floor(y / tile) * cols
    for (let c = 0; c < cols; c++) {
      const x1 = Math.min((c + 1) * tile, width)
      let m = out[base + c]!
      for (let x = c * tile; x < x1; x++) {
        const v = alpha[row + x * 4]!
        if (v !== last) {
          last = v
          const k = HALF.indexOf(v)
          bit = k > 0 ? 1 << k : 1
        }
        m |= bit
      }
      out[base + c] = m
    }
  }
  return out
}

export function reachNeeded(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, du: number, dv: number): number {
  const ux = bx - ax
  const uy = by - ay
  const vx = cx - ax
  const vy = cy - ay
  const det = Math.abs(ux * vy - uy * vx)
  if (!(det > 1e-9)) return Infinity
  const texels = (Math.max(du, dv) * Math.sqrt(ux * ux + uy * uy + vx * vx + vy * vy)) / det
  return Math.ceil((6 * texels + 2) / Math.min(du, dv)) + 1
}
