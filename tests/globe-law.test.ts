import { createHash } from 'node:crypto'
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium, type Browser, type Page } from 'playwright-core'
import * as THREE from 'three'
import { build } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { AirLaw } from '../src/bodies/air'
import { HazeShell } from '../src/bodies/haze'
import { Planet, planetFrag } from '../src/bodies/planet'
import * as look from '../src/stops/mars/look'
import { AIR_LAW_GLSL, AIR_LAW_KNOTS_GLSL, airLawDepth, airLawDepthOut, airLawFactor, airLawGather, airLawGatherOut } from '../src/terrain/air'
import { CHROME, CHROME_FLAGS } from '../tools/lib/browser'
import { frozen } from './globe-frozen'

const ROOT = resolve(__dirname, '..')
const at = (path: string): string => JSON.stringify(resolve(ROOT, path))
const hash = (text: string): string => createHash('sha256').update(frozen(text)).digest('hex')
const KEPT = '81b0189383d53555c8623467df803b233644cf143249b11aa3e3a28f5548a308'
const SHELL = '692d6d8ba375114b2cd5dd0f4126a2d7edfa8a2b1569e9eaa8e6e23f0ced5e02'
const LAW: AirLaw = { light: [0.42, 0.3, 0.2], density: 15, scaleHeight: 0.0045, dayFrom: -0.2, dayTo: 0.6 }
const KNOTS: NonNullable<AirLaw['knots']> = { heights: [0.002, 0.005, 0.008], shares: [0.3, 0.6, 1] }
const count = (text: string, part: string): number => text.split(part).length - 1
const planet = (extra: object = {}): Planet => {
  const t = new THREE.Texture()
  return new Planet({ map: t, mapWidth: 8, height: t, heightWidth: 8, light: look.light, haze: look.haze, ...extra })
}

describe('the air law of the globe, off', () => {
  it('keeps the text, the uniforms and the blend of a planet and a shell that do not name it', () => {
    const p = planet({ grazing: look.grazing })
    expect(hash(p.material.fragmentShader)).toBe(KEPT)
    expect(p.material.fragmentShader).not.toContain('irLaw')
    expect(Object.keys(p.material.uniforms).filter((k) => k.startsWith('uAir'))).toEqual([])
    const shell = new HazeShell(look.shellHaze, { value: 0 })
    expect(hash(shell.material.fragmentShader)).toBe(SHELL)
    expect(Object.keys(shell.material.uniforms).filter((k) => k.startsWith('uAir'))).toEqual([])
    expect(shell.material.blending).toBe(THREE.AdditiveBlending)
    const base = { slots: 6, own: false, gain: false, minor: false, glow: false }
    expect(planetFrag({ ...base, law: false })).toBe(planetFrag(base))
    expect(planetFrag({ ...base, cap: true, law: false })).toBe(planetFrag({ ...base, cap: true }))
    p.dispose()
    shell.dispose()
  })
})

