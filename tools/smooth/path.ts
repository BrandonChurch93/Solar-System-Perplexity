// The numbers of npm run smooth, part (a): three curves along a dive or a rise, judged without a picture.
// A curve holds one value for every capture frame k of the window: what changed from capture frame k - 1 to k, counted per film frame.
// Values are given over the mean of the move: the mean of the curve over the steps whose two ends lie inside the segment.

export interface Span { first: number; end: number }

export interface CurveLimits { maxStep: number; maxRebound: number; seamFrames: number }

export interface Fault { curve: string; rule: 'step' | 'halfStep' | 'climbAfterPeak' | 'fallBeforePeak' | 'mean' | 'seam' | 'halfSeam' | 'lateBrake' | 'brakeGrows' | 'letGo' | 'hump' | 'dip'; k: number; frame: number; value: number; limit: number; first?: number; last?: number; count?: number; points?: number; text: string }

// A curve that is a mean over points (the speed of the picture: ground points on a ring round the place). values[i] holds what every point gave
// at capture frame k0 + i, null where a point has no ground under it. A step and a rebound compare the mean over one fixed set of points, the
// points that have a value in every frame they compare, so the curve never steps because the count of its points changed. A rebound is a
// valley on one such set: the curve falls and climbs again by at least as much, both read on the points that live from its one side to its
// other; it is a fall before the largest value when its lowest frame lies before it and a climb after it otherwise. A step over fewer
// than min points is shown and not judged; points counts those steps.
export interface Members { values: ((number | null)[] | null)[]; min: number }

export interface Mark { k: number; frame: number; value: number; points?: number }

export interface CurveResult {
  name: string
  unit: string
  rate: number
  mean: number
  floor: number | null
  floored: boolean
  over: (number | null)[]
  step: (number | null)[]
  halfStep: (number | null)[]
  peak: Mark | null
  worstStep: Mark | null
  worstHalfStep: Mark | null
  worstBeyond: Mark | null
  seams: { at: 'start' | 'end'; frame: number; step: number | null }[]
  climbAfterPeak: Mark
  fallBeforePeak: Mark
  missing: number
  points: { of: number; min: number; fewest: number; counts: number[]; notMeasured: number; first: number | null; last: number | null } | null
  faults: Fault[]
}

const digits = (v: number, n = 4): number => Number(v.toFixed(n))

