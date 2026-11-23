// The numbers of npm run smooth, part (a): three curves along a dive or a rise, judged without a picture.
// A curve holds one value for every capture frame k of the window: what changed from capture frame k - 1 to k, counted per film frame.
// Values are given over the mean of the move: the mean of the curve over the steps whose two ends lie inside the segment.

export interface Span { first: number; end: number }

export interface CurveLimits { maxStep: number; maxRebound: number; seamFrames: number }

export interface Fault { curve: string; rule: 'step' | 'halfStep' | 'climbAfterPeak' | 'fallBeforePeak' | 'mean'; k: number; frame: number; value: number; limit: number; first?: number; last?: number; count?: number; text: string }

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
  peak: { k: number; frame: number; value: number } | null
  worstStep: { k: number; frame: number; value: number } | null
  worstHalfStep: { k: number; frame: number; value: number } | null
  worstBeyond: { k: number; frame: number; value: number } | null
  seams: { at: 'start' | 'end'; frame: number; step: number | null }[]
  climbAfterPeak: { k: number; frame: number; value: number }
  fallBeforePeak: { k: number; frame: number; value: number }
  missing: number
  faults: Fault[]
}

const digits = (v: number, n = 4): number => Number(v.toFixed(n))

// raw[i] belongs to capture frame k0 + i. own is the span of capture frames whose step lies inside the segment: first is the first capture frame
// of the segment plus one, end is one past its last capture frame.
export function judgeCurve(name: string, unit: string, raw: (number | null)[], k0: number, rate: number, own: Span, limits: CurveLimits, floor: number | null = null): CurveResult {
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
  const diff = (k: number, lag: number): number | null => {
    const a = o(k)
    const b = o(k - lag)
    return a === null || b === null ? null : Math.abs(a - b)
  }
  const step = raw.map((_, i) => diff(k0 + i, rate))
  const halfStep = raw.map((_, i) => (rate > 1 ? diff(k0 + i, 1) : null))
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
      faults.push({ curve: name, rule, k: open.k, frame: frameOf(open.k), value: digits(open.value), limit: limits.maxStep, first: open.first, last: open.last, count: open.count, text: name + ': changes by ' + digits(open.value, 3) + ' of the mean ' + what + ' ' + span + ', limit ' + limits.maxStep })
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
        if (!worstStep || s > worstStep.value) worstStep = { k, frame: frameOf(k), value: s }
      } else if (!worstBeyond || s > worstBeyond.value) worstBeyond = { k, frame: frameOf(k), value: s }
    }
    const h = halfStep[i]!
    if (h !== null && judged(k, 1) && (!worstHalfStep || h > worstHalfStep.value)) worstHalfStep = { k, frame: frameOf(k), value: h }
  })
  runs('step', step, rate, 'over one film frame')
  if (rate > 1) runs('halfStep', halfStep, 1, 'from one capture frame to the next')
  let peak: CurveResult['peak'] = null
  for (let k = own.first; k < own.end; k++) {
    const v = o(k)
    if (v !== null && (!peak || v > peak.value)) peak = { k, frame: frameOf(k), value: v }
  }
  let climb = { k: -1, frame: -1, value: 0 }
  let fall = { k: -1, frame: -1, value: 0 }
  if (peak) {
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
    if (fall.value > limits.maxRebound) faults.push({ curve: name, rule: 'fallBeforePeak', k: fall.k, frame: fall.frame, value: digits(fall.value), limit: limits.maxRebound, text: name + ': falls by ' + digits(fall.value, 3) + ' of the mean before its largest value (frame ' + position(peak.k, rate) + '), lowest at frame ' + position(fall.k, rate) + ', limit ' + limits.maxRebound })
    if (climb.value > limits.maxRebound) faults.push({ curve: name, rule: 'climbAfterPeak', k: climb.k, frame: climb.frame, value: digits(climb.value), limit: limits.maxRebound, text: name + ': climbs again by ' + digits(climb.value, 3) + ' of the mean after its largest value (frame ' + position(peak.k, rate) + '), up to frame ' + position(climb.k, rate) + ', limit ' + limits.maxRebound })
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
  return { name, unit, rate, mean, floor, floored, over, step, halfStep, peak, worstStep, worstHalfStep, worstBeyond, seams, climbAfterPeak: climb, fallBeforePeak: fall, missing, faults }
}

export function position(k: number, rate: number): string {
  const whole = Math.floor(k / rate)
  const part = k - whole * rate
  return part === 0 ? String(whole) : whole + ' + ' + part + '/' + rate
}

export interface Row { frame: number; values: Record<string, { over: number | null; step: number | null; fine: number | null }> }

// One row for every film frame of the window: the value and the step of the whole frame analysis, and the largest step over one film frame that
// the capture rate analysis finds among the capture frames of that film frame.
export function table(whole: CurveResult[], fine: CurveResult[] | null, firstFrame: number, frames: number, k0: number, rate: number): Row[] {
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
      values[c.name] = { over: c.over[i] ?? null, step: c.step[i] ?? null, fine: most }
    })
    rows.push({ frame: firstFrame + i, values })
  }
  return rows
}
