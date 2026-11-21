export const TILE = 32

export interface Tiles {
  readonly tile: number
  readonly cols: number
  readonly rows: number
  readonly open: Uint8Array
}

export function openTiles(alpha: Uint16Array, width: number, height: number, tile = TILE): Tiles {
  const cols = Math.ceil(width / tile)
  const rows = Math.ceil(height / tile)
  const open = new Uint8Array(cols * rows)
  for (let y = 0; y < height; y++) {
    const row = y * width * 4 + 3
    const base = Math.floor(y / tile) * cols
    for (let c = 0; c < cols; c++) {
      if (open[base + c]) continue
      const x1 = Math.min((c + 1) * tile, width)
      for (let x = c * tile; x < x1; x++) {
        if ((alpha[row + x * 4]! & 0x7fff) === 0) {
          open[base + c] = 1
          break
        }
      }
    }
  }
  return { tile, cols, rows, open }
}

export function tileRects(tiles: Tiles, width: number, height: number): number[] {
  const { tile, cols, rows, open } = tiles
  const out: number[] = []
  let live: number[] = []
  for (let r = 0; r < rows; r++) {
    const y0 = r * tile
    const y1 = Math.min(y0 + tile, height)
    const next: number[] = []
    for (let c = 0; c < cols; c++) {
      if (!open[r * cols + c]) continue
      const from = c
      while (c + 1 < cols && open[r * cols + c + 1]) c++
      const x = from * tile
      const w = Math.min((c + 1) * tile, width) - x
      const i = live.find((k) => out[k] === x && out[k + 2] === w)
      if (i === undefined) {
        next.push(out.length)
        out.push(x, y0, w, y1 - y0)
      } else {
        out[i + 3] = y1 - out[i + 1]!
        next.push(i)
      }
    }
    live = next
  }
  return out
}

export function openRects(alpha: Uint16Array, width: number, height: number, tile = TILE): number[] {
  return tileRects(openTiles(alpha, width, height, tile), width, height)
}