describe('the air law of the globe, on', () => {
  it('carries the one chunk word for word on the globe, on the cap and in the shell, and no other air on the ground', () => {
    const base = { slots: 6, own: false, gain: false, minor: false, glow: false }
    const shell = new HazeShell(look.shellHaze, { value: 0 }, LAW)
    for (const text of [planetFrag({ ...base, law: true }), planetFrag({ ...base, cap: true, law: true }), shell.material.fragmentShader]) {
      expect(count(text, AIR_LAW_GLSL)).toBe(1)
      expect(count(text, 'hazeLight(n, dir)')).toBe(0)
      expect(count(text, 'if (uGrazingShape.x > 0.0)')).toBe(0)
      expect(count(text, 'uExtinction)')).toBe(0)
    }
    const off = planetFrag(base).split('\n')
    const on = planetFrag({ ...base, law: true }).split('\n')
    const gone = off.filter((l) => !on.includes(l))
    const come = on.filter((l) => !off.includes(l) && !AIR_LAW_GLSL.split('\n').includes(l))
    expect(gone[0]).toBe('  vec3 at;')
    expect(gone[1]).toBe('  float tau = hazeDepth(dir, true, at);')
    expect(gone.length).toBe(10)
    expect(come).toEqual([
      'uniform vec3 uAirLight;',
      'uniform vec4 uAirLaw;',
      '  col = airLaw(col, uAirLight * smoothstep(uAirLaw.z, uAirLaw.w, ndl0), airLawFactor(airLawDepth(uCam, n, uAirLaw.y), uAirLaw.x));',
    ])
    expect(count(planetFrag({ ...base, cap: true, law: true }), 'airLawFactor(airLawDepth(uCam, n * (1.0 + vCapH), uAirLaw.y), uAirLaw.x)')).toBe(1)
    expect(count(shell.material.fragmentShader, 'airLawFactor(airLawDepthOut(uCam, dir, uAirLaw.y), uAirLaw.x)')).toBe(1)
    shell.dispose()
  })

  it('takes the second chunk after the first only where the stop gives knots, and then gathers the light along the same path', () => {
    const base = { slots: 6, own: false, gain: false, minor: false, glow: false }
    const plain = new HazeShell(look.shellHaze, { value: 0 }, LAW)
    const shell = new HazeShell(look.shellHaze, { value: 0 }, { ...LAW, knots: KNOTS })
    for (const text of [planetFrag({ ...base, law: true }), planetFrag({ ...base, cap: true, law: true }), plain.material.fragmentShader, planetFrag({ ...base, knots: true })]) {
      expect(count(text, 'airLawGather')).toBe(0)
      expect(count(text, 'uAirKnots')).toBe(0)
    }
    for (const text of [planetFrag({ ...base, law: true, knots: true }), planetFrag({ ...base, cap: true, law: true, knots: true }), shell.material.fragmentShader]) {
      expect(count(text, AIR_LAW_GLSL)).toBe(1)
      expect(count(text, AIR_LAW_KNOTS_GLSL)).toBe(1)
      expect(text.indexOf(AIR_LAW_KNOTS_GLSL)).toBeGreaterThan(text.indexOf(AIR_LAW_GLSL))
      expect(count(text, 'hazeLight(n, dir)')).toBe(0)
    }
    const on = planetFrag({ ...base, law: true }).split('\n')
    const knots = planetFrag({ ...base, law: true, knots: true }).split('\n')
    expect(on.filter((l) => !knots.includes(l))).toEqual(['  col = airLaw(col, uAirLight * smoothstep(uAirLaw.z, uAirLaw.w, ndl0), airLawFactor(airLawDepth(uCam, n, uAirLaw.y), uAirLaw.x));'])
    expect(knots.filter((l) => !on.includes(l) && !AIR_LAW_KNOTS_GLSL.split('\n').includes(l))).toEqual([
      'uniform vec3 uAirKnots;',
      'uniform vec3 uAirShares;',
      '  col = max(col * airLawFactor(airLawDepth(uCam, n, uAirLaw.y), uAirLaw.x) + uAirLight * smoothstep(uAirLaw.z, uAirLaw.w, ndl0) * airLawGather(uCam, n, uAirLaw.y, uAirLaw.x, uAirKnots, uAirShares), vec3(0.0));',
    ])
    expect(count(planetFrag({ ...base, cap: true, law: true, knots: true }), 'airLawGather(uCam, n * (1.0 + vCapH), uAirLaw.y, uAirLaw.x, uAirKnots, uAirShares)')).toBe(1)
    expect(count(shell.material.fragmentShader, 'airLawGatherOut(uCam, dir, uAirLaw.y, uAirLaw.x, uAirKnots, uAirShares) * uGain, through)')).toBe(1)
    expect((shell.material.uniforms.uAirKnots!.value as THREE.Vector3).toArray()).toEqual(KNOTS.heights)
    expect((shell.material.uniforms.uAirShares!.value as THREE.Vector3).toArray()).toEqual(KNOTS.shares)
    const p = planet({ airLaw: { ...LAW, knots: KNOTS } })
    expect((p.material.uniforms.uAirKnots!.value as THREE.Vector3).toArray()).toEqual(KNOTS.heights)
    expect((p.material.uniforms.uAirShares!.value as THREE.Vector3).toArray()).toEqual(KNOTS.shares)
    expect(Object.keys(plain.material.uniforms).filter((k) => k === 'uAirKnots' || k === 'uAirShares')).toEqual([])
    expect(() => planet({ airLaw: { ...LAW, knots: { heights: [0.002, 0.001, 0.008], shares: [1, 1, 1] } } })).toThrow('three heights that rise')
    expect(() => new HazeShell(look.shellHaze, { value: 0 }, { ...LAW, knots: { heights: [0, 0.001, 0.008], shares: [1, -0.1, 1] } })).toThrow('three shares of 0 or more')
    p.dispose()
    plain.dispose()
    shell.dispose()
  })

  it('holds the numbers of the stop in uniforms and lays the shell over what stands behind it', () => {
    const p = planet({ airLaw: LAW })
    expect((p.material.uniforms.uAirLight!.value as THREE.Vector3).toArray()).toEqual(LAW.light)
    expect((p.material.uniforms.uAirLaw!.value as THREE.Vector4).toArray()).toEqual([15, 0.0045, -0.2, 0.6])
    const shell = new HazeShell(look.shellHaze, { value: 0 }, LAW)
    expect((shell.material.uniforms.uAirLaw!.value as THREE.Vector4).toArray()).toEqual([15, 0.0045, -0.2, 0.6])
    const m = shell.material
    expect([m.blending, m.blendSrc, m.blendDst, m.blendSrcAlpha, m.blendDstAlpha, m.transparent, m.depthWrite]).toEqual([THREE.CustomBlending, THREE.OneFactor, THREE.OneMinusSrcAlphaFactor, THREE.ZeroFactor, THREE.OneFactor, true, false])
    p.dispose()
    shell.dispose()
  })

  it('refuses a second air beside the law and numbers that give no air', () => {
    expect(() => planet({ airLaw: LAW, grazing: look.grazing })).toThrow('one air')
    expect(() => planet({ airLaw: { ...LAW, scaleHeight: 0 } })).toThrow('measured for a scale height of 0.0005 to 0.1 radii, not 0')
    expect(() => new HazeShell(look.shellHaze, { value: 0 }, { ...LAW, scaleHeight: 0.11 })).toThrow('not 0.11')
    expect(() => planet({ airLaw: { ...LAW, density: -1 } })).toThrow('density of 0 or more')
    expect(() => new HazeShell(look.shellHaze, { value: 0 }, { ...LAW, dayTo: -0.2 })).toThrow('day edge that rises')
  })
})