// raw[i] belongs to capture frame k0 + i. own is the span of capture frames whose step lies inside the segment: first is the first capture frame
// of the segment plus one, end is one past its last capture frame.
export function judgeCurve(name: string, unit: string, raw: (number | null)[], k0: number, rate: number, own: Span, limits: CurveLimits, floor: number | null = null, members: Members | null = null): CurveResult {
  const at = (k: number): number | null => raw[k - k0] ?? null
  const frameOf = (k: number): number => Math.floor(k / rate)
  let sum = 0
  let count = 0
  let missing = 0
  for (let k = own.first; k < own.end; k++) {
    const v = at(k)
    if (v === null) missing++
    else {
      sum += v
      count++
    }
  }
  const mean = count > 0 ? sum / count : 0
  const floored = floor !== null && Math.abs(mean) < floor
  const scale = floored ? floor! : mean
  const faults: Fault[] = []
  if (!(scale > 0)) faults.push({ curve: name, rule: 'mean', k: own.first, frame: frameOf(own.first), value: digits(mean, 6), limit: 0, text: name + ': the mean of the move is ' + digits(mean, 6) + ' ' + unit + ', it must be above 0' })
  const over = raw.map((v) => (v === null || !(scale > 0) ? null : v / scale))
  const o = (k: number): number | null => over[k - k0] ?? null
  const row = (k: number): (number | null)[] | null => members?.values[k - k0] ?? null
  const live = (k: number): number[] => (row(k) ?? []).flatMap((v, j) => (v === null ? [] : [j]))
  const meanOf = (k: number, set: number[]): number => set.reduce((n, j) => n + row(k)![j]!, 0) / set.length / scale
  const shared: Record<string, number> = {}
  const diff = (k: number, lag: number): number | null => {
    if (!members) {
      const a = o(k)
      const b = o(k - lag)
      return a === null || b === null ? null : Math.abs(a - b)
    }
    if (!(scale > 0) || k - lag < k0) return null
    const there = live(k - lag)
    const set = live(k).filter((j) => there.includes(j))
    shared[k + ':' + lag] = set.length
    return set.length < members.min ? null : Math.abs(meanOf(k, set) - meanOf(k - lag, set))
  }
  const step = raw.map((_, i) => diff(k0 + i, rate))
  const halfStep = raw.map((_, i) => (rate > 1 ? diff(k0 + i, 1) : null))
  const seen = (m: Mark, lag: number): Mark => (members ? { ...m, points: shared[m.k + ':' + lag] } : m)
  const reach = limits.seamFrames * rate
  const judged = (k: number, lag: number): boolean => k - lag >= own.first - 1 - reach && k <= own.end + reach
  let worstStep: CurveResult['worstStep'] = null
  let worstHalfStep: CurveResult['worstHalfStep'] = null
  let worstBeyond: CurveResult['worstBeyond'] = null
  const runs = (rule: 'step' | 'halfStep', values: (number | null)[], lag: number, what: string): void => {
    let open: { first: number; last: number; k: number; value: number; count: number } | null = null
    const close = (): void => {
      if (!open) return
      const span = open.count === 1 ? 'at frame ' + position(open.k, rate) : 'in ' + open.count + ' steps from frame ' + position(open.first, rate) + ' to ' + position(open.last, rate) + ', most at ' + position(open.k, rate)
      faults.push({ curve: name, rule, k: open.k, frame: frameOf(open.k), value: digits(open.value), limit: limits.maxStep, first: open.first, last: open.last, count: open.count, ...(members ? { points: shared[open.k + ':' + lag] } : {}), text: name + ': changes by ' + shown(open.value, 3, limits.maxStep) + ' of the mean ' + (members ? '(over ' + shared[open.k + ':' + lag] + ' points) ' : '') + what + ' ' + span + ', limit ' + limits.maxStep })
      open = null
    }
    values.forEach((s, i) => {
      const k = k0 + i
      if (s === null || !judged(k, lag) || !(s > limits.maxStep)) return close()
      if (!open) open = { first: k, last: k, k, value: s, count: 1 }
      else {
        open.last = k
        open.count++
        if (s > open.value) {
          open.value = s
          open.k = k
        }
      }
    })
    close()
  }
  raw.forEach((_, i) => {
    const k = k0 + i
    const s = step[i]!
    if (s !== null) {
      if (judged(k, rate)) {
        if (!worstStep || s > worstStep.value) worstStep = seen({ k, frame: frameOf(k), value: s }, rate)
      } else if (!worstBeyond || s > worstBeyond.value) worstBeyond = seen({ k, frame: frameOf(k), value: s }, rate)
    }
    const h = halfStep[i]!
    if (h !== null && judged(k, 1) && (!worstHalfStep || h > worstHalfStep.value)) worstHalfStep = seen({ k, frame: frameOf(k), value: h }, 1)
  })
  runs('step', step, rate, 'over one film frame')
  if (rate > 1) runs('halfStep', halfStep, 1, 'from one capture frame to the next')
  let peak: CurveResult['peak'] = null
  for (let k = own.first; k < own.end; k++) {
    const v = o(k)
    if (v !== null && (!peak || v > peak.value)) peak = { k, frame: frameOf(k), value: v }
  }
  if (members && peak) {
    let all = live(own.first)
    for (let k = own.first + 1; k < own.end; k++) {
      const there = live(k)
      all = all.filter((j) => there.includes(j))
    }
    if (all.length >= members.min) {
      let top = -Infinity
      for (let k = own.first; k < own.end; k++) {
        const v = meanOf(k, all)
        if (v > top) {
          top = v
          peak = { k, frame: frameOf(k), value: o(k) ?? v, points: all.length }
        }
      }
    }
  }
  let climb: Mark = { k: -1, frame: -1, value: 0 }
  let fall: Mark = { k: -1, frame: -1, value: 0 }
  if (peak && members) {
    const top = peak.k
    for (let m = own.first; m < own.end; m++) {
      let set = live(m)
      let left = 0
      let low: { k: number; value: number } | null = null
      let size = -1
      for (let n = m + 1; n < own.end; n++) {
        const there = live(n)
        set = set.filter((j) => there.includes(j))
        if (set.length < members.min) break
        if (set.length !== size) {
          size = set.length
          left = meanOf(m, set)
          low = null
          for (let b = m + 1; b < n; b++) {
            const v = meanOf(b, set)
            if (!low || v < low.value) low = { k: b, value: v }
          }
        }
        const right = meanOf(n, set)
        if (low) {
          const depth = Math.min(left, right) - low.value
          if (low.k < top && depth > fall.value) fall = { k: low.k, frame: frameOf(low.k), value: depth, points: set.length }
          if (low.k >= top && depth > climb.value) climb = { k: n, frame: frameOf(n), value: depth, points: set.length }
        }
        if (!low || right < low.value) low = { k: n, value: right }
      }
    }
  } else if (peak) {
    let high = -Infinity
    for (let k = own.first; k < peak.k; k++) {
      const v = o(k)
      if (v === null) continue
      high = Math.max(high, v)
      if (high - v > fall.value) fall = { k, frame: frameOf(k), value: high - v }
    }
    let low = peak.value
    for (let k = peak.k + 1; k < own.end; k++) {
      const v = o(k)
      if (v === null) continue
      low = Math.min(low, v)
      if (v - low > climb.value) climb = { k, frame: frameOf(k), value: v - low }
    }
  }
  if (peak) {
    const by = (m: Mark): string => (m.points === undefined ? '' : ' (over ' + m.points + ' points)')
    if (fall.value > limits.maxRebound) faults.push({ curve: name, rule: 'fallBeforePeak', k: fall.k, frame: fall.frame, value: digits(fall.value), limit: limits.maxRebound, ...(members ? { points: fall.points } : {}), text: name + ': falls by ' + shown(fall.value, 3, limits.maxRebound) + ' of the mean' + by(fall) + ' before its largest value (frame ' + position(peak.k, rate) + '), lowest at frame ' + position(fall.k, rate) + ', limit ' + limits.maxRebound })
    if (climb.value > limits.maxRebound) faults.push({ curve: name, rule: 'climbAfterPeak', k: climb.k, frame: climb.frame, value: digits(climb.value), limit: limits.maxRebound, ...(members ? { points: climb.points } : {}), text: name + ': climbs again by ' + shown(climb.value, 3, limits.maxRebound) + ' of the mean' + by(climb) + ' after its largest value (frame ' + position(peak.k, rate) + '), up to frame ' + position(climb.k, rate) + ', limit ' + limits.maxRebound })
  }
  const seamStep = (from: number, to: number): number | null => {
    let out: number | null = null
    for (let k = from; k <= to; k++) {
      const s = step[k - k0] ?? null
      if (s !== null && (out === null || s > out)) out = s
    }
    return out
  }
  const seams: CurveResult['seams'] = [
    { at: 'start', frame: frameOf(own.first - 1), step: seamStep(own.first - 1, own.first - 1 + rate) },
    { at: 'end', frame: frameOf(own.end), step: seamStep(own.end, own.end + rate) },
  ]
  let points: CurveResult['points'] = null
  if (members) {
    const counts = raw.map((_, i) => live(k0 + i).length)
    const lost: number[] = []
    raw.forEach((_, i) => {
      const k = k0 + i
      if ((i >= rate && judged(k, rate) && step[i] === null) || (rate > 1 && i >= 1 && judged(k, 1) && halfStep[i] === null)) lost.push(k)
    })
    let fewest = Infinity
    for (let k = own.first; k < own.end; k++) fewest = Math.min(fewest, counts[k - k0] ?? 0)
    points = { of: Math.max(0, ...members.values.map((v) => v?.length ?? 0)), min: members.min, fewest: Number.isFinite(fewest) ? fewest : 0, counts, notMeasured: lost.length, first: lost.length ? lost[0]! : null, last: lost.length ? lost[lost.length - 1]! : null }
  }
  return { name, unit, rate, mean, floor, floored, over, step, halfStep, peak, worstStep, worstHalfStep, worstBeyond, seams, climbAfterPeak: climb, fallBeforePeak: fall, missing, points, faults }
}

