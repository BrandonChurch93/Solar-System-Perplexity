import * as THREE from 'three'
import { afterAll, describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { spanMid } from '../src/core/clock'
import { framePlan, frameWay, rawMotion, sharpCount, wayMatrix, type FramePlan } from '../src/core/motion'
import { samplesFor, shutterOffset } from '../src/core/sampler'
import type { SetState, Shot } from '../src/core/types'
import { GRAD_GLSL, gradUniform, gradUniforms, setSamples, setWay, wayCloseUniform, wayOpenUniform, wayUniform } from '../src/diagnostics/diag'
import { FilmDirector } from '../src/director/film'
import { handoverOf } from '../src/director/handover'
import { plans } from '../src/director/plans'

// The footprint of a lookup by the way of its own point (gradAt of src/diagnostics/diag.ts, frameWay and wayMatrix of src/core/motion.ts):
// the numbers. The shader itself is drawn and read back in tests/way-gl.test.ts.
const LONG = 240000
const RAD = Math.PI / 180
const FLOOR = 0.5
const film = new FilmDirector(plans)
const numbers = config.raw.handover as unknown as { sharpCover: Record<string, number> }
const kept = numbers.sharpCover
const master = config.formats[config.formatKeys.master]!
const half = master.height / 2
const aspect = master.width / master.height
const at = (frame: number, offset: number, side?: 'orbit' | 'terrain'): Shot => film.shotAt(frame, (frame + offset) / config.fps, side)
const segment = (stop: string, kind: string): { firstFrame: number; endFrame: number } => config.segments.find((s) => s.stop === stop && s.kind === kind)!

afterAll(() => {
  numbers.sharpCover = kept
  setSamples(1, FLOOR)
  setWay(null)
})

// The footprint the engine sets from a count (setSamples), and the one the law gives a point that moves by way px across the open shutter.
const footprint = (count: number, soft = 0): number => {
  setSamples(count, FLOOR, soft)
  return gradUniform.value
}
const lawAt = (way: number, samples: number, cover: number, soft = 0): number => footprint(sharpCount({ samples, seen: way }, cover), soft)

// Where a lens sees a point of the surface of a set, in px of the master from the middle of the frame: the measure of rawMotion, written
// out again so that the matrices are held against it and not against themselves.
const turnedOf = (state: SetState): THREE.Quaternion => (state.turn ? state.rotation.clone().multiply(state.turn) : state.rotation.clone())
function seenAt(shot: Shot, state: SetState, local: THREE.Vector3): THREE.Vector2 | null {
  const v = local.clone().applyQuaternion(turnedOf(state)).add(state.origin).sub(shot.camera.position).applyQuaternion(shot.camera.quaternion.clone().invert())
  if (v.z > -1e-9) return null
  const k = half / Math.tan((shot.camera.vfov * RAD) / 2) / -v.z
  return new THREE.Vector2(v.x * k, v.y * k)
}
// The same point in the view space of a sample: what a fragment of it carries as vView.
const viewOf = (shot: Shot, state: SetState, local: THREE.Vector3): THREE.Vector3 => local.clone().applyQuaternion(turnedOf(state)).add(state.origin).sub(shot.camera.position).applyQuaternion(shot.camera.quaternion.clone().invert())
// A matrix on a point, in doubles and as the shader has it: every number and every step rounded to 32 bits.
function through(m: ArrayLike<number>, v: THREE.Vector3, single: boolean): THREE.Vector2 | null {
  const r = single ? Math.fround : (x: number): number => x
  const p = [r(v.x), r(v.y), r(v.z)]
  const row = (i: number): number => r(r(r(r(r(m[i]!) * p[0]!) + r(r(m[i + 4]!) * p[1]!)) + r(r(m[i + 8]!) * p[2]!)) + r(m[i + 12]!))
  const w = row(3)
  return w > 1e-9 ? new THREE.Vector2(r(row(0) / w), r(row(1) / w)) : null
}
// The points of the surface the grid of the motion measure meets (config.motion.probeGrid), in the set's frame without its turn.
function gridPoints(mid: Shot): { x: number; y: number; local: THREE.Vector3 }[] {
  const s = mid.sets[0]!
  const [cols, rows] = config.motion.probeGrid
  const tan = Math.tan((mid.camera.vfov * RAD) / 2)
  const inverse = s.rotation.clone().invert()
  const unturn = s.turn ? s.turn.clone().invert() : null
  const eye = mid.camera.position.clone().sub(s.origin).applyQuaternion(inverse)
  const height = eye.y + (s.ground ?? 0)
  const out: { x: number; y: number; local: THREE.Vector3 }[] = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ray = new THREE.Vector3(((x / (cols - 1)) * 2 - 1) * tan * aspect, ((y / (rows - 1)) * 2 - 1) * tan, -1).normalize().applyQuaternion(mid.camera.quaternion).applyQuaternion(inverse)
      if (s.view !== 'orbit') {
        if (height > 0 && ray.y < -1e-9) out.push({ x, y, local: eye.clone().addScaledVector(ray, height / -ray.y) })
        continue
      }
      const along = -eye.dot(ray)
      const disc = along * along - eye.lengthSq() + 1
      if (!(disc > 0) || !(along - Math.sqrt(disc) > 0)) continue
      const p = eye.clone().addScaledVector(ray, along - Math.sqrt(disc))
      out.push({ x, y, local: unturn ? p.applyQuaternion(unturn) : p })
    }
  }
  return out
}
const samplesOf = (plan: FramePlan): ReturnType<typeof samplesFor> => samplesFor(plan.samples, plan.shutter, plan.ends ?? 0)

