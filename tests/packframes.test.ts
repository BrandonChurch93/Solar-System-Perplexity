import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { framesFolder, kept, leave } from '../tools/pack/frames'

const made: string[] = []
const stage = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'packframes-'))
  made.push(dir)
  return dir
}
const frame = (dir: string, name: string, body: string, withRecord = true): string => {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, name), body)
  if (withRecord) writeFileSync(join(dir, name + '.json'), JSON.stringify({ of: body }))
  return join(dir, name)
}

afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('the frames of a pack that was stopped', () => {
  it('lie in one folder with a fixed name, so that the next run finds them', () => {
    const s = stage()
    const first = framesFolder(s)
    expect(first.dir).toBe(join(s, '.frames'))
    expect(first.waiting).toEqual([])
    frame(first.dir, 'f01913-draft.png', 'a')
    frame(first.dir, 'f01914-draft.png', 'b')
    const second = framesFolder(s)
    expect(second.dir).toBe(first.dir)
    expect(second.waiting).toEqual(['f01913-draft.png', 'f01914-draft.png'])
    expect(readFileSync(join(second.dir, 'f01913-draft.png'), 'utf8')).toBe('a')
  })

  it('does not count a frame without its record: the kill came before the record was written', () => {
    const s = stage()
    const { dir } = framesFolder(s)
    frame(dir, 'f01913-draft.png', 'a')
    frame(dir, 'f01914-draft.png', 'half', false)
    expect(kept(dir)).toEqual(['f01913-draft.png'])
    expect(framesFolder(s).waiting).toEqual(['f01913-draft.png'])
  })

  it('takes up the folders with a random name that a stopped run of the older tool left', () => {
    const s = stage()
    frame(join(s, '.frames-HmPQMR'), 'f02095-draft.png', 'old a')
    frame(join(s, '.frames-HmPQMR'), 'f02096-draft.png', 'old half', false)
    frame(join(s, '.frames-Zz0123'), 'f02097-review.png', 'old c')
    frame(join(s, '.frames-Zz0123'), 'f02095-draft.png', 'old twice')
    writeFileSync(join(s, 'motion-earth.rise-cover.png'), 'sheet')
    const { dir, waiting } = framesFolder(s)
    expect(waiting).toEqual(['f02095-draft.png', 'f02097-review.png'])
    expect(readFileSync(join(dir, 'f02095-draft.png'), 'utf8')).toBe('old a')
    expect(JSON.parse(readFileSync(join(dir, 'f02097-review.png.json'), 'utf8'))).toEqual({ of: 'old c' })
    expect(readdirSync(s).sort()).toEqual(['.frames', 'motion-earth.rise-cover.png'])
  })

  it('keeps every frame when the run ends on an error', () => {
    const s = stage()
    const { dir } = framesFolder(s)
    const source = frame(dir, 'f01000-final.png', 'source')
    frame(dir, 'f01913-draft.png', 'a')
    expect(leave(dir, [source], false)).toEqual(['f01000-final.png', 'f01913-draft.png'])
    expect(existsSync(source)).toBe(true)
    expect(existsSync(source + '.json')).toBe(true)
  })

  it('removes at a good end only what the run itself used, and the folder when nothing is left', () => {
    const s = stage()
    const { dir } = framesFolder(s)
    const source = frame(dir, 'f01000-final.png', 'source')
    frame(dir, 'f04752-draft.png', 'of another part')
    expect(leave(dir, [source], true)).toEqual(['f04752-draft.png'])
    expect(existsSync(source)).toBe(false)
    expect(existsSync(source + '.json')).toBe(false)
    expect(existsSync(join(dir, 'f04752-draft.png.json'))).toBe(true)
    rmSync(join(dir, 'f04752-draft.png'))
    rmSync(join(dir, 'f04752-draft.png.json'))
    expect(leave(dir, [], true)).toEqual([])
    expect(existsSync(dir)).toBe(false)
    expect(framesFolder(s).waiting).toEqual([])
    expect(leave(join(s, '.frames'), [], false)).toEqual([])
    expect(existsSync(join(s, '.frames'))).toBe(false)
  })
})