// The landing of a travel, judged: a curve of the speed of the picture from the start of the landing to the hold it arrives at.
// loss is what the speed loses over one film frame (the value one film frame earlier less the value), hold the mean of the first seamFrames film
// frames of the hold; all over the mean of the landing. Judged:
// seam, halfSeam  the change over one film frame (and between capture frames) from seamFrames film frames before the hold to seamFrames into it
// lateBrake       the largest loss does not lie in the last LANDING_LATE film frames before the hold
// brakeGrows      in those frames no loss is larger than the loss one film frame before it by more than the step limit
// letGo           the loss does not fall to under a third of the loss one film frame earlier while the speed is still over the hold's own
// hump            the speed does not climb again by more than the rebound limit once it has started to fall
// dip             the speed of the last seamFrames film frames is not under the hold's own by more than the step limit
// A loss and a speed over the hold's own count for lateBrake and letGo from LANDING_FLOOR of the mean.
export const LANDING_LATE = 4
export const LANDING_FLOOR = 0.01
// The path alone does not part a good arrival from a bad one by these three (travel_builder, 2026-11-24): the tool shows them and does not judge them.
export const LANDING_SHOWN: Fault['rule'][] = ['lateBrake', 'brakeGrows', 'letGo']

export interface LandingResult {
  name: string
  unit: string
  rate: number
  mean: number
  floor: number | null
  floored: boolean
  over: (number | null)[]
  step: (number | null)[]
  loss: (number | null)[]
  points: null
  hold: number | null
  first: number | null
  seam: Mark | null
  halfSeam: Mark | null
  peakLoss: Mark | null
  growth: Mark | null
  letGo: (Mark & { before: number }) | null
  hump: Mark
  dip: Mark | null
  faults: Fault[]
}

