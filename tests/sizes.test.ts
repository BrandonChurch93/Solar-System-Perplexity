import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { EVERY, PROPOSED, linesOf, movesOf, overOf, pairsOf, unread, type PairRow } from '../tools/sizes/pairs'

const MAKE = `
import sys, os
import numpy as np, cv2
from PIL import Image
folder = sys.argv[1]
W, H = 960, 540
def field(seed, w=W, h=H):
    g = np.random.default_rng(seed).normal(0, 1, (h, w)).astype(np.float32)
    g = cv2.GaussianBlur(g, (0, 0), 5)
    return 128 + 60 * g / g.std()
def save(name, g):
    Image.fromarray(np.repeat(np.clip(g, 0, 255).astype(np.uint8)[..., None], 3, axis=2)).save(os.path.join(folder, name))
a, b = field(1), field(2)
big = lambda g: cv2.resize(g, (2 * W, 2 * H), interpolation=cv2.INTER_CUBIC)
save('film.png', a)
save('same.png', big(a))
part = a.copy()
part[:, : W // 2] = b[:, : W // 2]
save('other.png', big(part))
save('flat.png', np.full((H, W), 128.0))
save('flat-big.png', np.full((2 * H, 2 * W), 128.0))
save('odd.png', cv2.resize(a, (W * 3 // 2, H * 3 // 2)))
`

interface Reading { pattern: number | null; at: [number, number] | null; share: number; wide: number | null }

const tool = fileURLToPath(new URL('../tools/img/sizes.py', import.meta.url))
let folder = ''
const read = (pairs: [string, string][]): Reading[] => JSON.parse(execFileSync('python3', [tool], { input: JSON.stringify({ scale: 0.25, patternPx: 40, patternFloor: 1, pairs: pairs.map(([film, big]) => ({ film: join(folder, film), big: join(folder, big) })) }), encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })) as Reading[]

describe('the film\'s two sizes against each other: the same film frame drawn large and at the film\'s size', () => {
  beforeAll(() => {
    folder = mkdtempSync(join(tmpdir(), 'sizes-'))
    execFileSync('python3', ['-c', MAKE, folder], { stdio: ['ignore', 'ignore', 'inherit'] })
  }, 120_000)
  afterAll(() => rmSync(folder, { recursive: true, force: true }))

  it('reads the same surface far under the proposed limit and another surface on half the frame far over it', () => {
    const [same, other] = read([['film.png', 'same.png'], ['film.png', 'other.png']])
    expect(same!.pattern!).toBeLessThan(PROPOSED / 5)
    expect(same!.share).toBeGreaterThan(0.9)
    expect(other!.pattern!).toBeGreaterThan(PROPOSED * 5)
    expect(other!.at![0]).toBeLessThan(480 + 40)
  }, 120_000)

  it('has no number where the frame holds no detail, and refuses a large picture that is no whole multiple of the film\'s', () => {
    const [flat] = read([['flat.png', 'flat-big.png']])
    expect(flat!.pattern).toBeNull()
    expect(flat!.share).toBeLessThan(0.02)
    expect(() => read([['film.png', 'odd.png']])).toThrow()
  }, 120_000)

  const segments = [
    { id: 'a.hold', stop: 'a', kind: 'hold', firstFrame: 0, endFrame: 100 },
    { id: 'a.dive', stop: 'a', kind: 'dive', firstFrame: 100, endFrame: 190 },
    { id: 'a.terrain', stop: 'a', kind: 'terrain', firstFrame: 190, endFrame: 300 },
    { id: 'a.rise', stop: 'a', kind: 'rise', firstFrame: 300, endFrame: 375 },
    { id: 'b.rise', stop: 'b', kind: 'rise', firstFrame: 375, endFrame: 380 },
  ]

  it('takes the dive and the rise of a stop with the reach of the pictures part to each side, inside the film', () => {
    expect(movesOf(segments, 'a', ['dive', 'rise'], 12, 380)).toEqual([{ segment: 'a.dive', kind: 'dive', first: 88, end: 202 }, { segment: 'a.rise', kind: 'rise', first: 288, end: 380 }])
    expect(movesOf(segments, 'a', ['rise'], 12, 380)).toHaveLength(1)
    expect(movesOf(segments, 'b', ['dive', 'rise'], 12, 380)).toEqual([{ segment: 'b.rise', kind: 'rise', first: 363, end: 380 }])
    expect(movesOf(segments, 'a', ['dive'], 200, 380)[0]).toMatchObject({ first: 0, end: 380 })
  })

  it('draws one pair each 8 film frames, so that a fault of 15 film frames holds at least one pair wherever it starts', () => {
    expect(EVERY).toBe(8)
    const [dive] = movesOf(segments, 'a', ['dive'], 12, 380)
    const pairs = pairsOf(dive!, EVERY)
    expect(pairs).toHaveLength(15)
    expect(pairs[0]).toEqual({ segment: 'a.dive', kind: 'dive', frame: 88 })
    expect(pairs.at(-1)!.frame).toBe(200)
    for (let start = dive!.first; start + 15 <= dive!.end; start++) expect(pairs.some((p) => p.frame >= start && p.frame < start + 15)).toBe(true)
    expect(pairsOf(dive!, EVERY, 100, 120).map((p) => p.frame)).toEqual([104, 112, 120])
  })

  it('prints every number, names the pairs over the proposed limit and says that it is no gate', () => {
    const row = (frame: number, pattern: number | null): PairRow => ({ segment: 'a.dive', kind: 'dive', frame, pattern, at: pattern === null ? null : [10, 20], share: pattern === null ? 0.01 : 0.7, wide: pattern === null ? null : pattern / 3 })
    const rows = [row(88, 0.002), row(96, 0.77), row(104, null), row(112, 0.1)]
    expect(PROPOSED).toBe(0.1)
    expect(overOf(rows, PROPOSED).map((r) => r.frame)).toEqual([96])
    expect(unread(rows).map((r) => r.frame)).toEqual([104])
    const lines = linesOf('a', movesOf(segments, 'a', ['dive'], 12, 380), rows, { formats: ['uhd', '16x9'], factor: 2, tier: 'draft', every: 8, bandPx: [8, 40], machine: 'here', seconds: { '16x9': 6.1, uhd: null }, commit: 'abc' })
    const text = lines.join('\n')
    expect(text).toContain('A report, not a gate')
    expect(text).toContain('Proposed limit 0.1, not yet a gate. 4 pairs, 3 read. Largest: 0.770 at film frame 96 (a.dive). Over the proposed limit: 1 (frame 96: 0.770). NOT MEASURED, too little of the frame holds detail in both: frame 104.')
    expect(text).toContain('| 88 | a.dive | 0.002 |  | 0.70 | 10,20 | 0.001 |')
    expect(text).toContain('| 96 | a.dive | 0.770 | OVER | 0.70 | 10,20 | 0.257 |')
    expect(text).toContain('| 104 | a.dive | none | not measured | 0.01 |  | none |')
    expect(text).toContain('| 112 | a.dive | 0.100 |  |')
    expect(lines.filter((l) => l.startsWith('| ') && /^\| \d/.test(l))).toHaveLength(4)
    expect(text).not.toMatch(/[\u2014!]/)
  })
})
