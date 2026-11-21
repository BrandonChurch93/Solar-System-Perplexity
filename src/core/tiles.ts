export const TILE = 32

export function openRects(alpha: Uint16Array, width: number, height: number, tile = TILE): number[] {
  const out: number[] = []
  const cols = Math.ceil(width / tile)
  const open = new Uint8Array(cols)
  let live: number[] = []
  for (let y0 = 0; y0 < height; y0 += tile) {
    const y1 = Math.min(y0 + tile, height)
    open.fill(0)
    for (let y = y0; y < y1; y++) {
      const row = y * width * 4 + 3
      for (let c = 0; c < cols; c++) {
        if (open[c]) continue
        const x1 = Math.min((c + 1) * tile, width)
        for (let x = c * tile; x < x1; x++) {
          if ((alpha[row + x * 4]! & 0x7fff) === 0) {
            open[c] = 1
            break
          }
        }
      }
    }
    const next: number[] = []
    for (let c = 0; c < cols; c++) {
      if (!open[c]) continue
      const from = c
      while (c + 1 < cols && open[c + 1]) c++
      const x = from * tile
      const w = Math.min((c + 1) * tile, width) - x
      let joined = false
      for (const i of live) {
        if (out[i] === x && out[i + 2] === w) {
          out[i + 3] = y1 - out[i + 1]!
          next.push(i)
          joined = true
          break
        }
      }
      if (!joined) {
        next.push(out.length)
        out.push(x, y0, w, y1 - y0)
      }
    }
    live = next
  }
  return out
}
