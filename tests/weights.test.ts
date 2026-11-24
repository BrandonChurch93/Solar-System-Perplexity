import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { config, type Segment } from '../src/config'
import { applyProbe, parseProbe, probeString } from '../src/diagnostics/probe'
import { FilmDirector } from '../src/director/film'
import { eyeHeightAt, eyeHeights, type Handover, type HandoverSide, handoverOf, placeWeight, type SkyShares, skyWeight } from '../src/director/handover'
import { StopPlan } from '../src/director/moves'
import { plans } from '../src/director/plans'
import { COVERED, coveredFit, coveredParams, coveredPlan, filmWith, restorePlans } from './lib/covered'

// The engine's own two weights of a dive and a rise (the share of the close view's sky on the globe side, the weight of the place picture)
// read the height of the eye and never the clock. The clock's laws, as they stood, are written out here: the two ends of each span must
// still be theirs.
// A stop may take its sky into its own hands, give it another span or none, and draw no place picture, at any time: plan F wants the film
// without a place picture, and it may come to leave no sky to the engine either. So no test here asks the film for a span of any kind.
// Every law is tried on each span of the film it speaks of, which may be none, and on spans made in memory, which are always there.
const fps = config.fps
const smooth = (t: number): number => {
  const x = Math.min(Math.max(t, 0), 1)
  return x * x * (3 - 2 * x)
}
const mid = (frame: number): number => (frame + config.shutterFraction / 2) / fps
const clockSky = (seg: Segment, h: Handover, time: number): number => {
  if (seg.kind === 'dive') {
    const full = h.firstFrame / fps
    return time >= full ? 1 : h.skyFrames > 0 ? smooth((time - full) / (h.skyFrames / fps) + 1) : 0
  }
  const full = (h.lastFrame + 1) / fps
  return time < full ? 1 : h.skyFrames > 0 ? smooth(1 - (time - full) / (h.skyFrames / fps)) : 0
}
const clockPlace = (seg: Segment, h: Handover, time: number): number => {
  const from = h.placeFirstFrame / fps
  const to = (h.placeLastFrame + 1) / fps
  if (time < from || time >= to) return 0
  if (seg.kind === 'dive') return time >= h.firstFrame / fps ? 1 : smooth((time - from) / (h.firstFrame / fps - from))
  const full = (h.lastFrame + 1) / fps
  return time < full ? 1 : smooth((to - time) / (to - full))
}
interface Span { plan: StopPlan; kind: 'dive' | 'rise'; seg: Segment; h: Handover; full: number; farSky: number; farPlace: number; own: boolean }
// The span of a plan's dive or rise as the handover in force gives it, or null where the plan has no such move or does not hand over.
const spanOf = (plan: StopPlan, kind: 'dive' | 'rise'): Span | null => {
  const seg = plan.seg[kind]
  const h = seg && plan.handsOver ? handoverOf(plan.id, kind) : null
  if (!seg || !h) return null
  const full = kind === 'dive' ? h.firstFrame / fps : (h.lastFrame + 1) / fps
  const farSky = kind === 'dive' ? Math.max(full - h.skyFrames / fps, seg.start) : Math.min(full + h.skyFrames / fps, seg.end)
  return { plan, kind, seg, h, full, farSky, farPlace: kind === 'dive' ? h.placeFirstFrame / fps : (h.placeLastFrame + 1) / fps, own: plan.skyShare(seg, (seg.start + seg.end) / 2) !== null }
}
const spans: Span[] = []
for (const plan of plans) {
  for (const kind of ['dive', 'rise'] as const) {
    const s = spanOf(plan, kind)
    if (s) spans.push(s)
  }
}
const high = (s: Span, time: number): number => s.plan.eyeShot(s.kind, time, 'orbit').pose.position.length() - 1
const beforeT = (s: Span, time: number): boolean => (s.kind === 'dive' ? time < s.full : time >= s.full)
const framesOf = (s: Span): number[] => {
  const out: number[] = []
  for (let f = s.seg.firstFrame; f < s.seg.endFrame; f++) out.push(f)
  return out
}
// A sky span that the segment ends inside: its far end is the end of the segment.
const cutShort = (s: Span): boolean => Math.abs(s.farSky - s.full) * fps < s.h.skyFrames - 1e-6
// A plan made in memory has its handover in force in the place of a stop's own. The film is asked with every stop's own in force again.
let made = false
const theFilm = (): FilmDirector => {
  if (made) restorePlans()
  made = false
  return new FilmDirector(plans)
}
// The spans the laws are tried on whatever the film holds. Each is made in memory and is no span of the film: the plan the tests keep
// for themselves (lib/covered.ts: the engine's own class on a fit and parameters that no stop can change) with a handover written here,
// in force from here to the next span made or the next theFilm(). So a span made here is used before the next is made.
const both = ['dive', 'rise'] as const
type Kind = (typeof both)[number]
const madeSpan = (plan: StopPlan, kind: Kind, what: string, holds: (s: Span) => boolean): Span => {
  made = true
  const s = spanOf(plan, kind)
  if (!s || !holds(s)) throw new Error('the ' + kind + ' made in memory is not ' + what)
  return s
}
const sideOf = (kind: Kind, side: HandoverSide): { handover: { dive?: HandoverSide; rise?: HandoverSide } } => ({ handover: kind === 'dive' ? { dive: side } : { rise: side } })
const placeFrames = (s: Span): number => (s.kind === 'dive' ? s.h.firstFrame - s.h.placeFirstFrame : s.h.placeLastFrame - s.h.lastFrame)
// Both weights left to the engine: the sky over 24 frames and the picture over 12 on the far side of T (the numbers the made up heights
// of the dive are written for).
const whole = (kind: Kind): Span =>
  madeSpan(coveredPlan(sideOf(kind, { skyFrames: 24, placeFrames: 12, picture: true })), kind, 'a span that leaves a sky over 24 frames and a picture over 12 on the far side of T to the engine', (s) => !s.own && s.h.picture && s.h.skyFrames === 24 && placeFrames(s) === 12 && !cutShort(s))
