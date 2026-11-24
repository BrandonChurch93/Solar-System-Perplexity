import { args } from './lib/common'
import { config } from '../src/config'
import { FilmDirector } from '../src/director/film'
import { forceOneMove } from '../src/director/handover'
import { paceLimits, type Corners, type Flanks } from '../src/director/pace'
import { plans } from '../src/director/plans'
import { paceOf, type CurveName } from './lib/pace'
import { position } from './smooth/path'

// The search for a stop's own law of the engine's one move (plan E): the bell of the height, the bell of the eye's direction and the power
// of the lift (StopPlan.eyeLaw), for one dive or one rise.
//   npx tsx tools/law.ts --stop ID --kind dive|rise [--corners] [--tries N] [--moves N] [--seed N] [--rounds N] [--rate N]
//                        [--keys LIST] [--start JSON] [--rebound W]
// It flies the stop on the one move whatever handover.ownPath says, starts from the law the stop has (or --start, a JSON of
// {pace, turn, liftPower}), tries sets from a grid and keeps the one whose worst curve stands lowest against the limits of the harness
// (smooth.path of the config): the worst step of rate, turn and picture speed over maxStep (over one film frame and, at a rate above 1,
// from one capture frame to the next), and the worst fall before or climb after a peak over maxRebound times --rebound (1 when not given;
// 0 leaves the rebound to the stop's surface view).
//   --corners  also tries two corners a flank (pace.corners, turn.corners). Without it only rise, fall, corner of both bells and liftPower.
//   --keys     a list of what may change, of pace.rise pace.fall pace.corner pace.rise.0 pace.rise.1 pace.fall.0 pace.fall.1, the same
//              with turn, and liftPower (.0 is the foot of that flank, .1 its top).
//   --tries    random sets before the fine search (2000), each changing up to --moves keys (4); --seed picks the sequence, so a run repeats.
//   --rate     capture frames a film frame during the search (1). Above 1 a set is read at whole frames and at that rate, as a build is
//              judged. The best set is printed at whole frames and at the rate of the harness.
// Nothing is written: the last lines are the block to put under handover.KIND of the stop's params. The measure is the judge's own
// (tools/lib/pace.ts: the functions of npm run smooth on the film's camera, the speed of the picture on one fixed set of ring points),
// about 20 ms a set at whole frames and 30 ms with rate 2; "faults" counts what the judge would name. The judge of a build is npm run
// smooth.

type Law = { pace: Flanks; turn: Flanks; liftPower: number }
type Kind = 'dive' | 'rise'

const a = args()
const stop = a.stop
const kind = a.kind as Kind
const plan = plans.find((p) => p.id === stop)
if (!plan || (kind !== 'dive' && kind !== 'rise') || !plan.seg[kind]) {
  console.error('law: --stop must be a stop with a dive or a rise and --kind dive or rise')
  process.exit(2)
}
forceOneMove(true)
const limits = paceLimits()
const rebound = a.rebound === undefined ? 1 : Number(a.rebound)
const rate = Number(a.rate ?? 1)
const tries = Number(a.tries ?? 2000)
const moves = Number(a.moves ?? 4)
const rounds = Number(a.rounds ?? 3)
const CURVES: CurveName[] = ['fall', 'turn', 'speed']
const NAMES: Record<CurveName, string> = { fall: 'rate', turn: 'turn', speed: 'speed' }

const params = plan.p as { handover?: Record<string, object> }
const own = { ...((params.handover ?? {})[kind] ?? {}) } as Record<string, unknown>

interface Score { total: number; step: number; rebound: number; faults: number; line: string }

const refused = (why: string): Score => ({ total: Number.POSITIVE_INFINITY, step: Number.POSITIVE_INFINITY, rebound: Number.POSITIVE_INFINITY, faults: 0, line: 'refused: ' + why.slice(0, 160) })

