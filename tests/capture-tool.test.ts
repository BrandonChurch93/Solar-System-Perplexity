import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { deflateSync } from 'node:zlib'
import { afterAll, describe, expect, it } from 'vitest'
import { config } from '../src/config'
import grains from '../src/stops/saturn/grains.json'
import { chunksOf, clock, frameName, pngSize, rangeOf, under, wholeBuffer, wholePng, type Limits, type Wanted } from '../tools/capture/plan'

const segments = [
  { stop: 'sun', firstFrame: 0, endFrame: 270 },
  { stop: 'sun', firstFrame: 270, endFrame: 600 },
  { stop: 'mercury', firstFrame: 600, endFrame: 1200 },
]

function crc(buf: Buffer): number {
  let c = ~0
  for (const b of buf) {
    c ^= b
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(8)
  head.writeUInt32BE(data.length, 0)
  head.write(type, 4, 'latin1')
  const tail = Buffer.alloc(4)
  tail.writeUInt32BE(crc(Buffer.concat([head.subarray(4), data])), 0)
  return Buffer.concat([head, data, tail])
}

function png(width: number, height: number): Buffer {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr.set([8, 2, 0, 0, 0], 8)
  const rows = Buffer.alloc(height * (1 + width * 3), 7)
  for (let y = 0; y < height; y++) rows[y * (1 + width * 3)] = 0
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))])
}

const dir = mkdtempSync(join(tmpdir(), 'capture-plan-'))
afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('the frames of a capture run', () => {
  it('takes the whole film at the capture rate when nothing is named', () => {
    expect(rangeOf(2400, 2, segments, undefined, undefined, undefined)).toEqual({ from: 0, to: 2399 })
  })

  it('takes every segment of a stop, in capture frames, and cuts it to --from and --to', () => {
    expect(rangeOf(2400, 2, segments, 'sun', undefined, undefined)).toEqual({ from: 0, to: 1199 })
    expect(rangeOf(2400, 2, segments, 'mercury', undefined, undefined)).toEqual({ from: 1200, to: 2399 })
    expect(rangeOf(2400, 2, segments, 'mercury', 1300, 1309)).toEqual({ from: 1300, to: 1309 })
    expect(rangeOf(1200, 1, segments, 'mercury', 0, 5000)).toEqual({ from: 600, to: 1199 })
  })

  it('refuses a stop that is not in the film and a range that is empty', () => {
    expect(() => rangeOf(2400, 2, segments, 'pluto', undefined, undefined)).toThrow(/pluto/)
    expect(() => rangeOf(2400, 2, segments, undefined, 50, 40)).toThrow(/empty/)
    expect(() => rangeOf(2400, 2, segments, 'sun', 1500, undefined)).toThrow(/empty/)
  })

  it('names a frame by its number', () => {
    expect(frameName(0)).toBe('000000.png')
    expect(frameName(10799)).toBe('010799.png')
  })
})

describe('the chunks of a capture run', () => {
  it('covers every frame once, in order, with a short last chunk', () => {
    const c = chunksOf({ from: 100, to: 1549 }, 600)
    expect(c.map((x) => [x.first, x.last, x.frames])).toEqual([[100, 699, 600], [700, 1299, 600], [1300, 1549, 250]])
    expect(c.map((x) => x.index)).toEqual([0, 1, 2])
    expect(c.reduce((n, x) => n + x.frames, 0)).toBe(1450)
    expect(c[2]!.name).toBe('part-001300-001549.mp4')
  })

  it('gives the same chunks for the same command, and one chunk when the size covers the run', () => {
    expect(chunksOf({ from: 0, to: 10799 }, 600)).toEqual(chunksOf({ from: 0, to: 10799 }, 600))
    expect(chunksOf({ from: 0, to: 10799 }, 600)).toHaveLength(18)
    expect(chunksOf({ from: 5, to: 9 }, 600)).toHaveLength(1)
    expect(() => chunksOf({ from: 0, to: 9 }, 0)).toThrow(/chunk/)
  })
})

describe('a frame on disk counts as whole', () => {
  const good = png(8, 4)

  it('when it is a PNG of the wanted size that ends with its end mark', () => {
    expect(pngSize(good)).toEqual({ width: 8, height: 4 })
    expect(wholeBuffer(good, 8, 4)).toBe(true)
    const file = join(dir, 'good.png')
    writeFileSync(file, good)
    expect(wholePng(file, 8, 4)).toBe(true)
  })

  it('and not when it was cut short, has another size, is no PNG or is missing', () => {
    const cut = join(dir, 'cut.png')
    writeFileSync(cut, good.subarray(0, good.length - 5))
    expect(wholePng(cut, 8, 4)).toBe(false)
    expect(wholeBuffer(good.subarray(0, 30), 8, 4)).toBe(false)
    const other = join(dir, 'other.png')
    writeFileSync(other, png(4, 4))
    expect(wholePng(other, 8, 4)).toBe(false)
    const text = join(dir, 'text.png')
    writeFileSync(text, Buffer.alloc(200, 65))
    expect(wholePng(text, 8, 4)).toBe(false)
    expect(wholePng(join(dir, 'none.png'), 8, 4)).toBe(false)
    writeFileSync(join(dir, 'empty.png'), Buffer.alloc(0))
    expect(wholePng(join(dir, 'empty.png'), 8, 4)).toBe(false)
  })
})

describe('the time left, in words', () => {
  it('reads as seconds, minutes or hours', () => {
    expect(clock(42)).toBe('42 s')
    expect(clock(125)).toBe('2 min 5 s')
    expect(clock(3600 * 30 + 120)).toBe('30 h 2 min')
    expect(clock(Infinity)).toBe('unknown')
  })
})

describe('the limits of the machine against what the film needs', () => {
  const wanted: Wanted = { maxTextureSize: 16384, maxRenderbufferSize: 4610, maxViewportDims: [3840, 2160], pointSize: 1000, samples: 0, maxTextureImageUnits: 16, maxVertexAttribs: 8 }
  const good: Limits = { renderer: 'a graphics card', maxTextureSize: 16384, maxRenderbufferSize: 16384, maxViewportDims: [16384, 16384], aliasedPointSizeRange: [1, 1024], maxSamples: 4, maxTextureImageUnits: 16, maxVertexAttribs: 16, missingExtensions: [] }

  it('says nothing when every limit reaches the need', () => {
    expect(under(good, wanted)).toEqual([])
  })

  it('names each limit that is under the need in a plain line', () => {
    const lines = under({ ...good, maxTextureSize: 8192, maxViewportDims: [3840, 2048], aliasedPointSizeRange: [1, 511], missingExtensions: ['EXT_float_blend'] }, wanted)
    expect(lines).toHaveLength(4)
    expect(lines[0]).toContain('8192')
    expect(lines[1]).toContain('3840 by 2048')
    expect(lines[2]).toContain('511')
    expect(lines[3]).toContain('EXT_float_blend')
  })

  it('holds a point size in the config that covers the largest point the film draws', () => {
    expect(config.raw.smooth.machine.pointSize).toBeGreaterThanOrEqual(grains.largestPoint)
    expect(config.raw.smooth.machine.pointSize).toBeGreaterThanOrEqual((30 * config.formats.uhd!.height) / 1080)
  })
})
