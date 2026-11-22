import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { skyBytesFor } from '../src/capture/skybytes'

function sizeOf(file: string): { width: number; height: number } {
  const b = readFileSync(file)
  if (b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) }
  if (b.readUInt16BE(0) !== 0xffd8) throw new Error('neither PNG nor JPEG: ' + file)
  let at = 2
  while (at + 9 < b.length) {
    if (b[at] !== 0xff) throw new Error('no marker at ' + at + ' in ' + file)
    const marker = b[at + 1]!
    const frame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
    if (frame) return { width: b.readUInt16BE(at + 7), height: b.readUInt16BE(at + 5) }
    at += 2 + b.readUInt16BE(at + 2)
  }
  throw new Error('no frame header in ' + file)
}

const maps: { name: string; mipmaps: boolean }[] = [
  { name: 'sky.jpg', mipmaps: true },
  { name: 'skyband.jpg', mipmaps: true },
  { name: 'skybandglow.png', mipmaps: false },
]

describe('sky bytes', () => {
  for (const set of Object.keys(config.assetSets)) {
    it('counts the ' + set + ' sky maps as the engine does', () => {
      let engine = 0
      for (const m of maps) {
        const s = sizeOf(join(process.cwd(), 'public/assets/shared', set, m.name))
        engine += s.width * s.height * 4 * (m.mipmaps ? 4 / 3 : 1)
      }
      expect(Math.abs(skyBytesFor(set) - engine)).toBeLessThan(1)
    })
    it('reads the widths of the ' + set + ' sky maps from the config', () => {
      const def = config.assetSets[set]!
      const dir = join(process.cwd(), 'public/assets/shared', set)
      expect(sizeOf(join(dir, 'sky.jpg'))).toEqual({ width: def.skyWidth, height: def.skyWidth / 2 })
      expect(sizeOf(join(dir, 'skyband.jpg'))).toEqual({ width: def.skyWidth, height: def.skyWidth / 4 })
      expect(sizeOf(join(dir, 'skybandglow.png'))).toEqual({ width: def.skyStripWidth, height: def.skyStripWidth / 4 })
    })
  }
})
