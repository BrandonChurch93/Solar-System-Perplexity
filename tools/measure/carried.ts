import type { Pixels } from '../lib/frames'

// A report beside G13, not a gate: per tile, what the material says in the texels view and what the picture carries in the nograin view.
export const CARRIED = {
  name: 'report-against-picture-v1',
  luma: 'sRGB luma 0.2126 R + 0.7152 G + 0.0722 B on 0..1 values, no linearisation',
  band: 'the band of G17: luma blurred with sigma 0.6 px minus luma blurred with sigma 2.0 px, roughly 0.08 to 0.3 cycles per pixel',
  coarse: 'luma blurred with sigma 2.0 px minus luma blurred with sigma 6.0 px, the band below',
  energy: 'mean of the squared band signal over the inside pixels of a tile',
  inside: 'a counted pixel (green above one half) with only counted pixels within the margin, so a limb or a matte edge adds nothing',
  grid: [32, 18] as [number, number],
  marginPx: 6,
  minInsideShare: 0.5,
  darkLuma: 0.04,
  nothing: 2e-5,
  reportBands: [1.25, 1.9],
  byReport: 'the tiles that are not dark, sorted by their median report into under 1.25, 1.25 to under 1.9, and 1.9 and over (the view cannot say more than 2), so the tiles nearest the limit of G13 stand alone',
  flag: 'the tile says sharp (median reported texels at least detail.minTexelsPerPixel), is not dark, and its band energy is under nothing',
}

export interface CarriedTile { tile: [number, number]; inside: number; reported: number; soft: number; luma: number; energy: number; coarse: number; says: 'sharp' | 'soft'; dark: boolean; flag: boolean }
export interface CarriedGroup { tiles: number; energy: number | null; fineOverCoarse: number | null }
export interface CarriedBand extends CarriedGroup { from: number; under: number | null; reported: number | null; luma: number | null; leastEnergy: number | null; flagged: number }
export interface CarriedFrame { tiles: CarriedTile[]; judged: number; dark: number; flagged: [number, number][]; sharp: CarriedGroup; soft: CarriedGroup; byReport: CarriedBand[] }

function kernel(sigma: number): Float64Array {
  const r = Math.ceil(4 * sigma)
  const k = new Float64Array(2 * r + 1)
  let sum = 0
  for (let i = -r; i <= r; i++) sum += k[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma))
  return k.map((v) => v / sum)
}

const mirror = (i: number, n: number): number => (n === 1 ? 0 : i < 0 ? Math.min(-i, n - 1) : i >= n ? Math.max(2 * n - 2 - i, 0) : i)

export function blur(src: Float64Array, w: number, h: number, sigma: number): Float64Array {
  const k = kernel(sigma)
  const r = (k.length - 1) / 2
  const mid = new Float64Array(w * h)
  const out = new Float64Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0
    for (let i = -r; i <= r; i++) s += k[i + r]! * src[y * w + mirror(x + i, w)]!
    mid[y * w + x] = s
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0
    for (let i = -r; i <= r; i++) s += k[i + r]! * mid[mirror(y + i, h) * w + x]!
    out[y * w + x] = s
  }
  return out
}

function shrink(mask: Uint8Array, w: number, h: number, r: number): Uint8Array {
  const mid = new Uint8Array(w * h)
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    let last = -1e9
    const gap = new Int32Array(w)
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x] === 0) last = x
      gap[x] = x - last
    }
    last = 1e9
    for (let x = w - 1; x >= 0; x--) {
      if (mask[y * w + x] === 0) last = x
      mid[y * w + x] = Math.min(gap[x]!, last - x) > r ? 1 : 0
    }
  }
  for (let x = 0; x < w; x++) {
    let last = -1e9
    const gap = new Int32Array(h)
    for (let y = 0; y < h; y++) {
      if (mid[y * w + x] === 0) last = y
      gap[y] = y - last
    }
    last = 1e9
    for (let y = h - 1; y >= 0; y--) {
      if (mid[y * w + x] === 0) last = y
      out[y * w + x] = Math.min(gap[y]!, last - y) > r ? 1 : 0
    }
  }
  return out
}

