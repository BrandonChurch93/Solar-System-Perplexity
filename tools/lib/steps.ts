// The steps between two frames of a dive or a rise, as the frames part of the handover report reads them (tools/handover.ts).
//
// One step, two readings.
// On the mean of the body: the blocks the body covers in both frames' own grids, so a globe that grows into a black sky or leaves it is not
// read as a cut.
// In place: on the ground both frames show (tools/img/handover.py, op inPlace). A frame that opens on a darker side of the body, or loses a lit
// one, moves the mean of the body and not the look of any ground; read in place it is new ground and no step. A pair is read in place where
// both frames hold enough of the body and the frame before shows at least `inPlaceShare` of this frame's body.
//
// Both readings are held to the same limits (handover.limits.levelStep, colourStep) and both verdicts are told. Which one is judged:
// `inPlace` false, the mean of the body, to the letter as before, and the step in place is shown beside it. `inPlace` true, the step in
// place, and the mean of the body judges only the pairs that cannot be read in place.

// The reading in place. The pictures are laid over each other at a quarter of their size and a pair is read in place where the frame before
// shows at least half of this frame's body (handover.limits.inPlaceScale and inPlaceShare replace the two numbers where the config names
// them). `judged` says which reading the report judges: true, the step in place (decision d238). Were it false, the mean of the body would
// judge and --in-place would ask for the step in place for one run.
export const IN_PLACE = { scale: 0.25, share: 0.5, judged: true }

export interface StepRow {
  frame: number
  level: number
  colour: number[]
  bodyShare: number
  bodyLevel: number
  bodyColour: number[]
  flatShare: number
  inPlace?: { seen: number; level: number; colour: number[] }
}

export interface StepLimits {
  bodyShare: number
  levelStep: number
  colourStep: number
  flatShare: number
  inPlaceShare: number
  inPlace: boolean
}

export interface Most { frame: number; step: number }

export interface Steps {
  // On the mean of the body, and on the whole frame (never judged).
  level: Most
  colour: Most
  whole: Most
  wholeColour: Most
  flat: { frame: number; share: number }
  // In place: the largest steps over the pairs read in place, the least share a frame before shows, and the pairs that cannot be read in
  // place with their largest steps on the mean of the body.
  inPlace: { judged: boolean; level: Most; colour: Most; least: { frame: number; share: number }; unread: number; unreadLevel: Most; unreadColour: Most }
  // What each reading holds against the steps, judged or not, and the lines of the verdict: those of the judged reading and the flat share.
  fails: { body: string[]; inPlace: string[] }
  why: string[]
}

const round = (v: number, digits: number): number => Number(v.toFixed(digits))
const far = (a: number[], b: number[]): number => Math.max(...a.map((v, k) => Math.abs(v - b[k]!)))

export function frameSteps(rows: StepRow[], L: StepLimits): Steps {
  const judged = L.inPlace
  let level: Most = { frame: -1, step: 0 }
  let colour: Most = { frame: -1, step: 0 }
  let whole: Most = { frame: -1, step: 0 }
  let wholeColour: Most = { frame: -1, step: 0 }
  let flat = { frame: -1, share: 0 }
  let seenLevel: Most = { frame: -1, step: 0 }
  let seenColour: Most = { frame: -1, step: 0 }
  let unreadLevel: Most = { frame: -1, step: 0 }
  let unreadColour: Most = { frame: -1, step: 0 }
  let least = { frame: -1, share: 1 }
  let unread = 0
  rows.forEach((r, i) => {
    if (r.flatShare > flat.share) flat = { frame: r.frame, share: r.flatShare }
    const p = rows[i - 1]
    if (!p) return
    const wl = Math.abs(r.level - p.level)
    const wc = far(r.colour, p.colour)
    if (wl > whole.step) whole = { frame: r.frame, step: wl }
    if (wc > wholeColour.step) wholeColour = { frame: r.frame, step: wc }
    if (Math.min(r.bodyShare, p.bodyShare) < L.bodyShare) return
    const dl = Math.abs(r.bodyLevel - p.bodyLevel)
    const dc = far(r.bodyColour, p.bodyColour)
    if (dl > level.step) level = { frame: r.frame, step: dl }
    if (dc > colour.step) colour = { frame: r.frame, step: dc }
    const n = r.inPlace
    if (n && n.seen < least.share) least = { frame: r.frame, share: n.seen }
    if (!n || n.seen < L.inPlaceShare) {
      unread++
      if (dl > unreadLevel.step) unreadLevel = { frame: r.frame, step: dl }
      if (dc > unreadColour.step) unreadColour = { frame: r.frame, step: dc }
      return
    }
    const sl = Math.abs(n.level)
    const sc = Math.max(...n.colour.map((v) => Math.abs(v)))
    if (sl > seenLevel.step) seenLevel = { frame: r.frame, step: sl }
    if (sc > seenColour.step) seenColour = { frame: r.frame, step: sc }
  })
  const body: string[] = []
  if (level.step > L.levelStep) body.push('the mean level of the body steps by ' + round(level.step, 2) + ' into frame ' + level.frame + ', limit ' + L.levelStep)
  if (colour.step > L.colourStep) body.push('the mean colour of the body steps by ' + round(colour.step, 2) + ' into frame ' + colour.frame + ', limit ' + L.colourStep)
  const place: string[] = []
  const unreadNote = ' (a frame that shares too little ground with the one before to be read in place)'
  if (seenLevel.step > L.levelStep) place.push('the level of the ground two frames both show steps by ' + round(seenLevel.step, 2) + ' into frame ' + seenLevel.frame + ', limit ' + L.levelStep)
  if (seenColour.step > L.colourStep) place.push('the colour of the ground two frames both show steps by ' + round(seenColour.step, 2) + ' into frame ' + seenColour.frame + ', limit ' + L.colourStep)
  if (unreadLevel.step > L.levelStep) place.push('the mean level of the body steps by ' + round(unreadLevel.step, 2) + ' into frame ' + unreadLevel.frame + unreadNote + ', limit ' + L.levelStep)
  if (unreadColour.step > L.colourStep) place.push('the mean colour of the body steps by ' + round(unreadColour.step, 2) + ' into frame ' + unreadColour.frame + unreadNote + ', limit ' + L.colourStep)
  const why = [...(judged ? place : body)]
  if (flat.share > L.flatShare) why.push('frame ' + flat.frame + ' has ' + round(flat.share * 100, 1) + ' percent of the body flat, limit ' + round(L.flatShare * 100, 1))
  return { level, colour, whole, wholeColour, flat, inPlace: { judged, level: seenLevel, colour: seenColour, least, unread, unreadLevel, unreadColour }, fails: { body, inPlace: place }, why }
}
