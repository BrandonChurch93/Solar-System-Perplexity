import * as THREE from 'three'
import { afterAll, describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { needs } from '../src/core/caps'
import { placeCamera, placeGeometry, placeLayout, placeUv, type PlaceLayout } from '../src/core/place'
import type { Pose, Shot } from '../src/core/types'
import { parseProbe, probeString } from '../src/diagnostics/probe'
import { FilmDirector } from '../src/director/film'
import { handoverOf, placeWeight, skyTurnWeight, skyWeight } from '../src/director/handover'
import { trapeze } from '../src/director/moves'
import { plans } from '../src/director/plans'
import { coveredPlan, filmWith, restorePlans } from './lib/covered'

const fps = config.fps
const c = config.raw.handover
const master = config.formats[config.formatKeys.master]!
const deg = (a: THREE.Quaternion, b: THREE.Quaternion): number => THREE.MathUtils.radToDeg(a.angleTo(b))
const seg = (stop: string, kind: string): (typeof config.segments)[number] => config.segments.find((s) => s.stop === stop && s.kind === kind)!
const film = new FilmDirector(plans)
const handing = plans.filter((p) => p.handsOver)
const kinds = ['dive', 'rise'] as const

afterAll(() => restorePlans())

function frameCamera(pose: Pose, format: { width: number; height: number }): THREE.PerspectiveCamera {
  const cam = new THREE.PerspectiveCamera(pose.vfov, format.width / format.height, 0.001, 100)
  cam.position.set(0, 0, 0)
  cam.quaternion.copy(pose.quaternion)
  cam.updateProjectionMatrix()
  cam.updateMatrixWorld(true)
  return cam
}

function pixelRay(cam: THREE.PerspectiveCamera, format: { width: number; height: number }, x: number, y: number): THREE.Vector3 {
  const e = cam.projectionMatrix.elements
  const nx = (x / format.width) * 2 - 1
  const ny = 1 - (y / format.height) * 2
  return new THREE.Vector3(nx / e[0]! + e[8]! / e[0]!, ny / e[5]! + e[9]! / e[5]!, -1)
}

function projOf(cam: THREE.PerspectiveCamera): [number, number, number, number] {
  const e = cam.projectionMatrix.elements
  return [e[0]!, e[5]!, e[8]!, e[9]!]
}

function texel(layout: PlaceLayout, x: number, y: number): [number, number] {
  const s = layout.scale
  return [(x + layout.left) * s + layout.shift, layout.height - ((y + layout.top) * s + layout.shift)]
}

describe('the layout of a place picture', () => {
  it('takes its margins from the film wide share and keeps texel centres on frame pixel centres', () => {
    const l = placeLayout(master, {}, 8192)
    const half = c.place.margin / 2
    expect([l.left, l.right, l.bottom, l.top]).toEqual([Math.round(half * master.width), Math.round(half * master.width), Math.round(half * master.height), Math.round(half * master.height)])
    expect(l.scale).toBe(Math.min(c.place.scale, Math.floor(Math.min(c.place.maxEdge, 8192) / (master.width + l.left + l.right))))
    expect(l.width).toBe((master.width + l.left + l.right) * l.scale)
    expect(l.height).toBe((master.height + l.bottom + l.top) * l.scale)
    expect(l.shift).toBe(l.scale % 2 === 0 ? 0.5 : 0)
  })
  it('takes the valid field of a stop side by side and never less than one pixel', () => {
    const l = placeLayout(master, { valid: [0.11, 0.06, 0.11, 0.125] }, 8192)
    expect([l.left, l.right, l.bottom, l.top]).toEqual([Math.ceil(0.11 * master.width), Math.ceil(0.06 * master.width), Math.ceil(0.11 * master.height), Math.ceil(0.125 * master.height)])
    const none = placeLayout(master, { valid: [0, 0, 0, 0] }, 8192)
    expect([none.left, none.right, none.bottom, none.top]).toEqual([1, 1, 1, 1])
    const tight = placeLayout(master, { margin: 0 }, 8192)
    expect([tight.left, tight.right, tight.bottom, tight.top]).toEqual([1, 1, 1, 1])
    expect(tight.width).toBe((master.width + 2) * tight.scale)
  })
  it('drops the scale to fit the edge it is allowed and refuses a picture that cannot fit', () => {
    const edge = master.width + 2 * Math.round((c.place.margin / 2) * master.width)
    expect(placeLayout(master, { scale: 3 }, 3 * edge).scale).toBe(Math.min(3, Math.floor(Math.min(c.place.maxEdge, 3 * edge) / edge)))
    const one = placeLayout(master, { scale: 2 }, edge + 10)
    expect([one.scale, one.shift, one.width]).toEqual([1, 0, edge])
    expect(() => placeLayout(master, {}, edge - 1)).toThrow()
    expect(() => placeLayout(master, { valid: [c.place.maxShare, 0.1, 0, 0] }, 8192)).toThrow()
    expect(() => placeLayout(master, { margin: c.place.maxShare + 0.1 }, 16384)).toThrow()
  })
  it('fits the buffers the film may ask for on every format the gate checks', () => {
    for (const key of [config.formatKeys.master, config.formatKeys.preview]) {
      const f = config.formats[key]!
      const n = needs('full', key)
      const widest = placeLayout(f, { valid: [c.place.maxShare / 2, c.place.maxShare / 2, c.place.maxShare / 2, c.place.maxShare / 2] }, n.limits.MAX_RENDERBUFFER_SIZE!)
      expect(Math.max(widest.width, widest.height)).toBeLessThanOrEqual(n.limits.MAX_RENDERBUFFER_SIZE!)
      expect(n.limits.MAX_TEXTURE_SIZE!).toBeGreaterThanOrEqual(n.limits.MAX_RENDERBUFFER_SIZE!)
    }
  })
})

describe('the projection of a place picture', () => {
  const twin: Pose = { position: new THREE.Vector3(0.02, 1.0017, -0.01), quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.37, 0.4, 0.02)), vfov: 60 }
  const state = { twin, centre: new THREE.Vector3(0, 0, 0), radius: 1 }

  it('is the identity at T: every frame pixel centre meets a texel centre, on the ground and in the sky', () => {
    for (const size of [{}, { valid: [0.11, 0.06, 0.11, 0.125] as [number, number, number, number] }, { scale: 1 }, { scale: 3, margin: 0.1 }]) {
      const layout = placeLayout(master, size, 16384)
      const pic = new THREE.PerspectiveCamera()
      placeCamera(pic, master, layout, twin, 0.0001, 10)
      const cam = frameCamera(twin, master)
      const g = placeGeometry(twin, state)
      expect(g.shift.length()).toBe(0)
      expect(g.heights).toBe(1)
      let ground = 0
      let sky = 0
      for (const x of [0, 1, 7, 480, 959, 960, 1437, 1918, 1919]) {
        for (const y of [0, 1, 270, 539, 540, 811, 1078, 1079]) {
          const got = placeUv(g, projOf(pic), pixelRay(cam, master, x + 0.5, y + 0.5))
          const want = texel(layout, x + 0.5, y + 0.5)
          expect(got.uv[0] * layout.width).toBeCloseTo(want[0], 6)
          expect(got.uv[1] * layout.height).toBeCloseTo(want[1], 6)
          expect(got.front).toBe(true)
          expect(got.honest).toBeCloseTo(1, 9)
          const centre = got.uv[0] * layout.width - 0.5
          expect(Math.abs(centre - Math.round(centre))).toBeLessThan(1e-6)
          if (got.hit) ground++
          else sky++
        }
      }
      expect(ground).toBeGreaterThan(10)
      expect(sky).toBeGreaterThan(10)
    }
  })
  it('puts a ground point where the twin saw it, from any camera above the place', () => {
    const layout = placeLayout(master, {}, 16384)
    const pic = new THREE.PerspectiveCamera()
    placeCamera(pic, master, layout, twin, 0.0001, 10)
    const out = twin.position.clone().normalize()
    const cameras: Pose[] = [
      { position: twin.position.clone().addScaledVector(out, 0.004), quaternion: twin.quaternion.clone(), vfov: 52 },
      { position: twin.position.clone().addScaledVector(out, 0.03).add(new THREE.Vector3(0.004, 0, 0.002)), quaternion: twin.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.3, 0.1, 0.05))), vfov: 40 },
    ]
    for (const camera of cameras) {
      const cam = frameCamera(camera, master)
      const g = placeGeometry(camera, state)
      expect(g.heights).toBeCloseTo((camera.position.length() - 1) / (twin.position.length() - 1), 9)
      let seen = 0
      let hidden = 0
      for (let x = 60; x < master.width; x += 225) {
        for (let y = 40; y < master.height; y += 130) {
          const ray = pixelRay(cam, master, x, y)
          const got = placeUv(g, projOf(pic), ray)
          if (!got.hit) continue
          const d = ray.clone().normalize().applyQuaternion(camera.quaternion)
          const b = d.dot(camera.position)
          const t = -b - Math.sqrt(b * b - (camera.position.lengthSq() - 1))
          const point = camera.position.clone().addScaledVector(d, t)
          expect(point.length()).toBeCloseTo(1, 9)
          const fromTwin = point.clone().sub(twin.position)
          const sees = point.dot(fromTwin) < 0
          expect(got.honest > 0).toBe(sees)
          if (!sees) {
            hidden++
            continue
          }
          seen++
          const ndc = fromTwin.clone().project(pic)
          expect(got.uv[0]).toBeCloseTo(ndc.x * 0.5 + 0.5, 7)
          expect(got.uv[1]).toBeCloseTo(ndc.y * 0.5 + 0.5, 7)
        }
      }
      expect(seen).toBeGreaterThan(20)
      if (camera.position.length() - 1 > 0.02) expect(hidden).toBeGreaterThan(0)
    }
  })
  it('keeps a direction of the sky where the twin saw it and calls the sky below the horizon of the twin unseen', () => {
    const layout = placeLayout(master, {}, 16384)
    const pic = new THREE.PerspectiveCamera()
    placeCamera(pic, master, layout, twin, 0.0001, 10)
    const camera: Pose = { position: twin.position.clone().multiplyScalar(1.02), quaternion: twin.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.25, 0, 0))), vfov: 60 }
    const cam = frameCamera(camera, master)
    const g = placeGeometry(camera, state)
    const out = twin.position.clone().normalize()
    const dipTwin = Math.acos(1 / twin.position.length())
    let above = 0
    for (let x = 100; x < master.width; x += 300) {
      for (let y = 20; y < master.height; y += 60) {
        const ray = pixelRay(cam, master, x, y)
        const got = placeUv(g, projOf(pic), ray)
        if (got.hit) continue
        const d = ray.clone().normalize().applyQuaternion(camera.quaternion)
        const ndc = d.clone().project(pic)
        expect(got.uv[0]).toBeCloseTo(ndc.x * 0.5 + 0.5, 7)
        expect(got.uv[1]).toBeCloseTo(ndc.y * 0.5 + 0.5, 7)
        const elevation = Math.asin(d.dot(out))
        expect(got.honest > 0).toBe(elevation > -dipTwin)
        above++
      }
    }
    expect(above).toBeGreaterThan(10)
  })
})

