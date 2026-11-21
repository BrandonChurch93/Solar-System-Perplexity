import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { config } from '../src/config'
import { framePlan, frameSamples, rawMotion, samplesNeeded, seenShare, shutterMotion, softness } from '../src/core/motion'
import { gradUniform, setSamples } from '../src/diagnostics/diag'
import { sampleCount } from '../src/core/sampler'
import type { Shot } from '../src/core/types'
import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'
import { segmentAtFrame } from '../src/director/timeline'

const director = new FilmDirector(plans)
const step = config.motion.maxStepPx
const ends = (f: number): [Shot, Shot, Shot] => [0, config.shutterFraction / 2, config.shutterFraction].map((o) => director.shotAt(f, (f + o) / config.fps)) as [Shot, Shot, Shot]
const first = (kind: string, stop: string): number => {
  const s = config.segments.find((x) => x.kind === kind && x.stop === stop)!
  return s.firstFrame + Math.floor(s.frames / 2)
}
const moved = (shot: Shot, by: THREE.Vector3, turn = new THREE.Quaternion()): Shot => ({ ...shot, camera: { position: shot.camera.position.clone().add(by), quaternion: shot.camera.quaternion.clone().multiply(turn), vfov: shot.camera.vfov } })

describe('sample count rule', () => {
  it('keeps the count of today when the motion needs no more', () => {
    for (const base of [1, 4, 16, 64]) {
      expect(samplesNeeded(base, 128, 0)).toBe(base)
      expect(samplesNeeded(base, 128, base * step)).toBe(base)
      expect(samplesNeeded(base, 128, base * step * 0.999)).toBe(base)
    }
  })
  it('rises so that the step between neighbours stays at or under the limit, up to the cap', () => {
    expect(samplesNeeded(16, 64, 16 * step + 0.01)).toBe(17)
    expect(samplesNeeded(16, 64, 40 * step)).toBe(40)
    expect(samplesNeeded(16, 64, 1e6)).toBe(64)
    expect(samplesNeeded(16, 8, 1e6)).toBe(16)
    for (let m = 0; m < 300; m += 0.7) {
      const n = samplesNeeded(4, 128, m)
      expect(n).toBeGreaterThanOrEqual(4)
      if (n < 128) expect(m / n).toBeLessThanOrEqual(step + 1e-9)
      if (n > 4) expect(m / (n - 1)).toBeGreaterThan(step - 1e-9)
    }
  })
})

describe('motion across the shutter', () => {
  const hold = first('hold', 'mars')
  const [, mid] = ends(hold)
  it('is zero for a camera that stands still and for a pure turn with no body in view', () => {
    expect(shutterMotion(mid, mid, mid)).toBe(0)
    const away = { ...mid, sets: mid.sets.map((s) => ({ ...s, weight: 0 })) }
    const turn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.05)
    expect(shutterMotion(away, away, moved(away, new THREE.Vector3(), turn))).toBe(0)
  })
  it('counts a turn and a push in when the body is in view, and nothing under a full cover', () => {
    const turn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.01)
    const focal = config.formats[config.formatKeys.master]!.height / 2 / Math.tan(THREE.MathUtils.degToRad(mid.camera.vfov) / 2)
    const turned = shutterMotion(mid, mid, moved(mid, new THREE.Vector3(), turn))
    expect(turned).toBeGreaterThan(0.9 * focal * 0.01)
    expect(turned).toBeLessThan(3 * focal * 0.01)
    const toBody = mid.sets[0]!.origin.clone().sub(mid.camera.position)
    expect(shutterMotion(mid, mid, moved(mid, toBody.clone().multiplyScalar(0.05)))).toBeGreaterThan(1)
    const covered = { ...mid, cover: { ...mid.cover, amount: 1 } }
    expect(shutterMotion(covered, covered, moved(covered, new THREE.Vector3(), turn))).toBe(0)
  })
  it('leaves out a body under the smallest size that counts', () => {
    const far = moved(mid, mid.camera.position.clone().sub(mid.sets[0]!.origin).multiplyScalar(5000))
    const turn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.0005)
    expect(shutterMotion(far, far, moved(far, new THREE.Vector3(), turn))).toBe(0)
  })
  it('counts the ground rushing past in a terrain view from the height over the stage ground', () => {
    const f = first('terrain', 'mars')
    const [, m] = ends(f)
    const s = m.sets[0]!
    expect(s.view).toBe('terrain')
    expect(s.ground).toBe(plans.find((p) => p.id === 'mars')!.ground)
    const ahead = new THREE.Vector3(0, 0, -1).applyQuaternion(m.camera.quaternion)
    const slow = shutterMotion(m, m, moved(m, ahead.clone().multiplyScalar(0.01)))
    const fast = shutterMotion(m, m, moved(m, ahead.clone().multiplyScalar(0.1)))
    expect(slow).toBeGreaterThan(0)
    expect(fast).toBeGreaterThan(5 * slow)
    const low = { ...m, sets: [{ ...s, ground: s.ground! / 4 }] }
    expect(shutterMotion(low, low, moved(low, ahead.clone().multiplyScalar(0.01)))).toBeGreaterThan(slow)
  })
})

