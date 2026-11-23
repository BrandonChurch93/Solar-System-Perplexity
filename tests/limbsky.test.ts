import * as THREE from 'three'
import { afterAll, describe, expect, it } from 'vitest'
import raw from '../config/showcase.json'
import { buildConfig, config, type Segment } from '../src/config'
import { horizonK, horizonUv, Place, placeCamera, placeGeometry, placeLayout, placeUv, type PlaceGeometry, type PlaceLayout } from '../src/core/place'
import type { PlaceState, Pose } from '../src/core/types'
import { applyProbe, parseProbe, probeString } from '../src/diagnostics/probe'
import { FilmDirector } from '../src/director/film'
import { handoverOf, horizonWeight, placeWeight, skyWeight, type HandoverParams, type SkyShares } from '../src/director/handover'
import { StopPlan } from '../src/director/moves'
import { plans } from '../src/director/plans'
import { COVERED, coveredFit, coveredParams, coveredPlan, filmWith, restorePlans } from './lib/covered'

type Four = [number, number, number, number]
const fps = config.fps
const master = config.formats[config.formatKeys.master]!
const kinds = ['dive', 'rise'] as const
const reach = 8
const asking: { handover: HandoverParams } = { handover: { dive: { place: { limbReachDeg: reach, limbSky: true } }, rise: { place: { limbReachDeg: reach, limbSky: true } } } }
const held: { handover: HandoverParams } = { handover: { dive: { place: { limbReachDeg: reach } }, rise: { place: { limbReachDeg: reach } } } }
const midTime = (f: number): number => (f + config.shutterFraction / 2) / fps
const rad = THREE.MathUtils.degToRad
// What a stop's own plan asks of the place picture in a dive or a rise: undefined where it asks nothing.
const asked = (p: (typeof plans)[number], kind: (typeof kinds)[number]) => (p as unknown as { p?: { handover?: HandoverParams } }).p?.handover?.[kind]?.place

class OwnSky extends StopPlan {
  override skyShare(seg: Segment, time: number): SkyShares | null {
    if (seg.kind !== 'dive' && seg.kind !== 'rise') return null
    const k = Math.min(Math.max((time - seg.start) / (seg.end - seg.start), 0), 1)
    return { low: 0.5 * k * k, high: 1 - 0.5 * k }
  }
}

function frameCamera(pose: Pose): THREE.PerspectiveCamera {
  const cam = new THREE.PerspectiveCamera(pose.vfov, master.width / master.height, 0.001, 100)
  cam.position.set(0, 0, 0)
  cam.quaternion.copy(pose.quaternion)
  cam.updateProjectionMatrix()
  cam.updateMatrixWorld(true)
  return cam
}

// The place picture of a state as the pass lays it out: its size and the projection of its camera.
function pictureOf(place: PlaceState): { layout: PlaceLayout; proj: Four } {
  const layout = placeLayout(master, place, 8192)
  const cam = new THREE.PerspectiveCamera()
  placeCamera(cam, master, layout, place.twin, 0.001, 100)
  const e = cam.projectionMatrix.elements
  return { layout, proj: [e[0]!, e[5]!, e[8]!, e[9]!] }
}

// Rays in the camera's own frame at an angle under its limb (over it when negative), in the plane through the centre of the body and
// the view axis.
function overLimb(g: PlaceGeometry): (under: number) => THREE.Vector3 {
  const down = g.centre.clone().normalize()
  const axis = new THREE.Vector3(0, 0, -1)
  const fore = axis.clone().addScaledVector(down, -axis.dot(down)).normalize()
  const dip = Math.asin(g.sinDip)
  return (under: number): THREE.Vector3 => {
    // The angle from the line to the centre: 90 degrees less the dip is the limb.
    const a = Math.PI / 2 - dip - under
    return down.clone().multiplyScalar(Math.cos(a)).addScaledVector(fore, Math.sin(a))
  }
}

afterAll(() => {
  applyProbe(null)
  restorePlans()
})

