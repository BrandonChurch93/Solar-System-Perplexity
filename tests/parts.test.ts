import { describe, expect, it } from 'vitest'
import { joinParts, listHash, parsePart, share, sumG13, sumG17, sumG5, type Build, type JoinAsk, type PartFile, type TexelRow } from '../tools/measure/parts'

const build: Build = { stop: 'venus', commit: 'c1', engineHash: 'e1', stopHashes: { venus: 's1', mars: 'm1' }, stopHash: 's1', format: '16x9', assets: 'full', detail: '{"maxSoftPixelFraction":0.02}', texelsRule: 't1', finalsRule: 'f1' }
const all = Array.from({ length: 23 }, (_, i) => 1110 + i)
const row = (frame: number): TexelRow => ({ frame, segment: frame < 1120 ? 'venus-hold' : 'venus-dive', counted: frame === 1113 ? 0 : 1000 + frame, soft: frame % 7, fraction: frame === 1125 ? 0.031 : (frame % 7) / 1000, meanTexels: 1 + frame / 1000, pass: frame !== 1125 })
const ask = (over: Partial<JoinAsk> = {}): JoinAsk => ({ build, every: 1, only: ['G5', 'G13', 'G17'], tier: 'final', texelsTier: 'draft', maxSoft: 0.02, frames: () => all, ...over })
const g5 = sumG5('venus', 'final', [{ frame: 1185, segment: 'venus-hold', kind: 'hold', invalid: 0, coverage: 0.31641, pass: true }])
const g17 = sumG17('venus', 'final', 0.8, { tile: 64 }, [{ frame: 1185, segment: 'venus-hold', approved: 'a.png', median: 0.812, p25: 0.77, tiles: 77, pass: true }])

function texelPart(part: number, parts: number, every = 1): PartFile {
  const list = all.filter((_, i) => i % every === 0)
  const frames = share(list, part, parts)
  return { ...build, kind: 'measure part', part, parts, browser: 'b1', machine: 'machine ' + part, every, noCover: false, seconds: part, run: { pages: 1 }, tier: 'draft', view: 'texels', list: listHash(list), listFrames: list.length, of: all.length, frames, results: frames.map(row) }
}
const finalsPart = (): PartFile => ({ ...build, kind: 'measure part', part: 'finals', parts: 1, browser: 'b1', machine: 'machine f', every: 1, noCover: false, seconds: 9, run: { pages: 1 }, tier: 'final', view: 'nograin', G5: g5.record, G17: g17.record, lines: [g5.line, g17.line] })
const folder = (parts = 3): { name: string; part: PartFile }[] => [...Array.from({ length: parts }, (_, i) => ({ name: 'venus-part-' + (i + 1) + '-of-' + parts + '.json', part: texelPart(i + 1, parts) })), { name: 'venus-part-finals.json', part: finalsPart() }]
const change = (files: { name: string; part: PartFile }[], name: string, over: Partial<PartFile>): { name: string; part: PartFile }[] => files.map((f) => (f.name === name ? { name, part: { ...f.part, ...over } } : f))

