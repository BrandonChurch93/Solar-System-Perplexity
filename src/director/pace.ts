import { config } from '../config'

// Plan E, the one pace: the bell, the one rate curve of a dive and of a rise over the whole segment, and its integral, the share of the
// move that is done; and the limits of a smooth move as the harness holds them.
// The plan check of a move (the three curves the harness judges a dive or a rise by) is not here any more: it is tools/lib/pace.ts, on
// the judge's own functions, so a plan is held to the one measure a build is judged by.

// The flanks of the bell as shares of the segment: the rate rises over `rise` from the far end, holds, and falls over `fall` to the near end.
// `corner` is the share of a flank over which its slope comes in and goes out again, so the rate has no kink.
// `corners` is a stop's option: for a flank it names, the slope comes in over the first share (at the flank's foot, the end of the move)
// and goes out over the second (at the plateau), so a flank may be soft at one end and short at the other. A flank it does not name
// keeps `corner` at both ends, and a bell without it is the bell as it was, to the bit.
export type Corners = [number, number]
export interface Flanks { rise: number; fall: number; corner: number; corners?: { rise?: Corners; fall?: Corners } }

export function checkFlanks(f: Flanks, who: string): void {
  if (!(f.rise > 0) || !(f.fall > 0) || !(f.rise + f.fall <= 1 + 1e-12) || !(f.corner > 0 && f.corner <= 0.5)) throw new Error(who + ': the flanks of the pace need rise and fall above 0 adding up to at most 1, and a corner above 0 and at most 0.5')
  for (const side of ['rise', 'fall'] as const) {
    const c = f.corners?.[side]
    if (c && !(c.length === 2 && c[0] > 0 && c[1] > 0 && c[0] + c[1] <= 1 + 1e-12)) throw new Error(who + ': the two corners of the ' + side + ' flank need to be above 0 and add up to at most 1')
  }
}

// The two corners of a flank, foot first.
function cornersOf(f: Flanks, side: 'rise' | 'fall'): Corners {
  return f.corners?.[side] ?? [f.corner, f.corner]
}

// The S curve of a flank with unlike corners: the slope comes in over the share a at the foot and goes out over the share b at the top.
export function flankOf(u: number, a: number, b: number): number {
  if (u <= 0) return 0
  if (u >= 1) return 1
  const s = 1 / (1 - (a + b) / 2)
  if (u <= a) return (s * u * u) / (2 * a)
  if (u <= 1 - b) return s * (u - a / 2)
  return 1 - (s * (1 - u) * (1 - u)) / (2 * b)
}

// Its integral from 0 to u. With like corners it is a half at u = 1; with unlike ones it is what flankWhole says.
export function flankAreaOf(u: number, a: number, b: number): number {
  if (u <= 0) return 0
  if (u >= 1) return flankWhole(a, b)
  const s = 1 / (1 - (a + b) / 2)
  if (u <= a) return (s * u * u * u) / (6 * a)
  const first = (s * a * a) / 6
  if (u <= 1 - b) return first + (s * (u - a) * u) / 2
  const v = 1 - u
  return first + (s * (1 - a - b) * (1 - b)) / 2 + (u - (1 - b)) - (s * (b * b * b - v * v * v)) / (6 * b)
}

export function flankWhole(a: number, b: number): number {
  const s = 1 / (1 - (a + b) / 2)
  return (s * a * a) / 6 + (s * (1 - a - b) * (1 - b)) / 2 + b - (s * b * b) / 6
}

// The S curve of a flank: from 0 to 1 over u from 0 to 1, slope 0 at both ends, the slope a trapeze with corners of share j.
export function flank(u: number, j: number): number {
  if (u <= 0) return 0
  if (u >= 1) return 1
  if (u <= j) return (u * u) / (2 * j * (1 - j))
  if (u <= 1 - j) return (u - j / 2) / (1 - j)
  return 1 - ((1 - u) * (1 - u)) / (2 * j * (1 - j))
}

