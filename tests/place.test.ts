import * as THREE from 'three'
import { afterAll, describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { needs } from '../src/core/caps'
import { edgeReach, Place, placeCamera, placeGeometry, placeLayout, placeSkyGrad, placeUv, type PlaceLayout } from '../src/core/place'
import type { Pose, Shot } from '../src/core/types'
import { parseProbe, probeString } from '../src/diagnostics/probe'
import { FilmDirector } from '../src/director/film'
import { forceTop, handoverOf, placeWeight, skyTurnWeight, skyWeight, type HandoverParams } from '../src/director/handover'
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
// What a stop's own plan asks of the place picture in a dive or a rise: undefined where it asks nothing. The options that are off unless a stop
// asks are held against this, so no test names the stops that ask.
const asked = (p: (typeof plans)[number], kind: (typeof kinds)[number]) => (p as unknown as { p?: { handover?: HandoverParams } }).p?.handover?.[kind]?.place

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
  const reachDeg = 8
  const reaching = { ...state, limbReachDeg: reachDeg }

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
  it('keeps a direction of the sky where the twin saw it and calls the sky below the horizon of the twin unseen, when the limb is not held', () => {
    const layout = placeLayout(master, {}, 16384)
    const pic = new THREE.PerspectiveCamera()
    placeCamera(pic, master, layout, twin, 0.0001, 10)
    const camera: Pose = { position: twin.position.clone().multiplyScalar(1.02), quaternion: twin.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.25, 0, 0))), vfov: 60 }
    const cam = frameCamera(camera, master)
    const g = placeGeometry(camera, { ...state, limbReachDeg: 0 })
    expect(g.reach).toBe(0)
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
  it('holds the horizon of the picture on the limb of the camera: the sky above is lifted by the gap, less and less up to the reach', () => {
    const layout = placeLayout(master, {}, 16384)
    const pic = new THREE.PerspectiveCamera()
    placeCamera(pic, master, layout, twin, 0.0001, 10)
    const out = twin.position.clone().normalize()
    const side = new THREE.Vector3(1, 0, 0).cross(out).normalize()
    const ahead = new THREE.Vector3(0, 0, -1).applyQuaternion(twin.quaternion)
    ahead.addScaledVector(out, -ahead.dot(out)).normalize()
    const sinTwin = Math.sqrt(1 - 1 / twin.position.lengthSq())
    const cameras: Pose[] = [
      { position: twin.position.clone().multiplyScalar(1.0005), quaternion: twin.quaternion.clone(), vfov: 60 },
      { position: twin.position.clone().multiplyScalar(1.003).addScaledVector(side, 0.004), quaternion: twin.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 0.05, 0))), vfov: 60 },
      { position: twin.position.clone().addScaledVector(ahead, -0.03).setLength(twin.position.length() * 1.0002), quaternion: twin.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.05, -0.1, 0))), vfov: 60 },
      { position: twin.position.clone().multiplyScalar(1.12), quaternion: twin.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.2, 0, 0))), vfov: 60 },
    ]
    let lifted = 0
    let lowered = 0
    let wide = 0
    for (const camera of cameras) {
      const g = placeGeometry(camera, reaching)
      const off = placeGeometry(camera, state)
      expect(c.place.limbReachDeg).toBe(0)
      expect(off.reach).toBe(0)
      expect(g.reach).toBeCloseTo(Math.sin(THREE.MathUtils.degToRad(reachDeg)), 12)
      const cam = frameCamera(camera, master)
      const upCamera = camera.position.clone().normalize()
      const sinCamera = Math.sqrt(1 - 1 / camera.position.lengthSq())
      const world = (u: [number, number]): THREE.Vector3 => new THREE.Vector3(u[0] * 2 - 1, u[1] * 2 - 1, 0.5).unproject(pic).normalize()
      for (let x = 30; x < master.width; x += 170) {
        let last = -Infinity
        let first = true
        for (let y = master.height - 0.5; y > 0; y -= 1) {
          const ray = pixelRay(cam, master, x, y)
          const got = placeUv(g, projOf(pic), ray)
          if (got.hit) continue
          const plain = placeUv(off, projOf(pic), ray)
          const d = ray.clone().normalize().applyQuaternion(camera.quaternion)
          const own = d.dot(upCamera) + sinCamera
          const gap = own - (d.dot(out) + sinTwin)
          const reach = Math.max(g.reach, 2 * Math.abs(gap))
          expect(got.honest).toBe(1)
          if (!got.front || !plain.front) continue
          const e = world(got.uv)
          const under = e.dot(out) + sinTwin
          const t = Math.min(own / reach, 1)
          expect(under).toBeCloseTo(own - gap * t * t * (3 - 2 * t), 6)
          if (first) expect(under).toBeLessThan(own + 1e-6 + Math.abs(gap) * 3 * (own / reach) ** 2)
          first = false
          expect(under).toBeGreaterThan(-1e-7)
          expect(under).toBeGreaterThan(last)
          last = under
          const level = (v: THREE.Vector3): THREE.Vector3 => v.clone().addScaledVector(out, -v.dot(out)).normalize()
          if (Math.abs(d.dot(out)) < 0.99) expect(level(e).dot(level(d))).toBeGreaterThan(1 - 1e-9)
          if (own >= reach) {
            expect(got.uv[0]).toBeCloseTo(plain.uv[0], 9)
            expect(got.uv[1]).toBeCloseTo(plain.uv[1], 9)
          }
          if (2 * Math.abs(gap) > g.reach) wide++
          if (gap > 1e-6 && own < reach) lifted++
          if (gap < -1e-6 && own < reach) lowered++
        }
      }
    }
    expect(lifted).toBeGreaterThan(100)
    expect(lowered).toBeGreaterThan(100)
    expect(wide).toBeGreaterThan(100)
  })
  it('fills the ground the twin could not see with the horizon of the picture, and holds the weight in a band under the limb', () => {
    const layout = placeLayout(master, {}, 16384)
    const pic = new THREE.PerspectiveCamera()
    placeCamera(pic, master, layout, twin, 0.0001, 10)
    const out = twin.position.clone().normalize()
    const sinTwin = Math.sqrt(1 - 1 / twin.position.lengthSq())
    const [from, to] = c.place.limbHoldDeg.map((a) => Math.sin(THREE.MathUtils.degToRad(a))) as [number, number]
    const world = (u: [number, number]): THREE.Vector3 => new THREE.Vector3(u[0] * 2 - 1, u[1] * 2 - 1, 0.5).unproject(pic).normalize()
    let beyond = 0
    let held = 0
    let free = 0
    for (const lift of [1.0003, 1.002, 1.02]) {
      const camera: Pose = { position: twin.position.clone().multiplyScalar(lift), quaternion: twin.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(lift > 1.01 ? -0.1 : 0.02, 0, 0))), vfov: 60 }
      const cam = frameCamera(camera, master)
      const g = placeGeometry(camera, reaching)
      const off = placeGeometry(camera, { ...state, limbReachDeg: 0 })
      const sinCamera = Math.sqrt(1 - 1 / camera.position.lengthSq())
      const upCamera = camera.position.clone().normalize()
      for (let x = 30; x < master.width; x += 340) {
        let edge: { ground: [number, number]; sky: [number, number] | null } | null = null
        let limb = master.height
        while (limb > 0 && placeUv(g, projOf(pic), pixelRay(cam, master, x, limb - 0.5)).hit) limb--
        const rows: number[] = []
        for (let y = master.height - 0.5; y > limb + 40; y -= 7) rows.push(y)
        for (let y = limb + 40; y > limb + 2; y -= 0.5) rows.push(y)
        for (let y = limb + 2; y > limb - 2; y -= 0.05) rows.push(y)
        for (const y of rows) {
          const ray = pixelRay(cam, master, x, y)
          const got = placeUv(g, projOf(pic), ray)
          const plain = placeUv(off, projOf(pic), ray)
          expect(plain.hold).toBe(0)
          if (!got.hit) {
            expect(got.hold).toBe(0)
            if (edge && !edge.sky) edge.sky = got.uv
            continue
          }
          edge = { ground: got.uv, sky: null }
          const d = ray.clone().normalize().applyQuaternion(camera.quaternion)
          const depth = -d.dot(upCamera) - sinCamera
          const t = Math.min(Math.max((depth - from) / (to - from), 0), 1)
          expect(got.hold).toBeCloseTo(1 - t * t * (3 - 2 * t), 6)
          if (got.hold === 1) held++
          if (got.hold === 0) free++
          expect(got.honest).toBe(plain.honest)
          if (plain.honest >= 0) {
            expect(got.uv[0]).toBeCloseTo(plain.uv[0], 9)
            expect(got.uv[1]).toBeCloseTo(plain.uv[1], 9)
            continue
          }
          beyond++
          const e = world(got.uv)
          expect(e.dot(out) + sinTwin).toBeCloseTo(0, 6)
          const b = d.dot(camera.position)
          const point = camera.position.clone().addScaledVector(d, -b - Math.sqrt(b * b - (camera.position.lengthSq() - 1)))
          const level = (v: THREE.Vector3): THREE.Vector3 => v.clone().addScaledVector(out, -v.dot(out)).normalize()
          expect(level(e).dot(level(point))).toBeGreaterThan(1 - 1e-9)
        }
        if (edge?.sky) {
          expect(Math.abs(edge.sky[1] - edge.ground[1]) * layout.height).toBeLessThan(1)
          expect(Math.abs(edge.sky[0] - edge.ground[0]) * layout.width).toBeLessThan(1)
        }
      }
    }
    expect(beyond).toBeGreaterThan(50)
    expect(held).toBeGreaterThan(50)
    expect(free).toBeGreaterThan(50)
  })
  it('knows the size of a pixel of sky in the picture without asking its neighbours, so a pixel on the limb is not judged by the ground beside it', () => {
    const layout = placeLayout(master, {}, 16384)
    const pic = new THREE.PerspectiveCamera()
    placeCamera(pic, master, layout, twin, 0.0001, 10)
    const cameras: Pose[] = [
      twin,
      { position: twin.position.clone().multiplyScalar(1.003), quaternion: twin.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 0.05, 0.3))), vfov: 60 },
      { position: twin.position.clone().multiplyScalar(1.12), quaternion: twin.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.2, 0.4, -0.2))), vfov: 38 },
    ]
    let seen = 0
    for (const camera of cameras) {
      const off = placeGeometry(camera, { ...state, limbReachDeg: 0 })
      const cam = frameCamera(camera, master)
      const e = cam.projectionMatrix.elements
      const step: [number, number] = [2 / master.width / e[0]!, 2 / master.height / e[5]!]
      const h = 0.25
      for (let x = 40.5; x < master.width; x += 233) {
        for (let y = 20.5; y < master.height; y += 97) {
          const at = (dx: number, dy: number) => placeUv(off, projOf(pic), pixelRay(cam, master, x + dx, y + dy))
          const mid = at(0, 0)
          const around = [at(h, 0), at(-h, 0), at(0, -h), at(0, h)]
          if (mid.hit || !mid.front || around.some((a) => a.hit || !a.front)) continue
          const got = placeSkyGrad(off, projOf(pic), pixelRay(cam, master, x, y), step)
          const size = Math.hypot(got.dx[0], got.dx[1], got.dy[0], got.dy[1])
          expect(Math.abs(got.dx[0] - (around[0]!.uv[0] - around[1]!.uv[0]) / (2 * h))).toBeLessThan(size * 1e-4)
          expect(Math.abs(got.dx[1] - (around[0]!.uv[1] - around[1]!.uv[1]) / (2 * h))).toBeLessThan(size * 1e-4)
          expect(Math.abs(got.dy[0] - (around[2]!.uv[0] - around[3]!.uv[0]) / (2 * h))).toBeLessThan(size * 1e-4)
          expect(Math.abs(got.dy[1] - (around[2]!.uv[1] - around[3]!.uv[1]) / (2 * h))).toBeLessThan(size * 1e-4)
          if (camera === twin) {
            expect(got.dx[0] * layout.width).toBeCloseTo(layout.scale, 6)
            expect(got.dy[1] * layout.height).toBeCloseTo(layout.scale, 6)
            expect(Math.abs(got.dx[1] * layout.height)).toBeLessThan(1e-9)
            expect(Math.abs(got.dy[0] * layout.width)).toBeLessThan(1e-9)
          }
          seen++
        }
      }
    }
    expect(seen).toBeGreaterThan(60)
  })

  it('lifts nothing at T, to the last bit', () => {
    const layout = placeLayout(master, {}, 16384)
    const pic = new THREE.PerspectiveCamera()
    placeCamera(pic, master, layout, twin, 0.0001, 10)
    const cam = frameCamera(twin, master)
    const g = placeGeometry(twin, reaching)
    const off = placeGeometry(twin, { ...state, limbReachDeg: 0 })
    expect(g.limb.length()).toBe(0)
    expect(g.limbDip).toBe(0)
    let sky = 0
    for (let x = 0.5; x < master.width; x += 97) {
      for (let y = 0.5; y < master.height; y += 31) {
        const ray = pixelRay(cam, master, x, y)
        const a = placeUv(g, projOf(pic), ray)
        const b = placeUv(off, projOf(pic), ray)
        expect(a.uv).toEqual(b.uv)
        expect(a.hit).toBe(b.hit)
        if (a.hit) expect(a.honest).toBeCloseTo(1, 9)
        if (!a.hit) {
          sky++
          expect(b.honest).toBeCloseTo(1, 9)
        }
      }
    }
    expect(sky).toBeGreaterThan(100)
  })
})