describe('the horizon of a place picture on the clock of the sky', () => {
  it('is off unless a stop asks: the film wide switch is off and no shot of a stop that did not ask carries a horizon', () => {
    expect(config.raw.handover.place.limbSky).toBe(false)
    restorePlans()
    const film = new FilmDirector(plans)
    for (const p of plans) {
      if (!p.handsOver) continue
      for (const kind of kinds) {
        const h = handoverOf(p.id, kind)
        const s = p.seg[kind]
        if (!h || !s) continue
        const own = asked(p, kind)?.limbSky === true && h.picture
        expect(h.limbSky).toBe(own)
        if (own) continue
        for (let f = s.firstFrame; f < s.endFrame; f++) {
          const globe = film.shotAt(f, midTime(f), 'orbit')
          const w = placeWeight(s, midTime(f))
          if (w > 0 && h.picture) {
            expect(globe.place!.weight).toBe(w)
            expect('horizon' in globe.place!).toBe(false)
          } else expect(globe.place).toBeUndefined()
          expect(horizonWeight(h, w, globe.skyShare!)).toBeUndefined()
        }
      }
    }
  })

  it('is the share of the close view\'s sky when a stop asks: all of it at T, and there before and after the picture', () => {
    const plan = coveredPlan(asking)
    const film = filmWith(plan)
    for (const kind of kinds) {
      const s = plan.seg[kind]!
      const h = handoverOf(plan.id, kind)!
      expect(h.limbSky).toBe(true)
      expect(h.skyFrames).toBeGreaterThan(h.placeLastFrame - h.placeFirstFrame)
      let outside = 0
      let last = -1
      for (let f = s.firstFrame; f < s.endFrame; f++) {
        const time = midTime(f)
        const globe = film.shotAt(f, time, 'orbit')
        const w = placeWeight(s, time)
        const sky = skyWeight(s, time)
        expect(globe.skyShare).toBe(sky)
        const want = Math.max(w, sky)
        expect(horizonWeight(h, w, sky)).toBe(want)
        if (want > 0) {
          expect(globe.place!.weight).toBe(w)
          expect(globe.place!.horizon).toBe(want)
          expect(globe.place!.horizon!).toBeGreaterThanOrEqual(w)
          if (w === 0) outside++
          // One way only: up toward T in a dive, down from it in a rise.
          if (last >= 0) expect(kind === 'dive' ? want >= last : want <= last).toBe(true)
          last = want
        } else expect(globe.place).toBeUndefined()
        expect(film.shotAt(f, time, 'terrain').place).toBeUndefined()
      }
      expect(outside).toBeGreaterThan(0)
      const at = film.shotAt(h.firstFrame, h.time, 'orbit')
      expect(at.place!.weight).toBe(1)
      expect(at.place!.horizon).toBe(1)
    }
  })

  it('follows the stop\'s own share of that sky, and is never under the weight of the picture', () => {
    const plan = new OwnSky(COVERED, coveredFit, { ...coveredParams(), ...asking })
    const film = filmWith(plan)
    for (const kind of kinds) {
      const s = plan.seg[kind]!
      let lifted = 0
      for (let f = s.firstFrame; f < s.endFrame; f++) {
        const time = midTime(f)
        const own = plan.skyShare(s, time)!
        const w = placeWeight(s, time)
        const globe = film.shotAt(f, time, 'orbit')
        const want = Math.max(w, own.low)
        if (want > 0) {
          expect(globe.place!.horizon).toBe(want)
          if (w > own.low) lifted++
        } else expect(globe.place).toBeUndefined()
      }
      expect(lifted).toBeGreaterThan(0)
    }
    // A sky that has no frames of its own leaves the horizon with the picture's weight.
    const short = filmWith(coveredPlan({ handover: { dive: { skyFrames: 0, place: { limbReachDeg: reach, limbSky: true } }, rise: { skyFrames: 0, place: { limbReachDeg: reach, limbSky: true } } } }))
    for (const kind of kinds) {
      const s = plans.find((p) => p.id === COVERED)!.seg[kind]!
      const h = handoverOf(COVERED, kind)!
      for (let f = s.firstFrame; f < s.endFrame; f++) {
        const time = midTime(f)
        const globe = short.shotAt(f, time, 'orbit')
        const w = placeWeight(s, time)
        // On the globe's own side of T: before it in a dive, after it in a rise.
        if (kind === 'dive' ? f < h.firstFrame : f > h.lastFrame) {
          if (w > 0) expect(globe.place!.horizon).toBe(w)
          else expect(globe.place).toBeUndefined()
        }
      }
    }
  })

  it('needs the horizon of the picture held on the limb, a picture, and true or false', () => {
    expect(config.raw.handover.place.limbReachDeg).toBe(0)
    // The plan of a stop reads its own handover as it is built, so a wrong one is refused there or at the first look.
    const refused = (handover: HandoverParams, kind: (typeof kinds)[number], why: RegExp): void => {
      expect(() => {
        filmWith(coveredPlan({ handover }))
        handoverOf(COVERED, kind)
      }).toThrow(why)
      restorePlans()
    }
    refused({ dive: { place: { limbSky: true } }, rise: {} }, 'dive', /mars\.dive needs limbReachDeg above 0 for limbSky/)
    refused({ dive: {}, rise: { place: { limbReachDeg: 0, limbSky: true } } }, 'rise', /mars\.rise needs limbReachDeg above 0 for limbSky/)
    refused({ dive: { place: { limbReachDeg: reach, limbSky: 'yes' as unknown as boolean } }, rise: {} }, 'dive', /limbSky/)
    filmWith(coveredPlan({ handover: { dive: { place: { limbReachDeg: reach, limbSky: true } }, rise: { place: { limbSky: false } } } }))
    expect(handoverOf(COVERED, 'dive')!.limbSky).toBe(true)
    expect(handoverOf(COVERED, 'rise')!.limbSky).toBe(false)
    restorePlans()
    // A side that draws no picture has no horizon to hold: the switch is not an error there and does nothing.
    const none = coveredPlan({ handover: { dive: { picture: false, place: { limbSky: true } }, rise: { place: { limbReachDeg: reach, limbSky: false } } } })
    const film = filmWith(none)
    for (const kind of kinds) {
      const h = handoverOf(COVERED, kind)!
      expect(h.limbSky).toBe(false)
      const s = none.seg[kind]!
      for (let f = s.firstFrame; f < s.endFrame; f++) {
        const p = film.shotAt(f, midTime(f), 'orbit').place
        if (p) expect('horizon' in p).toBe(false)
        if (kind === 'dive') expect(p).toBeUndefined()
      }
    }
    // The film wide switch is checked with the film's other numbers.
    const on = JSON.parse(JSON.stringify(raw)) as typeof raw
    ;(on.handover.place as { limbSky: unknown }).limbSky = true
    expect(() => buildConfig(on)).toThrow(/handover.place.limbSky/)
    on.handover.place.limbReachDeg = reach
    expect(() => buildConfig(on)).not.toThrow()
    ;(on.handover.place as { limbSky: unknown }).limbSky = 1
    expect(() => buildConfig(on)).toThrow(/handover.place.limbSky/)
    const gone = JSON.parse(JSON.stringify(raw)) as typeof raw
    delete (gone.handover.place as { limbSky?: boolean }).limbSky
    expect(() => buildConfig(gone)).toThrow(/missing key handover.place.limbSky/)
  })

  it('gives a ray of the sky the weight of the horizon alone and leaves the ground with the picture', () => {
    const plan = coveredPlan(asking)
    const film = filmWith(plan)
    const h = handoverOf(plan.id, 'rise')!
    // A frame after the picture has gone and before the sky has: the camera stands above the twin.
    const f = h.placeLastFrame + 4
    const shot = film.shotAt(f, midTime(f), 'orbit')
    const place = shot.place!
    expect(place.weight).toBe(0)
    expect(place.horizon!).toBeGreaterThan(0)
    expect(place.horizon!).toBeLessThan(1)
    const g = placeGeometry(shot.camera, place)
    expect(g.reach).toBeGreaterThan(0)
    expect(g.sinDip).toBeGreaterThan(g.sinDipTwin)
    const { proj } = pictureOf(place)
    const at = overLimb(g)
    const band = config.raw.handover.place.limbHoldDeg
    const sky = placeUv(g, proj, at(rad(-2)))
    expect(sky.hit).toBe(false)
    expect(sky.front).toBe(true)
    for (const ground of [0, 0.3, 1]) expect(horizonK(place, sky, ground)).toBe(place.horizon)
    expect(horizonK(place, { ...sky, front: false }, 1)).toBe(0)
    // The ground keeps the weight the picture gives it: under the limb, in the band where the picture holds its horizon, and further down.
    for (const under of [band[0]! / 2, (band[0]! + band[1]!) / 2, band[1]! + 3]) {
      const land = placeUv(g, proj, at(rad(under)))
      expect(land.hit).toBe(true)
      for (const ground of [0, 0.3, 1]) expect(horizonK(place, land, ground)).toBe(ground)
    }
    // Without a horizon in the state every ray keeps the weight the picture's own rules give it.
    const plain = { ...place }
    delete plain.horizon
    for (const ray of [sky, placeUv(g, proj, at(rad(1)))]) expect(horizonK(plain, ray, 0.4)).toBe(0.4)
  })

  it('reads the sky of the picture at its own height over the horizon where a ray leaves the picture by a side', () => {
    const plan = coveredPlan(asking)
    const film = filmWith(plan)
    for (const kind of kinds) {
      const h = handoverOf(plan.id, kind)!
      const f = kind === 'rise' ? h.placeLastFrame + 4 : h.placeFirstFrame - 4
      const shot = film.shotAt(f, midTime(f), 'orbit')
      const place = shot.place!
      expect(place.weight).toBe(0)
      const g = placeGeometry(shot.camera, place)
      const { proj, layout } = pictureOf(place)
      const brim = [0.5 / layout.width, 0.5 / layout.height] as const
      const upTwin = g.up.clone().applyMatrix3(g.rel)
      // The height of a place of the picture over the level of the twin, as the sine of the angle.
      const height = (uv: readonly [number, number]): number => new THREE.Vector3((2 * uv[0] - 1 + proj[2]) / proj[0], (2 * uv[1] - 1 + proj[3]) / proj[1], -1).normalize().dot(upTwin)
      const at = overLimb(g)
      let inside = 0
      let left = 0
      let right = 0
      let behind = 0
      for (const over of [0.25, 1, 3]) {
        for (let turn = -170; turn <= 170; turn += 5) {
          const ray = at(rad(-over)).applyAxisAngle(g.up, rad(turn))
          const raw = placeUv(g, proj, ray)
          if (raw.hit) continue
          const got = horizonUv(g, proj, ray, layout)
          expect(got.front).toBe(true)
          expect(got.uv[0]).toBeGreaterThanOrEqual(brim[0])
          expect(got.uv[0]).toBeLessThanOrEqual(1 - brim[0])
          expect(got.uv[1]).toBeGreaterThanOrEqual(brim[1])
          expect(got.uv[1]).toBeLessThanOrEqual(1 - brim[1])
          if (raw.front && raw.uv[0] >= brim[0] && raw.uv[0] <= 1 - brim[0]) {
            // Inside the picture the ray reads its own place.
            inside++
            expect(got.uv[0]).toBe(raw.uv[0])
            expect(got.uv[1]).toBe(Math.min(Math.max(raw.uv[1], brim[1]), 1 - brim[1]))
            continue
          }
          // Outside it reads the nearer side, at the height over the horizon the ray itself has.
          const side = (raw.front ? raw.uv[0] > 0.5 : raw.dir.x > 0) ? 1 - brim[0] : brim[0]
          expect(got.uv[0]).toBeCloseTo(side, 9)
          if (side < 0.5) left++
          else right++
          if (!raw.front) behind++
          expect(got.uv[1]).toBeGreaterThan(brim[1])
          expect(got.uv[1]).toBeLessThan(1 - brim[1])
          expect(height(got.uv)).toBeCloseTo(raw.dir.clone().normalize().dot(upTwin), 9)
        }
      }
      expect(inside).toBeGreaterThan(10)
      expect(left).toBeGreaterThan(10)
      expect(right).toBeGreaterThan(10)
      expect(behind).toBeGreaterThan(10)
      // A ray of the sky high over the picture reads its top row.
      const high = horizonUv(g, proj, at(rad(-60)), layout)
      expect(high.uv[1]).toBe(1 - brim[1])
    }
  })

  it('leaves the shader of the picture as it was and adds the horizon to a second one', () => {
    const pass = new Place()
    const inner = pass as unknown as { lay: { material: THREE.ShaderMaterial }; veil: { material: THREE.ShaderMaterial } | null; veilSplit: { material: THREE.ShaderMaterial } | null; splitPass(): { material: THREE.ShaderMaterial }; veilPass(toned: boolean): { material: THREE.ShaderMaterial } }
    const plain = inner.lay.material.fragmentShader
    for (const name of ['uVeil', 'bool over', 'brim']) expect(plain.includes(name)).toBe(false)
    expect(inner.veil).toBe(null)
    expect(inner.veilSplit).toBe(null)
    const declared = '\nuniform float uVeil;'
    const sideFrom = '  bool over = !(disc > 0.0 && b > 0.0);\n  if (mode != 3 && over) {\n    vec2 brim = vec2(0.5) / uSize;\n'
    const sideTo = '    uv = clamp(uv, brim, vec2(1.0) - brim);\n  }\n'
    const weight = '  if (mode != 3 && over) k = uVeil * front;\n'
    const without = (text: string, from: string, to: string): string => {
      const a = text.indexOf(from)
      const b = text.indexOf(to, a)
      expect(a).toBeGreaterThan(-1)
      expect(b).toBeGreaterThan(a)
      expect(text.indexOf(from, a + 1)).toBe(-1)
      return text.slice(0, a) + text.slice(b + to.length)
    }
    for (const [veiled, base] of [[inner.veilPass(false).material.fragmentShader, plain], [inner.veilPass(true).material.fragmentShader, inner.splitPass().material.fragmentShader]] as const) {
      // Taken out again, the additions leave the shader they were added to, character for character.
      for (const part of [declared, weight]) expect(veiled.split(part).length).toBe(2)
      expect(without(veiled, sideFrom, sideTo).replace(declared, '').replace(weight, '')).toBe(base)
      // The side is read before the picture is, and the weight of the horizon is set after every limit of the picture, the land matte too.
      expect(veiled.indexOf(sideTo)).toBeLessThan(veiled.indexOf('  vec4 pic = textureGrad(uPicture, uv,'))
      expect(veiled.indexOf(sideFrom)).toBeGreaterThan(veiled.indexOf('  float k = uLimits.x * front'))
      expect(veiled.indexOf(weight)).toBeGreaterThan(veiled.indexOf('if (uMatteOn > 0.5) k *= '))
      expect(veiled.indexOf(weight)).toBeLessThan(veiled.indexOf('  if (mode == 1) {'))
      // The ground is left alone: nothing of the horizon touches a ray that hits the ball.
      const added = veiled.slice(veiled.indexOf(sideFrom), veiled.indexOf(sideTo))
      expect(added.includes('hold')).toBe(false)
    }
    expect(inner.veil).not.toBe(null)
    expect(inner.veilSplit).not.toBe(null)
    expect(inner.lay.material.fragmentShader).toBe(plain)
    pass.dispose()
    expect(inner.veil).toBe(null)
    expect(inner.veilSplit).toBe(null)
  })

  it('runs the second shader only for a picture with a horizon of its own that is held on the limb', () => {
    const pass = new Place()
    const inner = pass as unknown as { lay: { material: THREE.ShaderMaterial }; split: { material: THREE.ShaderMaterial } | null; veil: { material: THREE.ShaderMaterial } | null; veilSplit: { material: THREE.ShaderMaterial } | null; blur: { material: THREE.ShaderMaterial } | null }
    const plan = coveredPlan(asking)
    const film = filmWith(plan)
    const h = handoverOf(plan.id, 'dive')!
    const f = Math.floor((h.placeFirstFrame + h.firstFrame) / 2)
    const shot = film.shotAt(f, midTime(f), 'orbit')
    const place = shot.place!
    expect(place.weight).toBeGreaterThan(0)
    expect(place.weight).toBeLessThan(1)
    expect(place.horizon!).toBeGreaterThan(place.weight)
    const layout = placeLayout(master, place, 8192)
    const texture = new THREE.Texture()
    const pic = { key: 'test', target: { texture, width: layout.width, height: layout.height } as unknown as THREE.WebGLRenderTarget, layout, proj: [1, 1, 0, 0] as Four, used: 0 }
    const target = { width: master.width, height: master.height, texture: new THREE.Texture() } as unknown as THREE.WebGLRenderTarget
    const drawn: { pass: string; mode: number; veil: number | null; blended: boolean }[] = []
    const r = {
      setRenderTarget: () => undefined,
      render: (scene: THREE.Scene) => {
        const m = (scene.children[0] as THREE.Mesh).material as THREE.ShaderMaterial
        const name = m === inner.lay.material ? 'plain' : m === inner.split?.material ? 'split' : m === inner.veil?.material ? 'veil' : m === inner.veilSplit?.material ? 'veilSplit' : m === inner.blur?.material ? 'blur' : 'other'
        drawn.push({ pass: name, mode: name === 'blur' ? -1 : (m.uniforms.uScale!.value as THREE.Vector2).y, veil: name.startsWith('veil') ? (m.uniforms.uVeil!.value as number) : null, blended: m.blending !== THREE.NoBlending })
      },
    } as unknown as THREE.WebGLRenderer
    const cam = frameCamera(shot.camera)
    const aspect = master.width / master.height
    const draw = (state: typeof place, mode: 'beauty' | 'mask' | 'texels' | 'picture'): typeof drawn => {
      drawn.length = 0
      pass.render(r, target, pic, state, shot.camera, cam, mode, 0, aspect, 1)
      return drawn.map((d) => ({ ...d }))
    }
    const plain = { ...place }
    delete plain.horizon
    expect(draw(plain, 'beauty').map((d) => d.pass)).toEqual(['plain'])
    expect(inner.veil).toBe(null)
    expect(draw(place, 'beauty')).toEqual([{ pass: 'veil', mode: 0, veil: place.horizon, blended: true }])
    // The mask of the harness shows the horizon too; its count of texels and the picture itself stay the picture's own.
    expect(draw(place, 'mask')).toEqual([{ pass: 'veil', mode: 2, veil: place.horizon, blended: false }])
    expect(draw(place, 'texels').map((d) => d.pass)).toEqual(['plain'])
    expect(draw(place, 'picture').map((d) => d.pass)).toEqual(['plain'])
    // A picture that is not held on the limb has no horizon to give.
    expect(draw({ ...place, limbReachDeg: 0 }, 'beauty').map((d) => d.pass)).toEqual(['plain'])
    // Out of range it is held to 0 and 1.
    expect(draw({ ...place, horizon: 1.5 }, 'beauty')[0]!.veil).toBe(1)
    expect(draw({ ...place, horizon: -1 }, 'beauty')[0]!.veil).toBe(0)
    // With the broad tone lent by the globe the horizon rides on the tone's shader, and where the picture has no weight left the tone is not run.
    const toned = { ...place, toneIn: [0.5, 0.5, 0.5, 0.5] as Four }
    expect(draw(toned, 'beauty').map((d) => d.pass)).toEqual(['veilSplit', 'blur', 'blur', 'veilSplit', 'blur', 'blur', 'veilSplit'])
    expect(draw(toned, 'beauty').map((d) => d.veil)).toEqual([place.horizon, null, null, place.horizon, null, null, place.horizon])
    expect(draw({ ...toned, weight: 0 }, 'beauty')).toEqual([{ pass: 'veil', mode: 0, veil: place.horizon, blended: true }])
    expect(draw({ ...plain, toneIn: [0.5, 0.5, 0.5, 0.5] as Four }, 'beauty').map((d) => d.pass)).toEqual(['split', 'blur', 'blur', 'split', 'blur', 'blur', 'split'])
    pass.dispose()
  })

  it('can be asked for and refused on a diagnostic string, for a look at any stop', () => {
    expect(parseProbe('beauty').limbSky).toBe(undefined)
    expect(parseProbe('beauty/limbsky').limbSky).toBe(true)
    expect(parseProbe('beauty/limbsky=on').limbSky).toBe(true)
    expect(parseProbe('beauty/side=orbit/limbsky=off').limbSky).toBe(false)
    for (const s of ['beauty/limbsky', 'beauty/side=orbit/limb=8/limbsky', 'beauty/noplace/limbsky=off', 'beauty/side=orbit/mask/limb=8/in=0.4,0.4,0.4,0.25/limbsky']) expect(probeString(parseProbe(s))).toBe(s)
    for (const bad of ['beauty/limbsky=1', 'beauty/limbsky=yes', 'beauty/limbsky=']) expect(() => parseProbe(bad)).toThrow()
    const quiet = coveredPlan(held)
    const film = filmWith(quiet)
    const h = handoverOf(COVERED, 'rise')!
    expect(h.limbSky).toBe(false)
    const f = h.placeLastFrame + 4
    const s = quiet.seg.rise!
    expect(placeWeight(s, midTime(f))).toBe(0)
    expect(film.shotAt(f, midTime(f), 'orbit').place).toBeUndefined()
    applyProbe(parseProbe('beauty/limbsky'))
    const forced = film.shotAt(f, midTime(f), 'orbit').place!
    expect(forced.weight).toBe(0)
    expect(forced.horizon).toBe(skyWeight(s, midTime(f)))
    applyProbe(null)
    expect(film.shotAt(f, midTime(f), 'orbit').place).toBeUndefined()
    const loud = filmWith(coveredPlan(asking))
    expect(loud.shotAt(f, midTime(f), 'orbit').place!.horizon).toBe(skyWeight(s, midTime(f)))
    applyProbe(parseProbe('beauty/limbsky=off'))
    expect(loud.shotAt(f, midTime(f), 'orbit').place).toBeUndefined()
    const inside = h.firstFrame + 2
    expect('horizon' in loud.shotAt(inside, midTime(inside), 'orbit').place!).toBe(false)
    applyProbe(null)
    expect(loud.shotAt(inside, midTime(inside), 'orbit').place!.horizon).toBe(Math.max(placeWeight(s, midTime(inside)), skyWeight(s, midTime(inside))))
  })
})
