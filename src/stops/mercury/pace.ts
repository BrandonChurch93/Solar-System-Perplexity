export type Knot = [number, number]

export interface Track { from: number; step: number; value: Float64Array; slope: Float64Array }

export function curve(knots: Knot[], endSlope = 0): (t: number) => number {
  const n = knots.length
  const d: number[] = []
  for (let i = 0; i < n - 1; i++) d.push((knots[i + 1]![1] - knots[i]![1]) / (knots[i + 1]![0] - knots[i]![0]))
  const m: number[] = knots.map((_, i) => (i === 0 || i === n - 1 || d[i - 1]! * d[i]! <= 0 ? 0 : (d[i - 1]! + d[i]!) / 2))
  m[n - 1] = endSlope
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0
      m[i + 1] = 0
      continue
    }
    const a = m[i]! / d[i]!
    const b = m[i + 1]! / d[i]!
    const s = a * a + b * b
    if (s > 9) {
      const k = 3 / Math.sqrt(s)
      m[i] = k * a * d[i]!
      m[i + 1] = k * b * d[i]!
    }
  }
  return (t) => {
    if (t <= knots[0]![0]) return knots[0]![1]
    if (t >= knots[n - 1]![0]) return knots[n - 1]![1]
    let i = 0
    while (t > knots[i + 1]![0]) i++
    const h = knots[i + 1]![0] - knots[i]![0]
    const x = (t - knots[i]![0]) / h
    const x2 = x * x
    const x3 = x2 * x
    return (2 * x3 - 3 * x2 + 1) * knots[i]![1] + (x3 - 2 * x2 + x) * h * m[i]! + (3 * x2 - 2 * x3) * knots[i + 1]![1] + (x3 - x2) * h * m[i + 1]!
  }
}

export function sampled(f: (x: number) => number, from: number, to: number, step: number): (x: number) => number {
  const n = Math.round((to - from) / step)
  const v = new Float64Array(n + 1)
  for (let i = 0; i <= n; i++) v[i] = f(from + i * step)
  return (x) => {
    const u = Math.min(Math.max((x - from) / step, 0), n)
    const i = Math.min(Math.floor(u), n - 1)
    return v[i]! + (v[i + 1]! - v[i]!) * (u - i)
  }
}

export function integrate(rate: (t: number, w: number) => number, from: number, start: number, to: number, step: number): Track {
  const n = Math.round((to - from) / step)
  const value = new Float64Array(n + 1)
  const slope = new Float64Array(n + 1)
  let w = start
  for (let i = 0; i <= n; i++) {
    const t = from + i * step
    const k1 = rate(t, w)
    value[i] = w
    slope[i] = k1
    const k2 = rate(t + step / 2, w + (step / 2) * k1)
    const k3 = rate(t + step / 2, w + (step / 2) * k2)
    const k4 = rate(t + step, w + step * k3)
    w += (step / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
  }
  return { from, step, value, slope }
}

export function hermite(x: number, a: number, sa: number, b: number, sb: number, h: number): number {
  const x2 = x * x
  const x3 = x2 * x
  return (2 * x3 - 3 * x2 + 1) * a + (x3 - 2 * x2 + x) * h * sa + (3 * x2 - 2 * x3) * b + (x3 - x2) * h * sb
}

export function read(track: Track, t: number): number {
  const n = track.value.length - 1
  const u = Math.min(Math.max((t - track.from) / track.step, 0), n)
  const i = Math.min(Math.floor(u), n - 1)
  return hermite(u - i, track.value[i]!, track.slope[i]!, track.value[i + 1]!, track.slope[i + 1]!, track.step)
}

export function last(track: Track): { t: number; value: number; slope: number } {
  const n = track.value.length - 1
  return { t: track.from + n * track.step, value: track.value[n]!, slope: track.slope[n]! }
}

export function solve(f: (x: number) => number, low: number, high: number, rounds = 48): number {
  let a = low
  let b = high
  for (let i = 0; i < rounds; i++) {
    const mid = (a + b) / 2
    if (f(mid) < 0) a = mid
    else b = mid
  }
  return (a + b) / 2
}
