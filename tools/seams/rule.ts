// The rule of the seams report (tools/seams.ts), travel_builder's: the picture stands at a seam when the speed at the picture's middle and at
// the body's limb is under STILL.px px a half frame at preview size for STILL.steps or more steps in a row, with motion before and after
// inside the window. A step with no reading at one of the points is not under the limit.

export const STILL = { px: 0.5, steps: 3 }
export const WINDOW = { before: 12, after: 20 }

export interface Step { k: number; middle: number | null; limb: number | null; mean: number }
export interface Run { first: number; end: number; steps: number; lowest: number }
export interface Change { value: number; k: number; from: number; to: number }
export interface Low { value: number; k: number }
export type Stand = { kind: 'stands'; run: Run } | { kind: 'rests'; from: number } | { kind: 'starts'; until: number } | { kind: 'still' } | { kind: 'moves'; lowest: number | null }
export interface Verdict { middle: { lowest: Low | null; change: Change | null; alone: Run | null }; limb: { lowest: Low | null; change: Change | null; alone: Run | null }; both: Stand; mean: Stand }

export const lowest = (ks: number[], values: (number | null)[]): Low | null => {
  let best: Low | null = null
  values.forEach((v, i) => {
    if (v !== null && (best === null || v < best.value)) best = { value: v, k: ks[i]! }
  })
  return best
}

export const change = (ks: number[], values: (number | null)[]): Change | null => {
  let best: Change | null = null
  for (let i = 1; i < values.length; i++) {
    const [a, b] = [values[i - 1]!, values[i]!]
    if (a === null || b === null) continue
    if (best === null || Math.abs(b - a) > best.value) best = { value: Math.abs(b - a), k: ks[i]!, from: a, to: b }
  }
  return best
}

export function stand(ks: number[], values: (number | null)[], limit = STILL.px, steps = STILL.steps): Stand {
  const under = values.map((v) => v !== null && v < limit)
  const runs: (Run & { open: boolean; closed: boolean })[] = []
  for (let i = 0; i < under.length; i++) {
    if (!under[i]) continue
    let j = i
    while (j < under.length && under[j]) j++
    if (j - i >= steps) runs.push({ first: ks[i]!, end: ks[j - 1]! + 1, steps: j - i, lowest: Math.min(...(values.slice(i, j) as number[])), open: i > 0 && values[i - 1] !== null, closed: j < under.length && values[j] !== null })
    i = j
  }
  const whole = runs.find((r) => r.steps === under.length)
  if (whole) return { kind: 'still' }
  const held = runs.filter((r) => r.open && r.closed).sort((a, b) => b.steps - a.steps)[0]
  if (held) return { kind: 'stands', run: { first: held.first, end: held.end, steps: held.steps, lowest: held.lowest } }
  const last = runs[runs.length - 1]
  if (last && last.end === ks[ks.length - 1]! + 1 && last.open) return { kind: 'rests', from: last.first }
  const first = runs[0]
  if (first && first.first === ks[0] && first.closed) return { kind: 'starts', until: first.end }
  return { kind: 'moves', lowest: lowest(ks, values)?.value ?? null }
}

const larger = (a: number | null, b: number | null): number | null => (a === null || b === null ? null : Math.max(a, b))
const alone = (s: Stand): Run | null => (s.kind === 'stands' ? s.run : null)

export function verdict(rows: Step[]): Verdict {
  const ks = rows.map((r) => r.k)
  const [middle, limb, mean] = [rows.map((r) => r.middle), rows.map((r) => r.limb), rows.map((r) => r.mean)]
  const both = stand(ks, rows.map((r) => larger(r.middle, r.limb)))
  const [m, l] = [stand(ks, middle), stand(ks, limb)]
  return {
    middle: { lowest: lowest(ks, middle), change: change(ks, middle), alone: both.kind === 'moves' ? alone(m) : null },
    limb: { lowest: lowest(ks, limb), change: change(ks, limb), alone: both.kind === 'moves' ? alone(l) : null },
    both,
    mean: stand(ks, mean),
  }
}

export const where = (k: number, rate: number): string => Math.floor(k / rate) + (k % rate === 0 ? '' : ' ' + (k % rate) + '/' + rate)
const px = (v: number): string => v.toFixed(2)
const span = (r: Run, rate: number): string => where(r.first, rate) + ' to ' + where(r.end, rate) + ' (' + r.steps + ')'

export const lowCell = (low: Low | null, rate: number): string => (low ? px(low.value) + ' at ' + where(low.k, rate) : 'no reading')
export const changeCell = (c: Change | null, rate: number): string => (c ? px(c.value) + ' at ' + where(c.k, rate) + ' (' + px(c.from) + ' to ' + px(c.to) + ')' : 'no reading')

export function bothCell(v: Verdict, rate: number): string {
  const s = v.both
  if (s.kind === 'stands') return 'YES, ' + span(s.run, rate)
  if (s.kind === 'rests') return 'no: comes to rest at ' + where(s.from, rate) + ' and stays'
  if (s.kind === 'starts') return 'no: starts from rest (under ' + STILL.px + ' until ' + where(s.until, rate) + ')'
  if (s.kind === 'still') return 'no: at rest through the whole window'
  const one = v.middle.alone ? ' (middle alone: ' + span(v.middle.alone, rate) + ')' : v.limb.alone ? ' (limb alone: ' + span(v.limb.alone, rate) + ')' : ''
  return (s.lowest === null ? 'no reading at both points' : 'no, lowest ' + px(s.lowest)) + one
}

export function meanCell(v: Verdict, rate: number): string {
  const s = v.mean
  if (s.kind === 'stands') return 'yes, ' + span(s.run, rate) + ', lowest ' + px(s.run.lowest)
  if (s.kind === 'rests') return 'rest from ' + where(s.from, rate)
  if (s.kind === 'starts') return 'rest until ' + where(s.until, rate)
  if (s.kind === 'still') return 'at rest through the whole window'
  return 'no, lowest ' + (s.lowest === null ? 'none' : px(s.lowest))
}

export interface SeamRow { stop: string; seam: string; frame: number; verdict: Verdict }

export const HEAD = ['stop', 'seam', 'middle: lowest, where', 'middle: largest change, where', 'limb: lowest, where', 'limb: largest change, where', 'stands at both points', 'stands by the mean of the frame']

export const cells = (r: SeamRow, rate: number): string[] => [r.stop, r.seam + ' at ' + r.frame, lowCell(r.verdict.middle.lowest, rate), changeCell(r.verdict.middle.change, rate), lowCell(r.verdict.limb.lowest, rate), changeCell(r.verdict.limb.change, rate), bothCell(r.verdict, rate), meanCell(r.verdict, rate)]

export function tableOf(rows: SeamRow[], rate: number): string[] {
  return ['| ' + HEAD.join(' | ') + ' |', '|' + HEAD.map(() => '---').join('|') + '|', ...rows.map((r) => '| ' + cells(r, rate).join(' | ') + ' |')]
}

export const standing = (rows: SeamRow[]): SeamRow[] => rows.filter((r) => r.verdict.both.kind === 'stands')
