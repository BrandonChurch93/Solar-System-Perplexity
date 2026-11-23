import type { Segment } from '../../src/config'
import { handoverFrame, handoverOf } from '../../src/director/handover'
import { coverTiming, coverWindow } from '../../src/director/timeline'

export interface Cue { segment: string; what: string; frame: number; seconds: number; sound: string }

export function sound(s: Segment): string {
  const plasma = s.stop === 'sun' ? ' Plasma: a low roar with crackle, loudest here.' : ''
  if (s.kind === 'hold') return 'Music lands on the first frame and carries the hold.' + (s.stop === 'sun' ? ' Plasma: a low roar, further off.' : '')
  if (s.kind === 'dive' && handoverOf(s.stop, 'dive')) return 'The rush of the dive: a rising rush of air from the first frame that peaks at the handover.'
  if (s.kind === 'rise' && handoverOf(s.stop, 'rise')) return 'A shorter rush that peaks at the handover and opens out after it.'
  if (s.kind === 'dive') return 'The rush of the dive: a rising rush of air from the first frame that peaks at the cover center.'
  if (s.kind === 'terrain') return (s.index === 0 ? 'The film opens here at full level, with no fade in. ' : '') + 'The hush: music drops to a quiet bed on the first frame, under a soft air tone.' + plasma
  if (s.kind === 'rise') return 'A shorter rush that peaks at the cover center and opens out after it.'
  if (s.kind === 'travel') return 'Music builds from the first frame toward the next hold.' + (s.id === 'mars.travel' ? ' A few rocks pass close to the lens: one low pass for each.' : '')
  if (s.kind === 'retreat') return 'Music begins to fall away.'
  if (s.kind === 'lookback') return 'Music lands for the last time and thins to one held tone.'
  return 'All sound fades with the picture. The last frame is silent.'
}

export function cuesOf(segs: Segment[]): Cue[] {
  const out: Cue[] = []
  for (const s of segs) {
    out.push({ segment: s.id, what: 'start of ' + s.kind, frame: s.firstFrame, seconds: s.start, sound: sound(s) })
    const w = coverWindow(s)
    if (w) {
      const center = coverTiming(s)!.center
      out.push({ segment: s.id, what: 'center of the cover', frame: w.centerFrame, seconds: center, sound: 'The peak of the rush. The cover runs from frame ' + w.firstFrame + ' to ' + w.lastFrame + ' and the view changes under it.' })
    }
    const h = s.kind === 'dive' || s.kind === 'rise' ? handoverOf(s.stop, s.kind) : null
    if (h) out.push({ segment: s.id, what: 'the handover', frame: handoverFrame(h), seconds: h.time, sound: 'The peak of the rush. The view changes ' + (h.firstFrame === h.lastFrame ? 'in frame ' + h.firstFrame : 'from frame ' + h.firstFrame + ' to ' + h.lastFrame) + ' with no cover: the place stays in view.' })
  }
  return out
}

export function swapOf(seg: Segment): { move: string; seen: 'cover' | 'handover' } {
  const h = seg.kind === 'dive' || seg.kind === 'rise' ? handoverOf(seg.stop, seg.kind) : null
  if (!h) {
    const w = coverWindow(seg)!
    return { move: 'Cover from frame ' + w.firstFrame + ' to ' + w.lastFrame, seen: 'cover' }
  }
  return { move: 'Handover ' + (h.firstFrame === h.lastFrame ? 'in frame ' + h.firstFrame : 'from frame ' + h.firstFrame + ' to ' + h.lastFrame) + ', no cover', seen: 'handover' }
}
