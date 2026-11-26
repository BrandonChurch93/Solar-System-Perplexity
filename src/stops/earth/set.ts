import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import type { SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { config } from '../../config'
import { bufferFrame } from '../../core/frame'
import { diagUniform } from '../../diagnostics/diag'
import { handoverOf, skyWeight } from '../../director/handover'
import { smooth } from '../../director/rig'
import { defaultPost } from '../../post/chain'
import { Air } from './air'
import { Aurora } from './aurora'
import { patches, wrap } from './assets'
import { Globe, direction } from './globe'
import { Moon } from './moon'
import { Ground, type GroundDef } from './relief'
import reliefJson from './relief.json'
import * as look from './look'
import placeJson from './place.json'
import { carry, centre as placeCentre, fromLocal, placeFrame, radius as placeRadius } from './place'
import { plan } from './plan'
import skyJson from './sky.json'

export const createSet: SetFactory = async (ctx) => {
  const base = 'earth/' + ctx.assets + '/'
  const fit = plan.fit
  const world = new THREE.Group()
  const orbit = new THREE.Group()
  const terrain = new THREE.Group()
  world.add(orbit, terrain)

  const map = await ctx.texture(base + 'wrap-surface.jpg', { srgb: true, anisotropy: 16, repeat: true })
  const cloud = await ctx.texture(base + 'wrap-cloud.webp', { srgb: true, anisotropy: 16, repeat: true })
  const emissive = await ctx.texture(base + 'wrap-emissive.webp', { srgb: true, anisotropy: 8, repeat: true })
  const farMap = await ctx.texture(base + 'wrap-far.webp', { srgb: true, anisotropy: 16, repeat: true })
  const farCloud = await ctx.texture(base + 'wrap-far-cloud.webp', { srgb: true, anisotropy: 16, repeat: true })
  const patchTextures: THREE.Texture[] = []
  for (const level of patches.levels) patchTextures.push(await ctx.texture(base + level.file, { srgb: true, anisotropy: 16 }))

  const plates = placeJson.plates
  const glintLight = await ctx.texture(base + plates.glint.calm.light, { srgb: false, mips: false })
  const glintSea = await ctx.texture(base + plates.glint.calm.sea, { srgb: false, mips: false })
  const glintOf = (pl: typeof plates) => ({ at: [pl.glint.centre[0]! / pl.size - 0.5, 0.5 - pl.glint.centre[1]! / pl.size], win: pl.size / pl.glint.calm.window, feather: pl.glint.calm.feather, seenDeg: pl.glint.seenDeg, cloud: pl.glint.calm.cloud, warm: pl.glint.calm.warm, glow: pl.glint.calm.glow, floor: pl.glint.calm.floor, light: glintLight, sea: glintSea })
  const pathShare = [plates.haze.share.kappa, plates.haze.share.cap, plates.haze.share.floor, plates.haze.share.footDeg[0]!, 1 / Math.log(plates.haze.share.footDeg[0]! / plates.haze.share.footDeg[1]!), plates.haze.share.root, plates.haze.share.ends, plates.air.radii[0]!, 1 / Math.log(plates.air.radii[0]! / plates.air.radii[1]!), plates.air.ends, plates.seaGain[2]!, plates.seaGain[1]!, plates.seaGain[0]!, Math.cos(THREE.MathUtils.degToRad(plates.air.pastDeg[1]!)), Math.cos(THREE.MathUtils.degToRad(plates.air.pastDeg[0]!))]
  const footDeg = (fov: number): number => THREE.MathUtils.radToDeg((2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2)) / config.raw.formats.master.height)
  const lowVeil = new THREE.DataTexture(new Uint16Array(await ctx.buffer(base + plates.haze.file)), plates.haze.size, plates.haze.size, THREE.RGBAFormat, THREE.HalfFloatType)
  lowVeil.minFilter = THREE.LinearFilter
  lowVeil.magFilter = THREE.LinearFilter
  lowVeil.needsUpdate = true
  const lowBroad = new THREE.DataTexture(new Uint16Array(await ctx.buffer(base + plates.haze.broad)), plates.haze.size, plates.haze.size, THREE.RGBAFormat, THREE.HalfFloatType)
  lowBroad.minFilter = THREE.LinearFilter
  lowBroad.magFilter = THREE.LinearFilter
  lowBroad.needsUpdate = true
  const standMap = await ctx.texture(base + plates.stand.file, { srgb: false, mips: false, anisotropy: 1 })
  const aboveMap = await ctx.texture(base + plates.above.file, { srgb: true, anisotropy: 16 })
  const wedgeMap = await ctx.texture(base + plates.wedge.file, { srgb: true, anisotropy: 16 })
  const tone = new THREE.DataTexture(new Uint16Array(await ctx.buffer(base + plates.tone.file)), plates.tone.size, plates.tone.size, THREE.RGBAFormat, THREE.HalfFloatType)
  tone.minFilter = THREE.LinearFilter
  tone.magFilter = THREE.LinearFilter
  tone.needsUpdate = true

  const globe = new Globe({
    map, mapWidth: (map.image as unknown as { width: number }).width, mapFull: wrap.sets.full.surface[0], cloud, emissive, far: farMap, farCloud, look: look.globe,
    sunHold: plan.lightDir.clone().applyQuaternion(new THREE.Quaternion().fromArray(fit.globe.quaternion).invert()),
    patches: { textures: patchTextures, widthsDeg: patches.levels.map((l) => l.widthDeg), windows: patches.levels.map((l) => (l.raster && l.size && l.offset ? { raster: l.raster, size: l.size, offset: l.offset } : undefined)), made: patches.levels.map((l) => l.made ?? 0), full: patches.levels.map((l) => l.size ?? 0), spot: direction(patches.spot.lon, patches.spot.lat), feather: patches.feather, fade: patches.fade, place: { centre: direction(plates.centre.lon, plates.centre.lat), from: patches.placeFrom, tone, toneDeg: plates.tone.widthDeg, toneCloud: plates.tone.cloud, toneGrey: plates.tone.grey, glint: glintOf(plates), earlyDeg: plates.earlyDeg, gain: plates.gain, day: plates.day, twin: direction(placeJson.globe.lon, placeJson.globe.lat).multiplyScalar(1 + placeJson.height), arrive: plates.arrive.footDeg, share: pathShare, veil: { map: lowVeil, broad: lowBroad, times: plates.haze.times }, above: { map: aboveMap, fromDeg: plates.above.fromDeg, size: (aboveMap.image as unknown as { width: number }).width }, wedge: { map: wedgeMap, widthDeg: plates.wedge.widthDeg, size: (wedgeMap.image as unknown as { width: number }).width }, stand: { map: standMap, times: plates.stand.times, km: plates.stand.km, graze: plates.stand.graze, bodyKm: plates.stand.bodyKm, slope: plates.stand.slope, slopeKm: plates.stand.slopeKm, shadow: plates.stand.shadow, softKm: plates.stand.softKm, shade: plates.stand.shade, sunFloor: plates.stand.sunFloor, steps: plates.stand.steps, shadowSteps: plates.stand.shadowSteps } } },
  })
  globe.mesh.quaternion.fromArray(fit.globe.quaternion)
  globe.mesh.scale.fromArray(fit.globe.scale)
  const glow = await ctx.texture(base + 'air-glow.png', { srgb: false, mips: false, repeat: true, flipY: false })
  const curtain = new Aurora(look.aurora, await ctx.texture(base + 'aurora.webp', { srgb: true, anisotropy: 4 }))
  const air = new Air(look.air, glow, diagUniform, curtain)
  const shape = new THREE.Group()
  const m = look.shape
  shape.matrixAutoUpdate = false
  const unshape = new THREE.Matrix3()
  const reshape = (square: number): void => {
    const k = (i: number, j: number): number => m[i]![j]! + ((i === j ? 1 : 0) - m[i]![j]!) * square
    shape.matrix.set(k(0, 0), k(0, 1), k(0, 2), 0, k(1, 0), k(1, 1), k(1, 2), 0, k(2, 0), k(2, 1), k(2, 2), 0, 0, 0, 0, 1)
    shape.matrixWorldNeedsUpdate = true
    unshape.setFromMatrix4(shape.matrix).invert()
  }
  reshape(0)
  shape.add(globe.mesh, air.mesh)
  orbit.add(shape)
  const tilt = new THREE.Quaternion().fromArray(fit.globe.quaternion)
  const untilt = tilt.clone().invert()
  const upAxis = new THREE.Vector3(0, 1, 0)

  const moonMap = await ctx.texture(base + 'moon-color.jpg', { srgb: true, anisotropy: 8, repeat: true })
  const moonLit = await ctx.texture(base + 'moon-lit.webp', { srgb: true, anisotropy: 8, repeat: true })
  const moonEye = plan.hold(plan.holdMid - plan.seg.hold.start).position
  const moon = new Moon({ ...look.moon, center: moonEye.clone().lerp(new THREE.Vector3().fromArray(look.moon.center), look.moon.near).toArray(), radius: look.moon.radius * look.moon.near }, moonMap, moonLit)
  orbit.add(moon.mesh)

  const far = new FarPoint()
  orbit.add(far.points)

  const toGround = new THREE.Quaternion().fromArray(fit.globe.quaternion).invert().multiply(placeFrame).multiply(fromLocal).invert()
  const plateAt = direction(plates.centre.lon, plates.centre.lat)
  const plateEast = new THREE.Vector3(0, 1, 0).cross(plateAt).normalize()
  const plateNorth = plateAt.clone().cross(plateEast)
  const veilScale = 1 / (2 * Math.tan(THREE.MathUtils.degToRad(patches.levels[patches.placeFrom]!.widthDeg) / 2) * plates.haze.times)
  const veilTone = 1 / (2 * Math.tan(THREE.MathUtils.degToRad(plates.tone.widthDeg) / 2) * veilScale)
  plateAt.applyQuaternion(toGround)
  plateEast.applyQuaternion(toGround).multiplyScalar(veilScale)
  plateNorth.applyQuaternion(toGround).multiplyScalar(veilScale)
  const veilPlane = new THREE.Matrix3().set(plateEast.x, plateEast.y, plateEast.z, plateNorth.x, plateNorth.y, plateNorth.z, plateAt.x, plateAt.y, plateAt.z)
  const ground = await Ground.load(ctx, base, reliefJson as GroundDef, look.ground, { farDeg: placeJson.onGlobe.farDeg, mapDeg: placeJson.onGlobe.mapDeg, rim: placeJson.onGlobe.rim, rimNear: placeJson.onGlobe.near.rim, arrive: plates.arrive.footDeg, share: pathShare, level: [placeJson.onGlobe.level[0]!, placeJson.onGlobe.level[1]!, footDeg(placeJson.vfovDeg)], air: [plates.wedge.arcDeg[0]!, plates.wedge.arcDeg[1]!, placeJson.onGlobe.air.from, placeJson.onGlobe.air.half, placeJson.onGlobe.air.power], rise: placeJson.onGlobe.rise, behind: placeJson.onGlobe.behind, toneTimes: veilTone, light: Object.fromEntries(['uTone', 'uToneCloud', 'uToneGrey', 'uCurve', 'uTwilight', 'uTwilightAt', 'uTint', 'uPlaceGain', 'uPlaceDay', 'uFeather', 'uGlint', 'uGlintSeen', 'uGlintCloud', 'uGlintGlow', 'uGlintSea'].map((name) => [name, globe.material.uniforms[name]!])), veil: { map: lowVeil, broad: lowBroad, plane: veilPlane, fromDeg: plates.haze.fromDeg, times: plates.haze.times } })
  terrain.add(ground.group)
  const onGlobe = new THREE.Group()
  onGlobe.scale.setScalar(1 / placeRadius)
  shape.add(onGlobe)
  const toPlace = new THREE.Quaternion()
  const eyePlace = new THREE.Vector3()
  const terrainMid = (plan.seg.terrain.start + plan.seg.terrain.end) / 2 + config.shutterFraction / (2 * config.fps)

  const skyLow = [Math.log(placeJson.sky.low[0]!), Math.log(placeJson.sky.low[1]!)]
  const skyWeights = (time: number): [number, number] | null => {
    const down = plan.seg.dive!
    const dive = time >= down.start && time < down.end
    const seg = dive ? down : time >= plan.seg.rise.start && time < plan.seg.rise.end ? plan.seg.rise : null
    if (!seg) return null
    const height = plan.eye(dive ? 'dive' : 'rise', time, 'orbit').position.length() - 1
    const high = smooth((Math.log(Math.max(height, 1e-6)) - skyLow[0]!) / (skyLow[1]! - skyLow[0]!))
    const share = skyWeight(seg, time)
    return [share < 1 ? high / (1 - share) : 0, share > 0 ? (1 - high) / share : 0]
  }
  const sky: SkyPatch[] = []
  for (const [view, def] of Object.entries(skyJson)) {
    const wide = 1 + 2 * def.margin
    const tan = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2) * wide
    const at = view === 'terrain' ? 1 : 0
    sky.push({ view: view as ViewKind, texture: await ctx.texture(base + def.file, { srgb: true, mips: false, anisotropy: 1 }), aim: new THREE.Quaternion(), tan: [tan * 16 / 9, tan], gain: def.gain, add: def.add, ring: def.ring as [number, number, number, number], edge: def.edge, weight: (time) => skyWeights(time)?.[at] ?? 1 })
  }

  const light = new THREE.Vector3()
  const camera = new THREE.Vector3()
  const eye = new THREE.Vector3()
  const eyeWorld = new THREE.Vector3()
  const eyeBody = new THREE.Vector3()
  const back = new THREE.Quaternion()
  const sunLocal = new THREE.Vector3()
  const sunPlace = new THREE.Vector3()
  const airTint = new THREE.Vector3()
  const descent = look.descent
  const lens = defaultPost().vignette * config.raw.handover.place.lens
  const glowHome = new THREE.Vector3().fromArray(look.air.dir).normalize()
  const auroraHome = new THREE.Vector3().fromArray(look.aurora.eye).normalize()
  const stand = new THREE.Vector3()
  const eyeDir = new THREE.Vector3()
  const lean = new THREE.Quaternion()
  const ease = look.globe.drift.ease
  const home = plan.hold(plan.seg.hold.end - plan.seg.hold.start).position.length()
  const leaveAt = handoverOf(plan.id, 'rise')!.time
  const nearEnds = [Math.log(Math.max(plan.eye('dive', handoverOf(plan.id, 'dive')!.time, 'orbit').position.length(), plan.eye('rise', leaveAt, 'orbit').position.length()) - 1), Math.log(placeJson.onGlobe.near.to)]

  return {
    id: plan.id,
    world,
    sky,
    update: (state, shot, view) => {
      const perLine = bufferFrame()
      const inOrbit = state.view === 'orbit'
      orbit.visible = inOrbit && state.weight > 0
      terrain.visible = !inOrbit
      const gain = 1 / shot.post.exposure
      if (!inOrbit) {
        back.copy(state.rotation).invert()
        eye.copy(world.position).applyQuaternion(back).negate()
        if (ground.group.parent !== terrain) terrain.add(ground.group)
        ground.group.visible = true
        ground.update(state.time - terrainMid, gain, shot.post.vignette, shot.post.bloomStrength, view, eye, sunPlace.copy(plan.lightDir).applyQuaternion(toPlace.copy(carry(plan, state.time)).invert()), view.place === true ? lens : 0, null)
        return
      }
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      light.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      camera.copy(world.position).negate()
      const d = descent
      const low = ending ? 0 : 1 - smooth((Math.log(Math.max(camera.length() - 1, 1e-4)) - Math.log(d.low)) / (Math.log(d.high) - Math.log(d.low)))
      const x = plan.seg.hold.end - state.time
      const y = plan.seg.rise.end - state.time
      const flow = x > 0 ? (-x * x) / (x + ease) : y > 0 && state.time >= plan.seg.rise.start ? (-y * y) / (y + ease) : 0
      const aspect = view.format.width / view.format.height
      back.copy(state.rotation).invert()
      reshape(low)
      eye.copy(camera).applyQuaternion(back).applyMatrix3(unshape)
      eyeWorld.copy(eye).applyQuaternion(state.rotation)
      const near = Math.sqrt((home * home - 1) / Math.max(camera.lengthSq() - 1, 1e-6))
      const leaving = state.time > leaveAt
      const away = smooth(Math.pow(Math.max((near - look.away[0]!) / (look.away[1]! - look.away[0]!), 0), look.away[2]!))
      const lights = (1 - look.lights[2]! * smooth(Math.log(near / look.lights[0]!) / Math.log(look.lights[1]! / look.lights[0]!))) * smooth((near - look.lightsFrom[0]!) / (look.lightsFrom[1]! - look.lightsFrom[0]!))
      globe.update(light, eyeWorld, state.rotation, plan.spin(state.time), gain, state.weight, flow, plan.clock(state.time) - plan.holdMid, away, 0, perLine)
      const gu = globe.material.uniforms
      const gone = ending ? 0 : smooth((state.time - plan.seg.rise.end - look.ebb[0]!) / (look.ebb[1]! - look.ebb[0]!))
      const born = smooth((state.time - plan.seg.hold.start - look.onset[0]!) / (look.onset[1]! - look.onset[0]!)) * (1 - gone)
      ;(gu.uAuroraColor!.value as THREE.Vector3).fromArray(look.globe.auroraColor).multiplyScalar(born)
      gu.uUnborn!.value = 1 - born
      gu.uLights!.value = lights * (1 - low)
      const foot = footDeg(view.camera.fov)
      const arrive = gu.uArrive!.value as THREE.Vector4
      arrive.z = foot
      arrive.w = ending ? 0 : 1
      const reached = !ending && (camera.length() - 1) * foot < arrive.x
      const whole = ending ? 0 : 1 - smooth((Math.log(Math.max(camera.length() - 1, 1e-4)) - nearEnds[0]!) / (nearEnds[1]! - nearEnds[0]!))
      gu.uGraze!.value = whole * placeJson.onGlobe.near.graze
      if (ground.group.parent !== onGlobe) onGlobe.add(ground.group)
      ground.group.visible = reached
      onGlobe.quaternion.copy(plan.turn(state.time)).multiply(placeFrame).multiply(fromLocal).normalize()
      onGlobe.position.copy(placeCentre).applyQuaternion(onGlobe.quaternion).multiplyScalar(-1 / placeRadius)
      toPlace.copy(onGlobe.quaternion).invert()
      if (reached) ground.update(state.time - terrainMid, gain, shot.post.vignette, shot.post.bloomStrength, view, eyePlace.copy(eye).applyQuaternion(toPlace).multiplyScalar(placeRadius).add(placeCentre), sunPlace.copy(plan.lightDir).applyQuaternion(toPlace), 0, foot, whole)
      const turned = plan.spin(state.time)
      eyeBody.copy(eye).applyQuaternion(untilt)
      ;(gu.uEyeBody!.value as THREE.Vector3).set(Math.cos(turned) * eyeBody.x - Math.sin(turned) * eyeBody.z, eyeBody.y, Math.sin(turned) * eyeBody.x + Math.cos(turned) * eyeBody.z)
      ;(gu.uLimbShape!.value as THREE.Vector4).x = look.globe.limb.width + (d.haze.width - look.globe.limb.width) * low
      ;(gu.uLimbPale!.value as THREE.Vector3).fromArray(look.globe.limb.pale).multiply(airTint.set(1 + (d.haze.pale[0] - 1) * low, 1 + (d.haze.pale[1] - 1) * low, 1 + (d.haze.pale[2] - 1) * low))
      gu.uVignette!.value = shot.post.vignette
      ;(gu.uBloomPre!.value as THREE.Vector4).x = shot.post.bloomStrength
      gu.uAspect!.value = aspect
      const au = air.material.uniforms
      ;(au.uCam!.value as THREE.Vector3).copy(eye)
      ;(au.uGlowDir!.value as THREE.Vector3).copy(light).applyQuaternion(back).multiplyScalar(Math.max(low, lit)).addScaledVector(glowHome, 1 - Math.max(low, lit)).normalize()
      au.uGain!.value = gain * state.weight
      au.uWide!.value = 1 - low
      au.uAway!.value = away
      au.uFree!.value = leaving ? 1 : away
      au.uOut!.value = 1 - whole
      const thinAir = 1 + (d.air - 1) * low
      const thinRim = 1 + (d.inner - 1) * low
      ;(au.uHeight!.value as THREE.Vector4).set(look.air.heights[0]! * thinAir, look.air.heights[1]! * thinAir, look.air.heights[2]!, look.air.heights[3]!)
      ;(au.uInner!.value as THREE.Vector2).x = look.air.inner * thinRim
      ;(au.uInnerWide!.value as THREE.Vector2).x = look.air.innerWide[0]! * thinRim
      ;(au.uRim!.value as THREE.Vector3).fromArray(look.air.rim).multiply(airTint.set(1 + (d.rim[0] - 1) * low, 1 + (d.rim[1] - 1) * low, 1 + (d.rim[2] - 1) * low))
      ;(au.uMist!.value as THREE.Vector4).set(d.mist[0] * low, d.mist[1] * low, d.mist[2] * low, d.mist[3])
      ;(au.uFog!.value as THREE.Vector3).fromArray(d.fog).multiplyScalar(low)
      const thinLine = 1 + (d.line[0] - 1) * low
      ;(au.uLine!.value as THREE.Vector4).set(look.air.line[0]! * thinLine, look.air.line[1]! * thinLine, look.air.line[2]! * thinLine, look.air.linePower)
      ;(au.uLineShape!.value as THREE.Vector3).x = look.air.lineWidth * (1 + (d.line[1] - 1) * low)
      const layers = au.uColor!.value as THREE.Vector3[]
      const tint = d.glow
      for (let i = 0; i < 2; i++) layers[i]!.fromArray(look.air.colors[i]!).multiply(airTint.set(1 + (tint[0] - 1) * low, 1 + (tint[1] - 1) * low, 1 + (tint[2] - 1) * low))
      au.uPhysical!.value = Math.max(low, lit)
      au.uVignette!.value = shot.post.vignette
      au.uAspect!.value = aspect
      curtain.turn.setFromAxisAngle(upAxis, plan.spin(state.time)).premultiply(tilt).multiply(untilt)
      stand.copy(auroraHome).applyQuaternion(curtain.turn)
      curtain.turn.premultiply(lean.setFromUnitVectors(stand, eyeDir.copy(eye).normalize()))
      const high = smooth((eye.length() - 1 - look.aurora.fade[0]!) / (look.aurora.fade[1]! - look.aurora.fade[0]!))
      sunLocal.copy(light).applyQuaternion(back)
      curtain.update(plan.clock(state.time) - plan.holdMid, high * born, sunLocal, 1 - (1 - look.onset[2]!) * (1 - born))
      moon.update(sunLocal, plan.axis, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * (plan.clock(state.time) - plan.holdMid), gain * state.weight, shot.post.vignette, aspect, perLine)
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      const visible = radiusPx > 0.6 * perLine
      globe.mesh.visible = visible
      air.mesh.visible = visible
      moon.mesh.visible = visible
      far.update(radiusPx, view, plan.p.tint, gain)
    },
    dispose: () => {
      globe.dispose()
      air.dispose()
      moon.dispose()
      far.dispose()
      ground.dispose()
    },
  }
}
