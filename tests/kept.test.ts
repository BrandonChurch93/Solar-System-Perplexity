import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { determinismFrames, keptDeterminism, keptWarm, pinnedBrowser, toolHash, warmSelfFrames } from '../tools/gate/kept'

const build = { engineHash: 'e1', stopHashes: { sun: 's1', venus: 'v1' }, format: 'p', tier: 'review', assets: 'full', tool: 't1', browser: '147.0.7727.15' }
const frames = [360, 735, 495, 90]
const hashes = Object.fromEntries(frames.map((f) => [f, 'h' + f]))
const record = (over: object = {}): Record<string, unknown> => ({ ok: true, frames, ...build, machine: 'machine 4x', runs: { 'fresh-forward': { ...hashes }, 'fresh-reverse': { ...hashes } }, single: { 90: 'h90' }, ...over })
const want = { ...build, frames }

describe('gate G3 from the record of the determinism check', () => {
  it('takes a green record of this build, this tool and these frames, and names its machine', () => {
    const k = keptDeterminism(record(), want)
    expect(k.why).toBe('')
    expect(k.machine).toBe('machine 4x')
    expect(k.lines).toEqual(['frame 360 identical h360 h360', 'frame 735 identical h735 h735', 'frame 495 identical h495 h495', 'frame 90 identical h90 h90 h90', 'determinism: pass'])
  })

  it('takes no record that is missing or red', () => {
    expect(keptDeterminism(null, want).why).toBe('there is no record')
    expect(keptDeterminism(record({ ok: false }), want).why).toBe('the record is red')
    expect(keptDeterminism(record({ ok: 'true' }), want).why).toBe('the record is red')
    const k = keptDeterminism(record({ ok: false }), want)
    expect([k.machine, k.lines]).toEqual(['', []])
  })

  it('takes no record of another engine hash or another stop hash', () => {
    expect(keptDeterminism(record({ engineHash: 'e2' }), want).why).toBe('the record is of another engine hash (e2 against e1)')
    expect(keptDeterminism(record({ engineHash: undefined }), want).why).toContain('another engine hash')
    expect(keptDeterminism(record({ stopHashes: { sun: 's1', venus: 'v2' } }), want).why).toBe('the record is of another stop hash of venus (v2 against v1)')
    expect(keptDeterminism(record({ stopHashes: { sun: 's1' } }), want).why).toBe('the record is of another stop hash of venus (undefined against v1)')
    expect(keptDeterminism(record({ stopHashes: { sun: 's1', venus: 'v1', mars: 'm1' } }), want).why).toBe('the record is of another stop hash of mars (m1 against undefined)')
    expect(keptDeterminism(record({ stopHashes: undefined }), want).why).toContain('another stop hash of sun')
  })

  it('takes no record of another format, tier, asset set, state of the tool, or without a machine', () => {
    expect(keptDeterminism(record({ format: 'm' }), want).why).toBe('the record is of another format (m against p)')
    expect(keptDeterminism(record({ tier: 'draft' }), want).why).toBe('the record is of another tier (draft against review)')
    expect(keptDeterminism(record({ assets: 'web' }), want).why).toBe('the record is of another asset set (web against full)')
    expect(keptDeterminism(record({ tool: 't0' }), want).why).toBe('the record is of another state of the tool (t0 against t1)')
    expect(keptDeterminism(record({ tool: undefined }), want).why).toContain('another state of the tool')
    expect(keptDeterminism(record({ machine: '' }), want).why).toBe('the record names no machine')
  })

  it('takes no record without a browser, of another browser than the tree pins, or when the tree pins none', () => {
    expect(keptDeterminism(record({ browser: undefined }), want).why).toBe('the record names no browser')
    expect(keptDeterminism(record({ browser: '' }), want).why).toBe('the record names no browser')
    expect(keptDeterminism(record({ browser: '147.0.7727.16' }), want).why).toBe('the record is of another browser (147.0.7727.16 against 147.0.7727.15, the version this tree pins)')
    expect(keptDeterminism(record({ browser: '147.0.7727.15, 148.0.1.2' }), want).why).toContain('another browser')
    expect(keptDeterminism(record(), { ...want, browser: '' }).why).toBe('this tree pins no browser version in config/webgl-caps.json')
    expect(keptDeterminism(record({ browser: '' }), { ...want, browser: '' }).why).toBe('this tree pins no browser version in config/webgl-caps.json')
  })

  it('takes no record of other frames than the tool would pick now', () => {
    expect(keptDeterminism(record({ frames: [360, 735, 495] }), want).why).toBe('the record is of other frames ([360,735,495] against [360,735,495,90])')
    expect(keptDeterminism(record({ frames: [90, 495, 735, 360] }), want).why).toContain('other frames')
    expect(keptDeterminism(record(), { ...want, frames: [360, 735, 495, 91] }).why).toContain('other frames')
  })

  it('reads the verdict from the hashes of the record, not from its word', () => {
    const one = (runs: object, single: object = { 90: 'h90' }): string => keptDeterminism(record({ runs, single }), want).why
    expect(one({ 'fresh-forward': { ...hashes }, 'fresh-reverse': { ...hashes, 735: 'x' } })).toBe('the hashes of frame 735 in the record differ')
    expect(one({ 'fresh-forward': { ...hashes }, 'fresh-reverse': { ...hashes } }, { 90: 'x' })).toBe('the hashes of frame 90 in the record differ')
    expect(one({ 'fresh-forward': { ...hashes }, 'fresh-reverse': { ...hashes } }, {})).toBe('the record holds no hash of frame 90 in one of its runs')
    expect(one({ 'fresh-forward': { ...hashes } })).toBe('the record holds no hash of frame 360 in one of its runs')
    expect(one({ 'fresh-forward': { ...hashes, 495: '' }, 'fresh-reverse': { ...hashes, 495: '' } })).toBe('the record holds no hash of frame 495 in one of its runs')
    expect(keptDeterminism(record({ runs: undefined }), want).why).toContain('no hash of frame 360')
  })
})

