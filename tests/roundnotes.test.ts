import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const code = 'import sys, json; sys.path.insert(0, "tools"); import roundnotes as N; q = json.load(sys.stdin); c = [N.count(q["lines"], x[0], x[1], N.number(x[2])) for x in q["ask"]]; print(json.dumps([dict(x, tail=N.tail(x)) for x in c]))'
interface Counted { k: number; note: number; named: boolean; first: boolean; tail: string }
const ask = (lines: string[], rows: [number, string, string | number | null][]): Counted[] => JSON.parse(execFileSync('python3', ['-c', code], { cwd: root, encoding: 'utf8', input: JSON.stringify({ lines, ask: rows }) })) as Counted[]

const phase6 = [
  '- Round 33, Phase 6, polish, round 1 of 3. Started 2026-11-22 12:55 UTC.',
  '- Round 36, Phase 6, record round, run 1 of 2. Started 2026-11-22 20:44 UTC.',
  '- Round 37, Phase 6, mercury, round 1 of 3. Started 2026-11-23 15:56 UTC. Next: Mercury round 2 of 3.',
  '- Round 38, Phase 6, uranus, round 1 of 3. Started 2026-11-23 15:56 UTC.',
  '- Round 39, Phase 6, neptune, round 1 of 3. Started 2026-11-23 15:56 UTC.',
  '- Round 40, Phase 6, earth, round 1 of 3. Started 2026-11-23 15:57 UTC.',
  '- Round 41, Phase 6, venus, round 1 of 3. Started 2026-11-23 17:16 UTC.',
  '- Round 42, Phase 6, neptune, round 1 of 3 of the second note (round 39 was its round of the first note). Started 2026-11-24 13:10 UTC.',
  '- Round 43, Phase 6, mars, round 1 of 3. Started 2026-11-24 15:57 UTC.',
  '- Round 44, Phase 6, saturn, round 1 of 3. Started 2026-11-24 15:57 UTC.',
  '- Round 45, Phase 6, uranus, round 1 of 3 of the second note (round 38 was its round of the first note). Started 2026-11-24 15:57 UTC.',
  '- Round 46, Phase 6, jupiter, round 1 of 3. Started 2026-11-24 15:57 UTC.',
  '- Round 48, Phase 6, mercury, round 1 of 3 of the second note (round 37 was its round of the first note). Started 2026-11-24 20:58 UTC.',
  '- Round 49, Phase 6, sun, round 1 of 3. Started 2026-11-24 20:58 UTC.',
  '- Round 47, Phase 6, earth, round 1 of 3 of the second note (round 40 was its round of the first note). Started 2026-11-24 21:00 UTC.',
]
const phase4 = ['- Round 5, Phase 4, mars, round 1 of 3. Started 2026-11-20 10:00 UTC.', '- Round 6, Phase 4, mars, round 2 of 3. Started 2026-11-20 12:00 UTC.', '- Round 7, Phase 4, earth, round 1 of 3. Started 2026-11-20 13:00 UTC.']

describe('the round of a stop is counted for each note of the owner', () => {
  it('counts the rounds of the second note alone: a line that names it, and a line that says nothing from the note\'s first round on', () => {
    const stops = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']
    const got = ask([...phase4, ...phase6], stops.map((s) => [6, s, 'second']))
    expect(got.map((c) => c.k)).toEqual([2, 2, 1, 2, 2, 2, 2, 2, 2])
    expect(got.every((c) => c.note === 2 && c.named && c.tail === ' of the second note')).toBe(true)
    expect(got.map((c) => c.first)).toEqual(stops.map(() => false))
  })

  it('takes the latest note that has begun when none is stated, and the first note when it is stated', () => {
    expect(ask(phase6, [[6, 'venus', null]])[0]).toEqual({ k: 1, note: 2, named: true, first: false, tail: ' of the second note' })
    expect(ask(phase6, [[6, 'venus', 'first']])[0]).toEqual({ k: 2, note: 1, named: true, first: false, tail: ' of the first note' })
    expect(ask(phase6, [[6, 'earth', 2], [6, 'earth', '2'], [6, 'earth', 'Second']]).map((c) => c.k)).toEqual([2, 2, 2])
    expect(ask(phase6, [[6, 'earth', 'third']])[0]).toEqual({ k: 1, note: 3, named: true, first: false, tail: ' of the third note' })
  })

  it('writes the line as it always was while a phase knows one note, and counts each phase alone', () => {
    expect(ask([...phase4, ...phase6], [[4, 'mars', null], [4, 'earth', null], [4, 'venus', null]])).toEqual([
      { k: 3, note: 1, named: false, first: false, tail: '' },
      { k: 2, note: 1, named: false, first: false, tail: '' },
      { k: 1, note: 1, named: false, first: true, tail: '' },
    ])
  })

  it('counts a third round of the second note as the third, not as used up', () => {
    const more = [...phase6, '- Round 50, Phase 6, earth, round 2 of 3 of the second note. Started 2026-11-25 01:00 UTC.']
    expect(ask(more, [[6, 'earth', 'second']])[0]!.k).toBe(3)
    expect(ask([...more, '- Round 51, Phase 6, earth, round 3 of 3 of the second note. Started 2026-11-25 02:00 UTC.'], [[6, 'earth', 'second']])[0]!.k).toBe(4)
  })

  it('refuses a note that is no number and no word', () => {
    expect(() => ask(phase6, [[6, 'earth', 'next']])).toThrow()
  })
})
