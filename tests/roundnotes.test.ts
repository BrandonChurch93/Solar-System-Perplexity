import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const code = 'import sys, json; sys.path.insert(0, "tools"); import roundnotes as N; q = json.load(sys.stdin); c = [N.count(q["lines"], x[0], x[1], N.number(x[2])) for x in q["ask"]]; print(json.dumps([dict(x, tail=N.tail(x)) for x in c]))'
interface Counted { k: number; note: number; named: boolean; first: boolean; tail: string }
const ask = (lines: string[], rows: [number, string, string | number | null][]): Counted[] => JSON.parse(execFileSync('python3', ['-c', code], { cwd: root, encoding: 'utf8', input: JSON.stringify({ lines, ask: rows }), stdio: ['pipe', 'pipe', 'pipe'] })) as Counted[]

const phase6 = [
  '- Round 33, Phase 6, polish, round 1 of 3. Started 2026-11-22 12:55 UTC.',
  '- Round 34, Phase 6, polish, round 2 of 3. Started 2026-11-22 16:09 UTC.',
  '- Round 35, Phase 6, polish, round 3 of 3. Started 2026-11-22 18:25 UTC.',
  '- Round 36, Phase 6, record round, run 1 of 2. Started 2026-11-22 20:44 UTC.',
  '- Round 37, Phase 6, mercury, round 1 of 3. Started 2026-11-23 15:56 UTC.',
  '- Round 38, Phase 6, uranus, round 1 of 3. Started 2026-11-23 15:56 UTC.',
  '- Round 39, Phase 6, neptune, round 1 of 3. Started 2026-11-23 15:56 UTC.',
  '- Round 40, Phase 6, earth, round 1 of 3. Started 2026-11-23 15:57 UTC.',
  '- Round 41, Phase 6, venus, round 1 of 3 of the second note (opened at 17:16 UTC on 2026-11-23, before that note, and never packed before it; the note\'s own section names it Venus\'s first round of it). Started 2026-11-23 17:16 UTC.',
  '- Round 42, Phase 6, neptune, round 1 of 3 of the second note (round 39 was its round of the first note). Started 2026-11-24 13:10 UTC.',
  '- Round 43, Phase 6, mars, round 1 of 3. Started 2026-11-24 15:57 UTC.',
  '- Round 44, Phase 6, saturn, round 1 of 3. Started 2026-11-24 15:57 UTC.',
  '- Round 45, Phase 6, uranus, round 1 of 3 of the second note (round 38 was its round of the first note). Started 2026-11-24 15:57 UTC.',
  '- Round 46, Phase 6, jupiter, round 1 of 3. Started 2026-11-24 15:57 UTC.',
  '- Round 48, Phase 6, mercury, round 1 of 3 of the second note (round 37 was its round of the first note). Started 2026-11-24 20:58 UTC.',
  '- Round 49, Phase 6, sun, round 1 of 3. Started 2026-11-24 20:58 UTC.',
  '- Round 47, Phase 6, earth, round 1 of 3 of the second note (round 40 was its round of the first note). Started 2026-11-24 21:00 UTC.',
]
const third = [
  ...phase6,
  '- Round 50, Phase 6, mars, round 1 of 3 of the third note. Started 2026-11-25 01:00 UTC.',
  '- Round 51, Phase 6, jupiter, round 2 of 3 of the second note. Started 2026-11-25 01:10 UTC.',
  '- Round 52, Phase 6, mars, round 2 of 3 of the third note. Started 2026-11-25 03:00 UTC.',
]
const phase4 = ['- Round 5, Phase 4, mars, round 1 of 3. Started 2026-11-20 10:00 UTC.', '- Round 6, Phase 4, mars, round 2 of 3. Started 2026-11-20 12:00 UTC.', '- Round 7, Phase 4, earth, round 1 of 3. Started 2026-11-20 13:00 UTC.']

const stops = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']
const refusal = (lines: string[], row: [number, string, string | number | null]): string => {
  try {
    ask(lines, [row])
  } catch (e) {
    return String((e as { stderr?: string }).stderr ?? e)
  }
  return ''
}

describe('the round of a stop is counted for each note of the owner', () => {
  it('reads the lines of Phase 6 as they stand on main: 37 to 40 of the first note, 41 to 49 of the second, each stop one round of the second used', () => {
    const second = ask([...phase4, ...phase6], stops.map((s) => [6, s, 'second']))
    expect(second.map((c) => c.k)).toEqual(stops.map(() => 2))
    expect(second.every((c) => c.note === 2 && c.named && !c.first && c.tail === ' of the second note')).toBe(true)
    const first = ask(phase6, stops.map((s) => [6, s, 'first']))
    expect(first.map((c) => c.k)).toEqual([1, 2, 1, 2, 1, 1, 1, 2, 2])
    expect(first.every((c) => c.tail === ' of the first note')).toBe(true)
  })

  it('takes the note as a number or a word, and a note that has not begun yet as its first round', () => {
    expect(ask(phase6, [[6, 'earth', 2], [6, 'earth', '2'], [6, 'earth', 'Second']]).map((c) => c.k)).toEqual([2, 2, 2])
    expect(ask(phase6, [[6, 'earth', 'third']])[0]).toEqual({ k: 1, note: 3, named: true, first: false, tail: ' of the third note' })
  })

  it('refuses a round without the note as soon as the phase knows more than one, and names the choices', () => {
    expect(refusal(phase6, [6, 'jupiter', null])).toContain('Phase 6 knows 2 notes: state the note of this round of jupiter with --note first, second or third')
    expect(refusal(third, [6, 'jupiter', null])).toContain('Phase 6 knows 3 notes: state the note of this round of jupiter with --note first, second, third or fourth')
    expect(refusal(phase6, [6, 'jupiter', 'fourth'])).toContain('--note first, second or third')
    expect(refusal(phase6, [6, 'earth', 'next'])).toContain('--note takes a number')
  })

  it('counts a stop that goes on in the second note beside a stop that has rounds of the third', () => {
    const got = ask(third, [[6, 'mars', 'third'], [6, 'mars', 'second'], [6, 'jupiter', 'second'], [6, 'jupiter', 'third'], [6, 'sun', 'third'], [6, 'sun', 'second']])
    expect(got.map((c) => [c.k, c.tail])).toEqual([[3, ' of the third note'], [2, ' of the second note'], [3, ' of the second note'], [1, ' of the third note'], [1, ' of the third note'], [2, ' of the second note']])
  })

  it('writes the line as it always was while a phase knows one note, and counts each phase alone', () => {
    expect(ask([...phase4, ...phase6], [[4, 'mars', null], [4, 'earth', null], [4, 'venus', null]])).toEqual([
      { k: 3, note: 1, named: false, first: false, tail: '' },
      { k: 2, note: 1, named: false, first: false, tail: '' },
      { k: 1, note: 1, named: false, first: true, tail: '' },
    ])
  })

  it('counts a third round of the second note as the third, and the next as over the three', () => {
    const more = [...phase6, '- Round 50, Phase 6, earth, round 2 of 3 of the second note. Started 2026-11-25 01:00 UTC.']
    expect(ask(more, [[6, 'earth', 'second']])[0]!.k).toBe(3)
    expect(ask([...more, '- Round 51, Phase 6, earth, round 3 of 3 of the second note. Started 2026-11-25 02:00 UTC.'], [[6, 'earth', 'second']])[0]!.k).toBe(4)
  })
})
