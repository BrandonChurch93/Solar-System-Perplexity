import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { config, type Segment } from '../src/config'
import { applyProbe, parseProbe, probeString } from '../src/diagnostics/probe'
import { FilmDirector } from '../src/director/film'
import { eyeHeightAt, eyeHeights, type Handover, handoverOf, placeWeight, skyWeight } from '../src/director/handover'
import type { StopPlan } from '../src/director/moves'
import { plans } from '../src/director/plans'

// The engine's own two weights of a dive and a rise (the share of the close view's sky on the globe side, the weight of the place picture)
// read the height of the eye and never the clock. The clock's laws, as they stood, are written out here: the two ends of each span must
// still be theirs.
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
const spans: Span[] = []
for (const plan of plans) {
  for (const kind of ['dive', 'rise'] as const) {
    const seg = plan.seg[kind]
    const h = seg && plan.handsOver ? handoverOf(plan.id, kind) : null
    if (!seg || !h) continue
    const full = kind === 'dive' ? h.firstFrame / fps : (h.lastFrame + 1) / fps
    const farSky = kind === 'dive' ? Math.max(full - h.skyFrames / fps, seg.start) : Math.min(full + h.skyFrames / fps, seg.end)
    spans.push({ plan, kind, seg, h, full, farSky, farPlace: kind === 'dive' ? h.placeFirstFrame / fps : (h.placeLastFrame + 1) / fps, own: plan.skyShare(seg, (seg.start + seg.end) / 2) !== null })
  }
}
const high = (s: Span, time: number): number => s.plan.eyeShot(s.kind, time, 'orbit').pose.position.length() - 1
const beforeT = (s: Span, time: number): boolean => (s.kind === 'dive' ? time < s.full : time >= s.full)
const theFilm = (): FilmDirector => new FilmDirector(plans)
// The span the laws are tried on with eyes made up here: a dive that leaves both weights to the engine, with the sky over 24 frames and
// the picture over 12 before T (the numbers the made up heights are written for). It is picked by what it has, never by its name: a
// stop may take its sky or its picture into its own hands at any time, as Venus did.
const tried = (): Span => {
  const s = spans.find((x) => x.kind === 'dive' && !x.own && x.h.picture && x.h.skyFrames === 24 && x.h.firstFrame - x.h.placeFirstFrame === 12)
  if (!s) throw new Error('no dive of the film leaves a sky over 24 frames and a picture over 12 to the engine any more: these tests need a span made in memory')
  return s
}

