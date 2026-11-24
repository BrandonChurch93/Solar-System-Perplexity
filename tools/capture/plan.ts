import { closeSync, existsSync, openSync, readSync, statSync } from 'node:fs'

// The plan of npm run capture: which capture frames, in which chunks, and when a file on disk counts as whole.

export interface Range { from: number; to: number }
export interface Chunk { index: number; first: number; last: number; frames: number; name: string }

export const frameName = (k: number): string => String(k).padStart(6, '0') + '.png'

// The capture frames of the run: the whole film, or the segments of one stop, cut to --from and --to (capture frames, both counted in).
export function rangeOf(captureFrames: number, rate: number, segments: { stop: string; firstFrame: number; endFrame: number }[], stop: string | undefined, from: number | undefined, to: number | undefined): Range {
  let lo = 0
  let hi = captureFrames - 1
  if (stop) {
    const own = segments.filter((s) => s.stop === stop)
    if (own.length === 0) throw new Error('no segment of the film belongs to ' + stop)
    lo = Math.min(...own.map((s) => s.firstFrame)) * rate
    hi = Math.max(...own.map((s) => s.endFrame)) * rate - 1
  }
  if (from !== undefined) lo = Math.max(lo, from)
  if (to !== undefined) hi = Math.min(hi, to)
  if (!Number.isInteger(lo) || !Number.isInteger(hi) || lo < 0 || hi >= captureFrames || hi < lo) throw new Error('the frame range ' + lo + ' to ' + hi + ' is empty or outside the film (0 to ' + (captureFrames - 1) + ')')
  return { from: lo, to: hi }
}

// Chunks are counted from the first frame of the run, so the same command always gives the same chunks.
export function chunksOf(range: Range, size: number): Chunk[] {
  if (!Number.isInteger(size) || size < 1) throw new Error('--chunk is a whole number of at least 1')
  const out: Chunk[] = []
  for (let first = range.from; first <= range.to; first += size) {
    const last = Math.min(first + size - 1, range.to)
    out.push({ index: out.length, first, last, frames: last - first + 1, name: 'part-' + String(first).padStart(6, '0') + '-' + String(last).padStart(6, '0') + '.mp4' })
  }
  return out
}

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const END = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82])

export function pngSize(head: Buffer): { width: number; height: number } | null {
  if (head.length < 24 || !head.subarray(0, 8).equals(SIGNATURE) || head.toString('latin1', 12, 16) !== 'IHDR') return null
  return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) }
}

// Whole: a PNG of the right size that ends with its end mark. A file cut short by a stop fails one of the three.
export function wholePng(file: string, width: number, height: number): boolean {
  if (!existsSync(file)) return false
  const size = statSync(file).size
  if (size < 24 + END.length) return false
  const fd = openSync(file, 'r')
  try {
    const head = Buffer.alloc(24)
    const tail = Buffer.alloc(END.length)
    readSync(fd, head, 0, 24, 0)
    readSync(fd, tail, 0, END.length, size - END.length)
    const s = pngSize(head)
    return s !== null && s.width === width && s.height === height && tail.equals(END)
  } finally {
    closeSync(fd)
  }
}

export function wholeBuffer(png: Buffer, width: number, height: number): boolean {
  const s = pngSize(png)
  return s !== null && s.width === width && s.height === height && png.length >= 24 + END.length && png.subarray(png.length - END.length).equals(END)
}

export function clock(seconds: number): string {
  if (!Number.isFinite(seconds)) return 'unknown'
  const s = Math.round(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? h + ' h ' + m + ' min' : m > 0 ? m + ' min ' + (s % 60) + ' s' : s + ' s'
}

export interface Limits {
  renderer: string; maxTextureSize: number; maxRenderbufferSize: number; maxViewportDims: [number, number]; aliasedPointSizeRange: [number, number]; maxSamples: number
  maxTextureImageUnits: number; maxVertexAttribs: number; missingExtensions: string[]
}
export interface Wanted { maxTextureSize: number; maxRenderbufferSize: number; maxViewportDims: [number, number]; pointSize: number; samples: number; maxTextureImageUnits: number; maxVertexAttribs: number }

// What the machine's graphics cannot give the film, one plain line each. Empty: the machine can draw it.
export function under(g: Limits, w: Wanted): string[] {
  const out: string[] = []
  if (g.maxTextureSize < w.maxTextureSize) out.push('its largest texture is ' + g.maxTextureSize + ' pixels and the film needs ' + w.maxTextureSize)
  if (g.maxRenderbufferSize < w.maxRenderbufferSize) out.push('its largest render buffer is ' + g.maxRenderbufferSize + ' pixels and the film needs ' + w.maxRenderbufferSize)
  if (g.maxViewportDims[0] < w.maxViewportDims[0] || g.maxViewportDims[1] < w.maxViewportDims[1]) out.push('its largest viewport is ' + g.maxViewportDims.join(' by ') + ' and the film needs ' + w.maxViewportDims.join(' by '))
  if (g.aliasedPointSizeRange[1] < w.pointSize) out.push('its largest point is ' + g.aliasedPointSizeRange[1] + ' pixels and the film needs ' + w.pointSize)
  if (g.maxSamples < w.samples) out.push('it has ' + g.maxSamples + ' samples and the film needs ' + w.samples)
  if (g.maxTextureImageUnits < w.maxTextureImageUnits) out.push('it has ' + g.maxTextureImageUnits + ' texture units and the film needs ' + w.maxTextureImageUnits)
  if (g.maxVertexAttribs < w.maxVertexAttribs) out.push('it has ' + g.maxVertexAttribs + ' vertex attributes and the film needs ' + w.maxVertexAttribs)
  for (const e of g.missingExtensions) out.push('it lacks the extension ' + e)
  return out
}
