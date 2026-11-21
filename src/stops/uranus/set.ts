import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import { config } from '../../config'
import type { SetContext, SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { FilmDirector } from '../../director/film'
import { plans } from '../../director/plans'
import { smooth } from '../../director/rig'
import { Deck } from './deck'
import deckJson from './deck.json'
import deckRingsJson from './deck-rings.json'
import { Globe } from './globe'
import { Halo } from './halo'
import * as look from './look'
import { Moon } from './moons'
import patchJson from './patches.json'
import { plan } from './plan'
import { evenLines, hairLines, parseLines, ringGeometry, Rings } from './rings'
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
  const farGeo = ringGeometry(look.rings, evenLines(ringLines, fit.rings!.normal as [number, number, number], look.rings.even))
  const farRings = new Rings(farGeo, look.rings, holdPose.position)
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
      heightWidth: moonSize[0], bump: look.moons.bump, wrap: look.moons.wrap, seeliger: tone.seeliger, knee: look.moons.knee, rim: tone.rim, sun: tone.sun, ambient: tone.ambient, bounce: look.moons.bounce,
    })
    body.mesh.scale.setScalar(m.radius)
    orbit.add(body.mesh)
    moons.push({ body, home: new THREE.Vector3().fromArray(m.position), spinAxis: new THREE.Vector3(0.3 - 0.5 * i, 1, 0.2).normalize(), phase: 1.1 + 2.3 * i, light: new THREE.Vector3().fromArray(tone.light).normalize() })
  }

  const far = new FarPoint()
  orbit.add(far.points)

  const deck = new Deck({
    color: await ctx.texture(base + 'deck-color.jpg', { srgb: true, anisotropy: 16 }),
    far: await ctx.texture(base + 'deck-far.jpg', { srgb: false, anisotropy: 16, repeat: true }),
    height: await ctx.dataTexture(base + 'deck-height.bin', deckJson.heightSize[0]!, deckJson.heightSize[1]!, 1),
    light: await ctx.dataTexture(base + 'deck-light.bin', deckJson.lightSize[0]!, deckJson.lightSize[1]!, 4),
    halo: await ctx.dataTexture(base + 'deck-halo.bin', deckJson.haloSize[0]!, deckJson.haloSize[1]!, 4),
  }, key, look.deck)
  terrain.add(deck.group)
  const terrainMid = (plan.seg.terrain.start + plan.seg.terrain.end) / 2
  const arcGeo = ringGeometry(look.deckRings, parseLines(await ctx.buffer(base + 'deck-rings.bin')))
  const arcCentre = new THREE.Vector3().fromArray(deckRingsJson.centre)
  const arcs = new Rings(arcGeo, look.deckRings, arcCentre.clone().multiplyScalar(-1 / deckRingsJson.scale))
  arcs.mesh.scale.setScalar(deckRingsJson.scale)
  terrain.add(arcs.mesh)
  const frameInverse = plan.terrainFrame.clone().invert()
  const turnMid = plan.turn(terrainMid)
  const skyTurn = new THREE.Quaternion()

  const director = new FilmDirector(plans)
  const delta = new THREE.Matrix4()
  const before = new THREE.Matrix4()
  const after = new THREE.Matrix4()
  const eye = new THREE.Matrix4()
  const offset = new THREE.Vector3()
  const unit = new THREE.Vector3(1, 1, 1)
  const sun = new THREE.Vector3()
  const turn = new THREE.Quaternion()
  const bounce = new THREE.Vector3()
  const moonLight = new THREE.Vector3()

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
      terrain.visible = !inOrbit
      const gain = 1 / shot.post.exposure
      if (!inOrbit) {
        deck.update(world, state.time - terrainMid, gain, shot.post.vignette, view.format.width / view.format.height)
        skyTurn.copy(frameInverse).multiply(turn.copy(plan.turn(state.time)).invert()).multiply(turnMid).multiply(plan.terrainFrame)
        arcs.mesh.quaternion.copy(skyTurn)
        arcs.mesh.position.copy(arcCentre).applyQuaternion(skyTurn)
        arcs.update(shot.sun.dir, gain)
        arcs.mesh.visible = look.show.rings
        deck.group.visible = look.show.deck
        return
      }
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      sun.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      const elapsed = state.time - plan.holdMid
      const aspect = view.format.width / view.format.height
      globe.update(sun, plan.spin(state.time), elapsed, gain, state.weight, shot.post.vignette, aspect)
      halo.update(sun, gain * state.weight)
      const kind = shot.segment.kind
      const mine = shot.segment.stop === plan.id
      let moving = false
      if (view.samples > 1 && config.fastKinds.includes(kind)) {
        const next = director.shotAt(shot.frame, shot.time + config.shutterFraction / (config.fps * view.samples))
        const then = next.sets.find((s) => s.id === plan.id)
        if (then && then.view === 'orbit') {
          before.compose(offset.copy(state.origin).sub(shot.camera.position), state.rotation, unit).premultiply(eye.makeRotationFromQuaternion(shot.camera.quaternion).invert())
          after.compose(offset.copy(then.origin).sub(next.camera.position), then.rotation, unit).premultiply(eye.makeRotationFromQuaternion(next.camera.quaternion).invert())
          delta.copy(after).multiply(before.invert())
          moving = true
        }
      }
      const half: [number, number] = [view.format.width / 2, view.format.height / 2]
      rings.update(sun, gain * state.weight, moving ? delta : undefined, half)
      farRings.update(sun, gain * state.weight, moving ? delta : undefined, half)
      const left = mine ? kind === 'rise' || kind === 'travel' : kind !== 'travel'
      const veiled = kind === 'travel' ? (mine ? 0 : THREE.MathUtils.smoothstep(shot.u, 0.2, 0.8)) : mine && (kind === 'hold' || kind === 'dive') ? 1 : 0
      veil.update(gain * state.weight * veiled * shot.skyGlow, shot.post.vignette, aspect)
      turn.setFromAxisAngle(ringNormal, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * elapsed)
      for (const m of moons) {
        m.body.mesh.position.copy(m.home).applyQuaternion(turn)
        m.body.mesh.quaternion.setFromAxisAngle(m.spinAxis, m.phase + THREE.MathUtils.degToRad(look.moons.spinDegPerSecond) * elapsed)
        bounce.copy(m.body.mesh.position).negate().normalize().applyQuaternion(state.rotation)
        m.body.update(moonLight.copy(m.light).applyQuaternion(state.rotation), bounce, gain * state.weight, shot.post.vignette, aspect)
      }
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      const visible = radiusPx > 0.6
      globe.mesh.visible = visible && look.show.globe
      halo.mesh.visible = visible && look.show.globe
      rings.mesh.visible = visible && look.show.rings && !left
      farRings.mesh.visible = visible && look.show.rings && left
      veil.mesh.visible = visible && look.show.rings && look.show.sky
      const whip = mine && kind === 'rise' && shot.time < plan.seg.rise.start + look.moons.riseFrom
      for (const m of moons) m.body.mesh.visible = visible && look.show.moons && !whip
      far.update(radiusPx, view, plan.p.tint, gain)
    },
    dispose: () => {
      globe.dispose()
      halo.dispose()
      rings.dispose()
      farRings.dispose()
      veil.dispose()
      ringGeo.dispose()
      farGeo.dispose()
      for (const m of moons) m.body.dispose()
      far.dispose()
      deck.dispose()
      arcs.dispose()
      arcGeo.dispose()
    },
  }
}