describe('the weights of a dive and a rise by the height of the eye', () => {
  afterEach(() => {
    applyProbe(null)
    theFilm()
  })
  afterAll(() => applyProbe(null))

  it('cover every stop of the film that leaves its sky or its picture to the engine', () => {
    const sky = spans.filter((s) => !s.own && s.h.skyFrames > 0).map((s) => s.seg.id)
    const picture = spans.filter((s) => s.h.picture).map((s) => s.seg.id)
    expect(sky.length).toBeGreaterThan(0)
    expect(picture.length).toBeGreaterThan(0)
    for (const id of picture) expect(sky).toContain(id)
  })

  it('give the sky what the clock gave at both ends of its span, and between them a smooth step of the logarithm of the height', () => {
    theFilm()
    for (const s of spans) {
      if (s.own || !(s.h.skyFrames > 0)) continue
      expect(skyWeight(s.seg, s.farSky)).toBe(clockSky(s.seg, s.h, s.farSky))
      expect(skyWeight(s.seg, s.full)).toBeCloseTo(1, 12)
      const far = Math.log(high(s, s.farSky))
      const near = Math.log(high(s, s.full))
      expect(near).toBeLessThan(far)
      const base = clockSky(s.seg, s.h, s.farSky) > 0 ? (s.kind === 'dive' ? (s.farSky - s.full) / (s.h.skyFrames / fps) + 1 : 1 - (s.farSky - s.full) / (s.h.skyFrames / fps)) : 0
      let last = s.kind === 'dive' ? 0 : 1
      for (let f = s.seg.firstFrame; f < s.seg.endFrame; f++) {
        for (const o of [0, 0.25, 0.5]) {
          const time = (f + o) / fps
          const w = skyWeight(s.seg, time)
          if (!beforeT(s, time)) expect(w).toBe(1)
          else {
            expect(w).toBeCloseTo(smooth(base + ((1 - base) * (far - Math.log(high(s, time)))) / (far - near)), 12)
            // outside the span the weight is the clock's: nothing of the close view's sky
            if (s.kind === 'dive' ? time < s.farSky : time > s.farSky) expect(w).toBe(0)
          }
          // the eye of every stop of the film goes one way, and so does the weight
          if (s.kind === 'dive') expect(w).toBeGreaterThanOrEqual(last)
          else expect(w).toBeLessThanOrEqual(last)
          last = w
        }
      }
    }
  })

  it('begin a span that its segment cuts short at the weight the clock had there', () => {
    theFilm()
    const cut = spans.filter((s) => !s.own && s.h.skyFrames > 0 && Math.abs(s.farSky - s.full) * fps < s.h.skyFrames - 1e-6)
    expect(cut.map((s) => s.seg.id)).toEqual(['earth.dive', 'earth.rise'])
    for (const s of cut) {
      const end = s.kind === 'dive' ? s.seg.start : s.seg.end
      expect(s.farSky).toBe(end)
      const w = skyWeight(s.seg, end)
      expect(w).toBe(clockSky(s.seg, s.h, end))
      expect(w).toBeGreaterThan(0.1)
      expect(w).toBeLessThan(0.5)
    }
  })

  it('give the place picture nothing at the far end of its window, all of it at T, and a smooth step of the logarithm of the height between', () => {
    theFilm()
    for (const s of spans) {
      if (!s.h.picture) continue
      const far = Math.log(high(s, s.farPlace))
      const near = Math.log(high(s, s.full))
      expect(near).toBeLessThan(far)
      expect(placeWeight(s.seg, s.farPlace)).toBe(0)
      expect(clockPlace(s.seg, s.h, s.kind === 'dive' ? s.farPlace : s.farPlace - 1e-9)).toBeLessThan(1e-6)
      for (let f = s.seg.firstFrame; f < s.seg.endFrame; f++) {
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
    const made = (base: number, asked: number[]) => (_stop: string, _kind: 'dive' | 'rise', time: number): number => {
      asked.push(time)
      return base + (s.full - time) * 0.1
    }
    const asked: number[] = []
    const eye = made(0.02, asked)
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
    eyeHeights(made(0.03, other))
    expect(skyWeight(s.seg, times[0]!)).not.toBe(first[0])
    expect(other).toEqual([far, s.full, times[0]])
    asked.length = 0
    eyeHeights(eye)
    expect(skyWeight(s.seg, times[0]!)).toBe(first[0])
    expect(asked).toEqual([times[0]])
    // the film asks once for both weights of a sample, and its shot holds what the weights give when asked alone
    const film = theFilm()
    for (const sp of spans) {
      if (sp.own) continue
      for (let f = sp.seg.firstFrame; f < sp.seg.endFrame; f++) {
        if (!beforeT(sp, mid(f))) continue
        const shot = film.shotAt(f, mid(f), 'orbit')
        expect(shot.skyShare).toBe(skyWeight(sp.seg, mid(f)))
        const weight = placeWeight(sp.seg, mid(f))
        if (weight > 0) expect(shot.place?.weight).toBe(weight)
        else expect(shot.place === undefined || shot.place.weight === 0).toBe(true)
      }
    }
  })

  it('do not ask for a height where the stop has no span, no picture or a share of its own', () => {
    eyeHeights(() => {
      throw new Error('asked for a height')
    })
    const noSpan = spans.filter((s) => !(s.h.skyFrames > 0))
    expect(noSpan.length).toBeGreaterThan(0)
    for (const s of noSpan) for (let f = s.seg.firstFrame; f < s.seg.endFrame; f++) expect(skyWeight(s.seg, mid(f))).toBe(clockSky(s.seg, s.h, mid(f)))
    const noPicture = spans.filter((s) => !s.h.picture)
    expect(noPicture.length).toBeGreaterThan(0)
    for (const s of noPicture) for (let f = s.seg.firstFrame; f < s.seg.endFrame; f++) expect(placeWeight(s.seg, mid(f))).toBe(0)
    const asked = spans.find((s) => !s.own && s.h.skyFrames > 0)!
    expect(() => skyWeight(asked.seg, (asked.full + asked.farSky) / 2)).toThrow(/asked for a height/)
    // a stop with a share of its own is drawn with it, and with nothing of the engine's
    const film = theFilm()
    const owners = spans.filter((s) => s.own)
    expect(owners.length).toBeGreaterThan(0)
    for (const s of owners) for (let f = s.seg.firstFrame; f < s.seg.endFrame; f++) expect(film.shotAt(f, mid(f), 'orbit').skyShare).toBe(s.plan.skyShare(s.seg, mid(f))!.low)
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
    theFilm()
    expect(skyWeight(s.seg, inside)).toBeGreaterThan(0)
    expect(skyWeight(s.seg, inside)).toBeLessThan(1)
  })

  it('leave the globe side without the close view\'s sky when the harness asks (nosky)', () => {
    expect(parseProbe('beauty').noSky).toBe(undefined)
    expect(parseProbe('beauty/nosky').noSky).toBe(true)
    for (const text of ['beauty/nosky', 'beauty/side=orbit/nosky', 'beauty/noplace/nosky']) expect(probeString(parseProbe(text))).toBe(text)
    for (const bad of ['beauty/nosky=on', 'beauty/nosky=1', 'beauty/nosky=']) expect(() => parseProbe(bad)).toThrow()
    const film = theFilm()
    for (const s of spans) {
      const frames: number[] = []
      for (let f = s.seg.firstFrame; f < s.seg.endFrame; f++) frames.push(f)
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
  })
})
