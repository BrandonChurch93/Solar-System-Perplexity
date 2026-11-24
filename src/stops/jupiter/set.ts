import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import { HazeShell } from '../../bodies/haze'
import type { SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { diagUniform } from '../../diagnostics/diag'
import { smooth } from '../../director/rig'
import { patches } from './assets'
import { CloudDeck } from './clouds'
import { Globe } from './globe'
import { Io } from './io'
import * as look from './look'
import fields from './deck-fields.json'
import { bufferFrame } from '../../core/frame'
import place from './place.json'
import { chartAxes, chartEye, closeHeight, eddyTurn, exposed, exposure, flashNow, hazeDrift, heightTable, low, lowEven, plan, ringTurn, stormTurn } from './plan'
import proof from './proof.json'
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

  const ground = await CloudDeck.load(ctx, base)
  terrain.add(ground.mesh)
  orbit.add(ground.layer)

  const globe = new Globe({
    map, mapWidth: (map.image as unknown as { width: number }).width,
    curve: look.curve, limb: look.limb, jet: look.jet, shadeKnee: look.shadeKnee, night: look.night, nightAlbedo: look.nightAlbedo, shadow: look.shadow, shadowFade: look.shadowFade, shadowTip: look.shadowTip, shadowToe: look.shadowToe, shadowHaze: look.shadowHaze, nightRim: look.nightRim, litEdge: look.litEdge, haze: look.haze, edge: { ...look.edge, near: place.limb.nearHeights as [number, number] }, limbLit: look.limbLit,
    spot: { center: direction(look.spot.lon, look.spot.lat), axesDeg: look.spot.axesDeg, core: look.spot.core, reach: look.spot.reach },
    wisp: { texture: wispMap, ...look.wisp },
    veil: look.veil,
    pallShell: plan.p.coverShell ?? [1, 1.015],
    place: { n: place.solved.n, e: place.solved.e, u: place.solved.u, radius: place.solved.radiusUnits, grade: fields.grade, uniforms: ground.material.uniforms },
    patches: { center: direction(patches.center.lon, patches.center.lat), textures: patchTextures, widthsDeg: patches.levels.map((l) => l.widthDeg), feather: patches.feather, fade: patches.fade },
  })
  globe.mesh.quaternion.fromArray(fit.globe.quaternion)
  const shells = look.shells.map((p) => new HazeShell(p, diagUniform))
  const haloFar = Math.sqrt((1 + place.scene.halo) ** 2 - 1)
  orbit.add(globe.mesh, ...shells.map((s) => s.mesh))

  const ioMap = await ctx.texture(base + 'io-color.jpg', { srgb: true, anisotropy: 16, repeat: true })
  const io = new Io({ map: ioMap, mapWidth: (ioMap.image as unknown as { width: number }).width, radius: look.io.radius, sun: look.io.sun, ambient: look.io.ambient, bounce: look.io.bounce, wrap: look.io.wrap, power: look.io.power, rim: look.io.rim, feather: look.io.feather, blur: look.io.blur, term: look.io.term, dusk: look.io.dusk, crisp: look.io.crisp, night: look.io.night })
  orbit.add(io.mesh)
  const ioHome = new THREE.Vector3().fromArray(look.io.home)

  const far = new FarPoint()
  orbit.add(far.points)

  const dive = plan.seg.dive!
  const land = plan.seg.terrain
  const rise = plan.seg.rise
  const riseMid = (rise.start + rise.end) / 2
  const terrainMid = (land.start + land.end) / 2
  const freezeAt = dive.start + place.freeze.afterDiveStart
  const release = plan.coverCenter(rise) + place.freeze.releaseAfterRise
  const flowTime = (time: number): number => {
    if (time <= freezeAt) return settle(time - plan.holdMid, look.flow.settle)
    if (time < terrainMid) {
      const s = Math.min(time - freezeAt, place.freeze.easeSeconds)
      return settle(freezeAt - plan.holdMid + s - s * s / (2 * place.freeze.easeSeconds), look.flow.settle)
    }
    const free = settle(time - riseMid, look.flow.settle)
    if (time >= rise.end) return free
    return place.solved.local + (free - place.solved.local) * smooth((time - release) / (rise.end - release))
  }
  const ratio = (time: number): number[] => {
    const kind = time < terrainMid ? 'dive' : 'rise'
    const flown = exposure(kind === 'dive' ? dive.start - terrainMid : rise.end - terrainMid)
    return place.exposure.ratio[kind].map((v) => v * flown)
  }
  const stopped = { dive: heightTable(place.scene.expose.dive), rise: heightTable(place.scene.expose.rise) }
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
  const eye = new THREE.Vector3()
  const back = new THREE.Quaternion()
  const attitude = new THREE.Quaternion()

  const sky: SkyPatch[] = []
  for (const [view, def] of Object.entries(skyJson)) {
    const wide = 1 + 2 * def.margin
    const tan = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2) * wide
    sky.push({ view: view as ViewKind, texture: await ctx.texture(base + def.file, { srgb: true, anisotropy: 1, mips: (def.mips as Record<string, boolean>)[ctx.assets] }), aim: new THREE.Quaternion(), tan: [tan * 16 / 9, tan], gain: proof.glowAlone ? 0 : def.gain, add: def.add, ring: def.ring as [number, number, number, number], edge: def.margin / wide })
  }

  return {
    id: plan.id,
    world,
    sky,
    update: (state, shot, view) => {
      const frame = bufferFrame()
      const inOrbit = state.view === 'orbit'
      orbit.visible = inOrbit && state.weight > 0
      terrain.visible = !inOrbit
      back.copy(state.rotation).invert()
      eye.copy(world.position).negate().applyQuaternion(back)
      const height = inOrbit ? eye.length() - 1 : closeHeight(eye)
      const move = state.segment.stop !== plan.id ? '' : state.segment.kind === 'dive' ? 'dive' : state.segment.kind === 'rise' ? 'rise' : ''
      const gain = (move ? stopped[move](height) : 1) / shot.post.exposure
      const scene = place.scene
      const share = lowEven(height, scene.grade, scene.gradeRound)
      const r = ratio(state.time)
      const du = ground.material.uniforms
      du.uStormTurn!.value = stormTurn(state.time - terrainMid)
      const eddies = du.uEddyTurn!.value as number[]
      for (let i = 0; i < eddies.length; i++) eddies[i] = eddyTurn(i, state.time - terrainMid)
      const seams = du.uSeam!.value as THREE.Vector3[]
      for (let i = 0; i < seams.length; i++) seams[i]!.z = ringTurn(i, state.time - terrainMid)
      const own = state.segment.stop === plan.id && (state.segment.kind === 'dive' || state.segment.kind === 'rise')
      const deckShare = !inOrbit ? 1 : own ? low(height, scene.deck) : 0
      const limbShare = !inOrbit ? 1 : own ? low(height, scene.limb) : 0
      ground.layer.visible = inOrbit && deckShare > 0
      du.uOwn!.value = inOrbit ? 1 : 0
      ;(du.uLayer!.value as THREE.Vector3).set(deckShare, limbShare, inOrbit ? 1 : 0)
      if (!inOrbit || own) {
        ground.update(gain * (inOrbit ? state.weight : 1) * exposed(state.time - terrainMid), shot.post.vignette, view)
        ;(du.uExpose!.value as THREE.Vector3).set(Math.pow(r[0]!, share - 1), Math.pow(r[1]!, share - 1), Math.pow(r[2]!, share - 1))
        const thin = 1 - low(height, scene.air)
        du.uAirLift!.value = thin
        ;(du.uHazeLit!.value as THREE.Vector3).z = 1 - thin
        const bands = du.uHazeBand!.value as THREE.Vector4[]
        for (let b = 0; b < bands.length; b++) bands[b]!.z = hazeDrift(b, state.time - terrainMid)
        const flashes = du.uFlash!.value as THREE.Vector4[]
        for (let i = 0; i < flashes.length; i++) flashes[i]!.w = flashNow(i, state.time - terrainMid)
      }
      if (!inOrbit) return
      if (own) {
        const turned = plan.turn(state.time)
        chartEye(turned, eye, du.uEye!.value as THREE.Vector3)
        chartAxes(turned, attitude.copy(back).multiply(shot.camera.quaternion), du.uAxes!.value as THREE.Matrix3)
        chartAxes(turned, back, du.uToChart!.value as THREE.Matrix3)
      }
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      light.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      camera.copy(world.position).negate()
      const elapsed = state.time - plan.holdMid
      const local = flowTime(state.time)
      const gu = globe.material.uniforms
      ;(gu.uPlace!.value as THREE.Vector4).w = own ? low(height, scene.ground) : 0
      ;(gu.uGrade!.value as THREE.Vector3).set(Math.pow(r[0]!, share), Math.pow(r[1]!, share), Math.pow(r[2]!, share))
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
      gu.uShadowTipScale!.value = reach < 1 ? facing * reach / (look.io.radius * Math.max(reach * reach, 0.05)) : 0
      ;(gu.uShadowAt!.value as THREE.Vector4).set(foot.x, foot.y, foot.z, look.shadowCap.stretch * (1 - smooth((facing - look.shadowCap.from) / (look.shadowCap.to - look.shadowCap.from))))
      globe.update(camera, light, plan.spin(state.time), gain, state.weight)
      gu.uVignette!.value = shot.post.vignette
      gu.uAspect!.value = view.format.width / view.format.height
      const along = ioWorld.dot(moonLight)
      const eclipse = along < 0 ? 1 - smooth((across.copy(ioWorld).addScaledVector(moonLight, -along).length() - 0.97) / 0.06) : 0
      toPlanet.copy(ioWorld).negate().normalize()
      io.update(moonLight, toPlanet, eclipse, gain * state.weight, shot.post.vignette, view.format.width / view.format.height, ioCentre.copy(world.position).add(ioWorld), world.position)
      glowDir.copy(glowHome).applyQuaternion(state.rotation).lerp(light, lit).normalize()
      const distance = world.position.length()
      const halo = Math.min(Math.sqrt(Math.max(distance * distance - 1, 0)) / haloFar, 1)
      for (let i = 0; i < shells.length; i++) {
        const su = shells[i]!.material.uniforms
        const sp = look.shells[i]!
        ;(su.uCam!.value as THREE.Vector3).copy(camera)
        ;(su.uSunW!.value as THREE.Vector3).copy(glowDir)
        ;(su.uCoreSun!.value as THREE.Vector3).copy(glowDir)
        su.uHazeH!.value = sp.scaleHeight * halo
        su.uHazeTau!.value = sp.depth * Math.sqrt(halo)
        su.uCoreHeight!.value = (sp.core?.scaleHeight ?? 0) * halo
        su.uGain!.value = gain * state.weight * (1 - limbShare)
      }
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      const visible = radiusPx / frame > 0.6
      globe.mesh.visible = visible && !proof.glowAlone
      for (const s of shells) s.mesh.visible = visible
      io.mesh.visible = visible && !proof.glowAlone
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
