// The rate rule of E3 as tools/handover.ts 404 to 424 measures it, from the film's own camera at whole frames.
import { loadConfig } from '../../../../tools/lib/common'
import { FilmDirector } from '../../../../src/director/film'
import { plans } from '../../../../src/director/plans'
import { handoverFrame, handoverOf } from '../../../../src/director/handover'
import { sampleWindow, type Kind } from '../../../../tools/smooth/camera'
import { plan } from '../../../../src/stops/saturn/plan'

const cfg = loadConfig()
const S = cfg.raw.smooth
const L = cfg.raw.handover.limits
export const maxRate: number = cfg.raw.handover.maxRateOverMean
export const earlyLimit: number = L.earlyRateOverMean
const film = new FilmDirector(plans)

export function e3(kind: Kind): { fastest: number; at: number; early: number; fifth: number; back: number; heights: number[]; frameT: number; over: number[] } {
  const w = sampleWindow(cfg, film, plan, kind, 1, S.reachFrames)!
  const hh = handoverOf('saturn', kind)!
  const frameT = handoverFrame(hh)
  const seg = w.seg
  const rows = [] as { frame: number; height: number; rate: number | null }[]
  for (let f = seg.firstFrame; f < seg.endFrame; f++) {
    const s = w.samples[f - w.k0]!
    const height = Number(s.height.toExponential(4))
    const prev = rows[rows.length - 1]
    rows.push({ frame: f, height, rate: prev ? Number(Math.log(prev.height / height).toFixed(5)) : null })
  }
  const dive = kind === 'dive'
  const iT = frameT - seg.firstFrame
  const part = dive ? rows.slice(0, iT + 1) : rows.slice(iT)
  const steps = part.length - 1
  const mean = Math.abs(Math.log(part[0]!.height / part[steps]!.height)) / Math.max(steps, 1)
  const sign = dive ? 1 : -1
  const rates = rows.map((r) => (r.rate === null ? null : r.rate * sign))
  let worst = { frame: -1, over: 0 }
  rates.forEach((r, i) => { if (r !== null && r / mean > worst.over) worst = { frame: rows[i]!.frame, over: r / mean } })
  const fifth = dive ? seg.firstFrame + Math.ceil(steps * L.earlyShare) : seg.endFrame - 1 - Math.ceil(steps * L.earlyShare)
  const early = (rates[fifth - seg.firstFrame] ?? 0) / mean
  const back = rates.filter((r, i) => r !== null && (dive ? rows[i]!.frame <= frameT : rows[i]!.frame > frameT) && r < -L.backRate * mean).length
  return { fastest: worst.over, at: worst.frame, early, fifth, back, heights: [rows[0]!.height, rows[iT]!.height, rows[rows.length - 1]!.height], frameT, over: rates.map((r) => (r === null ? NaN : r / mean)) }
}