describe('the two sides of a stop that hands over', () => {
  it('meet at T: the globe camera is the twin, the sky and the light are the same on both sides', () => {
    expect(handing.length).toBeGreaterThan(0)
    for (const p of handing) {
      for (const kind of kinds) {
        const h = handoverOf(p.id, kind)
        if (!h) continue
        const frame = Math.floor(h.time * fps + 1e-9)
        const globe: Shot = film.shotAt(frame, h.time, 'orbit')
        const close: Shot = film.shotAt(frame, h.time, 'terrain')
        expect(globe.sets[0]!.view).toBe('orbit')
        expect(close.sets[0]!.view).toBe('terrain')
        expect(deg(globe.skyQuaternion, close.skyQuaternion)).toBeLessThan(1e-5)
        expect(globe.skyTurn.toArray()).toEqual(close.skyTurn.toArray())
        expect(globe.skyExposure).toBeCloseTo(close.skyExposure, 9)
        expect(globe.skyGlow).toBeCloseTo(close.skyGlow, 9)
        expect(globe.skyStars ?? 0).toBeCloseTo(close.skyStars ?? 0, 9)
        expect(globe.skyLook ?? 0).toBeCloseTo(close.skyLook ?? 0, 9)
        expect(globe.skyShare).toBe(1)
        expect(globe.camera.vfov).toBeCloseTo(close.camera.vfov, 9)
        expect(JSON.stringify(globe.post)).toBe(JSON.stringify(close.post))
        expect(globe.cover.amount).toBe(0)
        expect(close.cover.amount).toBe(0)
        expect(close.place).toBeUndefined()
        if (!h.picture) {
          expect(globe.place).toBeUndefined()
          continue
        }
        const place = globe.place!
        expect(place.weight).toBe(1)
        expect(place.time).toBe(h.time)
        expect(place.frame).toBe(frame)
        expect(place.live).toBe(h.live)
        expect(place.twin.position.distanceTo(globe.camera.position)).toBeLessThan(1e-9)
        expect(deg(place.twin.quaternion, globe.camera.quaternion)).toBeLessThan(1e-5)
        const g = placeGeometry(globe.camera, place)
        expect(g.heights).toBeCloseTo(1, 6)
        expect(globe.camera.position.distanceTo(place.centre)).toBeGreaterThan(place.radius)
      }
    }
  })
  it('carries the place only inside its window, on the globe side, with a weight that follows the place weight', () => {
    for (const p of handing) {
      for (const kind of kinds) {
        const h = handoverOf(p.id, kind)
        const s = p.seg[kind]
        if (!h || !s) continue
        let inside = 0
        for (let f = s.firstFrame; f < s.endFrame; f++) {
          const time = (f + config.shutterFraction / 2) / fps
          const globe = film.shotAt(f, time, 'orbit')
          const w = placeWeight(s, time)
          expect(globe.skyShare).toBe(skyWeight(s, time))
          expect(skyTurnWeight(s, time)).toBeGreaterThanOrEqual(0)
          if (w > 0 && h.picture) {
            inside++
            expect(globe.place!.weight).toBe(w)
            expect(f).toBeGreaterThanOrEqual(h.placeFirstFrame)
            expect(f).toBeLessThanOrEqual(h.placeLastFrame)
          } else expect(globe.place).toBeUndefined()
          expect(film.shotAt(f, time, 'terrain').place).toBeUndefined()
        }
        if (h.picture) expect(inside).toBeGreaterThan(0)
      }
    }
    for (const p of plans) {
      if (p.handsOver) continue
      for (const kind of kinds) {
        const s = p.seg[kind]
        if (!s) continue
        for (let f = s.firstFrame; f < s.endFrame; f += 3) {
          const shot = film.shotAt(f, (f + config.shutterFraction / 2) / fps)
          expect(shot.place).toBeUndefined()
          expect(shot.skyShare).toBeUndefined()
        }
      }
    }
  })
  it('joins the motion of the close side at T: the same velocity and the same turn rate from both sides', () => {
    const dt = 1e-4
    for (const p of handing) {
      for (const kind of kinds) {
        const h = handoverOf(p.id, kind)
        if (!h) continue
        const pose = (t: number): Pose => (kind === 'dive' ? p.divePose(t, 'orbit') : p.risePose(t, 'orbit'))
        const a = pose(h.time - dt)
        const b = pose(h.time)
        const d = pose(h.time + dt)
        const before = b.position.clone().sub(a.position).divideScalar(dt)
        const after = d.position.clone().sub(b.position).divideScalar(dt)
        const speed = Math.max(before.length(), after.length(), 1e-12)
        expect(before.distanceTo(after) / speed).toBeLessThan(0.02)
        const turnBefore = a.quaternion.angleTo(b.quaternion) / dt
        const turnAfter = b.quaternion.angleTo(d.quaternion) / dt
        expect(Math.abs(turnBefore - turnAfter)).toBeLessThan(0.02 * Math.max(turnBefore, turnAfter) + 1e-4)
        expect(Math.abs(a.vfov - 2 * b.vfov + d.vfov)).toBeLessThan(1e-3)
        const twin = p.twin(p.closePose(kind, h.time), h.time)
        expect(twin.position.distanceTo(b.position)).toBeLessThan(1e-12)
      }
    }
  })
})