// A plan may find its twin by a numeric solve: the two cameras may differ by a share of the height that is far below a pixel.
const near = (position: THREE.Vector3): number => 1e-5 * Math.max(position.length() - 1, 1e-6)

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
        expect(place.twin.position.distanceTo(globe.camera.position)).toBeLessThan(near(globe.camera.position))
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
        expect(twin.position.distanceTo(b.position)).toBeLessThan(near(b.position))
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
  it('hands the limits of a place to the pass only when a side asks, and refuses limits outside their range', () => {
    const plain = filmWith(coveredPlan({ handover: { dive: {}, rise: {} } }))
    const hd = handoverOf('mars', 'dive')!
    const hr = handoverOf('mars', 'rise')!
    const none = plain.shotAt(hd.firstFrame, hd.time, 'orbit').place!
    expect([none.seen, none.maxEnlarge, none.enlargeSoft]).toEqual([undefined, undefined, undefined])
    restorePlans()
    const d = filmWith(coveredPlan({ handover: { dive: { place: { seen: 0.25, maxEnlarge: 6, enlargeSoft: 0.75 } }, rise: { place: { maxEnlarge: 2 } } } }))
    const a = d.shotAt(hd.firstFrame, hd.time, 'orbit').place!
    expect([a.seen, a.maxEnlarge, a.enlargeSoft]).toEqual([0.25, 6, 0.75])
    const b = d.shotAt(hr.firstFrame, hr.time, 'orbit').place!
    expect([b.seen, b.maxEnlarge, b.enlargeSoft]).toEqual([undefined, 2, undefined])
    restorePlans()
    const e = filmWith(coveredPlan({ handover: { dive: { place: { limbReachDeg: 0 } }, rise: { place: { limbReachDeg: 3, limbHoldDeg: [0.1, 0.4] } } } }))
    const er = e.shotAt(hr.firstFrame, hr.time, 'orbit').place!
    expect([none.limbReachDeg, e.shotAt(hd.firstFrame, hd.time, 'orbit').place!.limbReachDeg, er.limbReachDeg]).toEqual([undefined, 0, 3])
    expect([none.limbHoldDeg, er.limbHoldDeg]).toEqual([undefined, [0.1, 0.4]])
    const own = placeGeometry(er.twin, er)
    expect(own.hold[0]).toBeCloseTo(Math.sin(THREE.MathUtils.degToRad(0.1)), 12)
    expect(own.hold[1]).toBeCloseTo(Math.sin(THREE.MathUtils.degToRad(0.4)), 12)
    expect(own.reach).toBeCloseTo(Math.sin(THREE.MathUtils.degToRad(3)), 12)
    restorePlans()
    const f = filmWith(coveredPlan({ handover: { rise: { place: { edgeIn: [0.4, 0.3, 0.2, 0.1] } } } }))
    expect([none.edgeIn, f.shotAt(hd.firstFrame, hd.time, 'orbit').place!.edgeIn, f.shotAt(hr.firstFrame, hr.time, 'orbit').place!.edgeIn]).toEqual([undefined, undefined, [0.4, 0.3, 0.2, 0.1]])
    restorePlans()
    type Four = [number, number, number, number]
    for (const bad of [{ seen: 0 }, { seen: 1.5 }, { maxEnlarge: 1 }, { enlargeSoft: 0 }, { enlargeSoft: 1 }, { limbReachDeg: -1 }, { limbReachDeg: 90 }, { limbHoldDeg: [0.5, 0.5] as [number, number] }, { limbHoldDeg: [-0.1, 0.5] as [number, number] }, { limbHoldDeg: [0.5, 90] as [number, number] }, { edgeIn: [0.4, 0.4, 0.4] as unknown as Four }, { edgeIn: [0.4, 0.4, 0.4, 1.1] as Four }, { edgeIn: [-0.1, 0, 0, 0] as Four }]) {
      filmWith(coveredPlan({ handover: { dive: { place: bad } } }))
      expect(() => handoverOf('mars', 'dive')).toThrow()
      restorePlans()
    }
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

describe('the land matte of a place picture', () => {
  it('multiplies the weight of the pass after every limit, and only when a set gives one', () => {
    const pass = new Place()
    const lay = (pass as unknown as { lay: { material: THREE.ShaderMaterial } }).lay.material
    const source = lay.fragmentShader
    const cut = 'if (uMatteOn > 0.5) k *= textureGrad(uMatte, uv, dx / uSize * fit, dy / uSize * fit).r;'
    expect(source.split(cut).length).toBe(2)
    expect(source.indexOf(cut)).toBeGreaterThan(source.indexOf('float k = '))
    // Every view reads the weight after the matte: the texel count, the mask and the picture itself.
    for (const reader of ['if (k <= 0.5) discard;', 'outColor = vec4(k, k, k, 1.0);', 'outColor = vec4(col * k, k);']) {
      expect(source.split(reader).length).toBe(2)
      expect(source.indexOf(reader)).toBeGreaterThan(source.indexOf(cut))
    }
    const hd = handoverOf('mars', 'dive')!
    const shot = film.shotAt(hd.firstFrame, hd.time, 'orbit')
    const layout = placeLayout(master, shot.place!, 8192)
    const texture = new THREE.Texture()
    const matte = new THREE.Texture()
    const pic = { key: 'test', target: { texture, width: layout.width, height: layout.height } as unknown as THREE.WebGLRenderTarget, layout, proj: [1, 1, 0, 0] as [number, number, number, number], used: 0 }
    const u = lay.uniforms
    const drawn: [number, THREE.Texture][] = []
    const r = { setRenderTarget: () => undefined, render: () => drawn.push([u.uMatteOn!.value as number, u.uMatte!.value as THREE.Texture]) } as unknown as THREE.WebGLRenderer
    const target = { width: master.width, height: master.height } as unknown as THREE.WebGLRenderTarget
    const cam = frameCamera(shot.camera, master)
    pass.render(r, target, pic, shot.place!, shot.camera, cam, 'beauty', 0, master.width / master.height, 1)
    pass.render(r, target, pic, shot.place!, shot.camera, cam, 'beauty', 0, master.width / master.height, 1, undefined, matte)
    pass.render(r, target, pic, shot.place!, shot.camera, cam, 'texels', 0, master.width / master.height, 1, undefined, null)
    expect(drawn).toEqual([[0, texture], [1, matte], [0, texture]])
  })
})

describe('the top down view of the harness', () => {
  it('puts the globe camera straight above the place at the height and field of the path, the heading up, and only while it is forced', () => {
    for (const p of handing) {
      for (const kind of kinds) {
        const h = handoverOf(p.id, kind)
        if (!h) continue
        const s = seg(p.id, kind)
        const sizes: number[] = []
        for (let f = s.firstFrame; f < s.endFrame; f += 3) {
          const time = (f + config.shutterFraction / 2) / fps
          const plain = film.shotAt(f, time, 'orbit')
          forceTop(true)
          const top = film.shotAt(f, time, 'orbit')
          const close = film.shotAt(f, time, 'terrain')
          forceTop(false)
          const place = p.place(kind, time)
          const path = kind === 'dive' ? p.divePose(time, 'orbit') : p.risePose(time, 'orbit')
          const above = p.topDown(kind, time, path)
          expect(above.position.length()).toBeCloseTo(path.position.length(), 12)
          expect(above.position.clone().normalize().distanceTo(place)).toBeLessThan(1e-9)
          expect(above.vfov).toBe(path.vfov)
          const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(above.quaternion)
          expect(dir.distanceTo(place.clone().negate())).toBeLessThan(1e-9)
          const up = new THREE.Vector3(0, 1, 0).applyQuaternion(above.quaternion)
          const twin = p.twin(p.closePose(kind, h.time), h.time)
          const look = new THREE.Vector3(0, 0, -1).applyQuaternion(twin.quaternion).applyQuaternion(p.turn(h.time).invert()).applyQuaternion(p.turn(time))
          const flat = look.addScaledVector(place, -look.dot(place)).normalize()
          expect(up.dot(flat)).toBeGreaterThan(0.999)
          // The film puts the pose into the set and adds its drift on the camera side, so the turn from the path's camera to the one above is the same angle in both, and the step between them the same length times the size of the set.
          expect(deg(top.camera.quaternion, plain.camera.quaternion)).toBeCloseTo(deg(above.quaternion, path.quaternion), 6)
          const step = above.position.distanceTo(path.position)
          if (step > 1e-6) sizes.push(top.camera.position.distanceTo(plain.camera.position) / step)
          expect(top.camera.vfov).toBe(plain.camera.vfov)
          expect(deg(film.shotAt(f, time, 'terrain').camera.quaternion, close.camera.quaternion)).toBeLessThan(1e-4)
          expect(film.shotAt(f, time, 'terrain').camera.position.distanceTo(close.camera.position)).toBe(0)
          expect(deg(film.shotAt(f, time, 'orbit').camera.quaternion, plain.camera.quaternion)).toBeLessThan(1e-4)
          expect(film.shotAt(f, time, 'orbit').camera.position.distanceTo(plain.camera.position)).toBe(0)
        }
        expect(sizes.length).toBeGreaterThan(4)
        for (const v of sizes) expect(v / sizes[0]!).toBeCloseTo(1, 6)
      }
    }
  })
})

describe('the picture coming in from the place outward', () => {
  const layout = placeLayout(master, { valid: [0.11, 0.06, 0.11, 0.125] }, 16384)
  const wide = layout.width - (layout.left + layout.right) * layout.scale
  const high = layout.height - (layout.bottom + layout.top) * layout.scale
  it('is off unless a stop asks: the film wide shares are 0 and the reach is 0 at every weight', () => {
    expect(c.place.edgeIn).toEqual([0, 0, 0, 0])
    for (const weight of [0, 0.09, 0.5, 0.99, 1]) expect(edgeReach({ weight }, layout)).toEqual([0, 0, 0, 0])
    for (const p of plans) for (const kind of kinds) expect(handoverOf(p.id, kind)?.place.edgeIn).toEqual(asked(p, kind)?.edgeIn)
  })
  it('reaches in by each side\'s share of the frame while the weight is low and is back in the margin when the weight is 1', () => {
    expect([wide, high]).toEqual([master.width * layout.scale, master.height * layout.scale])
    const share: [number, number, number, number] = [0.4, 0.3, 0.2, 0.1]
    expect(edgeReach({ weight: 1, edgeIn: share }, layout)).toEqual([0, 0, 0, 0])
    const gone = edgeReach({ weight: 0, edgeIn: share }, layout)
    expect(gone[0]).toBeCloseTo(0.4 * wide, 9)
    expect(gone[1]).toBeCloseTo(0.3 * wide, 9)
    expect(gone[2]).toBeCloseTo(0.2 * high, 9)
    expect(gone[3]).toBeCloseTo(0.1 * high, 9)
    let last = gone
    for (const weight of [0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
      const now = edgeReach({ weight, edgeIn: share }, layout)
      now.forEach((v, i) => {
        expect(v).toBeLessThan(last[i]!)
        expect(v).toBeCloseTo(gone[i]! * (1 - weight), 9)
      })
      last = now
    }
    expect(edgeReach({ weight: 1.5, edgeIn: share }, layout)).toEqual([0, 0, 0, 0])
    expect(edgeReach({ weight: -1, edgeIn: share }, layout)).toEqual(gone)
  })
})

describe('the options on a diagnostic string', () => {
  it('reads the view and every option and writes them back', () => {
    expect(parseProbe('beauty')).toEqual({ view: 'beauty', side: null, shut: false, time: null, place: true, mask: false, picture: false, top: false })
    expect(parseProbe('texels/side=orbit/shut')).toEqual({ view: 'texels', side: 'orbit', shut: true, time: null, place: true, mask: false, picture: false, top: false })
    expect(parseProbe('beauty/side=terrain/t=81.80833/noplace')).toEqual({ view: 'beauty', side: 'terrain', shut: true, time: 81.80833, place: false, mask: false, picture: false, top: false })
    expect(parseProbe('beauty/side=orbit/noplace/top')).toEqual({ view: 'beauty', side: 'orbit', shut: false, time: null, place: false, mask: false, picture: false, top: true })
    expect(parseProbe('beauty/mask').mask).toBe(true)
    expect(parseProbe('beauty/picture').picture).toBe(true)
    expect(parseProbe('ungraded/side=orbit/dump=1497,889,image')).toEqual({ view: 'ungraded', side: 'orbit', shut: false, time: null, place: true, mask: false, picture: true, top: false, dump: { x: 1497, y: 889, what: 'image' } })
    expect(probeString(parseProbe('ungraded/side=orbit/dump=0,0,alpha'))).toBe('ungraded/side=orbit/dump=0,0,alpha')
    expect(() => parseProbe('ungraded/dump=1.5,0,image')).toThrow()
    expect(() => parseProbe('ungraded/dump=0,0,colour')).toThrow()
    for (const s of ['beauty', 'texels/side=orbit/shut', 'beauty/side=terrain/t=81.80833/noplace', 'beauty/side=orbit/mask', 'beauty/picture', 'beauty/side=orbit/noplace/top']) expect(probeString(parseProbe(s))).toBe(s)
    expect(parseProbe('beauty/side=orbit/limb=0').limb).toBe(0)
    expect(parseProbe('beauty/limb=2.5').limb).toBe(2.5)
    expect(parseProbe('beauty/side=orbit').limb).toBe(undefined)
    expect(probeString(parseProbe('beauty/side=orbit/shut/top/limb=0'))).toBe('beauty/side=orbit/shut/top/limb=0')
    expect(() => parseProbe('beauty/limb=-1')).toThrow()
    expect(() => parseProbe('beauty/limb=90')).toThrow()
    expect(() => parseProbe('beauty/limb')).toThrow()
    expect(parseProbe('beauty/side=orbit').edgeIn).toBe(undefined)
    expect(parseProbe('beauty/in=0.4,0.3,0.2,0').edgeIn).toEqual([0.4, 0.3, 0.2, 0])
    expect(probeString(parseProbe('beauty/side=orbit/limb=2/in=0,0,0,0'))).toBe('beauty/side=orbit/limb=2/in=0,0,0,0')
    for (const bad of ['beauty/in', 'beauty/in=0.4', 'beauty/in=0.4,0.4,0.4', 'beauty/in=0.4,0.4,0.4,1.5', 'beauty/in=0.4,0.4,-0.1,0', 'beauty/in=a,b,c,d']) expect(() => parseProbe(bad)).toThrow()
    expect(() => parseProbe('beauty/side=left')).toThrow()
    expect(() => parseProbe('beauty/t=soon')).toThrow()
    expect(() => parseProbe('beauty/nothing')).toThrow()
  })
})
