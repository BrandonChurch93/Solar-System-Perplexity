import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import type { SetContext, SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { smooth } from '../../director/rig'
import { Deck } from './deck'
import deckJson from './deck.json'
import deckRingsJson from './deck-rings.json'
import { Globe } from './globe'
import { Halo } from './halo'
import * as look from './look'
import { Moon } from './moons'
import { plan } from './plan'
import { hairLines, parseLines, ringGeometry, Rings } from './rings'
import skyJson from './sky.json'

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
  const globe = new Globe({ map, cloud, light, shade, ...look.globe })
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

  const ringGeo = ringGeometry(look.rings, [...parseLines(await ctx.buffer(base + 'rings.bin')), ...hairLines(look.rings)])
  const holdPose = plan.hold(plan.holdMid - plan.seg.hold.start)
  const rings = new Rings(ringGeo, look.rings, holdPose.position)
  orbit.add(rings.mesh)
  const ringNormal = new THREE.Vector3().fromArray(fit.rings!.normal).normalize()
  const moonSize = look.moons.heightSize[key]
  const moons: { body: Moon; home: THREE.Vector3; spinAxis: THREE.Vector3; phase: number; light: THREE.Vector3 }[] = []
  for (const [i, m] of (fit.moons ?? []).entries()) {
    const tone = look.moons.bodies[m.id]!
    const body = new Moon({
      map: await ctx.texture(base + m.id + '-color.jpg', { srgb: true, anisotropy: 16, repeat: true }),
      height: ctx.floatTexture(await heights(ctx, base + m.id + '-height.bin', moonSize[0], moonSize[1]), moonSize[0], moonSize[1], true),
      heightWidth: moonSize[0], bump: look.moons.bump, wrap: look.moons.wrap, sun: tone.sun, ambient: tone.ambient, bounce: look.moons.bounce,
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
    sky,
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
      rings.update(sun, gain * state.weight)
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
      globe.mesh.visible = visible
      halo.mesh.visible = visible
      rings.mesh.visible = visible && look.show.rings
      for (const m of moons) m.body.mesh.visible = visible && look.show.moons
      far.update(radiusPx, view, plan.p.tint, gain)
    },
    dispose: () => {
      globe.dispose()
      halo.dispose()
      rings.dispose()
      ringGeo.dispose()
      for (const m of moons) m.body.dispose()
      far.dispose()
      deck.dispose()
      arcs.dispose()
      arcGeo.dispose()
    },
  }
}