describe('gate G3 from the record of the warm start\'s self test', () => {
  const list = { stop: 'mercury', frames: [690, 997, 1072], terrain: 870 }
  const rows = list.frames.map((frame) => ({ frame, cold: 'c' + frame, warm: 'c' + frame, drawn: 2 }))
  const lines = ['frame 690 identical', 'frame 997 identical', 'frame 1072 identical', 'warm: pass']
  const warm = (over: object = {}): Record<string, unknown> => ({ ok: true, ...list, ...build, tier: 'draft', machine: 'machine 4x', rows, lines, ...over })
  const wanted = { ...build, tier: 'draft', ...list }

  it('takes a green record of this build, this tool and this list', () => {
    expect(keptWarm(warm(), wanted)).toEqual({ why: '', machine: 'machine 4x', lines })
  })

  it('takes no record that is missing, red, of another build or of another state of the tool', () => {
    expect(keptWarm(null, wanted).why).toBe('there is no record')
    expect(keptWarm(warm({ ok: false }), wanted).why).toBe('the record is red')
    expect(keptWarm(warm({ engineHash: 'e2' }), wanted).why).toContain('another engine hash')
    expect(keptWarm(warm({ stopHashes: { sun: 's2', venus: 'v1' } }), wanted).why).toContain('another stop hash of sun')
    expect(keptWarm(warm({ tier: 'review' }), wanted).why).toContain('another tier')
    expect(keptWarm(warm({ format: 'm' }), wanted).why).toContain('another format')
    expect(keptWarm(warm({ assets: 'web' }), wanted).why).toContain('another asset set')
    expect(keptWarm(warm({ tool: 't0' }), wanted).why).toContain('another state of the tool')
  })

  it('takes no record without a browser or of another browser than the tree pins', () => {
    expect(keptWarm(warm({ browser: undefined }), wanted).why).toBe('the record names no browser')
    expect(keptWarm(warm({ browser: '146.0.1.1' }), wanted).why).toBe('the record is of another browser (146.0.1.1 against 147.0.7727.15, the version this tree pins)')
    expect(keptWarm(warm(), { ...wanted, browser: '' }).why).toContain('pins no browser version')
  })

  it('takes no record of another list than the test would check now', () => {
    expect(keptWarm(warm({ stop: 'venus' }), wanted).why).toContain('other frames')
    expect(keptWarm(warm({ frames: [690, 997] }), wanted).why).toContain('other frames')
    expect(keptWarm(warm({ terrain: 871 }), wanted).why).toContain('other frames')
  })

  it('reads the verdict from the hashes of the record', () => {
    expect(keptWarm(warm({ rows: rows.slice(0, 2) }), wanted).why).toBe('the record holds no hash of frame 1072')
    expect(keptWarm(warm({ rows: rows.map((r) => (r.frame === 997 ? { ...r, warm: 'x' } : r)) }), wanted).why).toBe('the hashes of frame 997 in the record differ')
    expect(keptWarm(warm({ rows: undefined }), wanted).why).toContain('no hash of frame 690')
    expect(keptWarm(warm({ lines: [] }), wanted).why).toBe('the record holds no lines')
  })
})

