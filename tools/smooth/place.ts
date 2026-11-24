import { frameSteps, type Most, type StepRow } from '../lib/steps'

export interface PlaceFrame { k: number; level: number; colour: number[]; bodyShare: number; bodyLevel: number; bodyColour: number[]; flatShare: number; inPlace: { seen: number; level: number; colour: number[] } | null }
export interface PlacePair { bodyLevelStep: number | null; bodyColourStep: number | null; seen: number | null; placeLevelStep: number | null; placeColourStep: number | null }
export interface PlaceLimits { bodyShare: number; levelStep: number; colourStep: number; inPlaceShare: number }
export interface PlaceReadings {
  pairs: PlacePair[]
  body: { level: Most; colour: Most }
  inPlace: { level: Most; colour: Most; least: { frame: number; share: number }; read: number; unread: number; unreadLevel: Most; unreadColour: Most }
  fails: { body: string[]; inPlace: string[] }
}

// The two readings of the step between two frames of the place part, pair by pair, and what each would rule (tools/lib/steps.ts, frameSteps:
// the ruling of the handover report). On the mean of the body, as the place part judges; in place, on the ground both frames show
// (tools/img/handover.py, op inPlace), where the frame before shows at least inPlaceShare of this frame's body. frame in the reply is k.
export function placeReadings(frames: PlaceFrame[], L: PlaceLimits): PlaceReadings {
  const pairs: PlacePair[] = frames.map((f, i) => {
    const p = frames[i - 1]
    const seen = p !== undefined && Math.min(f.bodyShare, p.bodyShare) >= L.bodyShare
    const n = seen ? f.inPlace : null
    const read = n !== null && n.seen >= L.inPlaceShare
    return {
      bodyLevelStep: seen ? Math.abs(f.bodyLevel - p.bodyLevel) : null,
      bodyColourStep: seen ? Math.max(...f.bodyColour.map((v, j) => Math.abs(v - p.bodyColour[j]!))) : null,
      seen: n ? n.seen : null,
      placeLevelStep: read ? Math.abs(n.level) : null,
      placeColourStep: read ? Math.max(...n.colour.map((v) => Math.abs(v))) : null,
    }
  })
  const rows: StepRow[] = frames.map((f) => ({ frame: f.k, level: f.level, colour: f.colour, bodyShare: f.bodyShare, bodyLevel: f.bodyLevel, bodyColour: f.bodyColour, flatShare: f.flatShare, ...(f.inPlace ? { inPlace: f.inPlace } : {}) }))
  const s = frameSteps(rows, { bodyShare: L.bodyShare, levelStep: L.levelStep, colourStep: L.colourStep, flatShare: 1, inPlaceShare: L.inPlaceShare, inPlace: false })
  const { level, colour, least, unread, unreadLevel, unreadColour } = s.inPlace
  return { pairs, body: { level: s.level, colour: s.colour }, inPlace: { level, colour, least, read: pairs.filter((p) => p.placeLevelStep !== null).length, unread, unreadLevel, unreadColour }, fails: s.fails }
}

export interface PairRuling { body: boolean; inPlace: boolean; differs: boolean }

// One pair held to the limits of the mean of the body, and to limits scaled by `scale` in place (a pair that cannot be read in place is held
// to them on the mean of the body, as frameSteps does when the step in place is judged). true is over a limit. null: the pair is not read.
export function pairRuling(p: PlacePair, L: { levelStep: number; colourStep: number }, scale: number): PairRuling | null {
  if (p.bodyLevelStep === null || p.bodyColourStep === null) return null
  const body = p.bodyLevelStep > L.levelStep || p.bodyColourStep > L.colourStep
  const level = p.placeLevelStep ?? p.bodyLevelStep
  const colour = p.placeColourStep ?? p.bodyColourStep
  const inPlace = level > L.levelStep * scale || colour > L.colourStep * scale
  return { body, inPlace, differs: body !== inPlace }
}
