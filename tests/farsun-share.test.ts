import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium, type Browser, type Page } from 'playwright-core'
import { build } from 'vite'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { CHROME, CHROME_FLAGS } from '../tools/lib/browser'
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
import { Sky } from '../src/space/sky'
import { Corona } from '../src/stops/sun/corona'
import * as sunLook from '../src/stops/sun/look'
import place from '../src/stops/sun/place.json'
import { Prominences } from '../src/stops/sun/prominence'

const swapOf = (deg: number): number => 1 / Math.sin((deg * Math.PI) / 180)

const ROOT = resolve(__dirname, '..')
const at = (path: string): string => JSON.stringify(resolve(ROOT, path))

const PAGE = `
import * as THREE from 'three'
import { farSun } from ${at('src/space/farsun/farsun.ts')}
import * as sunLook from ${at('src/stops/sun/look.ts')}

const renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas') })
renderer.autoClear = false
const blank = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1)
blank.needsUpdate = true
const knot = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: 0, transparent: true, depthTest: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }))
knot.frustumCulled = false
let shown = true

function count(v) {
  const target = new THREE.WebGLRenderTarget(v.width, v.height, { depthBuffer: true })
  const [x0, y0, x1, y1] = v.box
  const w = x1 - x0 + 1
  const h = y1 - y0 + 1
  target.scissor.set(x0, y0, w, h)
  target.scissorTest = true
  const g = sunLook.globe
  knot.position.fromArray(v.spot)
  knot.scale.setScalar(v.size)
  farSun.wear({ map: blank, grade: blank, mapWidth: 1, limb: g.limb, rim: g.rim, boil: g.boil, hot: g.hot, pulse: g.pulse, cell: g.cell, gas: { corona: blank, coronaLook: sunLook.corona, prominence: blank, flow: blank, prominenceLook: sunLook.prominence, turn: new THREE.Quaternion(), arcade: { object: knot, draw: () => { knot.visible = shown } } } })
  const camera = new THREE.PerspectiveCamera(v.vfov, v.width / v.height, v.near, v.far)
  camera.quaternion.fromArray(v.q)
  camera.updateMatrixWorld(true)
  const view = { camera, centre: new THREE.Vector3().fromArray(v.centre), body: new THREE.Quaternion().fromArray(v.body), spin: v.spin, time: v.time, holdTime: v.holdTime, exposure: v.exposure, burn: v.burn, vignette: v.vignette, aspect: v.width / v.height, height: v.height }
  const shoot = (on) => {
    shown = on
    renderer.setRenderTarget(target)
    renderer.clear(true, true, true)
    farSun.set(view, 1, 0)
    farSun.render(renderer, target)
    const out = new Uint8Array(w * h * 4)
    renderer.readRenderTargetPixels(target, x0, y0, w, h, out)
    return out
  }
  const withIt = shoot(true)
  const without = shoot(false)
  let lit = 0
  let dark = 0
  for (let i = 0; i < w * h * 4; i += 4) {
    if (without[i] + without[i + 1] + without[i + 2] === 0) continue
    lit++
    if (withIt[i] + withIt[i + 1] + withIt[i + 2] === 0) dark++
  }
  farSun.wear(null)
  renderer.setRenderTarget(null)
  target.dispose()
  return { lit, dark, near: camera.near, far: camera.far }
}

window.farsunArcade = { count }
`

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

  it('starts from the distance of the last view of the Sun stop as the film hands it over, with no stand-in for it in the look', () => {
    expect('sunStart' in look).toBe(false)
    const handed = spans(swapDistance, sunStart)
    const read = spans(swapDistance)
    for (const key of ['handover', 'wear'] as const) {
      expect(handed[key][0]).toBeGreaterThanOrEqual(sunStart)
      expect(handed[key][1]).toBeGreaterThan(handed[key][0])
      expect(handed[key][1]).toBeLessThanOrEqual(swapDistance)
      expect(read[key]).toEqual(handed[key])
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

  it('stands in the direction of the Sun of the film at every half frame of every dive and rise of the eight planets, with its body unturned, and never rides with the turn of the sky', () => {
    const ids = plans.slice(1, 9).map((p) => p.id)
    const legs = config.segments.filter((s) => (s.kind === 'dive' || s.kind === 'rise') && ids.includes(s.stop))
    expect(legs).toHaveLength(16)
    let turned = 0
    for (const leg of legs) {
      const mid = config.segments.find((s) => s.id === leg.stop + '.hold')!
      const at = ((mid.start + mid.end) / 2) * config.fps
      const body = film.shotAt(at, at / config.fps).sun.far!.body.clone().normalize()
      const first = film.shotAt(leg.firstFrame, leg.firstFrame / config.fps).skyTurn
      for (let frame = leg.firstFrame; frame < leg.endFrame; frame += 0.5) {
        const shot = film.shotAt(frame, frame / config.fps)
        const f = shot.sun.far
        if (!f) throw new Error('no far Sun at ' + frame)
        expect(f.centre, leg.id + ' ' + frame).toBeUndefined()
        expect((f.dir ?? shot.sun.dir).angleTo(shot.sun.dir), leg.id + ' ' + frame).toBeLessThan(1e-6)
        expect(f.body.clone().normalize().angleTo(body), leg.id + ' ' + frame).toBeLessThan(1e-6)
        turned = Math.max(turned, shot.skyTurn.angleTo(first))
      }
    }
    expect(turned).toBeGreaterThan(0.5)
  })

  it('is seen through the sky orientation of its own sample of the shutter while the stars keep the one of the middle, and through the middle one where no other is handed', () => {
    const seg = config.segments.find((s) => s.id === plans[1]!.id + '.hold')!
    const frame = ((seg.start + seg.end) / 2) * config.fps
    const mid = film.shotAt(frame, frame / config.fps)
    const own = mid.skyQuaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), mid.sun.angularRadius))
    const { width, height } = config.raw.formats.master
    const aspect = width / height
    const camera = new THREE.PerspectiveCamera(mid.camera.vfov, aspect)
    camera.quaternion.copy(mid.camera.quaternion)
    const stood = camera.quaternion.clone()
    const stars: THREE.Quaternion[] = []
    const body: THREE.Quaternion[] = []
    const canvas = { addEventListener: (): void => undefined }
    const renderer = new Proxy({}, { get: (_, key) => (key === 'domElement' ? canvas : key === 'render' ? (_scene: THREE.Object3D, eye: THREE.Camera): void => { stars.push(eye.quaternion.clone()) } : (): void => undefined) }) as unknown as THREE.WebGLRenderer
    const target = new THREE.WebGLRenderTarget(width, height)
    const set = vi.spyOn(farSun, 'set').mockImplementation((view) => {
      body.push(view.camera.quaternion.clone())
      return 0
    })
    const draw = vi.spyOn(farSun, 'render').mockImplementation(() => undefined)
    const sky = new Sky(height)
    const through = (...sample: THREE.Quaternion[]): void => (sky.render as (...all: unknown[]) => void).call(sky, renderer, target, camera, mid.skyQuaternion, mid.skyExposure, mid.skyGlow, mid.skyTurn, height, mid.sun, mid.post.vignette, aspect, null, ...sample)
    through(own)
    through()
    set.mockRestore()
    draw.mockRestore()
    expect(body).toHaveLength(2)
    expect(body[0]!.equals(own)).toBe(true)
    expect(body[0]!.equals(mid.skyQuaternion)).toBe(false)
    expect(body[1]!.equals(mid.skyQuaternion)).toBe(true)
    expect(stars.length).toBeGreaterThan(0)
    for (const q of stars) expect(q.equals(mid.skyQuaternion)).toBe(true)
    expect(camera.quaternion.equals(stood)).toBe(true)
  })
})