describe('the matrices of the way (wayMatrix)', () => {
  it('put a point where the lens of a shot that stands still sees it, at every share', () => {
    const shot = at(2156, spanMid())
    const state = shot.sets[0]!
    for (const share of [1, 0.25]) {
      const m = wayMatrix(shot, state, shot, state, share).elements
      for (const p of gridPoints(shot)) {
        const seen = seenAt(shot, state, p.local)!
        const got = through(m, viewOf(shot, state, p.local), false)!
        expect(got.x).toBeCloseTo(seen.x * share, 8)
        expect(got.y).toBeCloseTo(seen.y * share, 8)
      }
    }
  })
  it('take a point behind the lens of the end out', () => {
    const shot = at(2156, spanMid())
    const state = shot.sets[0]!
    const m = wayMatrix(shot, state, shot, state).elements
    expect(through(m, new THREE.Vector3(0.1, 0.2, 1), false)).toBeNull()
    expect(through(m, new THREE.Vector3(0.1, 0.2, -1), false)).not.toBeNull()
  })
  it('are the measure of the motion, point for point, on the globe side and on the close side of every named dive and rise', () => {
    let points = 0
    let worst = 0
    let single = 0
    for (const [stop, cover] of Object.entries(kept)) {
      if (!(cover > 0)) continue
      for (const kind of ['dive', 'rise'] as const) {
        const seg = segment(stop, kind)
        const h = handoverOf(stop, kind)!
        const frames = new Set([seg.firstFrame, seg.firstFrame + 27, Math.floor((seg.firstFrame + seg.endFrame) / 2), seg.endFrame - 19, seg.endFrame - 1, h.firstFrame, h.lastFrame])
        for (const f of frames) {
          const plan = framePlan(film, f, 'review')
          expect(plan.cover, stop + ' ' + f).toBe(cover)
          for (const side of plan.split ? (['orbit', 'terrain'] as const) : [undefined]) {
            const mid = at(f, spanMid(), side)
            const open = at(f, shutterOffset(0, plan.shutter), side)
            const close = at(f, shutterOffset(1, plan.shutter), side)
            const way = frameWay(film, f, plan, mid)!
            const grid = gridPoints(mid)
            expect(grid.length, stop + ' ' + f).toBeGreaterThan(0)
            // The written out measure is the engine's own: the px of each grid point as rawMotion reports it.
            const told = new Map<string, number>()
            rawMotion(open, mid, close, (x, y, px) => told.set(x + ' ' + y, px))
            for (const s of samplesOf(plan)) {
              const shot = at(f, s.timeOffset, side)
              const state = shot.sets[0]!
              const m = way(shot)!
              expect(m.cover).toBe(cover)
              for (const p of grid) {
                const a = seenAt(open, open.sets[0]!, p.local)
                const b = seenAt(close, close.sets[0]!, p.local)
                if (!a || !b) continue
                expect(a.distanceTo(b)).toBeCloseTo(told.get(p.x + ' ' + p.y)!, 6)
                const v = viewOf(shot, state, p.local)
                const ga = through(m.open, v, false)!
                const gb = through(m.close, v, false)!
                worst = Math.max(worst, ga.distanceTo(a), gb.distanceTo(b))
                const fa = through(m.open, v, true)
                const fb = through(m.close, v, true)
                if (fa && fb) single = Math.max(single, Math.abs(fa.distanceTo(fb) - a.distanceTo(b)))
                points++
              }
            }
          }
        }
      }
    }
    expect(points).toBeGreaterThan(10000)
    // In doubles the matrices are the measure; with every step rounded to 32 bits, as the shader takes them, the way of a point is off
    // by less than a hundredth of a pixel.
    expect(worst).toBeLessThan(1e-6)
    console.log('way: ' + points + ' points, doubles off by ' + worst.toExponential(2) + ' px at most, 32 bits by ' + single.toExponential(2) + ' px')
    expect(single).toBeLessThan(0.01)
  }, LONG)
})