export function judgeLanding(name: string, unit: string, raw: (number | null)[], k0: number, rate: number, own: Span, limits: CurveLimits, floor: number | null = null): LandingResult {
  const frameOf = (k: number): number => Math.floor(k / rate)
  let sum = 0
  let count = 0
  for (let k = own.first; k < own.end; k++) {
    const v = raw[k - k0] ?? null
    if (v !== null) {
      sum += v
      count++
    }
  }
  const mean = count > 0 ? sum / count : 0
  const floored = floor !== null && Math.abs(mean) < floor
  const scale = floored ? floor! : mean
  const faults: Fault[] = []
  const say = (rule: Fault['rule'], m: Mark, limit: number, text: string): void => {
    faults.push({ curve: name, rule, k: m.k, frame: m.frame, value: digits(m.value), limit, text: name + ': ' + text })
  }
  if (!(scale > 0)) faults.push({ curve: name, rule: 'mean', k: own.first, frame: frameOf(own.first), value: digits(mean, 6), limit: 0, text: name + ': the mean of the landing is ' + digits(mean, 6) + ' ' + unit + ', it must be above 0' })
  const over = raw.map((v) => (v === null || !(scale > 0) ? null : v / scale))
  const o = (k: number): number | null => over[k - k0] ?? null
  const lossAt = (k: number, lag = rate): number | null => {
    const a = k - lag >= k0 ? o(k - lag) : null
    const b = o(k)
    return a === null || b === null ? null : a - b
  }
  const loss = raw.map((_, i) => lossAt(k0 + i))
  const step = loss.map((v) => (v === null ? null : Math.abs(v)))
  const reach = limits.seamFrames * rate
  let held = 0
  let holds = 0
  for (let k = own.end + 1; k <= own.end + reach; k++) {
    const v = o(k)
    if (v !== null) {
      held += v
      holds++
    }
  }
  const hold = holds > 0 ? held / holds : null
  const most = (from: number, to: number, value: (k: number) => number | null): Mark | null => {
    let out: Mark | null = null
    for (let k = from; k <= to; k++) {
      const v = value(k)
      if (v !== null && (!out || v > out.value)) out = { k, frame: frameOf(k), value: v }
    }
    return out
  }
  const seam = most(own.end - reach + 1, own.end + reach, (k) => step[k - k0] ?? null)
  const halfSeam = rate > 1 ? most(own.end - reach + 1, own.end + reach, (k) => { const v = lossAt(k, 1); return v === null ? null : Math.abs(v) }) : null
  if (seam && seam.value > limits.maxStep) say('seam', seam, limits.maxStep, 'changes by ' + shown(seam.value, 3, limits.maxStep) + ' of the mean over one film frame at the seam into the hold, at frame ' + position(seam.k, rate) + ', limit ' + limits.maxStep)
  if (halfSeam && halfSeam.value > limits.maxStep) say('halfSeam', halfSeam, limits.maxStep, 'changes by ' + shown(halfSeam.value, 3, limits.maxStep) + ' of the mean from one capture frame to the next at the seam into the hold, at frame ' + position(halfSeam.k, rate) + ', limit ' + limits.maxStep)
  const late = own.end - LANDING_LATE * rate
  const peakLoss = most(own.first + rate, own.end, (k) => loss[k - k0] ?? null)
  if (peakLoss && peakLoss.value > LANDING_FLOOR && peakLoss.k > late) say('lateBrake', peakLoss, 0, 'loses most over one film frame (' + peakLoss.value.toFixed(3) + ' of the mean) at frame ' + position(peakLoss.k, rate) + ', inside the last ' + LANDING_LATE + ' film frames before the hold: the brake grows into the hold')
  const growth = most(late + 1, own.end, (k) => {
    const a = loss[k - k0] ?? null
    const b = k - rate >= k0 ? loss[k - rate - k0] ?? null : null
    return a === null || b === null ? null : a - b
  })
  if (growth && growth.value > limits.maxStep) say('brakeGrows', growth, limits.maxStep, 'the loss over one film frame grows by ' + shown(growth.value, 3, limits.maxStep) + ' of the mean against the film frame before, at frame ' + position(growth.k, rate) + ' in the last ' + LANDING_LATE + ' film frames before the hold, limit ' + limits.maxStep)
  let letGo: LandingResult['letGo'] = null
  if (hold !== null) {
    for (let k = own.first + 2 * rate; k <= own.end; k++) {
      const now = loss[k - k0] ?? null
      const before = loss[k - rate - k0] ?? null
      const speed = o(k - rate)
      if (now === null || before === null || speed === null || !(before > LANDING_FLOOR) || !(speed - hold > LANDING_FLOOR) || !(now < before / 3)) continue
      if (!letGo || before - now > letGo.before - letGo.value) letGo = { k, frame: frameOf(k), value: now, before }
    }
  }
  if (letGo) say('letGo', letGo, 0, 'lets go: the loss over one film frame falls from ' + letGo.before.toFixed(3) + ' to ' + letGo.value.toFixed(3) + ' of the mean at frame ' + position(letGo.k, rate) + ', to under a third, while the speed is still over the hold\'s own (' + (hold ?? 0).toFixed(3) + ')')
  let hump: Mark = { k: -1, frame: -1, value: 0 }
  let high = -Infinity
  let low: number | null = null
  for (let k = own.first; k < own.end; k++) {
    const v = o(k)
    if (v === null) continue
    if (low !== null) {
      low = Math.min(low, v)
      if (v - low > hump.value) hump = { k, frame: frameOf(k), value: v - low }
    } else if (v < high) low = v
    high = Math.max(high, v)
  }
  if (hump.value > limits.maxRebound) say('hump', hump, limits.maxRebound, 'climbs again by ' + shown(hump.value, 3, limits.maxRebound) + ' of the mean after it has started to fall, up to frame ' + position(hump.k, rate) + ', limit ' + limits.maxRebound)
  let dip: Mark | null = null
  if (hold !== null) {
    const under = most(own.end - reach + 1, own.end, (k) => { const v = o(k); return v === null ? null : hold - v })
    dip = under
    if (under && under.value > limits.maxStep) say('dip', under, limits.maxStep, 'dips under the hold\'s own speed (' + hold.toFixed(3) + ') by ' + shown(under.value, 3, limits.maxStep) + ' of the mean at frame ' + position(under.k, rate) + ', limit ' + limits.maxStep)
  }
  return { name, unit, rate, mean, floor, floored, over, step, loss, points: null, hold, first: o(own.first), seam, halfSeam, peakLoss, growth, letGo, hump, dip, faults }
}