const PAGE = `
import * as THREE from 'three'
import { Planet } from ${at('src/bodies/planet.ts')}
import { HazeShell } from ${at('src/bodies/haze.ts')}
import { AIR_LAW_GLSL } from ${at('src/terrain/air.ts')}
import { diagUniform } from ${at('src/diagnostics/diag.ts')}

const renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas') })
renderer.autoClear = false

function shoot(scene, cam, width, height, back) {
  const target = new THREE.WebGLRenderTarget(width, height, { type: THREE.FloatType })
  renderer.setRenderTarget(target)
  renderer.setClearColor(new THREE.Color(back[0], back[1], back[2]), back[3])
  renderer.clear(true, true, true)
  renderer.render(scene, cam)
  const out = new Float32Array(width * height * 4)
  renderer.readRenderTargetPixels(target, 0, 0, width, height, out)
  renderer.setRenderTarget(null)
  renderer.setClearColor(0x000000, 0)
  target.dispose()
  return Array.from(out)
}

function lens(o) {
  const cam = new THREE.PerspectiveCamera(o.vfov, o.width / o.height, o.near, 10)
  cam.up.fromArray(o.up)
  cam.lookAt(new THREE.Vector3().fromArray(o.target).sub(new THREE.Vector3().fromArray(o.eye)))
  cam.updateMatrixWorld(true)
  const rays = []
  for (let j = 0; j < o.height; j++) for (let i = 0; i < o.width; i++) {
    const d = new THREE.Vector3((i + 0.5) / o.width * 2 - 1, (j + 0.5) / o.height * 2 - 1, 0.5).unproject(cam).normalize()
    rays.push(d.x, d.y, d.z)
  }
  return { cam, rays }
}

function ground(o) {
  const height = new THREE.DataTexture(new Float32Array([0.5, 0.5, 0.5, 0.5]), 2, 2, THREE.RedFormat, THREE.FloatType)
  height.minFilter = height.magFilter = THREE.LinearFilter
  height.needsUpdate = true
  const data = new Uint8Array(8 * 8 * 4)
  for (let i = 0; i < 64; i++) data.set([150, 110, 80, 255], i * 4)
  const map = new THREE.DataTexture(data, 8, 8, THREE.RGBAFormat, THREE.UnsignedByteType)
  map.minFilter = map.magFilter = THREE.LinearFilter
  map.needsUpdate = true
  const planet = new Planet({
    map, mapWidth: 8, height, heightWidth: 2048, segments: 640,
    light: { wrap: 0.2, power: 1, gain: 1, night: [0, 0, 0], sun: [0.2, 0.15, 0.1], relief: 0, reliefNear: 0, limb: 0 },
    haze: { scaleHeight: 0.01, depth: o.haze ? 0.5 : 0, day: [0.5, 0.4, 0.3], twilight: [0.1, 0.1, 0.1], strength: o.haze ? 1.5 : 0, extinction: 1, forward: 0, top: 1 },
    ...(o.law ? { airLaw: o.law } : {}),
  })
  const { cam, rays } = lens(o)
  const eye = new THREE.Vector3().fromArray(o.eye)
  planet.mesh.position.copy(eye).negate()
  const world = new THREE.Scene()
  world.add(planet.mesh)
  planet.update(eye, new THREE.Vector3().fromArray(o.sun).normalize(), 0, o.gain, o.weight)
  diagUniform.value = 0
  const pixels = shoot(world, cam, o.width, o.height, [0, 0, 0, 0])
  planet.dispose()
  height.dispose()
  map.dispose()
  return { pixels, rays }
}

function shell(o) {
  const s = new HazeShell({ scaleHeight: o.law.scaleHeight, depth: 0.5, day: [0.5, 0.4, 0.3], twilight: [0.1, 0.1, 0.1], strength: 1.5, extinction: 1, forward: 0, top: o.top }, { value: 0 }, o.law)
  const { cam, rays } = lens(o)
  const eye = new THREE.Vector3().fromArray(o.eye)
  s.mesh.position.copy(eye).negate()
  s.material.uniforms.uCam.value.copy(eye)
  s.material.uniforms.uSunW.value.fromArray(o.sun).normalize()
  s.material.uniforms.uGain.value = o.gain
  const world = new THREE.Scene()
  world.add(s.mesh)
  s.mesh.visible = false
  const behind = shoot(world, cam, o.width, o.height, o.back)
  s.mesh.visible = true
  const pixels = shoot(world, cam, o.width, o.height, o.back)
  s.dispose()
  return { pixels, rays, behind }
}

function card(rows) {
  const n = rows.length
  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: { uA: { value: rows.map((r) => new THREE.Vector3().fromArray(r.a)) }, uB: { value: rows.map((r) => new THREE.Vector3().fromArray(r.b)) }, uH: { value: rows.map((r) => r.h) } },
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: 'precision highp float;\\nuniform vec3 uA[' + n + '];\\nuniform vec3 uB[' + n + '];\\nuniform float uH[' + n + '];\\nout vec4 outColor;\\n' + AIR_LAW_GLSL + '\\nvoid main() {\\n  int i = int(gl_FragCoord.x);\\n  float depth = airLawDepth(uA[i], uB[i], uH[i]);\\n  outColor = vec4(depth, airLawDepthOut(uA[i], normalize(uB[i] - uA[i]), uH[i]), airLawFactor(depth, 15.0), 1.0);\\n}',
  })
  const scene = new THREE.Scene()
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material))
  const pixels = shoot(scene, new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), n, 1, [0, 0, 0, 0])
  material.dispose()
  return pixels
}

window.law = { ground, shell, card }
`