describe('the parts of a measure', () => {
  it('reads I/N and finals, and nothing else', () => {
    expect(parsePart('2/6')).toEqual({ part: 2, parts: 6 })
    expect(parsePart('finals')).toBe('finals')
    for (const bad of ['0/6', '7/6', '2', '2/0', 'a/b', '1/2/3', '']) expect(() => parsePart(bad)).toThrow('--part takes I/N')
  })

  it.each([1, 2, 3, 4, 7, 23, 30])('puts every frame in exactly one of %i parts, in the order of the list', (n) => {
    const shares = Array.from({ length: n }, (_, i) => share(all, i + 1, n))
    expect(shares.flat().sort((x, y) => x - y)).toEqual(all)
    for (const s of shares) expect(s).toEqual([...s].sort((x, y) => x - y))
    expect(Math.max(...shares.map((s) => s.length)) - Math.min(...shares.map((s) => s.length))).toBeLessThanOrEqual(1)
  })

  it('joins to the record and the lines of a whole run, to the digit', () => {
    const whole = sumG13('venus', all.map(row), all.length, 1, 'draft', 0.02)
    for (const n of [1, 3, 5]) {
      const { out, lines } = joinParts(folder(n), ask())
      expect(JSON.stringify(out.G13)).toBe(JSON.stringify(whole.record))
      expect(JSON.stringify(out.G5)).toBe(JSON.stringify(g5.record))
      expect(JSON.stringify(out.G17)).toBe(JSON.stringify(g17.record))
      expect(lines).toEqual([whole.line, g5.line, g17.line])
      expect(out.pass).toBe(false)
      expect([out.stop, out.commit, out.engineHash, out.stopHash, out.format, out.assets, out.browser, out.every, out.noCover]).toEqual(['venus', 'c1', 'e1', 's1', '16x9', 'full', 'b1', 1, false])
      expect((out.run as { joined: { machine: string }[] }).joined.map((j) => j.machine)).toEqual([...Array.from({ length: n }, (_, i) => 'machine ' + (i + 1)), 'machine f'])
    }
    expect(whole.line).toBe('FAIL G13 venus: 1 of 23 frames over 0.02 soft; worst frame 1125 3.10%, frame 1112 0.60%, frame 1119 0.60%; 1 frames had no counted pixels')
  })

  it('joins the parts of every kth frame and of the texel frames alone', () => {
    const files = [1, 2].map((i) => ({ name: 'p' + i + '.json', part: texelPart(i, 2, 4) }))
    const list = all.filter((_, i) => i % 4 === 0)
    const { out, lines } = joinParts(files, ask({ every: 4, only: ['G13'] }))
    expect(JSON.stringify(out.G13)).toBe(JSON.stringify(sumG13('venus', list.map(row), all.length, 4, 'draft', 0.02).record))
    expect(lines[0]).toContain('(every 4th frame)')
    expect(out.pass).toBe(true)
    expect(out.G5).toBeUndefined()
  })

  it('takes no notice of the parts of another stop in the folder', () => {
    const other = { name: 'mars-part-1-of-3.json', part: { ...texelPart(1, 3), stop: 'mars' } }
    expect(joinParts([other, ...folder()], ask()).lines).toHaveLength(3)
  })

  it.each([
    ['commit', 'c2'],
    ['engineHash', 'e2'],
    ['stopHash', 's2'],
    ['format', '9x16'],
    ['assets', 'lite'],
    ['detail', '{"maxSoftPixelFraction":0.05}'],
    ['texelsRule', 't2'],
    ['finalsRule', 'f2'],
  ])('refuses a part whose %s is not the build\'s', (name, value) => {
    expect(() => joinParts(change(folder(), 'venus-part-2-of-3.json', { [name]: value }), ask())).toThrow('join refused: venus-part-2-of-3.json does not match the build: ' + name + ' ' + value + ' against ')
  })

  it('refuses parts of another commit than the tree\'s unless that commit is named, and then still wants one commit', () => {
    const files = folder().map((f) => ({ name: f.name, part: { ...f.part, commit: 'c9' } }))
    expect(() => joinParts(files, ask())).toThrow('commit c9 against c1')
    expect(joinParts(files, ask({ acceptCommit: 'c9' })).out.commit).toBe('c9')
    expect(() => joinParts(change(files, 'venus-part-finals.json', { commit: 'c1' }), ask({ acceptCommit: 'c9' }))).toThrow('venus-part-finals.json does not match the build: commit c1 against c9')
  })

  it('refuses parts that do not match each other', () => {
    expect(() => joinParts(change(folder(), 'venus-part-3-of-3.json', { browser: 'b2' }), ask())).toThrow('venus-part-3-of-3.json does not match venus-part-1-of-3.json: browser b2 against b1')
    expect(() => joinParts(change(folder(), 'venus-part-3-of-3.json', { noCover: true }), ask())).toThrow('noCover true against false')
    expect(() => joinParts(change(folder(), 'venus-part-3-of-3.json', { stopHashes: { venus: 's1', mars: 'm2' } }), ask())).toThrow('the stops\' hashes differ')
    expect(() => joinParts([...folder(3).slice(0, 2), { name: 'x.json', part: texelPart(3, 4) }, folder()[3]!], ask())).toThrow('x.json is one of 4 parts, venus-part-1-of-3.json one of 3')
  })

  it('refuses another tier, view, step or list of frames', () => {
    expect(() => joinParts(change(folder(), 'venus-part-1-of-3.json', { tier: 'review' }), ask())).toThrow('is drawn at review in the view texels, not at draft in texels')
    expect(() => joinParts(change(folder(), 'venus-part-1-of-3.json', { view: 'beauty' }), ask())).toThrow('in the view beauty')
    expect(() => joinParts(folder(), ask({ tier: 'draft' }))).toThrow('venus-part-finals.json is drawn at final in the view nograin, not at draft in nograin')
    expect(() => joinParts(folder(), ask({ every: 2 }))).toThrow('is of every 1th frame, the join is asked for every 2')
    expect(() => joinParts(folder(), ask({ frames: () => all.slice(1) }))).toThrow('was drawn from another list of frames (23 frames')
    expect(() => joinParts(folder(), ask({ frames: () => [...all.slice(0, 22), 9999] }))).toThrow('was drawn from another list of frames')
  })

  it('refuses a missing part, a part twice, a missing frame and a frame twice', () => {
    const files = folder()
    expect(() => joinParts(files.filter((f) => f.name !== 'venus-part-2-of-3.json'), ask())).toThrow('join refused: part 2 of 3 is missing')
    expect(() => joinParts([...files, { name: 'again.json', part: texelPart(2, 3) }], ask())).toThrow('part 2 of 3 is there twice: venus-part-2-of-3.json and again.json')
    const two = texelPart(2, 3)
    expect(() => joinParts(change(files, 'venus-part-2-of-3.json', { results: two.results!.slice(0, -1) }), ask())).toThrow('has results for 7 frames where its part has 8; frame 1132 is missing')
    expect(() => joinParts(change(files, 'venus-part-2-of-3.json', { results: [...two.results!.slice(0, -1), row(1110)] }), ask())).toThrow('has results for 8 frames where its part has 8; frame 1132 is missing')
    expect(() => joinParts(change(files, 'venus-part-2-of-3.json', { frames: texelPart(1, 3).frames, results: texelPart(1, 3).results }), ask())).toThrow('does not hold the frames of part 2 of 3')
  })

  it('refuses when the finals are wanted and missing or there twice, and when nothing of the stop is there', () => {
    const files = folder()
    expect(() => joinParts(files.slice(0, 3), ask())).toThrow('the part of the judged finals is missing')
    expect(() => joinParts([...files, { name: 'f2.json', part: finalsPart() }], ask())).toThrow('the part of the judged finals is there twice: venus-part-finals.json and f2.json')
    expect(() => joinParts(change(files, 'venus-part-finals.json', { G17: undefined }), ask())).toThrow('venus-part-finals.json holds no G17')
    expect(() => joinParts([], ask())).toThrow('no part of venus in the folder')
    expect(() => joinParts(files.slice(3), ask({ only: ['G13'] }))).toThrow('no part of what is asked (G13) in the folder')
  })
})
