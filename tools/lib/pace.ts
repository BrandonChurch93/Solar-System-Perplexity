import { config } from '../../src/config'
import { captureRate, setCapture, shutterAsked } from '../../src/core/clock'
import type { FilmDirector } from '../../src/director/film'
import type { StopPlan } from '../../src/director/moves'
import { paceLimits } from '../../src/director/pace'
import { MIN_POINTS, curves, ringPlane, sampleWindow, type Kind } from '../smooth/camera'
import { judgeCurve, type CurveResult } from '../smooth/path'

// The plan check of a move: the three curves the harness judges a dive or a rise by (the path part of npm run smooth), read on the film's
// own camera with the judge's own functions, so a test can hold a plan to the limits and the search of a law (tools/law.ts) cannot find a
// set the judge reads otherwise. Nothing is measured in this file. The camera and the curves are tools/smooth/camera.ts (sampleWindow,
// curves: the speed of the picture is that of ground points on a ring round the place, on the plane of the rings where the place lies on
// them), the judging is tools/smooth/path.ts (judgeCurve: a step and a rebound of the speed compare one fixed set of points, the points
// that have ground in every frame they compare, so the curve never steps because the count of its points changed).
// The engine had a measure of its own for this (src/director/pace.ts, paceOf). It took the mean over whatever points had ground in a
// frame and stepped where their count changed, took the globe for the ground of a place on the rings and did not set the capture rate
// the judge sets. It is gone: there is one measure, the judge's.

export type PaceKind = Kind
export type CurveName = 'fall' | 'turn' | 'speed'

export interface Pace { stop: string; kind: PaceKind; rate: number; firstFrame: number; k0: number; curves: Record<CurveName, CurveResult>; ok: boolean; faults: string[] }

// The names and units the harness gives the three curves, and the floor under which a curve stands still in the picture.
const units = (): [CurveName, string, string, number | null][] => {
  const floors = paceLimits().floors
  return [
    ['fall', 'rate', 'log of the height a film frame', null],
    ['turn', 'turn', 'degrees a film frame', floors.turnDeg],
    ['speed', 'speed', 'px a film frame at the place', floors.speedPx],
  ]
}

// The pace of a dive or a rise of the film as it stands, at one capture rate: what the judge reads at that rate, with its faults. A build
// is judged at whole frames and at the rate of the harness (paceLimits().rate), so a plan is held to both. The capture rate is a state of
// the engine's clock that the judge's sampling sets; it is put back as it was found.
export function paceOf(film: FilmDirector, plan: StopPlan, kind: PaceKind, rate = paceLimits().rate): Pace | null {
  const S = config.raw.smooth
  const master = config.formats[config.formatKeys.master]!
  const before = { rate: captureRate(), shutter: shutterAsked() }
  try {
    const w = sampleWindow(config, film, plan, kind, rate, S.reachFrames)
    if (!w) return null
    const c = curves(w, plan, master.width, master.height, S.path.ringPx, 'picture', 8, ringPlane(plan))
    const out = {} as Record<CurveName, CurveResult>
    for (const [key, name, unit, floor] of units()) out[key] = judgeCurve(name, unit, c[key], w.k0, rate, w.own, S.path, floor, key === 'speed' ? { values: c.ring, min: MIN_POINTS } : null)
    const faults = (Object.keys(out) as CurveName[]).flatMap((key) => out[key].faults.map((f) => plan.id + ' ' + kind + ': ' + f.text))
    return { stop: plan.id, kind, rate, firstFrame: w.firstFrame, k0: w.k0, curves: out, ok: faults.length === 0, faults }
  } finally {
    setCapture(before.rate, before.shutter)
  }
}