const median = (v: number[]): number | null => {
  if (v.length === 0) return null
  const s = [...v].sort((a, b) => a - b)
  return s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2
}

export function carried(texels: Pixels, picture: Pixels, minTexelsPerPixel: number, grid: [number, number] = CARRIED.grid): CarriedFrame {
  const { width: w, height: h } = texels
  if (picture.width !== w || picture.height !== h) throw new Error('the texels view and the picture differ in size')
  if (texels.channels < 3 || picture.channels < 3) throw new Error('both views must be RGB images')
  const n = w * h
  const counted = new Uint8Array(n)
  const luma = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    counted[i] = texels.data[i * texels.channels + 1]! > 127.5 ? 1 : 0
    const p = i * picture.channels
    luma[i] = (0.2126 * picture.data[p]! + 0.7152 * picture.data[p + 1]! + 0.0722 * picture.data[p + 2]!) / 255
  }
  const inside = shrink(counted, w, h, CARRIED.marginPx)
  const b06 = blur(luma, w, h, 0.6)
  const b20 = blur(luma, w, h, 2.0)
  const b60 = blur(luma, w, h, 6.0)
  const softBelow = 127.5 * minTexelsPerPixel
  const tiles: CarriedTile[] = []
  const [gx, gy] = grid
  for (let j = 0; j < gy; j++) for (let i = 0; i < gx; i++) {
    const x0 = Math.floor((i * w) / gx), x1 = Math.floor(((i + 1) * w) / gx), y0 = Math.floor((j * h) / gy), y1 = Math.floor(((j + 1) * h) / gy)
    const red: number[] = []
    let soft = 0, sum = 0, fine = 0, coarse = 0
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const k = y * w + x
      if (inside[k] === 0) continue
      const r = texels.data[k * texels.channels]!
      red.push(r)
      if (r < softBelow) soft++
      sum += luma[k]!
      fine += (b06[k]! - b20[k]!) ** 2
      coarse += (b20[k]! - b60[k]!) ** 2
    }
    const share = red.length / ((x1 - x0) * (y1 - y0))
    if (red.length === 0 || share < CARRIED.minInsideShare) continue
    const reported = (median(red)! / 255) * 2
    const says = median(red)! >= softBelow ? 'sharp' : 'soft'
    const dark = sum / red.length <= CARRIED.darkLuma
    const energy = fine / red.length
    tiles.push({ tile: [i, j], inside: share, reported, soft: soft / red.length, luma: sum / red.length, energy, coarse: coarse / red.length, says, dark, flag: says === 'sharp' && dark === false && energy < CARRIED.nothing })
  }
  const lit = tiles.filter((x) => x.dark === false)
  const stats = (t: CarriedTile[]): CarriedGroup => ({ tiles: t.length, energy: median(t.map((x) => x.energy)), fineOverCoarse: median(t.filter((x) => x.coarse > 0).map((x) => x.energy / x.coarse)) })
  const edges = [0, ...CARRIED.reportBands, null]
  const byReport = edges.slice(0, -1).map((from, k): CarriedBand => {
    const under = edges[k + 1] ?? null
    const t = lit.filter((x) => x.reported >= from! && (under === null || x.reported < under))
    return { from: from!, under, ...stats(t), reported: median(t.map((x) => x.reported)), luma: median(t.map((x) => x.luma)), leastEnergy: t.length ? Math.min(...t.map((x) => x.energy)) : null, flagged: t.filter((x) => x.flag).length }
  })
  return { tiles, judged: tiles.length, dark: tiles.filter((x) => x.dark).length, flagged: tiles.filter((x) => x.flag).map((x) => x.tile), sharp: stats(lit.filter((x) => x.says === 'sharp')), soft: stats(lit.filter((x) => x.says === 'soft')), byReport }
}