describe('samples of a frame', () => {
  it('is the same on every call and stays between the count of today and the cap', () => {
    for (const [tier, t] of Object.entries(config.tiers)) {
      for (let f = 0; f < config.frameCount; f += 7) {
        const base = sampleCount(tier, segmentAtFrame(f).kind)
        const n = frameSamples(director, f, tier)
        expect(n).toBe(frameSamples(director, f, tier))
        expect(n).toBeGreaterThanOrEqual(base)
        expect(n).toBeLessThanOrEqual(Math.max(t.maxSamplesPerFrame, base))
        if (n > base && n < t.maxSamplesPerFrame) expect(shutterMotion(...ends(f)) / n).toBeLessThanOrEqual(step + 1e-9)
        if (n === base && t.maxSamplesPerFrame > base) expect(shutterMotion(...ends(f))).toBeLessThanOrEqual(base * step + 1e-9)
      }
    }
  })
  it('keeps one sample at the draft tier and the count of today on every hold', () => {
    for (let f = 0; f < config.frameCount; f += 3) {
      expect(frameSamples(director, f, 'draft')).toBe(1)
      if (segmentAtFrame(f).kind === 'hold') for (const tier of ['review', 'final']) expect(frameSamples(director, f, tier)).toBe(config.tiers[tier]!.samplesPerFrame)
    }
  })
  it('raises the count in the fastest part of a rise', () => {
    const s = config.segments.find((x) => x.id === 'neptune.rise')!
    let most = 0
    for (let f = s.firstFrame; f < s.endFrame; f++) most = Math.max(most, frameSamples(director, f, 'review'))
    expect(most).toBeGreaterThan(config.tiers.review!.fastSamplesPerFrame)
  })
})

describe('gradient scale under motion', () => {
  const m = config.motion
  it('is the still scale up to the lower motion and 1 from the upper motion on', () => {
    expect(softness(0)).toBe(0)
    expect(softness(m.softFromPx)).toBe(0)
    expect(softness(m.softToPx)).toBe(1)
    expect(softness(1e6)).toBe(1)
    let last = 0
    for (let x = m.softFromPx; x <= m.softToPx; x += (m.softToPx - m.softFromPx) / 40) {
      const s = softness(x)
      expect(s).toBeGreaterThanOrEqual(last)
      last = s
    }
    for (const count of [1, 4, 16, 64, 256]) {
      setSamples(count, 0.5)
      const still = gradUniform.value
      expect(still).toBe(Math.max(1 / Math.sqrt(count), 0.5))
      setSamples(count, 0.5, 0)
      expect(gradUniform.value).toBe(still)
      setSamples(count, 0.5, 0.5)
      expect(gradUniform.value).toBeCloseTo(still + (1 - still) * 0.5, 12)
      setSamples(count, 0.5, 1)
      expect(gradUniform.value).toBe(1)
    }
    setSamples(1, 0.5)
  })
  it('leaves the slow Mars frames alone and softens a fast dive whatever its cover', () => {
    for (const f of [2325, 2427, 2580, 2726, 2772, 2782, 2796]) expect(framePlan(director, f, 'final').soft).toBe(0)
    const fast = framePlan(director, 1870, 'review')
    expect(fast.raw).toBeGreaterThan(m.softToPx)
    expect(fast.soft).toBe(1)
    const s = config.segments.find((x) => x.kind === 'dive' && x.stop === 'uranus')!
    let covered = 0
    for (let f = s.firstFrame; f < s.endFrame; f++) {
      const [a, b, c] = ends(f)
      const plan = framePlan(director, f, 'review')
      expect(plan.raw).toBe(rawMotion(a, b, c))
      expect(plan.seen).toBe(shutterMotion(a, b, c))
      expect(plan.soft).toBe(softness(plan.raw))
      expect(plan.samples).toBe(frameSamples(director, f, 'review'))
      if (b.cover.amount > 0.5 && plan.raw > m.softToPx) covered++
    }
    expect(covered).toBeGreaterThan(0)
  })
})

describe('what a cover hides', () => {
  it('is all of its amount by default and the share a stop sets', () => {
    const f = config.segments.find((x) => x.kind === 'dive' && x.stop === 'uranus')!
    let n = 0
    for (let i = f.firstFrame; i < f.endFrame; i++) {
      const [a, set, c] = ends(i)
      if (!(set.cover.amount > 0.2 && set.cover.amount < 1)) continue
      n++
      const cover = { ...set.cover }
      delete cover.hides
      const b: Shot = { ...set, cover }
      const raw = rawMotion(a, b, c)
      expect(seenShare(b)).toBe(Math.max(1 - b.cover.amount, 0))
      expect(shutterMotion(a, b, c)).toBe(raw * Math.max(1 - b.cover.amount, 0))
      const half: Shot = { ...b, cover: { ...b.cover, hides: 0.5 } }
      expect(seenShare(half)).toBeCloseTo(1 - b.cover.amount * 0.5, 12)
      expect(shutterMotion(a, half, c)).toBeCloseTo(raw * (1 - b.cover.amount * 0.5), 9)
      const none: Shot = { ...b, cover: { ...b.cover, hides: 0 } }
      expect(shutterMotion(a, none, c)).toBe(raw)
      const all: Shot = { ...b, cover: { ...b.cover, hides: 1 } }
      expect(shutterMotion(a, all, c)).toBe(shutterMotion(a, b, c))
    }
    expect(n).toBeGreaterThan(0)
    for (const p of plans) expect(p.p.coverHides === undefined || (p.p.coverHides >= 0 && p.p.coverHides <= 1)).toBe(true)
  })
})
