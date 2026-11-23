import { handoverOf } from '../../director/handover'
import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import { config } from '../../config'
import type { SetContext, SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { ramp, smooth } from '../../director/rig'
import { Deck, Glow } from './deck'
import deckJson from './deck.json'
import deckRingsJson from './deck-rings.json'
import { Globe } from './globe'
import { Halo } from './halo'
import * as look from './look'
import { Moon } from './moons'
import patchJson from './patches.json'
import platesJson from './plates.json'
import { plan } from './plan'
import { newRingMove, ringMove } from './ringmove'
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
  const cloud = await ctx.texture(base + 'wrap-cloud.png', { srgb: false, channels: 1, anisotropy: 16, repeat: true })
  const shadow = await ctx.texture(base + 'wrap-shadow.png', { srgb: false, channels: 1, anisotropy: 16, repeat: true })
  const light = await ctx.dataTexture(base + 'light.bin', look.globe.lightSize[0], look.globe.lightSize[1], 4)
  const shade = await ctx.dataTexture(base + 'shade.bin', look.globe.shadeSize[0], look.globe.shadeSize[1], 4)
  const haloLut = await ctx.dataTexture(base + 'halo.bin', look.halo.size[0], look.halo.size[1], 4)
  const patchTextures: THREE.Texture[] = []
  for (const level of patchJson.levels) patchTextures.push(await ctx.texture(base + level.file, { srgb: true, anisotropy: 16 }))
  const patches = { textures: patchTextures, widthsDeg: patchJson.levels.map((l) => l.widthDeg), spot: new THREE.Vector3().fromArray(patchJson.spot), feather: patchJson.feather, fade: patchJson.fade as [number, number] }
  const face = { map: await ctx.texture(base + 'face.jpg', { srgb: false, anisotropy: 16 }), ...look.face }
  const deckLight = await ctx.dataTexture(base + 'deck-light.bin', deckJson.lightSize[0]!, deckJson.lightSize[1]!, 4)
  const plateTextures: THREE.Texture[] = []
  for (const level of platesJson.levels) plateTextures.push(await ctx.texture(base + level.file, { srgb: false, anisotropy: 16 }))
  const globeTurn = new THREE.Quaternion().fromArray(fit.globe.quaternion)
  const place = {
    textures: plateTextures, halfTans: platesJson.levels.map((l) => l.halfTan), frame: platesJson, rot: plan.terrainFrame.clone().invert().multiply(globeTurn), field: await ctx.dataTexture(base + platesJson.field.file, platesJson.field.size, platesJson.field.size, 4), clockRef: platesJson.clockRef, aMax: platesJson.aMax, steep: look.place.steep, relitSoft: look.place.light.soft, topLight: look.place.tops, feather: platesJson.feather,
    deck: { centre: deckJson.centre, radius: deckJson.radius, f0: deckJson.f0, r0: deckJson.r0, flow: look.deck.flow, flowAngle: deckJson.flowAngle, light: deckLight, lightSize: deckJson.lightSize, psiMax: deckJson.psiMax },
  }
  const globe = new Globe({ map, cloud, shadow, light, shade, patches, face, place, ...look.globe })
  globe.mesh.quaternion.copy(globeTurn)
  const halo = new Halo(haloLut, look.halo.size, look.halo.range, { map, light, shade, lightSize: look.globe.lightSize, bandRate: look.globe.bandRate, turn: globe.mesh.quaternion, rim: look.halo.rim, rimSun: look.halo.rimSun })
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

  const deckHalo = await ctx.dataTexture(base + 'deck-halo.bin', deckJson.haloSize[0]!, deckJson.haloSize[1]!, 4)
  const deck = new Deck({
    color: await ctx.texture(base + 'deck-color.jpg', { srgb: true, anisotropy: 16 }),
    near: await ctx.texture(base + 'deck-near.jpg', { srgb: true, anisotropy: 16 }),
    cloud: await ctx.texture(base + 'deck-cloud.jpg', { srgb: false, anisotropy: 16, repeat: true }),
    far: await ctx.texture(base + 'deck-far.jpg', { srgb: false, anisotropy: 16, repeat: true }),
    height: await ctx.dataTexture(base + 'deck-height.bin', deckJson.heightSize[0]!, deckJson.heightSize[1]!, 1),
    light: deckLight,
    halo: deckHalo,
  }, key, look.deck)
  terrain.add(deck.group)
  const terrainMid = (plan.seg.terrain.start + plan.seg.terrain.end) / 2
  const deckCentre = new THREE.Vector3().fromArray(deckJson.centre)
  const eyeAt = (kind: 'dive' | 'rise', time: number): THREE.Vector3 => plan.unseat(plan.flown(kind, time), time).position.sub(deckCentre).divideScalar(deckJson.radius)
  const eyes = { dive: eyeAt('dive', handoverOf(plan.id, 'dive')!.time), rise: eyeAt('rise', handoverOf(plan.id, 'rise')!.time) }
  const arcLines = parseLines(await ctx.buffer(base + 'deck-rings.bin'))
  const arcGeo = ringGeometry(look.deckRings, [...arcLines, ...strandLines(arcLines, look.deckStrands)])
  const arcCentre = new THREE.Vector3().fromArray(deckRingsJson.centre)
  const arcs = new Rings(arcGeo, look.deckRings, arcCentre.clone().multiplyScalar(-1 / deckRingsJson.scale))
  arcs.mesh.scale.setScalar(deckRingsJson.scale)
  arcs.mesh.renderOrder = 8
  terrain.add(arcs.mesh)
  const lowArcs = new Rings(arcGeo, look.deckRings, arcCentre.clone().multiplyScalar(-1 / deckRingsJson.scale), false, true)
  lowArcs.mesh.scale.setScalar(deckRingsJson.scale / deckJson.radius)
  lowArcs.mesh.renderOrder = 8
  const riseRings = new Rings(farGeo, look.rings, holdPose.position, false, true, true)
  riseRings.mesh.renderOrder = 8
  const riseArcs = new Rings(arcGeo, look.deckRings, arcCentre.clone().multiplyScalar(-1 / deckRingsJson.scale), false, true, true)
  riseArcs.mesh.renderOrder = 8
  const archScale = deckRingsJson.scale / deckJson.radius
  const arch = { position: lowArcs.mesh.position, quaternion: lowArcs.mesh.quaternion, scale: archScale, normal: new THREE.Vector3().fromArray(deckRingsJson.normal).normalize() }
  const moved = newRingMove()
  const ringRatio = look.place.ringMove.match[1] / (look.place.ringMove.match[0] * archScale)
  const ringUnit = look.place.ringMove.match[1] / look.place.ringMove.match[0]
  const hoops = look.place.ringMove.hoops
  const glow = new Glow(deckHalo, 2000 / deckJson.radius)
  const over = new THREE.Group()
  over.add(glow.mesh, lowArcs.mesh, riseArcs.mesh, riseRings.mesh)
  const origin = new THREE.Vector3()
  const ball = new THREE.Vector3()
  const seated = new THREE.Quaternion()
  const inverse = new THREE.Matrix4()
  const eye = new THREE.Vector3()
  const frameInverse = plan.terrainFrame.clone().invert()
  const turnMid = plan.turn(terrainMid)
  const skyTurn = new THREE.Quaternion()

  const sun = new THREE.Vector3()
  const turn = new THREE.Quaternion()
  const placeEye = (): void => {
    world.updateMatrix()
    eye.set(0, 0, 0).applyMatrix4(inverse.copy(world.matrix).invert())
  }
  const reach = (span: [number, number], altitude: number): number => 1 - smooth(ramp(Math.log(span[0]), Math.log(span[1]), Math.log(Math.max(altitude, 1e-4))))
  const fixed = (time: number): void => {
    skyTurn.copy(frameInverse).multiply(turn.copy(plan.turn(time)).invert()).multiply(turnMid).multiply(plan.terrainFrame)
  }
  const ground = (time: number, sunDir: THREE.Vector3, gain: number, lines: number, vignette: number, aspect: number, bloom: number, pictured: boolean, lens: [number, number]): void => {
    deck.update(eye, time - terrainMid, gain, vignette, aspect, 1, bloom, lens)
    fixed(time)
    arcs.mesh.quaternion.copy(skyTurn)
    arcs.mesh.position.copy(arcCentre).applyQuaternion(skyTurn)
    arcs.update(sunDir, gain * lines)
    arcs.mesh.visible = look.show.rings && !pictured
    deck.haze.mesh.visible = !pictured
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
    over,
    sky: look.show.sky ? sky : [],
    update: (state, shot, view) => {
      const inOrbit = state.view === 'orbit'
      orbit.visible = inOrbit && state.weight > 0
      const gain = 1 / shot.post.exposure
      const aspect = view.format.width / view.format.height
      terrain.visible = !inOrbit
      if (!inOrbit) {
        placeEye()
        const seg = shot.segment
        const moving = seg.stop === plan.id && (seg.kind === 'dive' || seg.kind === 'rise')
        ground(state.time, shot.sun.dir, gain, moving ? reach(look.place.sky, eye.distanceTo(deckCentre) / deckJson.radius - 1) : 1, shot.post.vignette, aspect, shot.post.bloomStrength, view.place === true, view.place === true && view.camera.view ? [view.camera.view.fullWidth / view.camera.view.width, view.camera.view.fullHeight / view.camera.view.height] : [1, 1])
        lowArcs.mesh.visible = false
        riseArcs.mesh.visible = false
        riseRings.mesh.visible = false
        glow.mesh.visible = false
        return
      }
      const kind = shot.segment.kind
      const mine = shot.segment.stop === plan.id
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      const visible = radiusPx > 0.6
      const low = mine && (kind === 'dive' || kind === 'rise') && state.weight > 0
      const altitude = world.position.length() - 1
      const near = low ? reach(look.near.span, altitude) : 0
      const sky = low ? reach(look.place.sky, altitude) : 0
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      sun.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      const elapsed = state.time - plan.holdMid
      const left = mine ? kind === 'rise' || kind === 'travel' : kind !== 'travel'
      const clock = plan.clock(state.time)
      const sphere = low ? plan.roundness(state.time) : 0
      shape.scale.set(look.shape.polar + (1 - look.shape.polar) * sphere, look.shape.equator + (1 - look.shape.equator) * sphere, look.shape.equator + (1 - look.shape.equator) * sphere)
      shape.position.fromArray(look.shape.center).multiplyScalar(1 - sphere)
      globe.update(sun, plan.spin(state.time), elapsed, clock, gain * (left ? look.globe.away : 1), state.weight, shot.post.vignette, aspect)
      const nearing = mine && kind === 'dive' ? look.globe.diveSoft[0] * (1 - smooth(ramp(Math.log(look.globe.diveSoft[1]), Math.log(look.globe.diveSoft[2]), Math.log(Math.max(altitude, 1e-4))))) : 0
      globe.soften(left ? look.globe.soft : nearing, left ? look.globe.awayShade : 1)
      globe.near(look.near.tint, near)
      const relit = low && !look.show.down
      const plated = low ? reach(look.place.plates, altitude) : 0
      if (low) globe.place(relit ? reach(look.place.light.up, altitude) : 0, relit ? reach(look.place.light.down, altitude) : 0, plated, 1 - reach(look.place.tops.clear[kind as 'dive' | 'rise'], altitude), state.time - terrainMid, look.place.fixedEye ? eyes[kind as 'dive' | 'rise'] : eyeAt(kind as 'dive' | 'rise', state.time))
      else globe.place(0, 0, 0, 0, state.time - terrainMid, eyes.dive)
      globe.face(left ? look.face.weight : 0)
      halo.update(sun, gain * state.weight * (1 + (look.near.halo - 1) * near) * (1 - sky), plan.spin(state.time), clock)
      placeEye()
      seated.copy(plan.deckFrame(state.time))
      glow.turn(seated)
      glow.update(eye, origin, 1, gain * state.weight * sky, shot.post.vignette, aspect)
      glow.mesh.visible = sky > 0 && look.show.sky
      fixed(state.time)
      lowArcs.mesh.position.copy(arcCentre).applyQuaternion(skyTurn).sub(deckCentre).divideScalar(deckJson.radius).applyQuaternion(seated)
      lowArcs.mesh.quaternion.copy(seated).multiply(skyTurn)
      const rising = low && kind === 'rise'
      const open = rising ? 1 - reach(look.place.ringMove.span, altitude) : 0
      const moving = open > 0
      const handed = rising ? 1 - reach(look.place.ringMove.hand, altitude) : 1
      const arched = low ? (rising ? 1 - smooth(ramp(look.place.ringMove.arch[0], look.place.ringMove.arch[1], open)) : reach(look.place.arcs.dive, altitude)) : 0
      world.getWorldPosition(ball)
      if (moving) {
        const spread = smooth(ramp(look.place.ringMove.spread[0], look.place.ringMove.spread[1], open))
        ringMove(moved, open, arch, ringNormal, ringRatio, eye)
        riseArcs.mesh.position.copy(moved.centre)
        riseArcs.mesh.quaternion.copy(moved.archTurn)
        riseArcs.mesh.scale.setScalar(moved.archSize)
        riseArcs.gather(arch.normal, hoops.arch, hoops.rings, 1 / ringUnit, spread, false, look.place.ringMove.show)
        riseRings.mesh.position.copy(moved.centre)
        riseRings.mesh.quaternion.copy(moved.turn)
        riseRings.mesh.scale.setScalar(moved.size)
        riseRings.gather(ringNormal, hoops.rings, hoops.arch, ringUnit, 1 - spread, true, look.place.ringMove.show)
        riseArcs.update(shot.sun.dir, gain * state.weight * arched)
        riseArcs.against(ball, 1, look.place.onSky)
      }
      riseArcs.mesh.visible = moving && arched > 0 && visible && look.show.rings
      lowArcs.update(shot.sun.dir, gain * state.weight * arched)
      lowArcs.against(ball, 1, look.place.onSky)
      lowArcs.mesh.visible = !moving && arched > 0 && look.show.rings
      const ringed = low ? (rising ? handed : 1 - reach(look.place.rings.dive, altitude)) : 1
      const settling = (!mine && kind === 'travel') || (mine && kind === 'hold') ? smooth(ramp(look.arrival.rings[0], look.arrival.rings[1], (state.time - plan.seg.hold.start) * config.fps)) : 1
      rings.update(sun, gain * state.weight * settling * ringed)
      const lifted = mine && left ? look.departing.rings[2] + (1 - look.departing.rings[2]) * smooth(ramp(look.departing.rings[0], look.departing.rings[1], altitude)) : 1
      farRings.update(sun, gain * state.weight * lifted * ringed)
      const mid = moving ? 1 - handed : 0
      riseRings.update(sun, gain * state.weight * lifted * mid)
      riseRings.against(ball, 1, look.place.onSky)
      riseRings.mesh.visible = mid > 0 && visible && look.show.rings
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
      globe.mesh.visible = visible && look.show.globe
      halo.mesh.visible = visible && look.show.globe
      rings.mesh.visible = visible && look.show.rings && !left
      farRings.mesh.visible = visible && look.show.rings && left
      veil.mesh.visible = visible && look.show.rings && look.show.sky
      for (const m of moons) m.body.mesh.visible = visible && look.show.moons
      far.update(radiusPx, view, plan.p.tint, gain)
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
      glow.dispose()
      arcs.dispose()
      lowArcs.dispose()
      riseRings.dispose()
      riseArcs.dispose()
      arcGeo.dispose()
    },
  }
}