describe('the switches of a handover', () => {
  const dive = seg('mars', 'dive')
  const rise = seg('mars', 'rise')

  it('draws no place picture for a side that switched it off and keeps the sky carry', () => {
    const d = filmWith(coveredPlan({ handover: { dive: { picture: false } } }))
    const hd = handoverOf('mars', 'dive')!
    const hr = handoverOf('mars', 'rise')!
    expect(hd.picture).toBe(false)
    expect(hr.picture).toBe(true)
    for (let f = hd.placeFirstFrame; f <= hd.lastFrame; f++) {
      const shot = d.shotAt(f, (f + config.shutterFraction / 2) / fps, 'orbit')
      expect(shot.place).toBeUndefined()
      expect(shot.skyShare).toBeGreaterThan(0)
    }
    expect(d.shotAt(hr.firstFrame, hr.time, 'orbit').place).toBeDefined()
    restorePlans()
  })
  it('marks a live picture and hands the options of a stop to the place', () => {
    const d = filmWith(coveredPlan({ handover: { dive: { live: true, place: { scale: 1, margin: 0.1, matte: 'alpha', lens: 0.5 } }, rise: { place: { valid: [0.1, 0.2, 0.05, 0.02] } } } }))
    const hd = handoverOf('mars', 'dive')!
    const hr = handoverOf('mars', 'rise')!
    const a = d.shotAt(hd.firstFrame, hd.time, 'orbit').place!
    expect([a.live, a.scale, a.margin, a.matte, a.lens, a.valid]).toEqual([true, 1, 0.1, 'alpha', 0.5, undefined])
    const b = d.shotAt(hr.firstFrame, hr.time, 'orbit').place!
    expect([b.live, b.scale, b.margin, b.matte, b.valid]).toEqual([false, undefined, undefined, undefined, [0.1, 0.2, 0.05, 0.02]])
    expect(a.kind).toBe('dive')
    expect(b.kind).toBe('rise')
    restorePlans()
  })
  it('takes a place window of no frames: the picture is there in the dissolve only', () => {
    const d = filmWith(coveredPlan({ handover: { dive: { placeFrames: 0 }, rise: { placeFrames: 0 } } }))
    for (const [s, kind] of [[dive, 'dive'], [rise, 'rise']] as const) {
      const h = handoverOf('mars', kind)!
      expect([h.placeFirstFrame, h.placeLastFrame]).toEqual([h.firstFrame, h.lastFrame])
      for (let f = s.firstFrame; f < s.endFrame; f++) {
        for (const o of [0, 0.25, 0.49]) {
          const w = placeWeight(s, (f + o) / fps)
          expect(w).toBe(f >= h.firstFrame && f <= h.lastFrame ? 1 : 0)
          expect(Number.isFinite(w)).toBe(true)
          expect(d.shotAt(f, (f + o) / fps, 'orbit').place === undefined).toBe(w === 0)
        }
      }
    }
    restorePlans()
  })
  it('lets a plan put its own twin under the place, the pass and the globe camera at T', () => {
    const plan = coveredPlan({ handover: {} })
    const base = plan.twin.bind(plan)
    const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.03)
    plan.twin = (local: Pose, time: number): Pose => {
      const t = base(local, time)
      return { position: t.position.clone().applyQuaternion(tilt), quaternion: tilt.clone().multiply(t.quaternion), vfov: t.vfov }
    }
    const d = filmWith(plan)
    for (const kind of kinds) {
      const h = handoverOf('mars', kind)!
      const globe = d.shotAt(h.firstFrame, h.time, 'orbit')
      const close = d.shotAt(h.firstFrame, h.time, 'terrain')
      const own = plan.twin(plan.closePose(kind, h.time), h.time)
      expect(own.position.distanceTo(base(plan.closePose(kind, h.time), h.time).position)).toBeGreaterThan(1e-3)
      expect(globe.place!.twin.position.distanceTo(globe.camera.position)).toBeLessThan(1e-9)
      expect(deg(globe.place!.twin.quaternion, globe.camera.quaternion)).toBeLessThan(1e-5)
      expect(deg(globe.skyQuaternion, close.skyQuaternion)).toBeLessThan(1e-5)
    }
    restorePlans()
  })
})

