import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import { config } from '../../config'
import type { SetContext, SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { ramp, smooth } from '../../director/rig'
import { Deck } from './deck'
import deckJson from './deck.json'
import deckRingsJson from './deck-rings.json'
import { Globe } from './globe'
import { Halo } from './halo'
import { Mist } from './mist'
import * as look from './look'
import { Moon } from './moons'
import patchJson from './patches.json'
import { plan } from './plan'
import { fullLines, hairLines, parseLines, ringGeometry, ringProfile, Rings, strandLines } from './rings'
import skyJson from './sky.json'
import { Veil } from './veil'

async function heights(ctx: SetContext, path: string, width: number, height: number): Promise<Float32Array> {
  const raw = new Uint16Array(await ctx.buffer(path))
  if (raw.length !== width * height) throw new Error('height size mismatch: ' + path)
  const out = new Float32Array(raw.length)
  for (let y = 0; y < height; y++) {
    const src = (height - 1 - y) * width
    const dst = y * width
    for (let x = 0; x < width; x++) out[dst + x] = raw[src + x]! / 65535
  }
  return out
}

export const createSet: SetFactory = async (ctx) => {
  const key = ctx.assets === 'full' ? 'full' : 'web'
  const base = 'uranus/' + ctx.assets + '/'
  const fit = plan.fit
  const world = new THREE.Group()
  const orbit = new THREE.Group()
  const terrain = new THREE.Group()
  world.add(orbit, terrain)

  const map = await ctx.texture(base + 'wrap-color.jpg', { srgb: true, anisotropy: 16, repeat: true })
  const cloud = await ctx.texture(base + 'wrap-cloud.png', { srgb: false, anisotropy: 16, repeat: true })
  const light = await ctx.dataTexture(base + 'light.bin', look.globe.lightSize[0], look.globe.lightSize[1], 4)
  const shade = await ctx.dataTexture(base + 'shade.bin', look.globe.shadeSize[0], look.globe.shadeSize[1], 4)
  const haloLut = await ctx.dataTexture(base + 'halo.bin', look.halo.size[0], look.halo.size[1], 4)
  const patchTextures: THREE.Texture[] = []
  for (const level of patchJson.levels) patchTextures.push(await ctx.texture(base + level.file, { srgb: true, anisotropy: 16 }))
  const patches = { textures: patchTextures, widthsDeg: patchJson.levels.map((l) => l.widthDeg), spot: new THREE.Vector3().fromArray(patchJson.spot), feather: patchJson.feather, fade: patchJson.fade as [number, number] }
  const globe = new Globe({ map, cloud, light, shade, patches, ...look.globe })
  globe.mesh.quaternion.fromArray(fit.globe.quaternion)
  const halo = new Halo(haloLut, look.halo.size, look.halo.range)
  const shape = new THREE.Group()
  shape.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3().fromArray(look.shape.axis).normalize())
  shape.scale.set(look.shape.polar, look.shape.equator, look.shape.equator)
  shape.position.fromArray(look.shape.center)
  const upright = new THREE.Group()
  upright.quaternion.copy(shape.quaternion).invert()
  upright.add(globe.mesh, halo.mesh)
  shape.add(upright)
  orbit.add(shape)

  const holdPose = plan.hold(plan.holdMid - plan.seg.hold.start)
  const ringNormal = new THREE.Vector3().fromArray(fit.rings!.normal).normalize()
  const ringLines = [...parseLines(await ctx.buffer(base + 'rings.bin')), ...hairLines(look.rings)]
  const ringGeo = ringGeometry(look.rings, ringLines, look.rings.flat ? { eye: holdPose.position, normal: ringNormal } : undefined)
  const farLines = fullLines(ringLines, fit.rings!.normal as [number, number, number], look.rings.vary, look.rings.far)
  const farGeo = ringGeometry(look.rings, farLines)
  const ringShadow = ringProfile(farLines, [1.05, 2], look.rings.shade[1])
  globe.ringShade(ringShadow, [1.05, 2], ringNormal)
  const farRings = new Rings(farGeo, look.rings, holdPose.position, true)
  orbit.add(farRings.mesh)
  const rings = new Rings(ringGeo, look.rings, holdPose.position)
  orbit.add(rings.mesh)
  const veil = new Veil(await ctx.texture(base + 'veil.webp', { srgb: false, anisotropy: 16, repeat: true }), look.veil)
  orbit.add(veil.mesh)
  const moonSize = look.moons.heightSize[key]
  const moons: { body: Moon; home: THREE.Vector3; spinAxis: THREE.Vector3; phase: number; light: THREE.Vector3 }[] = []
  for (const [i, m] of (fit.moons ?? []).entries()) {
    const tone = look.moons.bodies[m.id]!
    const body = new Moon({
      map: await ctx.texture(base + m.id + '-color.jpg', { srgb: true, anisotropy: 16, repeat: true }),
      height: ctx.floatTexture(await heights(ctx, base + m.id + '-height.bin', moonSize[0], moonSize[1]), moonSize[0], moonSize[1], true),
      heightWidth: moonSize[0], bump: look.moons.bump, wrap: look.moons.wrap, seeliger: tone.seeliger, knee: look.moons.knee, rim: tone.rim, sun: tone.sun, ambient: tone.ambient, bounce: look.moons.bounce, air: look.moons.air,
    })
    body.mesh.scale.setScalar(m.radius * tone.depth)
    orbit.add(body.mesh)
    moons.push({ body, home: new THREE.Vector3().fromArray(m.position).sub(holdPose.position).multiplyScalar(tone.depth).add(holdPose.position), spinAxis: new THREE.Vector3(0.3 - 0.5 * i, 1, 0.2).normalize(), phase: 1.1 + 2.3 * i, light: new THREE.Vector3().fromArray(tone.light).normalize() })
  }

  const far = new FarPoint()
  orbit.add(far.points)

  const deck = new Deck({
    color: await ctx.texture(base + 'deck-color.jpg', { srgb: true, anisotropy: 16 }),
    near: await ctx.texture(base + 'deck-near.jpg', { srgb: true, anisotropy: 16 }),
    cloud: await ctx.texture(base + 'deck-cloud.jpg', { srgb: false, anisotropy: 16, repeat: true }),
    far: await ctx.texture(base + 'deck-far.jpg', { srgb: false, anisotropy: 16, repeat: true }),
    height: await ctx.dataTexture(base + 'deck-height.bin', deckJson.heightSize[0]!, deckJson.heightSize[1]!, 1),
    light: await ctx.dataTexture(base + 'deck-light.bin', deckJson.lightSize[0]!, deckJson.lightSize[1]!, 4),
    halo: await ctx.dataTexture(base + 'deck-halo.bin', deckJson.haloSize[0]!, deckJson.haloSize[1]!, 4),
  }, key, look.deck)
  terrain.add(deck.group)
  const terrainMid = (plan.seg.terrain.start + plan.seg.terrain.end) / 2
  const arcLines = parseLines(await ctx.buffer(base + 'deck-rings.bin'))
  const arcGeo = ringGeometry(look.deckRings, [...arcLines, ...strandLines(arcLines, look.deckStrands)])
  const arcCentre = new THREE.Vector3().fromArray(deckRingsJson.centre)
  const arcs = new Rings(arcGeo, look.deckRings, arcCentre.clone().multiplyScalar(-1 / deckRingsJson.scale))
  arcs.mesh.scale.setScalar(deckRingsJson.scale)
  arcs.mesh.renderOrder = 8
  terrain.add(arcs.mesh)
  const ball = new THREE.Group()
  ball.position.fromArray(deckJson.centre)
  ball.scale.setScalar(deckJson.radius)
  terrain.add(ball)
  const mist = new Mist(look.mist)
  ball.add(mist.mesh)
  const air = new Mist(look.air)
  shape.add(air.mesh)
  const inverse = new THREE.Matrix4()
  const eye = new THREE.Vector3()
  const frameInverse = plan.terrainFrame.clone().invert()
  const turnMid = plan.turn(terrainMid)
  const skyTurn = new THREE.Quaternion()

  const sun = new THREE.Vector3()
  const turn = new THREE.Quaternion()
  const place = (): void => {
    world.updateMatrix()
    eye.set(0, 0, 0).applyMatrix4(inverse.copy(world.matrix).invert())
  }
  const ground = (time: number, sunDir: THREE.Vector3, gain: number, lines: number, vignette: number, aspect: number): void => {
    deck.update(eye, time - terrainMid, gain, vignette, aspect, 1)
    skyTurn.copy(frameInverse).multiply(turn.copy(plan.turn(time)).invert()).multiply(turnMid).multiply(plan.terrainFrame)
    arcs.mesh.quaternion.copy(skyTurn)
    arcs.mesh.position.copy(arcCentre).applyQuaternion(skyTurn)
    arcs.update(sunDir, gain * lines)
    arcs.mesh.visible = look.show.rings
    deck.group.visible = look.show.deck
  }
  const bounce = new THREE.Vector3()
  const moonLight = new THREE.Vector3()
  const planetInverse = new THREE.Matrix4()

  const sky: SkyPatch[] = []
  for (const [view, def] of Object.entries(skyJson)) {
    const wide = 1 + 2 * def.margin
    const t = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2) * wide
    sky.push({ view: view as ViewKind, texture: await ctx.texture(base + def.file, { srgb: true, mips: false, anisotropy: 1 }), aim: new THREE.Quaternion(), tan: [t * 16 / 9, t], gain: def.gain, add: def.add, ring: def.ring as [number, number, number, number], edge: def.margin / wide })
  }

  return {
    id: plan.id,
    world,
    sky: look.show.sky ? sky : [],
    update: (state, shot, view) => {
      const inOrbit = state.view === 'orbit'
      orbit.visible = inOrbit && state.weight > 0
      const gain = 1 / shot.post.exposure
      const aspect = view.format.width / view.format.height
      terrain.visible = !inOrbit
      if (!inOrbit) {
        place()
        const seg = shot.segment
        const mine = seg.stop === plan.id
        const diving = mine && seg.kind === 'dive'
        const rising = mine && seg.kind === 'rise'
        const since = diving || rising ? (state.time - plan.swap(seg)) * config.fps : 0
        const thick = diving ? 1 - smooth(ramp(look.clearing.mist[0], look.clearing.mist[1], since)) : rising ? smooth(ramp(look.closing.mist[0], look.closing.mist[1], since)) : 0
        const lines = diving ? smooth(ramp(look.clearing.arcs[0], look.clearing.arcs[1], since)) : rising ? 1 - smooth(ramp(look.closing.arcs[0], look.closing.arcs[1], since)) : 1
        ground(state.time, shot.sun.dir, gain, lines, shot.post.vignette, aspect)
        const rush = shot.cover.rush
        mist.update(look.show.cover && rush ? thick : 0, shot.sun.dir, rush ? rush.focus : [0, 0], rush ? rush.phase : 0, rush ? rush.billow : [1, 1, 1], gain)
        return
      }
      const kind = shot.segment.kind
      const mine = shot.segment.stop === plan.id
      const low = mine && (kind === 'dive' || kind === 'rise') && state.weight > 0
      const altitude = world.position.length() - 1
      const near = low ? 1 - smooth(ramp(Math.log(look.near.span[0]), Math.log(look.near.span[1]), Math.log(Math.max(altitude, 1e-4)))) : 0
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      sun.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      const elapsed = state.time - plan.holdMid
      const left = mine ? kind === 'rise' || kind === 'travel' : kind !== 'travel'
      globe.update(sun, plan.spin(state.time), elapsed, gain * (left ? look.globe.away : 1), state.weight, shot.post.vignette, aspect)
      const nearing = mine && kind === 'dive' ? look.globe.diveSoft[0] * (1 - smooth(ramp(Math.log(look.globe.diveSoft[1]), Math.log(look.globe.diveSoft[2]), Math.log(Math.max(altitude, 1e-4))))) : 0
      globe.soften(left ? look.globe.soft : nearing, left ? look.globe.awayShade : 1)
      globe.near(look.near.tint, near)
      halo.update(sun, gain * state.weight * (1 + (look.near.halo - 1) * near))
      rings.update(sun, gain * state.weight)
      farRings.update(sun, gain * state.weight)
      globe.shadeRings(left ? look.rings.shade[0] : 0, farRings.mesh, farRings.sunLocal)
      const veiled = kind === 'travel' ? (mine ? 0 : THREE.MathUtils.smoothstep(shot.u, 0.2, 0.8)) : mine && kind === 'hold' ? 1 : mine && kind === 'dive' ? 1 - smooth(ramp(look.veil.dive[0], look.veil.dive[1], shot.u)) : 0
      veil.update(gain * state.weight * veiled * shot.skyGlow, shot.post.vignette, aspect)
      turn.setFromAxisAngle(ringNormal, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * elapsed)
      shape.updateWorldMatrix(true, false)
      planetInverse.copy(shape.matrixWorld).invert()
      for (const m of moons) {
        m.body.mesh.position.copy(m.home).applyQuaternion(turn)
        m.body.mesh.quaternion.setFromAxisAngle(m.spinAxis, m.phase + THREE.MathUtils.degToRad(look.moons.spinDegPerSecond) * elapsed)
        bounce.copy(m.body.mesh.position).negate().normalize().applyQuaternion(state.rotation)
        m.body.update(left ? sun : moonLight.copy(m.light).applyQuaternion(state.rotation), bounce, gain * state.weight * (left ? look.moons.away : 1), shot.post.vignette, aspect, planetInverse, left ? look.moons.shine : 1)
      }
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      const visible = radiusPx > 0.6
      globe.mesh.visible = visible && look.show.globe
      halo.mesh.visible = visible && look.show.globe
      rings.mesh.visible = visible && look.show.rings && !left
      farRings.mesh.visible = visible && look.show.rings && left
      veil.mesh.visible = visible && look.show.rings && look.show.sky
      for (const m of moons) m.body.mesh.visible = visible && look.show.moons
      far.update(radiusPx, view, plan.p.tint, gain)
      const rush = shot.cover.rush
      const thick = mine && kind === 'rise' && rush ? 1 - smooth(ramp(look.lifting.mist[0], look.lifting.mist[1], (state.time - plan.swap(shot.segment)) * config.fps)) : 0
      air.update(look.show.cover ? thick : 0, sun, rush ? rush.focus : [0, 0], rush ? rush.phase : 0, rush ? rush.billow : [1, 1, 1], gain)
    },
    dispose: () => {
      globe.dispose()
      halo.dispose()
      rings.dispose()
      farRings.dispose()
      ringShadow.dispose()
      veil.dispose()
      ringGeo.dispose()
      farGeo.dispose()
      for (const m of moons) m.body.dispose()
      far.dispose()
      deck.dispose()
      mist.dispose()
      air.dispose()
      arcs.dispose()
      arcGeo.dispose()
    },
  }
}
