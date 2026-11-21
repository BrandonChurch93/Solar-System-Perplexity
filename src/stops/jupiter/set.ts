import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import { HazeShell } from '../../bodies/haze'
import type { SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { diagUniform } from '../../diagnostics/diag'
import { smooth } from '../../director/rig'
import { patches } from './assets'
import { Deck, type DeckMeta } from './deck'
import { Globe } from './globe'
import { Io } from './io'
import * as look from './look'
import { plan } from './plan'
import reliefJson from './relief.json'
import skyJson from './sky.json'

function direction(lonDeg: number, latDeg: number): THREE.Vector3 {
  const lon = THREE.MathUtils.degToRad(lonDeg)
  const lat = THREE.MathUtils.degToRad(latDeg)
  return new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon))
}

function settle(x: number, limit: number): number {
  return x / Math.sqrt(1 + (x / limit) * (x / limit))
}

export const createSet: SetFactory = async (ctx) => {
  const base = 'jupiter/' + ctx.assets + '/'
  const fit = plan.fit
  const world = new THREE.Group()
  const orbit = new THREE.Group()
  const terrain = new THREE.Group()
  world.add(orbit, terrain)

  const map = await ctx.texture(base + 'wrap-color.jpg', { srgb: true, anisotropy: 16, repeat: true })
  const wispMap = await ctx.texture(base + 'wisp.png', { srgb: false, anisotropy: 8, repeat: true })
  const patchTextures: THREE.Texture[] = []
  for (const level of patches.levels) patchTextures.push(await ctx.texture(base + level.file, { srgb: true, anisotropy: 16 }))

  const globe = new Globe({
    map, mapWidth: (map.image as unknown as { width: number }).width,
    curve: look.curve, limb: look.limb, jet: look.jet, shadeKnee: look.shadeKnee, night: look.night, nightAlbedo: look.nightAlbedo, shadow: look.shadow, haze: look.haze, edge: look.edge, limbLit: look.limbLit,
    spot: { center: direction(look.spot.lon, look.spot.lat), axesDeg: look.spot.axesDeg, core: look.spot.core, reach: look.spot.reach },
    wisp: { texture: wispMap, ...look.wisp },
    patches: { textures: patchTextures, widthsDeg: patches.levels.map((l) => l.widthDeg), feather: patches.feather, fade: patches.fade },
  })
  globe.mesh.quaternion.fromArray(fit.globe.quaternion)
  const shells = look.shells.map((p) => new HazeShell(p, diagUniform))
  orbit.add(globe.mesh, ...shells.map((s) => s.mesh))

  const ioMap = await ctx.texture(base + 'io-color.jpg', { srgb: true, anisotropy: 16, repeat: true })
  const io = new Io({ map: ioMap, mapWidth: (ioMap.image as unknown as { width: number }).width, radius: look.io.radius, sun: look.io.sun, ambient: look.io.ambient, bounce: look.io.bounce, wrap: look.io.wrap, power: look.io.power, rim: look.io.rim })
  orbit.add(io.mesh)
  const ioHome = new THREE.Vector3().fromArray(look.io.home)

  const far = new FarPoint()
  orbit.add(far.points)

  const ground = await Deck.load(ctx, base, reliefJson as DeckMeta, look.deck, wispMap)
  terrain.add(ground.group)

  const riseMid = (plan.seg.rise.start + plan.seg.rise.end) / 2
  const terrainMid = (plan.seg.terrain.start + plan.seg.terrain.end) / 2
  const holdTurn = plan.hold(plan.holdMid - plan.seg.hold.start).quaternion
  const glowHome = new THREE.Vector3().fromArray(look.glowDir).normalize().applyQuaternion(holdTurn)
  const moonHome = new THREE.Vector3().fromArray(look.moonSun).normalize()
  const moonLight = new THREE.Vector3()
  const light = new THREE.Vector3()
  const glowDir = new THREE.Vector3()
  const camera = new THREE.Vector3()
  const turn = new THREE.Quaternion()
  const ioWorld = new THREE.Vector3()
  const toPlanet = new THREE.Vector3()
  const across = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)

  const sky: SkyPatch[] = []
  for (const [view, def] of Object.entries(skyJson)) {
    const wide = 1 + 2 * def.margin
    const tan = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2) * wide
    sky.push({ view: view as ViewKind, texture: await ctx.texture(base + def.file, { srgb: true, mips: false, anisotropy: 1 }), aim: new THREE.Quaternion(), tan: [tan * 16 / 9, tan], gain: def.gain, add: def.add, ring: def.ring as [number, number, number, number], edge: def.margin / wide })
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
        ground.update(state.time - terrainMid, gain, shot.post.vignette, view)
        return
      }
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      light.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      camera.copy(world.position).negate()
      const elapsed = state.time - plan.holdMid
      const local = settle(state.time < terrainMid ? elapsed : state.time - riseMid, look.flow.settle)
      const gu = globe.material.uniforms
      gu.uFlowT!.value = THREE.MathUtils.degToRad(look.flow.bandDegPerSecond) * local
      gu.uSwirlT!.value = THREE.MathUtils.degToRad(look.flow.swirlDegPerSecond) * local
      gu.uWispT!.value = look.flow.wispTilesPerSecond * elapsed
      turn.setFromAxisAngle(plan.axis, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * elapsed)
      io.mesh.position.copy(ioHome).applyQuaternion(turn)
      io.mesh.quaternion.setFromAxisAngle(up, THREE.MathUtils.degToRad(look.io.spinDegPerSecond) * elapsed)
      ioWorld.copy(io.mesh.position).applyQuaternion(state.rotation)
      ;(gu.uMoon!.value as THREE.Vector4).set(ioWorld.x, ioWorld.y, ioWorld.z, look.io.radius)
      moonLight.copy(moonHome).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      ;(gu.uShadowSun!.value as THREE.Vector3).copy(moonLight)
      globe.update(camera, light, plan.spin(state.time), gain, state.weight)
      gu.uVignette!.value = shot.post.vignette
      gu.uAspect!.value = view.format.width / view.format.height
      const along = ioWorld.dot(moonLight)
      const eclipse = along < 0 ? 1 - smooth((across.copy(ioWorld).addScaledVector(moonLight, -along).length() - 0.97) / 0.06) : 0
      toPlanet.copy(ioWorld).negate().normalize()
      io.update(moonLight, toPlanet, eclipse, gain * state.weight, shot.post.vignette, view.format.width / view.format.height)
      glowDir.copy(glowHome).applyQuaternion(state.rotation).lerp(light, lit).normalize()
      for (const s of shells) {
        const su = s.material.uniforms
        ;(su.uCam!.value as THREE.Vector3).copy(camera)
        ;(su.uSunW!.value as THREE.Vector3).copy(glowDir)
        ;(su.uCoreSun!.value as THREE.Vector3).copy(glowDir)
        su.uGain!.value = gain * state.weight
      }
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      const visible = radiusPx > 0.6
      globe.mesh.visible = visible
      for (const s of shells) s.mesh.visible = visible
      io.mesh.visible = visible
      far.update(radiusPx, view, plan.p.tint, gain)
    },
    dispose: () => {
      globe.dispose()
      for (const s of shells) s.dispose()
      io.dispose()
      far.dispose()
      ground.dispose()
    },
  }
}