describe('the curve of a descent', () => {
  it('runs from 0 to 1, never back, and is level at both ends when it has a rise and a fall', () => {
    for (const [rise, fall] of [[c.descent.rise, c.descent.fall], [0.2, 0.3], [0, 0.4], [0.5, 0.5], [0.1, 0.05]] as const) {
      expect(trapeze(0, rise, fall)).toBe(0)
      expect(trapeze(1, rise, fall)).toBeCloseTo(1, 12)
      expect(trapeze(-1, rise, fall)).toBe(0)
      expect(trapeze(2, rise, fall)).toBeCloseTo(1, 12)
      let last = 0
      let most = 0
      for (let i = 1; i <= 1000; i++) {
        const v = trapeze(i / 1000, rise, fall)
        expect(v).toBeGreaterThanOrEqual(last)
        most = Math.max(most, (v - last) * 1000)
        last = v
      }
      const cruise = 1 / (1 - 0.5 * rise - 0.5 * fall)
      expect(most).toBeLessThanOrEqual(cruise * (1 + 1e-6))
      expect((1 - trapeze(1 - 1e-4, rise, fall)) / 1e-4).toBeLessThan(0.01 * cruise)
      if (rise > 0) expect(trapeze(1e-4, rise, fall) / 1e-4).toBeLessThan(0.01 * cruise)
      else expect(trapeze(1e-4, rise, fall) / 1e-4).toBeCloseTo(cruise, 6)
      const mid = (rise + (1 - fall)) / 2
      if (1 - fall - rise > 0.01) expect((trapeze(mid + 1e-4, rise, fall) - trapeze(mid, rise, fall)) / 1e-4).toBeCloseTo(cruise, 6)
    }
  })
})

describe('the options on a diagnostic string', () => {
  it('reads the view and every option and writes them back', () => {
    expect(parseProbe('beauty')).toEqual({ view: 'beauty', side: null, shut: false, time: null, place: true, mask: false, picture: false })
    expect(parseProbe('texels/side=orbit/shut')).toEqual({ view: 'texels', side: 'orbit', shut: true, time: null, place: true, mask: false, picture: false })
    expect(parseProbe('beauty/side=terrain/t=81.80833/noplace')).toEqual({ view: 'beauty', side: 'terrain', shut: true, time: 81.80833, place: false, mask: false, picture: false })
    expect(parseProbe('beauty/mask').mask).toBe(true)
    expect(parseProbe('beauty/picture').picture).toBe(true)
    for (const s of ['beauty', 'texels/side=orbit/shut', 'beauty/side=terrain/t=81.80833/noplace', 'beauty/side=orbit/mask', 'beauty/picture']) expect(probeString(parseProbe(s))).toBe(s)
    expect(() => parseProbe('beauty/side=left')).toThrow()
    expect(() => parseProbe('beauty/t=soon')).toThrow()
    expect(() => parseProbe('beauty/nothing')).toThrow()
  })
})