// A value as it is printed: with more digits where the usual ones would print it as its limit.
export function shown(v: number, digits: number, limit: number | null = null): string {
  let n = digits
  let s = v.toFixed(n)
  while (limit !== null && v !== limit && Number(s) === limit && n < digits + 6) s = v.toFixed(++n)
  return s
}

// The longest run of rows without a value (the first of the longest ones), as indices; null where every row has one.
export function longestGap(has: boolean[]): { first: number; last: number } | null {
  let out: { first: number; last: number } | null = null
  let first = -1
  has.forEach((h, i) => {
    if (h) {
      first = -1
      return
    }
    if (first < 0) first = i
    if (!out || i - first > out.last - out.first) out = { first, last: i }
  })
  return out
}

export function position(k: number, rate: number): string {
  const whole = Math.floor(k / rate)
  const part = k - whole * rate
  return part === 0 ? String(whole) : whole + ' + ' + part + '/' + rate
}

export interface Row { frame: number; values: Record<string, { over: number | null; step: number | null; fine: number | null; points?: number }> }

// One row for every film frame of the window: the value and the step of the whole frame analysis, and the largest step over one film frame that
// the capture rate analysis finds among the capture frames of that film frame.
export function table(whole: Pick<CurveResult, 'name' | 'over' | 'step' | 'points'>[], fine: Pick<CurveResult, 'step'>[] | null, firstFrame: number, frames: number, k0: number, rate: number): Row[] {
  const rows: Row[] = []
  for (let i = 0; i < frames; i++) {
    const values: Row['values'] = {}
    whole.forEach((c, j) => {
      let most: number | null = null
      const f = fine?.[j]
      if (f) {
        for (let k = (firstFrame + i) * rate; k < (firstFrame + i + 1) * rate; k++) {
          const s = f.step[k - k0] ?? null
          if (s !== null && (most === null || s > most)) most = s
        }
      }
      values[c.name] = { over: c.over[i] ?? null, step: c.step[i] ?? null, fine: most, ...(c.points ? { points: c.points.counts[i] ?? 0 } : {}) }
    })
    rows.push({ frame: firstFrame + i, values })
  }
  return rows
}