type V = [number, number, number]
interface Shot { pixels: number[]; rays: number[]; behind?: number[] }
interface View { eye: V; target: V; up: V; vfov: number; width: number; height: number; near: number; sun: V; gain: number }
const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const unit = (a: V): V => {
  const l = Math.hypot(a[0], a[1], a[2])
  return [a[0] / l, a[1] / l, a[2] / l]
}
const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}
const ray = (s: Shot, i: number): V => [s.rays[i * 3]!, s.rays[i * 3 + 1]!, s.rays[i * 3 + 2]!]
const rgb = (s: Shot, i: number): V => [s.pixels[i * 4]!, s.pixels[i * 4 + 1]!, s.pixels[i * 4 + 2]!]
const have = existsSync(CHROME)
const NOTES = resolve(ROOT, 'out/work/globe-law-test/measured.txt')
const note = (line: string): void => appendFileSync(NOTES, line + '\n')

describe.skipIf(!have)('the air law of the globe in a WebGL2 browser', () => {
  let browser: Browser
  let page: Page
  const call = <T>(name: 'ground' | 'shell' | 'card', arg: unknown): Promise<T> => page.evaluate(([n, a]) => (window as unknown as { law: Record<string, (x: unknown) => unknown> }).law[n as string]!(a) as T, [name, arg] as [string, unknown])

  beforeAll(async () => {
    const dir = resolve(ROOT, 'out/work/globe-law-test')
    mkdirSync(dir, { recursive: true })
    const entry = resolve(dir, 'page.js')
    writeFileSync(entry, PAGE)
    writeFileSync(NOTES, '')
    const built = await build({
      root: ROOT, configFile: false, logLevel: 'silent',
      build: { write: false, minify: false, target: 'es2022', lib: { entry, formats: ['iife'], name: 'lawPage', fileName: 'law-page' } },
    })
    const output = (Array.isArray(built) ? built[0]! : built) as { output: { type: string; code?: string }[] }
    const code = output.output.find((x) => x.type === 'chunk')!.code!
    browser = await chromium.launch({ executablePath: CHROME, headless: true, args: CHROME_FLAGS })
    page = await browser.newPage()
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    await page.route('http://law.test/**', (route) => {
      const url = route.request().url()
      if (url.endsWith('/page.js')) return route.fulfill({ status: 200, contentType: 'text/javascript', body: code })
      if (url === 'http://law.test/') return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><script src="./page.js"></script>' })
      return route.fulfill({ status: 404, body: '' })
    })
    await page.goto('http://law.test/')
    await page.waitForFunction(() => 'law' in window, undefined, { timeout: 60000 })
    expect(errors).toEqual([])
  }, 180000)

  afterAll(async () => {
    await browser?.close()
  }, 60000)

  it('gives in the card the depths of the twin, from the hold to a path a ten thousandth of a radius long', async () => {
    const rows: { a: V; b: V; h: number }[] = []
    const turn = (p: V): V => [p[0] * 0.36 + p[1] * 0.48 - p[2] * 0.8, -p[0] * 0.8 + p[1] * 0.6, p[0] * 0.48 + p[1] * 0.64 + p[2] * 0.6]
    for (const h of [0.0045, 0.0204, 0.1]) {
      for (const up of [2, 0.3, 0.012, 0.002]) {
        const edge = Math.acos(1 / (1 + up))
        for (const away of [0, 0.4, 0.96]) rows.push({ a: turn([0, 0, 1 + up]), b: turn([Math.sin(edge * away), 0, Math.cos(edge * away)]), h })
        for (const over of [0.5, 2, 6]) rows.push({ a: turn([0, 0, 1 + up]), b: turn([Math.sin(edge) * (1 + over * h), 0, Math.cos(edge) * (1 + over * h)]), h })
      }
      for (const length of [1e-4, 1e-3, 1e-2]) rows.push({ a: turn([0, 0, 1.0008]), b: turn([Math.sin(length) * 1.0009, 0, Math.cos(length) * 1.0009]), h })
      rows.push({ a: turn([0, 0, 1.002]), b: turn([Math.sin(0.01) * (1 - 3 * h), 0, Math.cos(0.01) * (1 - 3 * h)]), h })
      rows.push({ a: turn([0, 0, 1.002]), b: turn([Math.sin(0.2) * 1.3, 0, Math.cos(0.2) * 1.3]), h })
    }
    const out = await call<number[]>('card', rows)
    let worst = 0
    let worstOut = 0
    let clear = 0
    rows.forEach((r, i) => {
      const depth = airLawDepth(r.a, r.b, r.h)
      const dir = unit([r.b[0] - r.a[0], r.b[1] - r.a[1], r.b[2] - r.a[2]])
      const whole = airLawDepthOut(r.a, dir, r.h)
      expect(Number.isFinite(out[i * 4]!)).toBe(true)
      worst = Math.max(worst, Math.abs(out[i * 4]! - depth) / (depth + 1e-3))
      expect(Number.isFinite(out[i * 4 + 1]!)).toBe(true)
      const reach = -dot(r.a, dir)
      if (reach <= 0 || dot(r.a, r.a) - reach * reach > 0.99) {
        clear++
        worstOut = Math.max(worstOut, Math.abs(out[i * 4 + 1]! - whole) / (whole + 1e-3))
      }
      expect(Math.abs(out[i * 4 + 2]! - airLawFactor(depth, 15))).toBeLessThan(1e-3)
    })
    note('card against twin, ' + rows.length + ' rows: worst depth error ' + worst.toExponential(2) + ', worst depth out error ' + worstOut.toExponential(2) + ' on the ' + clear + ' lines that clear the ball (of the depth plus 0.001 radii)')
    expect(clear).toBeGreaterThan(40)
    expect(worst).toBeLessThan(2e-3)
    expect(worstOut).toBeLessThan(2e-3)
  }, 120000)

  it('lays the air over the ground by the path from the eye to the point, with the day term at the point, and no other air', async () => {
    const view: View & { weight: number } = { eye: [0, 0, 1.012], target: [0.97, 0.1, 0.77], up: [0, 0, 1], vfov: 6, width: 9, height: 7, near: 0.0005, sun: [1, 0.2, 0.35], gain: 1.3, weight: 0.8 }
    const bare = await call<Shot>('ground', { ...view, haze: false })
    const law = { ...LAW, density: 60 }
    const none = await call<Shot>('ground', { ...view, haze: true, law: { ...law, density: 0 } })
    const on = await call<Shot>('ground', { ...view, haze: true, law })
    const sun = unit(view.sun)
    let worst = 0
    let least = 1
    let most = 0
    for (let i = 0; i < view.width * view.height; i++) {
      const d = ray(on, i)
      const b = -dot(view.eye, d)
      const disc = 1 - (dot(view.eye, view.eye) - b * b)
      expect(disc).toBeGreaterThan(0)
      const t = b - Math.sqrt(disc)
      const point: V = [view.eye[0] + d[0] * t, view.eye[1] + d[1] * t, view.eye[2] + d[2] * t]
      const f = airLawFactor(airLawDepth(view.eye, point, law.scaleHeight), law.density)
      const day = smooth(law.dayFrom, law.dayTo, dot(point, sun))
      least = Math.min(least, f)
      most = Math.max(most, f)
      const ground = rgb(bare, i)
      const got = rgb(on, i)
      const flat = rgb(none, i)
      for (let c = 0; c < 3; c++) {
        expect(ground[c]!).toBeGreaterThan(0.001)
        expect(Math.abs(flat[c]! - ground[c]!)).toBeLessThan(1e-5)
        const want = ground[c]! * f + law.light[c]! * day * (1 - f) * view.gain * view.weight
        worst = Math.max(worst, Math.abs(got[c]! - want) / want)
      }
      expect(on.pixels[i * 4 + 3]).toBe(1)
    }
    const knots = await call<Shot>('ground', { ...view, haze: true, law: { ...law, knots: KNOTS } })
    const whole = await call<Shot>('ground', { ...view, haze: true, law: { ...law, knots: { heights: KNOTS.heights, shares: [1, 1, 1] } } })
    let worstKnots = 0
    let worstWhole = 0
    let leastShare = 1
    let mostShare = 0
    for (let i = 0; i < view.width * view.height; i++) {
      const d = ray(on, i)
      const b = -dot(view.eye, d)
      const t = b - Math.sqrt(1 - (dot(view.eye, view.eye) - b * b))
      const point: V = [view.eye[0] + d[0] * t, view.eye[1] + d[1] * t, view.eye[2] + d[2] * t]
      const f = airLawFactor(airLawDepth(view.eye, point, law.scaleHeight), law.density)
      const g = airLawGather(view.eye, point, law.scaleHeight, law.density, KNOTS.heights, KNOTS.shares)
      const day = smooth(law.dayFrom, law.dayTo, dot(point, sun))
      leastShare = Math.min(leastShare, g / (1 - f))
      mostShare = Math.max(mostShare, g / (1 - f))
      for (let c = 0; c < 3; c++) {
        const ground = rgb(bare, i)[c]!
        const want = ground * f + law.light[c]! * day * g * view.gain * view.weight
        worstKnots = Math.max(worstKnots, Math.abs(rgb(knots, i)[c]! - want) / want)
        worstWhole = Math.max(worstWhole, Math.abs(rgb(whole, i)[c]! - rgb(on, i)[c]!) / rgb(on, i)[c]!)
      }
      expect(knots.pixels[i * 4 + 3]).toBe(1)
    }
    note('ground under the law with knots, ' + view.width * view.height + ' pixels: the path gathers ' + leastShare.toFixed(3) + ' to ' + mostShare.toFixed(3) + ' of what it gathers with every share at 1, worst error against the twin ' + worstKnots.toExponential(2) + '; with every share at 1 against the law without knots worst ' + worstWhole.toExponential(2))
    expect(mostShare).toBeLessThan(0.95)
    expect(worstKnots).toBeLessThan(2e-3)
    expect(worstWhole).toBeLessThan(2e-3)
    note('ground under the law, ' + view.width * view.height + ' pixels: factor ' + least.toFixed(3) + ' to ' + most.toFixed(3) + ', worst error against the twin ' + worst.toExponential(2))
    expect(most - least).toBeGreaterThan(0.15)
    expect(worst).toBeLessThan(2e-3)
  }, 120000)

  it('dims what stands behind the shell by the factor of the whole path and adds the light of the air, from inside and from outside', async () => {
    const back: [number, number, number, number] = [0.5, 0.25, 1, 0.75]
    const views: View[] = [
      { eye: [0, 0, 1.002], target: [1, 0.3, 1.2], up: [0, 0, 1], vfov: 12, width: 9, height: 7, near: 0.0005, sun: [1, 0.2, 0.35], gain: 1.3 },
      { eye: [0, 0, 1.008], target: [0.9986, 0, 0.9557], up: [0, 0, 1], vfov: 3, width: 9, height: 7, near: 0.0005, sun: [-0.3, 0.2, 1], gain: 0.7 },
      { eye: [0, -3, 0], target: [1.01, -0.175, 0], up: [0, 0, 1], vfov: 0.3, width: 72, height: 56, near: 0.01, sun: [1, -0.4, 0.2], gain: 1 },
    ]
    for (const view of views) {
      const on = await call<Shot>('shell', { ...view, law: LAW, top: 10, back })
      const sun = unit(view.sun)
      let worst = 0
      let least = 1
      let most = 0
      for (let i = 0; i < view.width * view.height; i++) {
        const d = ray(on, i)
        const b = -dot(view.eye, d)
        const rt2 = dot(view.eye, view.eye) - b * b
        expect(b <= 0 || rt2 > 1).toBe(true)
        const f = airLawFactor(airLawDepthOut(view.eye, d, LAW.scaleHeight), LAW.density)
        const low: V = b > 0 ? unit([view.eye[0] + d[0] * b, view.eye[1] + d[1] * b, view.eye[2] + d[2] * b]) : unit(view.eye)
        const day = smooth(LAW.dayFrom, LAW.dayTo, dot(low, sun))
        least = Math.min(least, f)
        most = Math.max(most, f)
        const got = rgb(on, i)
        for (let c = 0; c < 3; c++) {
          const star = on.behind![i * 4 + c]!
          expect(star).toBeGreaterThan(0.1)
          const want = star * f + LAW.light[c]! * day * (1 - f) * view.gain
          worst = Math.max(worst, Math.abs(got[c]! - want) / want)
        }
        expect(on.pixels[i * 4 + 3]).toBe(on.behind![i * 4 + 3])
        expect(on.pixels[i * 4 + 3]).toBe(0.75)
      }
      const knots = await call<Shot>('shell', { ...view, law: { ...LAW, knots: KNOTS }, top: 10, back })
      let worstKnots = 0
      let leastShare = 1
      let mostShare = 0
      for (let i = 0; i < view.width * view.height; i++) {
        const d = ray(on, i)
        const b = -dot(view.eye, d)
        const f = airLawFactor(airLawDepthOut(view.eye, d, LAW.scaleHeight), LAW.density)
        const g = airLawGatherOut(view.eye, d, LAW.scaleHeight, LAW.density, KNOTS.heights, KNOTS.shares)
        const low: V = b > 0 ? unit([view.eye[0] + d[0] * b, view.eye[1] + d[1] * b, view.eye[2] + d[2] * b]) : unit(view.eye)
        const day = smooth(LAW.dayFrom, LAW.dayTo, dot(low, sun))
        leastShare = Math.min(leastShare, g / (1 - f))
        mostShare = Math.max(mostShare, g / (1 - f))
        for (let c = 0; c < 3; c++) {
          const want = on.behind![i * 4 + c]! * f + LAW.light[c]! * day * g * view.gain
          worstKnots = Math.max(worstKnots, Math.abs(rgb(knots, i)[c]! - want) / want)
        }
        expect(knots.pixels[i * 4 + 3]).toBe(0.75)
      }
      note('shell under the law with knots, eye ' + (Math.hypot(...view.eye) - 1).toFixed(3) + ' radii up, ' + view.width * view.height + ' pixels: the path gathers ' + leastShare.toFixed(3) + ' to ' + mostShare.toFixed(3) + ' of what it gathers with every share at 1, worst error against the twin ' + worstKnots.toExponential(2))
      expect(worstKnots).toBeLessThan(2e-3)
      note('shell under the law, eye ' + (Math.hypot(...view.eye) - 1).toFixed(3) + ' radii up, ' + view.width * view.height + ' pixels: factor ' + least.toFixed(3) + ' to ' + most.toFixed(3) + ', worst error against the twin ' + worst.toExponential(2))
      expect(worst).toBeLessThan(2e-3)
    }
  }, 120000)
})