// The integral of the S curve from 0 to u; a half at u = 1.
export function flankArea(u: number, j: number): number {
  if (u <= 0) return 0
  if (u >= 1) return 0.5
  if (u <= j) return (u * u * u) / (6 * j * (1 - j))
  const first = (j * j) / (6 * (1 - j))
  if (u <= 1 - j) return first + ((u - j) * u) / (2 * (1 - j))
  const v = 1 - u
  return first + (1 - 2 * j) / 2 + (u - (1 - j)) - (j * j * j - v * v * v) / (6 * j * (1 - j))
}

// The height of the plateau over the mean of the move.
export function bellPeak(f: Flanks): number {
  if (!f.corners) return 1 / (1 - (f.rise + f.fall) / 2)
  const r = cornersOf(f, 'rise')
  const n = cornersOf(f, 'fall')
  return 1 / (1 - f.rise * (1 - flankWhole(r[0], r[1])) - f.fall * (1 - flankWhole(n[0], n[1])))
}

// The rate of the move over its mean at the share x of the segment, x from 0 at the far end to 1 at the near end.
export function bellRate(x: number, f: Flanks): number {
  if (x <= 0 || x >= 1) return 0
  const p = bellPeak(f)
  if (f.corners) {
    const r = cornersOf(f, 'rise')
    const n = cornersOf(f, 'fall')
    if (x < f.rise) return p * flankOf(x / f.rise, r[0], r[1])
    if (x > 1 - f.fall) return p * flankOf((1 - x) / f.fall, n[0], n[1])
    return p
  }
  if (x < f.rise) return p * flank(x / f.rise, f.corner)
  if (x > 1 - f.fall) return p * flank((1 - x) / f.fall, f.corner)
  return p
}

// The share of the move that is done at x: the integral of the rate, 0 at the far end, 1 at the near end, with no rate at either.
export function bellShare(x: number, f: Flanks): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const p = bellPeak(f)
  if (f.corners) {
    const r = cornersOf(f, 'rise')
    const n = cornersOf(f, 'fall')
    if (x < f.rise) return p * f.rise * flankAreaOf(x / f.rise, r[0], r[1])
    if (x > 1 - f.fall) return 1 - p * f.fall * flankAreaOf((1 - x) / f.fall, n[0], n[1])
    return p * (f.rise * flankWhole(r[0], r[1]) + x - f.rise)
  }
  if (x < f.rise) return p * f.rise * flankArea(x / f.rise, f.corner)
  if (x > 1 - f.fall) return 1 - p * f.fall * flankArea((1 - x) / f.fall, f.corner)
  return p * (x - f.rise / 2)
}

// The most the rate can change over one film frame, over the mean of the move, for a segment of that many frames: the steepest slope of a
// flank times one frame.
export function bellStep(f: Flanks, frames: number): number {
  if (!f.corners) return bellPeak(f) / ((1 - f.corner) * Math.min(f.rise, f.fall) * frames)
  const r = cornersOf(f, 'rise')
  const n = cornersOf(f, 'fall')
  return (bellPeak(f) * Math.max(1 / ((1 - (r[0] + r[1]) / 2) * f.rise), 1 / ((1 - (n[0] + n[1]) / 2) * f.fall))) / frames
}

export interface PaceLimits { maxStep: number; maxRebound: number; seamFrames: number; ringPx: number; floors: { turnDeg: number; speedPx: number }; rate: number; reachFrames: number }

// The limits of a smooth move. They live once, in the harness's `smooth` block of the config, and are read here and nowhere else in the
// engine.
export function paceLimits(): PaceLimits {
  const s = config.raw.smooth
  const p = s.path
  return { maxStep: p.maxStep, maxRebound: p.maxRebound, seamFrames: p.seamFrames, ringPx: p.ringPx, floors: { turnDeg: p.floors.turnDeg, speedPx: p.floors.speedPx }, rate: s.rate, reachFrames: s.reachFrames }
}