describe('the way of a frame (frameWay)', () => {
  it('is there in every frame of the dive and the rise of a named stop at more than one sample, and nowhere else', () => {
    let on = 0
    let off = 0
    for (const s of config.segments) {
      const named = (kept[s.stop] ?? 0) > 0 && (s.kind === 'dive' || s.kind === 'rise')
      for (const f of [s.firstFrame, Math.floor((s.firstFrame + s.endFrame) / 2), s.endFrame - 1]) {
        for (const tier of ['draft', 'review', 'final']) {
          const plan = framePlan(film, f, tier)
          const mid = at(f, spanMid())
          const way = frameWay(film, f, plan, mid)
          if (named && plan.samples > 1) {
            expect(way, s.id + ' ' + tier).not.toBeNull()
            expect(way!(mid), s.id + ' ' + tier).not.toBeNull()
            on++
          } else {
            expect(way, s.id + ' ' + tier).toBeNull()
            off++
          }
        }
      }
    }
    expect(on).toBeGreaterThan(0)
    expect(off).toBeGreaterThan(on)
  }, LONG)
  it('follows the stop that is named, and with no stop named no frame has one', () => {
    const mars = segment('mars', 'dive')
    const earth = segment('earth', 'dive')
    const f = (s: { firstFrame: number; endFrame: number }): number => Math.floor((s.firstFrame + s.endFrame) / 2)
    const has = (frame: number): boolean => frameWay(film, frame, framePlan(film, frame, 'review'), at(frame, spanMid())) !== null
    numbers.sharpCover = { mars: 2 }
    expect(has(f(mars))).toBe(true)
    expect(has(f(earth))).toBe(false)
    numbers.sharpCover = {}
    expect(has(f(mars))).toBe(false)
    expect(has(f(earth))).toBe(false)
    numbers.sharpCover = kept
    expect(has(f(earth))).toBe((kept.earth ?? 0) > 0)
  })
  it('gives a shot of more than one set, or of another side than the ends, none', () => {
    const f = 2156
    const plan = framePlan(film, f, 'review')
    const mid = at(f, spanMid())
    const way = frameWay(film, f, plan, mid)!
    expect(way(mid)).not.toBeNull()
    expect(way({ ...mid, sets: [mid.sets[0]!, mid.sets[0]!] })).toBeNull()
    expect(way({ ...mid, sets: [] })).toBeNull()
    expect(way({ ...mid, sets: [{ ...mid.sets[0]!, id: 'mars' }] })).toBeNull()
    expect(way({ ...mid, sets: [{ ...mid.sets[0]!, view: 'terrain' }] })).toBeNull()
  })
})

