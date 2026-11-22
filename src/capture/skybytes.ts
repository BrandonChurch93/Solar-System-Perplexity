import { config } from '../config'

export function mapBytes(width: number, height: number, mipmaps: boolean): number {
  return width * height * 4 * (mipmaps ? 4 / 3 : 1)
}

export function skyBytesFor(assets: string): number {
  const set = config.assetSets[assets]!
  const w = set.skyWidth
  const s = set.skyStripWidth
  return mapBytes(w, w / 2, true) + mapBytes(w, w / 4, true) + mapBytes(s, s / 4, false)
}