describe.skipIf(!existsSync(CHROME))('the thing the Sun stop stands on the body, drawn by the far Sun in a WebGL2 browser', () => {
  let browser: Browser
  let page: Page
  const film = new FilmDirector(plans)

  beforeAll(async () => {
    const dir = resolve(ROOT, 'out/work/farsun-test')
    mkdirSync(dir, { recursive: true })
    const entry = resolve(dir, 'page.js')
    writeFileSync(entry, PAGE)
    const built = await build({
      root: ROOT, configFile: false, logLevel: 'silent',
      build: { write: false, minify: false, target: 'es2022', lib: { entry, formats: ['iife'], name: 'farsunPage', fileName: 'farsun-page' } },
    })
    const output = (Array.isArray(built) ? built[0]! : built) as { output: { type: string; code?: string }[] }
    const code = output.output.find((x) => x.type === 'chunk')!.code!
    browser = await chromium.launch({ executablePath: CHROME, headless: true, args: CHROME_FLAGS })
    page = await browser.newPage()
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.route('http://farsun.test/**', (route) => {
      const url = route.request().url()
      if (url.endsWith('/page.js')) return route.fulfill({ status: 200, contentType: 'text/javascript', body: code })
      if (url === 'http://farsun.test/') return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><script src="./page.js"></script>' })
      return route.fulfill({ status: 404, body: '' })
    })
    await page.goto('http://farsun.test/')
    await page.waitForFunction(() => 'farsunArcade' in window, undefined, { timeout: 60000 })
    expect(errors).toEqual([])
  }, 300000)

  afterAll(async () => {
    await browser?.close()
  })

  it('is drawn over the body at its place in every frame from the end of the handover while that place is in the frame, also where the near plane of the film stands behind it, and the camera keeps its planes', async () => {
    const leg = config.segments.find((s) => s.kind === 'travel' && s.stop === plans[0]!.id)!
    const { width, height } = config.raw.formats.master
    const size = look.chromosphere.height
    const spot = new THREE.Vector3().fromArray(place.globe.spot).normalize()
    const views: { frame: number; cut: boolean; radius: number; v: Record<string, unknown> }[] = []
    for (let frame = leg.firstFrame; frame < leg.endFrame; frame++) {
      const shot = film.shotAt(frame, frame / config.fps)
      const f = shot.sun.far
      if (!f || f.share < 1 || wornAt(f.burn) <= 0) continue
      const centre = f.centre ?? shot.sun.dir.clone().multiplyScalar(1 / Math.sin(shot.sun.angularRadius))
      const seen = spot.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), f.spin).applyQuaternion(f.body).add(centre).applyQuaternion(shot.skyQuaternion.clone().invert())
      if (seen.z >= 0) continue
      const k = height / 2 / Math.tan((shot.camera.vfov * Math.PI) / 360)
      const x = width / 2 + (seen.x / -seen.z) * k
      const y = height / 2 + (seen.y / -seen.z) * k
      const radius = (size * k) / -seen.z
      if (x < 2 * radius || x > width - 2 * radius || y < 2 * radius || y > height - 2 * radius) continue
      const box = [Math.floor(x - radius), Math.floor(y - radius), Math.ceil(x + radius), Math.ceil(y + radius)]
      views.push({ frame, cut: shot.near > -seen.z, radius, v: { width, height, size, spot: spot.toArray(), box, vfov: shot.camera.vfov, near: shot.near, far: shot.far, q: shot.skyQuaternion.toArray(), centre: centre.toArray(), body: f.body.toArray(), spin: f.spin, time: f.time, holdTime: f.holdTime, exposure: f.exposure, burn: f.burn, vignette: shot.post.vignette } })
    }
    expect(views.length).toBeGreaterThan(0)
    expect(views.some((w) => w.cut)).toBe(true)
    for (const w of views) {
      const got = await page.evaluate((v) => (window as unknown as { farsunArcade: { count(v: unknown): { lit: number; dark: number; near: number; far: number } } }).farsunArcade.count(v), w.v)
      expect(got.lit, 'frame ' + w.frame).toBeGreaterThan(0)
      expect(got.dark, 'frame ' + w.frame).toBeGreaterThan((Math.PI * w.radius * w.radius) / 2)
      expect(got.near, 'frame ' + w.frame).toBe(w.v.near)
      expect(got.far, 'frame ' + w.frame).toBe(w.v.far)
    }
  }, 300000)
})