function measure(law: Law, at: number): Score {
  params.handover = { ...(params.handover ?? {}), [kind]: { ...own, pace: law.pace, turn: law.turn, liftPower: law.liftPower } }
  try {
    const film = new FilmDirector(plans)
    const rates = at > 1 ? [1, at] : [1]
    let step = 0
    let back = 0
    let faults = 0
    const parts: string[] = []
    for (const r of rates) {
      const pace = paceOf(film, plan!, kind, r)
      if (!pace) throw new Error('no pace')
      faults += pace.faults.length
      const bits: string[] = []
      for (const n of CURVES) {
        const c = pace.curves[n]
        const mean = c.faults.find((f) => f.rule === 'mean')
        if (mean) return refused(mean.text)
        const whole = c.worstStep?.value ?? 0
        const half = c.worstHalfStep?.value ?? 0
        const mark = half > whole ? c.worstHalfStep : c.worstStep
        const b = Math.max(c.fallBeforePeak.value, c.climbAfterPeak.value)
        step = Math.max(step, Math.max(whole, half) / limits.maxStep)
        back = Math.max(back, b / limits.maxRebound)
        const blind = c.points && c.points.notMeasured > 0 ? ', ' + c.points.notMeasured + ' steps not measured' : ''
        bits.push(NAMES[n] + ' ' + Math.max(whole, half).toFixed(4) + ' at ' + (mark ? position(mark.k, r) : '-') + ', back ' + b.toFixed(3) + blind)
      }
      parts.push((rates.length > 1 ? (r === 1 ? 'whole frames: ' : 'rate ' + r + ': ') : '') + bits.join(' | '))
    }
    return { total: Math.max(step, rebound * back), step, rebound: back, faults, line: parts.join(' || ') }
  } catch (e) {
    return refused((e as Error).message)
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
  if (key === 'liftPower') {
    out.liftPower = value
    return out
  }
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

const range = (from: number, to: number, by: number): number[] => {
  const out: number[] = []
  for (let v = from; v <= to + 1e-9; v += by) out.push(Math.round(v * 1000) / 1000)
  return out
}
const grid: Record<string, number[]> = { liftPower: range(0, 1.5, 0.125) }
for (const bell of ['pace', 'turn']) {
  grid[bell + '.rise'] = range(0.25, 0.7, 0.025)
  grid[bell + '.fall'] = range(0.25, 0.7, 0.025)
  grid[bell + '.corner'] = range(0.05, 0.5, 0.05)
  for (const side of ['rise', 'fall']) for (const i of [0, 1]) grid[bell + '.' + side + '.' + i] = range(0.05, 0.95, 0.05)
}
const plainKeys = ['pace.rise', 'pace.fall', 'pace.corner', 'turn.rise', 'turn.fall', 'turn.corner', 'liftPower']
const cornerKeys = ['pace', 'turn'].flatMap((bell) => ['rise', 'fall'].flatMap((side) => [0, 1].map((i) => bell + '.' + side + '.' + i)))
const keys = a.keys ? a.keys.split(',') : a.corners ? [...plainKeys, ...cornerKeys] : plainKeys
for (const key of keys) {
  if (!grid[key]) {
    console.error('law: unknown key ' + key + '; known: ' + Object.keys(grid).join(' '))
    process.exit(2)
  }
}

const first = plan.eyeLaw(kind)
let law: Law = a.start ? (JSON.parse(a.start) as Law) : copy(first)
let best = measure(law, rate)
const show = (s: Score): string => (Number.isFinite(s.total) ? 'steps ' + s.step.toFixed(3) + ' and rebound ' + s.rebound.toFixed(2) + ' of the limits, faults ' + s.faults + ': ' + s.line : s.line)
console.log('law ' + stop + ' ' + kind + ', ' + config.segments.find((s) => s.stop === stop && s.kind === kind)!.frames + ' frames, limits step ' + limits.maxStep + ' rebound ' + limits.maxRebound + ', rebound counted ' + rebound + ' times')
console.log('start  ' + show(best))
console.log('       ' + JSON.stringify(law))

let seed = Number(a.seed ?? 7)
const random = (): number => {
  seed = (seed * 1103515245 + 12345) % 2147483648
  return seed / 2147483648
}
for (let t = 0; t < tries; t++) {
  let next = law
  const count = 1 + Math.floor(random() * Math.min(keys.length, moves))
  for (let m = 0; m < count; m++) {
    const key = keys[Math.floor(random() * keys.length)]!
    const values = grid[key]!
    next = set(next, key, values[Math.floor(random() * values.length)]!)
  }
  const got = measure(next, rate)
  if (got.total < best.total - 1e-4) {
    best = got
    law = next
    console.log('try ' + String(t).padStart(5) + ' ' + show(got))
  }
}
for (let round = 0; round < rounds; round++) {
  let moved = false
  for (const key of keys) {
    for (const value of grid[key]!) {
      if (value === get(law, key)) continue
      const next = set(law, key, value)
      const got = measure(next, rate)
      if (got.total < best.total - 1e-4) {
        best = got
        law = next
        moved = true
        console.log('round ' + round + ' ' + key + ' ' + value + ' ' + show(got))
      }
    }
  }
  if (!moved) break
}
console.log('best, whole frames  ' + show(measure(law, 1)))
console.log('best, as judged     ' + show(measure(law, limits.rate)))
console.log('under handover.' + kind + ' of the stop:')
console.log('"pace": ' + JSON.stringify(law.pace) + ', "turn": ' + JSON.stringify(law.turn) + ', "liftPower": ' + law.liftPower)