describe('the footprint by the way of each point', () => {
  it('is the footprint of the frame at the fastest point of the measure, and finer or the same at every other', () => {
    let finer = 0
    let frames = 0
    let held = 0
    for (const [stop, cover] of Object.entries(kept)) {
      if (!(cover > 0)) continue
      for (const kind of ['dive', 'rise'] as const) {
        const seg = segment(stop, kind)
        const h = handoverOf(stop, kind)!
        for (let f = seg.firstFrame; f < seg.endFrame; f += 3) {
          // Inside the handover window the plan takes the faster of two sides: its number is no one side's own.
          if (f >= h.firstFrame && f <= h.lastFrame) continue
          for (const tier of ['review', 'final']) {
            const plan = framePlan(film, f, tier)
            const mid = at(f, spanMid())
            const open = at(f, shutterOffset(0, plan.shutter))
            const close = at(f, shutterOffset(1, plan.shutter))
            const m = frameWay(film, f, plan, mid)!(mid)!
            let most = 0
            for (const p of gridPoints(mid)) {
              const v = viewOf(mid, mid.sets[0]!, p.local)
              const a = through(m.open, v, false)
              const b = through(m.close, v, false)
              if (!a || !b) continue
              const way = a.distanceTo(b)
              most = Math.max(most, way)
              const g = lawAt(way, plan.samples, cover)
              expect(g).toBeLessThanOrEqual(footprint(plan.sharp!) + 1e-8)
              expect(g).toBeGreaterThanOrEqual(FLOOR)
              if (g < footprint(plan.sharp!) - 1e-6) finer++
            }
            // The fastest point of the grid is the plan's own motion where the grid holds it (the centre of a small disc may be faster).
            expect(most).toBeLessThanOrEqual(plan.seen + 1e-6)
            if (rawMotion(open, mid, close) === plan.seen && most > plan.seen - 1e-6) {
              expect(lawAt(most, plan.samples, cover)).toBeCloseTo(footprint(plan.sharp!), 7)
              held++
            }
            frames++
          }
        }
      }
    }
    expect(frames).toBeGreaterThan(50)
    expect(held).toBeGreaterThan(frames / 2)
    console.log('way: ' + frames + ' frames, the fastest point is a point of the grid in ' + held + ', points read finer than the frame ' + finer)
    // The law acts: there are points that are read finer than the frame's one number reads them.
    expect(finer).toBeGreaterThan(0)
  }, LONG)
  it('reads the middle of Earth 2156 at the review tier at the half, where the one number of the frame reads it at the pixel', () => {
    const f = 2156
    const plan = framePlan(film, f, 'review')
    const mid = at(f, spanMid())
    const m = frameWay(film, f, plan, mid)!(mid)!
    const [cols, rows] = config.motion.probeGrid
    const centre = gridPoints(mid).find((p) => p.x === (cols - 1) / 2 && p.y === (rows - 1) / 2)!
    const v = viewOf(mid, mid.sets[0]!, centre.local)
    const way = through(m.open, v, false)!.distanceTo(through(m.close, v, false)!)
    expect(footprint(plan.sharp!)).toBe(1)
    expect(way).toBeLessThan(plan.samples / (4 * plan.cover!))
    expect(lawAt(way, plan.samples, plan.cover!)).toBe(FLOOR)
  })
  it('is the footprint the frame count gave wherever a point stands still, and 1 at one sample', () => {
    for (const cover of [0.5, 1, 2, 4]) {
      for (const samples of [16, 24, 64, 128, 256]) {
        if (samples >= 4 * cover) expect(lawAt(0, samples, cover), samples + ' ' + cover).toBe(footprint(samples))
        expect(lawAt(0.9, samples, cover)).toBe(lawAt(0, samples, cover))
      }
      expect(lawAt(0, 1, cover)).toBe(1)
      expect(lawAt(40, 1, cover)).toBe(1)
    }
  })
})

describe('the uniforms of the way (setWay, gradUniforms)', () => {
  const open = Array.from({ length: 16 }, (_, i) => i + 1)
  const close = Array.from({ length: 16 }, (_, i) => -i - 1)
  it('are off without a way, at one sample and without a cover, and keep uGrad as it is', () => {
    setSamples(16, FLOOR)
    const grad = gradUniform.value
    for (const [way, samples] of [[null, 16], [{ cover: 2, open, close }, 1], [{ cover: 0, open, close }, 16]] as const) {
      setWay({ cover: 2, open, close }, 16, FLOOR)
      expect(wayUniform.value[0]).toBe(16)
      setWay(way, samples, FLOOR)
      expect(wayUniform.value[0]).toBe(0)
      expect(gradUniform.value).toBe(grad)
    }
  })
  it('carry the samples, the cover, the floor, the soft share and the two matrices', () => {
    setWay({ cover: 2, open, close }, 24, FLOOR, 0.25)
    expect(Array.from(wayUniform.value)).toEqual([24, 2, 0.5, 0.25])
    expect(Array.from(wayOpenUniform.value)).toEqual(open)
    expect(Array.from(wayCloseUniform.value)).toEqual(close)
    setWay(null)
  })
  it('are one object for every material, with uGrad among them', () => {
    expect(gradUniforms.uGrad).toBe(gradUniform)
    expect(gradUniforms.uWay).toBe(wayUniform)
    expect(gradUniforms.uWayOpen).toBe(wayOpenUniform)
    expect(gradUniforms.uWayClose).toBe(wayCloseUniform)
    for (const name of Object.keys(gradUniforms)) expect(GRAD_GLSL).toContain(' ' + name + ';')
    expect(GRAD_GLSL).toContain('float gradAt(vec3 view)')
  })
})
