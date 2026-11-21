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
import { Pall, PallSea, pallUniforms } from './pall'
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
  wispMap.wrapT = THREE.RepeatWrapping
  wispMap.source.dataReady = false
  wispMap.needsUpdate = true
  const patchTextures: THREE.Texture[] = []
  for (const level of patches.levels) patchTextures.push(await ctx.texture(base + level.file, { srgb: true, anisotropy: 16 }))

  const globe = new Globe({
    map, mapWidth: (map.image as unknown as { width: number }).width,
    curve: look.curve, limb: look.limb, jet: look.jet, shadeKnee: look.shadeKnee, night: look.night, nightAlbedo: look.nightAlbedo, shadow: look.shadow, shadowFade: look.shadowFade, shadowHaze: look.shadowHaze, nightRim: look.nightRim, litEdge: look.litEdge, haze: look.haze, edge: look.edge, limbLit: look.limbLit,
    spot: { center: direction(look.spot.lon, look.spot.lat), axesDeg: look.spot.axesDeg, core: look.spot.core, reach: look.spot.reach },
    wisp: { texture: wispMap, ...look.wisp },
    veil: look.veil,
    pallShell: plan.p.coverShell ?? [1, 1.015],
    patches: { center: direction(patches.center.lon, patches.center.lat), textures: patchTextures, widthsDeg: patches.levels.map((l) => l.widthDeg), feather: patches.feather, fade: patches.fade },
  })
  globe.mesh.quaternion.fromArray(fit.globe.quaternion)
  const shells = look.shells.map((p) => new HazeShell(p, diagUniform))
  orbit.add(globe.mesh, ...shells.map((s) => s.mesh))

  const ioMap = await ctx.texture(base + 'io-color.jpg', { srgb: true, anisotropy: 16, repeat: true })
  const io = new Io({ map: ioMap, mapWidth: (ioMap.image as unknown as { width: number }).width, radius: look.io.radius, sun: look.io.sun, ambient: look.io.ambient, bounce: look.io.bounce, wrap: look.io.wrap, power: look.io.power, rim: look.io.rim, feather: look.io.feather, blur: look.io.blur, term: look.io.term, dusk: look.io.dusk, crisp: look.io.crisp })
  orbit.add(io.mesh)
  const ioHome = new THREE.Vector3().fromArray(look.io.home)

  const far = new FarPoint()
  orbit.add(far.points)

  const seaUniforms = pallUniforms(look.deck.pall.shell)
  const ground = await Deck.load(ctx, base, reliefJson as DeckMeta, look.deck, wispMap, seaUniforms)
  terrain.add(ground.group)
  const sea = new PallSea(seaUniforms)
  terrain.add(sea.mesh)

  const orbitShell = plan.p.coverShell ?? [1, 1.015]
  const nadir = (reliefJson as DeckMeta).nadir
  const seaRadius = (reliefJson as DeckMeta).radius
  const pall = new Pall(plan, look.deck.pall, { centre: [nadir[0]! * (seaRadius + 1), nadir[1]! * (seaRadius + 1), nadir[2]! * (seaRadius + 1)], radius: seaRadius, orbitShell })
  const riseMid = (plan.seg.rise.start + plan.seg.rise.end) / 2
  const diveCover = plan.coverCenter(plan.seg.dive!)
  const riseCover = plan.coverCenter(plan.seg.rise)
  const terrainMid = (plan.seg.terrain.start + plan.seg.terrain.end) / 2
  const seaCentre = new THREE.Vector3().fromArray(nadir).multiplyScalar(seaRadius + 1)
  const above = (p: THREE.Vector3) => p.distanceTo(seaCentre) - seaRadius
  const floor = [above(plan.terrain(0).position), above(plan.terrain(plan.seg.terrain.end - plan.seg.terrain.start).position)]
  const ceiling = [above(plan.dive(diveCover).pose.position), above(plan.rise(riseCover - 1e-6).pose.position)]
  const holdTurn = plan.hold(plan.holdMid - plan.seg.hold.start).quaternion
  const glowHome = new THREE.Vector3().fromArray(look.glowDir).normalize().applyQuaternion(holdTurn)
  const moonHome = new THREE.Vector3().fromArray(look.moonSun).normalize()
  const moonLight = new THREE.Vector3()
  const light = new THREE.Vector3()
  const glowDir = new THREE.Vector3()
  const camera = new THREE.Vector3()
  const turn = new THREE.Quaternion()
  const ioWorld = new THREE.Vector3()
  const ioCentre = new THREE.Vector3()
  const toPlanet = new THREE.Vector3()
  const across = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)

  const sky: SkyPatch[] = []
  for (const [view, def] of Object.entries(skyJson)) {
    const wide = 1 + 2 * def.margin
    const tan = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2) * wide
    sky.push({ view: view as ViewKind, texture: await ctx.texture(base + def.file, { srgb: true, anisotropy: 1 }), aim: new THREE.Quaternion(), tan: [tan * 16 / 9, tan], gain: def.gain, add: def.add, ring: def.ring as [number, number, number, number], edge: def.margin / wide })
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
        const h = look.deck.haze
        const seg = state.segment
        const high = above(seg.kind === 'dive' ? plan.dive(state.time).pose.position : seg.kind === 'rise' ? plan.rise(state.time).pose.position : plan.terrain(state.time - plan.seg.terrain.start).position)
        const fall = THREE.MathUtils.clamp((high - floor[0]) / (ceiling[0] - floor[0]), 0, 1)
        const climb = THREE.MathUtils.clamp((high - floor[1]) / (ceiling[1] - floor[1]), 0, 1)
        ground.update(state.time - terrainMid, gain, shot.post.vignette, view, seg.kind === 'dive' ? h.clear[0] * Math.pow(fall, h.clear[1]) : seg.kind === 'rise' ? h.gather[0] * Math.pow(climb, h.gather[1]) : 0)
        pall.apply(seaUniforms, state.segment, state.time, 'terrain', view.camera.fov, view.format.width / view.format.height)
        sea.material.uniforms.uGain!.value = gain
        sea.mesh.visible = (seaUniforms.uPall!.value as THREE.Vector4).x > 0
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
      turn.setFromAxisAngle(plan.axis, THREE.MathUtils.degToRad(state.time < terrainMid ? plan.p.moonDegPerSecond * elapsed : look.io.riseDeg + plan.p.moonDegPerSecond * (state.time - riseMid)))
      io.mesh.position.copy(ioHome).applyQuaternion(turn)
      io.mesh.quaternion.setFromAxisAngle(up, THREE.MathUtils.degToRad(look.io.spinDegPerSecond) * elapsed)
      ioWorld.copy(io.mesh.position).applyQuaternion(state.rotation)
      ;(gu.uMoon!.value as THREE.Vector4).set(ioWorld.x, ioWorld.y, ioWorld.z, look.io.radius)
      moonLight.copy(moonHome).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      ;(gu.uShadowSun!.value as THREE.Vector3).copy(moonLight)
      const foot = across.copy(ioWorld).addScaledVector(moonLight, -ioWorld.dot(moonLight))
      const reach = foot.length()
      const facing = Math.sqrt(Math.max(1 - reach * reach, 0))
      if (reach < 1) foot.addScaledVector(moonLight, facing)
      else foot.divideScalar(reach)
      ;(gu.uShadowAt!.value as THREE.Vector4).set(foot.x, foot.y, foot.z, look.shadowCap.stretch * (1 - smooth((facing - look.shadowCap.from) / (look.shadowCap.to - look.shadowCap.from))))
      globe.update(camera, light, plan.spin(state.time), gain, state.weight)
      gu.uVignette!.value = shot.post.vignette
      gu.uAspect!.value = view.format.width / view.format.height
      pall.apply(gu, state.segment, state.time, 'orbit', view.camera.fov, view.format.width / view.format.height)
      const along = ioWorld.dot(moonLight)
      const eclipse = along < 0 ? 1 - smooth((across.copy(ioWorld).addScaledVector(moonLight, -along).length() - 0.97) / 0.06) : 0
      toPlanet.copy(ioWorld).negate().normalize()
      io.update(moonLight, toPlanet, eclipse, gain * state.weight, shot.post.vignette, view.format.width / view.format.height, ioCentre.copy(world.position).add(ioWorld), world.position)
      glowDir.copy(glowHome).applyQuaternion(state.rotation).lerp(light, lit).normalize()
      const clearing = Math.pow(1 - (gu.uPall!.value as THREE.Vector4).x, 2)
      for (const s of shells) {
        const su = s.material.uniforms
        ;(su.uCam!.value as THREE.Vector3).copy(camera)
        ;(su.uSunW!.value as THREE.Vector3).copy(glowDir)
        ;(su.uCoreSun!.value as THREE.Vector3).copy(glowDir)
        su.uGain!.value = gain * state.weight * clearing
      }
      const distance = world.position.length()
      const veil = gu.uVeil!.value as THREE.Vector4
      veil.x = (state.time < riseCover ? 1 : look.veil.rise) * look.veil.amount * smooth((look.veil.from - (distance - 1)) / (look.veil.from - look.veil.to))
      veil.w = look.veil.drift * elapsed
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