describe('what the two checks draw and the state of their tools', () => {
  const seg = (id: string, firstFrame: number, frames: number): { id: string; kind: string; stop: string; firstFrame: number; frames: number } => ({ id, kind: id.split('.')[1]!, stop: id.split('.')[0]!, firstFrame, frames })
  const segments = [seg('sun.hold', 0, 100), seg('sun.rise', 100, 50), seg('sun.travel', 150, 31), seg('venus.hold', 181, 20), seg('venus.dive', 201, 40), seg('venus.terrain', 241, 60), seg('venus.rise', 301, 40), seg('venus.travel', 341, 20), seg('mars.hold', 361, 20), seg('mars.dive', 381, 40), seg('mars.terrain', 421, 60), seg('mars.rise', 481, 41), seg('mars.travel', 522, 20)]

  it('picks the middle frame of the first hold, dive, travel and surface view', () => {
    expect(determinismFrames(segments)).toEqual([50, 221, 165, 271])
    expect(determinismFrames(segments.slice(0, 2))).toEqual([50])
  })

  it('checks the first stop with a dive that has a frame in the warm list, else the first dive', () => {
    expect(warmSelfFrames(segments, [])).toEqual({ stop: 'venus', frames: [201, 321, 351], terrain: 271 })
    expect(warmSelfFrames(segments, [120, 400])).toEqual({ stop: 'mars', frames: [381, 501, 532], terrain: 451 })
    expect(warmSelfFrames(segments, [400, 250])).toEqual({ stop: 'venus', frames: [201, 321, 351], terrain: 271 })
  })

  it('reads the browser version the tree pins from config/webgl-caps.json', () => {
    const root = mkdtempSync(join(tmpdir(), 'kept-'))
    expect(pinnedBrowser(root)).toBe('')
    mkdirSync(join(root, 'config'), { recursive: true })
    writeFileSync(join(root, 'config/webgl-caps.json'), JSON.stringify({ browser: 'Chrome for Testing 147.0.7727.15', flags: [] }))
    expect(pinnedBrowser(root)).toBe('147.0.7727.15')
    writeFileSync(join(root, 'config/webgl-caps.json'), JSON.stringify({ flags: [] }))
    expect(pinnedBrowser(root)).toBe('')
    writeFileSync(join(root, 'config/webgl-caps.json'), 'not json')
    expect(pinnedBrowser(root)).toBe('')
  })

  it('hashes the tool with every file under tools it imports, and nothing outside', () => {
    const root = mkdtempSync(join(tmpdir(), 'kept-'))
    mkdirSync(join(root, 'tools/lib'), { recursive: true })
    mkdirSync(join(root, 'src'), { recursive: true })
    const put = (file: string, body: string): void => writeFileSync(join(root, file), body)
    put('tools/a.ts', "import { b } from './lib/b'\nimport { s } from '../src/s'\nimport { x } from 'node:fs'\n")
    put('tools/lib/b.ts', "import { c } from './c'\n")
    put('tools/lib/c.ts', 'export const c = 1\n')
    put('tools/other.ts', 'export const o = 1\n')
    put('src/s.ts', 'export const s = 1\n')
    const first = toolHash(root, 'tools/a.ts')
    expect(first).toMatch(/^[0-9a-f]{16}$/)
    put('tools/other.ts', 'export const o = 2\n')
    put('src/s.ts', 'export const s = 2\n')
    expect(toolHash(root, 'tools/a.ts')).toBe(first)
    put('tools/lib/c.ts', 'export const c = 2\n')
    const second = toolHash(root, 'tools/a.ts')
    expect(second).not.toBe(first)
    put('tools/a.ts', "import { b } from './lib/b'\nimport { s } from '../src/s'\nimport { x } from 'node:fs'\n\n")
    expect(toolHash(root, 'tools/a.ts')).not.toBe(second)
  })
})
