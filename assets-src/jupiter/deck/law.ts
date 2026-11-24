import { args, loadConfig } from '../../../tools/lib/common'
import { FilmDirector } from '../../../src/director/film'
import { forceOneMove } from '../../../src/director/handover'
import type { Corners, Flanks } from '../../../src/director/pace'
import { plans } from '../../../src/director/plans'
import { MIN_POINTS, curves, ringPlane, sampleWindow } from '../../../tools/smooth/camera'
import { judgeCurve } from '../../../tools/smooth/path'

// The search for the law of Jupiter's dive or rise on the engine's one move (handover.KIND of place.json: pace, turn, liftPower), held
// against the judge of npm run smooth itself (tools/smooth: the speed of the picture on one fixed set of ring points) at whole frames and
// at the capture rate. tools/law.ts searches on the engine's own measure, whose speed steps where the count of ring points changes.
//   npx tsx assets-src/jupiter/deck/law.ts [--kind dive|rise] [--tries N] [--moves N] [--rounds N] [--seed N] [--rates 1,2] [--start JSON]
// Nothing is written: the last line is the block for place.json. The judge of a build is npm run smooth.

type Law = { pace: Flanks; turn: Flanks; liftPower: number }
const a = args()
const cfg = loadConfig()
const S = cfg.raw.smooth
const stop = 'jupiter'
const kind = (a.kind ?? 'rise') as 'dive' | 'rise'
const plan = plans.find((p) => p.id === stop)!
forceOneMove(true)
const master = cfg.formats[cfg.formatKeys.master]!
const tries = Number(a.tries ?? 2000)
const moves = Number(a.moves ?? 4)
const rounds = Number(a.rounds ?? 3)
const rates = (a.rates ?? '1,2').split(',').map(Number)
const params = plan.p as { handover?: Record<string, object> }
const own = { ...((params.handover ?? {})[kind] ?? {}) } as Record<string, unknown>
const UNITS: ['fall' | 'turn' | 'speed', string, number | null][] = [['fall', 'rate', null], ['turn', 'turn', S.path.floors.turnDeg], ['speed', 'speed', S.path.floors.speedPx]]
interface Score { total: number; faults: number; line: string }

function measure(law: Law): Score {
  params.handover = { ...(params.handover ?? {}), [kind]: { ...own, pace: law.pace, turn: law.turn, liftPower: law.liftPower } }
  try {
    const film = new FilmDirector(plans)
    const ground = ringPlane(plan)
    let total = 0
    let faults = 0
    const parts: string[] = []
    for (const r of rates) {
      const w = sampleWindow(cfg, film, plan, kind, r, S.reachFrames)!
      const c = curves(w, plan, master.width, master.height, S.path.ringPx, 'picture', 8, ground)
      for (const [key, name, floor] of UNITS) {
        const j = judgeCurve(name, '', c[key], w.k0, r, w.own, S.path, floor, key === 'speed' ? { values: c.ring, min: MIN_POINTS } : null)
        faults += j.faults.length
        if (j.floored) continue
        const step = Math.max(j.worstStep?.value ?? 0, j.worstHalfStep?.value ?? 0)
        const back = Math.max(j.climbAfterPeak.value, j.fallBeforePeak.value)
        total = Math.max(total, step / S.path.maxStep, back / S.path.maxRebound)
        parts.push(name + '@' + r + ' ' + step.toFixed(4) + ' at ' + (j.worstStep?.frame ?? '-') + ' back ' + back.toFixed(3))
      }
    }
    return { total: total + (faults > 0 && total < 1 ? 1 : 0), faults, line: parts.join(' | ') }
  } catch (e) {
    return { total: Number.POSITIVE_INFINITY, faults: 99, line: 'refused: ' + (e as Error).message.slice(0, 160) }
  }
}
const copy = (law: Law): Law => JSON.parse(JSON.stringify(law)) as Law
function get(law: Law, key: string): number {
  if (key === 'liftPower') return law.liftPower
  const [bell, name, i] = key.split('.') as ['pace' | 'turn', 'rise' | 'fall' | 'corner', string | undefined]
  const b = law[bell]
  if (name === 'corner') return b.corner
  return i === undefined ? b[name] : (b.corners?.[name] ?? [b.corner, b.corner])[Number(i)]!
}
function set(law: Law, key: string, value: number): Law {
  const out = copy(law)
  if (key === 'liftPower') { out.liftPower = value; return out }
  const [bell, name, i] = key.split('.') as ['pace' | 'turn', 'rise' | 'fall' | 'corner', string | undefined]
  const b = out[bell]
  if (name === 'corner') b.corner = value
  else if (i === undefined) b[name] = value
  else {
    const pair = (b.corners?.[name] ?? [b.corner, b.corner]).slice() as Corners
    pair[Number(i)] = value
    b.corners = { ...(b.corners ?? {}), [name]: pair }
  }
  return out
}
const range = (from: number, to: number, by: number): number[] => { const out: number[] = []; for (let v = from; v <= to + 1e-9; v += by) out.push(Math.round(v * 1000) / 1000); return out }
const grid: Record<string, number[]> = { liftPower: range(0, 2, 0.125) }
for (const bell of ['pace', 'turn']) {
  grid[bell + '.rise'] = range(0.2, 0.75, 0.025)
  grid[bell + '.fall'] = range(0.2, 0.75, 0.025)
  grid[bell + '.corner'] = range(0.05, 0.5, 0.05)
  for (const side of ['rise', 'fall']) for (const i of [0, 1]) grid[bell + '.' + side + '.' + i] = range(0.05, 0.95, 0.05)
}
const keys = Object.keys(grid)
let law: Law = a.start ? (JSON.parse(a.start) as Law) : copy(plan.eyeLaw(kind))
let best = measure(law)
const show = (s: Score): string => s.total.toFixed(3) + ' of the limits, faults ' + s.faults + ': ' + s.line
console.log('start ' + show(best))
console.log('      ' + JSON.stringify(law))
let seed = Number(a.seed ?? 7)
const random = (): number => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
for (let t = 0; t < tries; t++) {
  let next = law
  const count = 1 + Math.floor(random() * Math.min(keys.length, moves))
  for (let m = 0; m < count; m++) {
    const key = keys[Math.floor(random() * keys.length)]!
    const values = grid[key]!
    next = set(next, key, values[Math.floor(random() * values.length)]!)
  }
  const got = measure(next)
  if (got.total < best.total - 1e-4) { best = got; law = next; console.log('try ' + String(t).padStart(5) + ' ' + show(got)); console.log('      ' + JSON.stringify(law)) }
}
for (let round = 0; round < rounds; round++) {
  let moved = false
  for (const key of keys) for (const value of grid[key]!) {
    if (value === get(law, key)) continue
    const next = set(law, key, value)
    const got = measure(next)
    if (got.total < best.total - 1e-4) { best = got; law = next; moved = true; console.log('round ' + round + ' ' + key + ' ' + value + ' ' + show(got)) }
  }
  if (!moved) break
}
console.log('best ' + show(best))
console.log('"pace": ' + JSON.stringify(law.pace) + ', "turn": ' + JSON.stringify(law.turn) + ', "liftPower": ' + law.liftPower)
