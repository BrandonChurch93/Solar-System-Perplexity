import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'
import * as THREE from 'three'
import { setsForFrame } from '../src/director/timeline'
import { farSun, faceLaw, holdFrame, wornAt } from '../src/space/farsun/farsun'
import { HOLD } from '../src/space/farsun/hold'
import look from '../src/space/farsun/look.json'
import { globeShare, spans, swapDistance, wearShare } from '../src/space/farsun/share'
import { FARSUN_FRAG } from '../src/space/farsun/shader'
import { Corona } from '../src/stops/sun/corona'
import * as sunLook from '../src/stops/sun/look'
import { Prominences } from '../src/stops/sun/prominence'

const swapOf = (deg: number): number => 1 / Math.sin((deg * Math.PI) / 180)

describe('the handover and the wear of the far Sun', () => {
  const film = new FilmDirector(plans)
  const far = (frame: number): { share: number; burn: number } => {
    const f = film.shotAt(frame, frame / config.fps).sun.far
    if (!f) throw new Error('no far Sun at ' + frame)
    return { share: f.share, burn: f.burn }
  }

  const handoverSpan = spans(swapDistance).handover
  const wearSpan = spans(swapDistance).wear
  const sunStart = (film as unknown as { sunStart: number }).sunStart

  it('starts from the distance of the last view of the Sun stop: the typed stand-in stands within 0.005 of the distance of the film, and the distance of the film is taken when it is handed over', () => {
    expect(Math.abs(look.sunStart - sunStart)).toBeLessThan(0.005)
    const handed = spans(swapDistance, sunStart)
    const typed = spans(swapDistance, look.sunStart)
    for (const key of ['handover', 'wear'] as const) {
      expect(handed[key][0]).toBeGreaterThanOrEqual(sunStart)
      expect(handed[key][1]).toBeGreaterThan(handed[key][0])
      expect(handed[key][1]).toBeLessThanOrEqual(swapDistance)
      expect(Math.abs(handed[key][0] - typed[key][0])).toBeLessThan(0.005)
      expect(Math.abs(handed[key][1] - typed[key][1])).toBeLessThan(0.005)
    }
  })

  it('reads the swap distance the film reads, from the plan of the first stop after the Sun', () => {
    expect(swapDistance).toBeCloseTo(swapOf(plans[1]!.p.light.sunRadiusDeg), 12)
    expect(swapDistance).toBeCloseTo((film as unknown as { sunSwap: number }).sunSwap, 12)
  })

  it('holds both ends as shares of the way from the last view of the Sun stop to the swap, with no distance of an end in the look', () => {
    for (const span of [look.handover, look.wear]) {
      expect(span[0]).toBeGreaterThanOrEqual(0)
      expect(span[1]).toBeGreaterThan(span[0]!)
      expect(span[1]).toBeLessThanOrEqual(1)
    }
  })

  it('ends the wear and the handover at or before the swap distance of every stop', () => {
    for (const plan of plans) {
      const swap = swapOf(plan.p.light.sunRadiusDeg)
      const { handover, wear } = spans(swap)
      expect(handover[1], plan.id).toBeLessThanOrEqual(swap)
      expect(wear[1], plan.id).toBeLessThanOrEqual(swap)
    }
    for (const deg of [5, 9.2, 11.69, 12, 14, 30]) {
      const swap = swapOf(deg)
      const { handover, wear } = spans(swap)
      expect(handover[1], String(deg)).toBeLessThanOrEqual(swap)
      expect(wear[1], String(deg)).toBeLessThanOrEqual(swap)
    }
  })

  it('wears by the burn alone: the far Sun is the face of the Sun stop at burn 0 and its own body at burn 1, with no step on the way, and the wear is out before the set of the Sun stop leaves, so no frame hangs on what is loaded', () => {
    expect(wornAt(0)).toBe(1)
    expect(wornAt(1)).toBe(0)
    expect(look.burn.worn.end[1]).toBeLessThan(1)
    expect(wornAt(look.burn.worn.end[1]!)).toBe(0)
    expect(look.burn.worn.at - look.burn.worn.fall[0]! - look.burn.worn.fall[1]!).toBeGreaterThan(0)
    for (let k = 0; k < 4000; k++) expect(wornAt((k + 1) / 4000), String(k)).toBeLessThanOrEqual(wornAt(k / 4000))
    const seg = config.segments.find((s) => s.id === 'sun.travel')!
    const first = seg.start * config.fps
    const count = (seg.end - seg.start) * config.fps * 16
    let step = 0
    for (let k = 0; k < count - 1; k++) {
      const a = wornAt(far(first + k / 16).burn)
      const b = wornAt(far(first + (k + 1) / 16).burn)
      step = Math.max(step, Math.abs(b - a))
      if (a > 0) expect(setsForFrame(Math.floor(first + k / 16)), String(k)).toContain(config.stopIds[0])
    }
    expect(step).toBeLessThan(0.02)
    for (let k = count - 5 * 16; k < count; k++) expect(wornAt(far(first + k / 16).burn), String(k)).toBe(0)
    expect(globeShare(swapDistance)).toBe(0)
    expect(wearShare(swapDistance)).toBe(0)
  })

  it('draws the gas of the Sun stop by the laws of the stop, word for word, and its weight is the wear', () => {
    const t = new THREE.Texture()
    const pick = (src: string, keys: string[]): string[] => src.split('\n').map((l) => l.trim()).filter((l) => keys.some((k) => l.startsWith(k)))
    const mine = (l: string): string => l.replace(/TAU/g, '6.283185307179586').replace(/uWave/g, 'uGasWave').replace(/uTime/g, 'uHoldTime').replace(/uMove/g, 'uPromMove').replace(/cells\(/g, 'gasCells(')
    const laws = [...pick(new Corona(t, sunLook.corona).material.fragmentShader, ['float sway =', 'return 0.5 * cells(']), ...pick(new Prominences(t, t, sunLook.prominence).material.fragmentShader, ['float run =', 'float pa =', 'float pb ='])]
    expect(laws).toHaveLength(5)
    for (const law of laws) expect(FARSUN_FRAG, law).toContain(mine(law))
    expect(FARSUN_FRAG).toContain('float worn = uWear * uGasOn;')
    expect(FARSUN_FRAG).toContain('gas *= (1.0 - worn) * dim;')
  })

  it('carries the arcade of the Sun stop on the body while it wears the stop, and lets go of it when it does not', () => {
    const t = new THREE.Texture()
    const object = new THREE.Object3D()
    const seen: number[] = []
    const g = sunLook.globe
    farSun.wear({ map: t, grade: t, mapWidth: 8192, limb: g.limb, rim: g.rim, boil: g.boil, hot: g.hot, pulse: g.pulse, cell: g.cell, gas: { corona: t, coronaLook: sunLook.corona, prominence: t, flow: t, prominenceLook: sunLook.prominence, turn: new THREE.Quaternion(), arcade: { object, draw: (v) => void seen.push(v.wear) } } })
    const body = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, -0.7, 0.2))
    const view = { camera: new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 100), centre: new THREE.Vector3(1, 2, -6), body, spin: 0.4, time: 20, holdTime: 3, exposure: 1, burn: 0, vignette: 0, aspect: 16 / 9, height: 1080 }
    farSun.set(view, 1, 0)
    expect(object.parent).toBe(farSun.carry)
    expect(seen).toEqual([1])
    const at = new THREE.Vector3(0.2, 0.5, 0.8)
    const want = at.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.4).applyQuaternion(body).add(view.centre)
    expect(at.clone().applyMatrix4(object.matrixWorld).distanceTo(want)).toBeLessThan(1e-9)
    farSun.set({ ...view, burn: 1 }, 1, 0)
    expect(object.parent).toBeNull()
    farSun.set(view, 0, 0)
    expect(object.parent).toBeNull()
    expect(seen).toEqual([1])
    farSun.set(view, 1, 0)
    farSun.wear(null)
    expect(object.parent).toBeNull()
  })

  it('holds the face of the Sun stop whole while the globe is in the frame alone, and has let go of no more than the look says where the pull ends', () => {
    expect(handoverSpan[1]).toBeGreaterThan(handoverSpan[0])
    expect(wearSpan[0]).toBeLessThanOrEqual(handoverSpan[0])
    expect(wearSpan[1]).toBeGreaterThanOrEqual(handoverSpan[1])
    for (const frame of [450, 455, 460]) expect(wornAt(far(frame).burn), String(frame)).toBe(1)
    for (const frame of [489, 495, 499]) expect(wornAt(far(frame).burn), String(frame)).toBeCloseTo(look.burn.worn.at, 3)
  })

  it('has no step in the share or in the burn at any sixteenth of a frame of the way out of the Sun', () => {
    const seg = config.segments.find((s) => s.id === 'sun.travel')!
    let share = 0
    let burn = 0
    for (let k = 0; k < (seg.end - seg.start) * config.fps * 16; k++) {
      const a = far(seg.start * config.fps + k / 16)
      const b = far(seg.start * config.fps + (k + 1) / 16)
      share = Math.max(share, Math.abs(b.share - a.share))
      burn = Math.max(burn, Math.abs(b.burn - a.burn))
    }
    expect(share).toBeLessThan(0.02)
    expect(burn).toBeLessThan(0.004)
  })

  it('is whole and fully burnt before the pull ends and stays so through the leave', () => {
    for (const frame of [489, 495, 499, 499.4375, 499.5, 499.5625, 500, 500.5]) {
      const a = far(frame)
      const b = far(499)
      expect(a.share, String(frame)).toBe(1)
      expect(a.burn, String(frame)).toBeCloseTo(b.burn, 6)
    }
  })

  it('keeps the face of the Sun stop through the handover: the spots and the fields go out with the exposure after it and never before', () => {
    for (const frame of [471, 475, 480, 484, 485, 495, 500]) {
      const law = faceLaw(far(frame).burn)
      expect(law.flat, String(frame)).toBeLessThan(1e-6)
      expect(law.power, String(frame)).toBeCloseTo(look.spots.power[0]!, 6)
      expect(law.plage, String(frame)).toBeCloseTo(look.plage.gain[0]!, 6)
    }
    const full = faceLaw(1)
    expect(full).toEqual({ flat: look.spots.flat[0], power: look.spots.power[1], plage: look.plage.gain[1] })
    let step = 0
    for (let k = 0; k < 400; k++) step = Math.max(step, Math.abs(faceLaw((k + 1) / 400).flat - faceLaw(k / 400).flat))
    expect(step).toBeLessThan(0.004)
  })

  it('reads the map of place from the eye of the middle of the hold of the first stop after the Sun, as the film stands there', () => {
    const seg = config.segments.find((s) => s.id === plans[1]!.id + '.hold')!
    const frame = ((seg.start + seg.end) / 2) * config.fps
    const shot = film.shotAt(frame, frame / config.fps)
    const f = shot.sun.far
    if (!f) throw new Error('no far Sun at ' + frame)
    const eye = shot.sun.dir.clone().normalize().multiplyScalar(-1 / Math.sin(shot.sun.angularRadius)).applyQuaternion(f.body.clone().invert())
    const held = holdFrame(f.spin)
    expect(held.eye.distanceTo(eye)).toBeLessThan(2e-3)
    expect(new THREE.Vector3().fromArray(HOLD.eye).length()).toBeCloseTo(swapDistance, 3)
    expect(Math.abs(held.x.dot(held.axis))).toBeLessThan(1e-9)
    expect(Math.abs(held.y.dot(held.axis))).toBeLessThan(1e-9)
    expect(HOLD.data.length).toBe(Math.ceil((HOLD.width * HOLD.height * 2) / 3) * 4)
  })
})