const tried = (): Span => whole('dive')
// The same with a sky span as long as the whole segment, so that the segment ends inside it.
const cut = (kind: Kind): Span => {
  const seg = config.segments.find((x) => x.stop === COVERED && x.kind === kind)!
  return madeSpan(coveredPlan(sideOf(kind, { skyFrames: seg.endFrame - seg.firstFrame, placeFrames: 12, picture: true })), kind, 'a span of the sky that its segment cuts short', (s) => !s.own && s.h.picture && cutShort(s))
}
// No span of the sky, and no picture.
const noSky = (kind: Kind): Span => madeSpan(coveredPlan(sideOf(kind, { skyFrames: 0, placeFrames: 12, picture: true })), kind, 'without a span of the sky', (s) => !s.own && !(s.h.skyFrames > 0))
const noPicture = (kind: Kind): Span => madeSpan(coveredPlan(sideOf(kind, { skyFrames: 24, placeFrames: 12, picture: false })), kind, 'without a picture', (s) => !s.own && !s.h.picture)
// A plan that gives a share of its own, as a stop may: the share of its segment that has run, so that no two frames have one number.
class OwnSky extends StopPlan {
  override skyShare(seg: Segment, time: number): SkyShares | null {
    return { low: (time - seg.start) / (seg.end - seg.start) }
  }
}
const owner = (kind: Kind): Span => madeSpan(new OwnSky(COVERED, coveredFit, { ...coveredParams(), ...sideOf(kind, { skyFrames: 24, placeFrames: 12, picture: false }) }), kind, 'a span with a share of its own', (s) => s.own && !s.h.picture)

describe('the weights of a dive and a rise by the height of the eye', () => {
  afterEach(() => {
    applyProbe(null)
    theFilm()
  })
  afterAll(() => applyProbe(null))

  it('are both the engine\'s wherever a span draws a place picture: in the film, where none is as it should be, and in memory', () => {
    const law = (s: Span): void => {
      expect(s.h.picture).toBe(true)
      expect(s.own).toBe(false)
      expect(s.h.skyFrames).toBeGreaterThan(0)
    }
    for (const s of spans) if (s.h.picture) law(s)
    for (const make of [whole, cut]) for (const kind of both) law(make(kind))
  })

  it('give the sky what the clock gave at both ends of its span, and between them a smooth step of the logarithm of the height', () => {
    const law = (s: Span): void => {
      expect(skyWeight(s.seg, s.farSky)).toBe(clockSky(s.seg, s.h, s.farSky))
      expect(skyWeight(s.seg, s.full)).toBeCloseTo(1, 12)
      const far = Math.log(high(s, s.farSky))
      const near = Math.log(high(s, s.full))
      expect(near).toBeLessThan(far)
      const base = clockSky(s.seg, s.h, s.farSky) > 0 ? (s.kind === 'dive' ? (s.farSky - s.full) / (s.h.skyFrames / fps) + 1 : 1 - (s.farSky - s.full) / (s.h.skyFrames / fps)) : 0
      let last = s.kind === 'dive' ? 0 : 1
      for (const f of framesOf(s)) {
        for (const o of [0, 0.25, 0.5]) {
          const time = (f + o) / fps
          const w = skyWeight(s.seg, time)
          if (!beforeT(s, time)) expect(w).toBe(1)
          else {
            expect(w).toBeCloseTo(smooth(base + ((1 - base) * (far - Math.log(high(s, time)))) / (far - near)), 12)
            // outside the span the weight is the clock's: nothing of the close view's sky
            if (s.kind === 'dive' ? time < s.farSky : time > s.farSky) expect(w).toBe(0)
          }
          // the eye of every span here goes one way, and so does the weight
          if (s.kind === 'dive') expect(w).toBeGreaterThanOrEqual(last)
          else expect(w).toBeLessThanOrEqual(last)
          last = w
        }
      }
    }
    theFilm()
    for (const s of spans) if (!s.own && s.h.skyFrames > 0) law(s)
    for (const make of [whole, cut]) {
      for (const kind of both) {
        const s = make(kind)
        filmWith(s.plan)
        law(s)
      }
    }
  })

  it('begin a span that its segment cuts short at the weight the clock had there', () => {
    const law = (s: Span): void => {
      const end = s.kind === 'dive' ? s.seg.start : s.seg.end
      expect(s.farSky).toBe(end)
      const w = skyWeight(s.seg, end)
      expect(w).toBe(clockSky(s.seg, s.h, end))
      // a part of the close view's sky, not none of it and not all
      expect(w).toBeGreaterThan(0)
      expect(w).toBeLessThan(1)
    }
    theFilm()
    for (const s of spans) if (!s.own && s.h.skyFrames > 0 && cutShort(s)) law(s)
    for (const kind of both) {
      const s = cut(kind)
      filmWith(s.plan)
      law(s)
    }
  })

  it('give the place picture nothing at the far end of its window, all of it at T, and a smooth step of the logarithm of the height between', () => {
    const law = (s: Span): void => {
      const far = Math.log(high(s, s.farPlace))
      const near = Math.log(high(s, s.full))
      expect(near).toBeLessThan(far)
      expect(placeWeight(s.seg, s.farPlace)).toBe(0)
      expect(clockPlace(s.seg, s.h, s.kind === 'dive' ? s.farPlace : s.farPlace - 1e-9)).toBeLessThan(1e-6)
      for (const f of framesOf(s)) {
        for (const o of [0, 0.25, 0.5]) {
          const time = (f + o) / fps
          const w = placeWeight(s.seg, time)
          const inT = time >= s.h.firstFrame / fps && time < (s.h.lastFrame + 1) / fps
          if (inT) expect(w).toBe(1)
          else if (!beforeT(s, time)) expect(w).toBe(0)
          else {
            expect(w).toBeCloseTo(smooth((far - Math.log(high(s, time))) / (far - near)), 12)
            if (s.kind === 'dive' ? time <= s.farPlace : time >= s.farPlace) expect(w).toBe(0)
            // where the clock had the picture, the height has it, and nowhere else
            expect(w > 0).toBe(clockPlace(s.seg, s.h, time) > 0)
          }
        }
      }
    }
    theFilm()
    for (const s of spans) if (s.h.picture) law(s)
    for (const kind of both) {
      const s = whole(kind)
      filmWith(s.plan)
      law(s)
    }
  })

  it('are one number for one height: an eye that comes back up takes the weight back', () => {
    const s = tried()
    expect(s.h.picture).toBe(true)
    // heights by the frames left to T: down, up again to where it was, and down to T
    const table: Record<number, number> = { 24: 0.5, 12: 0.08, 10: 0.05, 8: 0.03, 6: 0.05, 4: 0.03, 2: 0.025, 0: 0.02 }
    const left = (time: number): number => Math.round((s.full - time) * fps)
    eyeHeights((_stop, _kind, time) => table[left(time)]!)
    const at = (k: number): number => s.full - k / fps
    for (const weight of [skyWeight, placeWeight]) {
      const farAt = weight === skyWeight ? 24 : 12
      const w = (k: number): number => weight(s.seg, at(k))
      expect(w(6)).toBe(w(10))
      expect(w(4)).toBe(w(8))
      expect(w(8)).toBeGreaterThan(w(10))
      expect(w(2)).toBeGreaterThan(w(4))
      // the far end of the span has what the clock had there: nothing, to the rounding of the span's own length
      expect(w(farAt)).toBeLessThan(1e-20)
      expect(w(10)).toBeCloseTo(smooth((Math.log(table[farAt]!) - Math.log(0.05)) / (Math.log(table[farAt]!) - Math.log(0.02))), 12)
    }
    // an eye at the ground has all of the close view's sky
    eyeHeights((_stop, _kind, time) => (left(time) === 5 ? 0 : table[left(time)] ?? 0.04))
    expect(skyWeight(s.seg, at(5))).toBe(1)
  })

  it('ask an eye for the two ends of a span once and for the height of the sample every time, unless the caller gives it', () => {
    const s = tried()
    const eyeFrom = (base: number, asked: number[]) => (_stop: string, _kind: 'dive' | 'rise', time: number): number => {
      asked.push(time)
      return base + (s.full - time) * 0.1
    }
    const asked: number[] = []
    const eye = eyeFrom(0.02, asked)
    eyeHeights(eye)
    const far = s.full - s.h.skyFrames / fps
    const times = [3, 7, 11].map((k) => s.full - (k + 0.5) / fps)
    const first = times.map((t) => skyWeight(s.seg, t))
    expect(asked).toEqual([far, s.full, ...times])
    asked.length = 0
    expect(times.map((t) => skyWeight(s.seg, t))).toEqual(first)
    expect(asked).toEqual(times)
    // the caller that has the height of the sample gives it: the same number, and the eye is not asked again
    const given = times.map((t) => eyeHeightAt(s.seg, t)!)
    expect(given).toEqual(times.map((t) => 0.02 + (s.full - t) * 0.1))
    asked.length = 0
    expect(times.map((t, i) => skyWeight(s.seg, t, given[i]))).toEqual(first)
    expect(asked).toEqual([])
    // the picture has its own far end and the same near end, asked once as well
    const from = s.h.placeFirstFrame / fps
    const picture = times.map((t, i) => placeWeight(s.seg, t, given[i]))
    expect(asked).toEqual([from, s.full])
    expect(picture.map((w) => w > 0)).toEqual(times.map((t) => t >= from))
    // another eye is asked for its own ends, and the first keeps the ones it gave
    const other: number[] = []
    eyeHeights(eyeFrom(0.03, other))
    expect(skyWeight(s.seg, times[0]!)).not.toBe(first[0])
    expect(other).toEqual([far, s.full, times[0]])
    asked.length = 0
    eyeHeights(eye)
    expect(skyWeight(s.seg, times[0]!)).toBe(first[0])
    expect(asked).toEqual([times[0]])
    // the film asks once for both weights of a sample, and its shot holds what the weights give when asked alone
    const law = (film: FilmDirector, sp: Span): void => {
      for (const f of framesOf(sp)) {
        if (!beforeT(sp, mid(f))) continue
        const shot = film.shotAt(f, mid(f), 'orbit')
        expect(shot.skyShare).toBe(skyWeight(sp.seg, mid(f)))
        const weight = placeWeight(sp.seg, mid(f))
        if (weight > 0) expect(shot.place?.weight).toBe(weight)
        else expect(shot.place === undefined || shot.place.weight === 0).toBe(true)
      }
    }
    const film = theFilm()
    for (const sp of spans) if (!sp.own) law(film, sp)
    for (const make of [whole, cut]) {
      for (const kind of both) {
        const sp = make(kind)
        law(filmWith(sp.plan), sp)
      }
    }
  })

  it('do not ask for a height where the stop has no span, no picture or a share of its own', () => {
    const never = (): number => {
      throw new Error('asked for a height')
    }
    const skyByTheClock = (s: Span): void => {
      for (const f of framesOf(s)) expect(skyWeight(s.seg, mid(f))).toBe(clockSky(s.seg, s.h, mid(f)))
    }
    const nothingOfAPicture = (s: Span): void => {
      for (const f of framesOf(s)) expect(placeWeight(s.seg, mid(f))).toBe(0)
    }
    // where the engine has a span, the eye is asked: the eye that refuses is heard
    const heard = (s: Span): void => {
      expect(() => skyWeight(s.seg, (s.full + s.farSky) / 2)).toThrow(/asked for a height/)
      if (s.h.picture) expect(() => placeWeight(s.seg, (s.full + s.farPlace) / 2)).toThrow(/asked for a height/)
    }
    // a stop with a share of its own is drawn with it, and with nothing of the engine's
    const drawnWithItsOwn = (film: FilmDirector, s: Span): void => {
      for (const f of framesOf(s)) {
        const shot = film.shotAt(f, mid(f), 'orbit')
        expect(shot.skyShare).toBe(s.plan.skyShare(s.seg, mid(f))!.low)
        if (!s.h.picture) expect(shot.place === undefined || shot.place.weight === 0).toBe(true)
      }
    }
    eyeHeights(never)
    for (const s of spans) if (!(s.h.skyFrames > 0)) skyByTheClock(s)
    for (const s of spans) if (!s.h.picture) nothingOfAPicture(s)
    for (const s of spans) if (!s.own && s.h.skyFrames > 0) heard(s)
    const film = theFilm()
    for (const s of spans) if (s.own) drawnWithItsOwn(film, s)
    for (const kind of both) {
      eyeHeights(never)
      skyByTheClock(noSky(kind))
      nothingOfAPicture(noPicture(kind))
      heard(whole(kind))
      const s = owner(kind)
      drawnWithItsOwn(filmWith(s.plan), s)
    }
  })

  it('refuse a span without a film to ask and one over which the eye does not come down', () => {
    const s = tried()
    const inside = (s.full + s.farPlace) / 2
    eyeHeights(null)
    expect(() => skyWeight(s.seg, inside)).toThrow(/no film has said how to ask/)
    expect(() => placeWeight(s.seg, inside)).toThrow(/no film has said how to ask/)
    eyeHeights(() => 0.05)
    expect(() => skyWeight(s.seg, inside)).toThrow(/lower at T than where the span begins/)
    eyeHeights((_stop, _kind, time) => (time >= s.full ? -0.001 : 0.05))
    expect(() => placeWeight(s.seg, inside)).toThrow(/over the body/)
    // a film that flies the plan of the span says how to ask again
    filmWith(s.plan)
    expect(skyWeight(s.seg, inside)).toBeGreaterThan(0)
    expect(skyWeight(s.seg, inside)).toBeLessThan(1)
  })

  it('leave the globe side without the close view\'s sky when the harness asks (nosky)', () => {
    expect(parseProbe('beauty').noSky).toBe(undefined)
    expect(parseProbe('beauty/nosky').noSky).toBe(true)
    for (const text of ['beauty/nosky', 'beauty/side=orbit/nosky', 'beauty/noplace/nosky']) expect(probeString(parseProbe(text))).toBe(text)
    for (const bad of ['beauty/nosky=on', 'beauty/nosky=1', 'beauty/nosky=']) expect(() => parseProbe(bad)).toThrow()
    const law = (film: FilmDirector, s: Span): void => {
      const frames = framesOf(s)
      const shares = (): (number | undefined)[] => frames.map((f) => film.shotAt(f, mid(f), 'orbit').skyShare)
      const highs = (): (number | undefined)[] => frames.map((f) => film.shotAt(f, mid(f), 'orbit').skyShareHigh)
      const plain = shares()
      const plainHigh = highs()
      expect(plain.some((x) => x !== undefined && x > 0)).toBe(true)
      applyProbe(parseProbe('beauty/nosky'))
      for (const x of shares()) expect(x).toBe(0)
      for (const x of highs()) expect(x).toBe(undefined)
      applyProbe(null)
      expect(shares()).toEqual(plain)
      expect(highs()).toEqual(plainHigh)
    }
    const film = theFilm()
    for (const s of spans) law(film, s)
    // in memory: a span that leaves its sky to the engine and one with a share of its own
    for (const make of [whole, owner]) {
      for (const kind of both) {
        const s = make(kind)
        law(filmWith(s.plan), s)
      }
    }
  })
})
