import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import { bufferFrame } from '../../core/frame'
import type { SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { diagUniform } from '../../diagnostics/diag'
import { handoverOf } from '../../director/handover'
import { smooth } from '../../director/rig'
import { Air } from './air'
import { close, farMap, flowMap, held, mended, moon as moonAsset, ringBands, ringGrain, ringMap, wrap } from './assets'
import { Closeup } from './closeup'
import closeLook from './closeup.json'
import { Deep } from './deep'
import deepLook from './deep.json'
import { ending as endLook } from './ending'
import { limbField } from './field'
import * as look from './look'
import { plan } from './plan'
import move from './move.json'
import patches from './patches.json'
import place from './place.json'
import { NeptunePlanet } from './planet'
import { Ring } from './ring'
import skyJson from './sky.json'
import { Triton } from './triton'

function direction(lonDeg: number, latDeg: number): THREE.Vector3 {
  const lon = THREE.MathUtils.degToRad(lonDeg)
  const lat = THREE.MathUtils.degToRad(latDeg)
  return new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon))
}

function eased(t: number, full: number, ease: number): number {
  const a = Math.abs(t)
  if (a <= full) return t
  const x = Math.min((a - full) / ease, 1)
  return Math.sign(t) * (full + ease * (x - 0.5 * x * x))
}

export const createSet: SetFactory = async (ctx) => {
  const base = 'neptune/' + ctx.assets + '/'
  const fit = plan.fit
  const world = new THREE.Group()
  const orbit = new THREE.Group()
  const terrain = new THREE.Group()
  world.add(orbit, terrain)

  const map = await ctx.texture(base + wrap.file, { srgb: true, anisotropy: 16, repeat: true })
  const field = limbField()
  const holdMap = await ctx.texture(base + held.file, { srgb: true, anisotropy: 16 })
  const mendMap = await ctx.texture(base + mended.file, { srgb: true, anisotropy: 16 })
  const flow = await ctx.texture(base + flowMap.file, { srgb: false, anisotropy: 16, repeat: true, channels: 1 })
  const farSide = await ctx.texture(base + farMap.file, { srgb: false, repeat: true })
  const patchTextures = await Promise.all(patches.levels.map((level) => ctx.texture(base + level.file, { srgb: true, anisotropy: 16 })))
  const toneMap = await ctx.texture(base + patches.place.tone.file, { srgb: false, mips: false })
  const planet = new NeptunePlanet({
    field, near: look.near.dive, night: look.night,
    map, mapWidth: (map.image as unknown as { width: number }).width, code: look.code, deck: look.deck, cloud: look.cloud, air: look.air, limb: look.limb, clouds: look.clouds,
    storm: { axis: direction(look.storm.lon, look.storm.lat), radiusDeg: look.storm.radiusDeg },
    patches: { textures: patchTextures, widthsDeg: patches.levels.map((l) => l.widthDeg), spot: direction(patches.spot.lon, patches.spot.lat), feather: patches.feather, featherOwn: patches.featherOwn, fade: [patches.fade[0]!, patches.fade[1]!], clearDeg: [patches.place.clearDeg[0]!, patches.place.clearDeg[1]!], shownFrom: patches.place.shownFrom, home: direction(place.camera.lonDeg, place.camera.latDeg), plainDeg: [patches.place.plainDeg[0]!, patches.place.plainDeg[1]!], vivid: [patches.place.vivid[0]!, patches.place.vivid[1]!], offsetsDeg: patches.levels.map((l) => [l.offsetDeg[0]!, l.offsetDeg[1]!] as [number, number]), tone: toneMap },
    hold: { map: holdMap, box: look.held.box, head: look.held.head },
    mend: { map: mendMap, box: look.mended.box },
    flow,
    far: farSide,
  })
  planet.mesh.quaternion.fromArray(fit.globe.quaternion)
  planet.mesh.scale.fromArray(fit.globe.scale)
  const air = new Air(look.air, diagUniform)
  air.share(planet.material.uniforms)
  orbit.add(planet.mesh, air.mesh)
  const rimAim = new THREE.Vector3().fromArray(look.limb.rimAim)
  const darkAim = new THREE.Vector3().fromArray(look.limb.darkAim)
  const cutAim = new THREE.Vector3().fromArray(look.limb.cutAim)
  const veilAim = new THREE.Vector3().fromArray(look.limb.veilAim)

  const tritonFit = fit.moons![0]!
  const moonMap = await ctx.texture(base + moonAsset.file, { srgb: true, anisotropy: 16, repeat: true })
  const triton = new Triton({ map: moonMap, mapWidth: (moonMap.image as unknown as { width: number }).width, radius: tritonFit.radius, gain: look.triton.gain, sun: look.triton.sun, ambient: look.triton.ambient, terminator: look.triton.terminator, power: look.triton.power, bump: look.triton.bump, rim: look.triton.rim })
  orbit.add(triton.mesh)
  const moonHome = new THREE.Vector3().fromArray(tritonFit.position)
  const moonStage = new THREE.Vector3().fromArray(look.triton.stage).applyAxisAngle(plan.axis, -THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * (plan.seg.rise.end - plan.holdMid))
  const moonUp = new THREE.Vector3().fromArray(look.triton.up).normalize()
  const moonHold = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), moonUp)
  const moonSpin = new THREE.Quaternion()
  const moonAim = new THREE.Vector3().fromArray(look.triton.aim)
  const moonLight = new THREE.Vector3()
  const moonSun = new THREE.Vector3()

  const ring = new Ring({ ...look.ring, map: await ctx.texture(base + ringMap.file, { srgb: false, anisotropy: 16, repeat: true }), bands: await ctx.texture(base + ringBands.file, { srgb: false, anisotropy: 16, repeat: true }), grain: { ...look.ring.grain, map: await ctx.texture(base + ringGrain.file, { srgb: false, anisotropy: 16, mirror: true }) } })
  orbit.add(ring.mesh)

  const far = new FarPoint()
  orbit.add(far.points)

  const closeMaps = {
    deck: await ctx.texture(base + close.deck, { srgb: true, anisotropy: 16 }),
    cloud: await ctx.texture(base + close.cloud, { srgb: true, anisotropy: 16 }),
    deckWide: await ctx.texture(base + close.deckWide, { srgb: true, anisotropy: 16, mirror: true }),
    cloudWide: await ctx.texture(base + close.cloudWide, { srgb: true, anisotropy: 16, mirror: true }),
    height: await ctx.texture(base + close.height, { srgb: false, anisotropy: 4, mirror: true }),
    glow: await ctx.texture(base + close.glow, { srgb: true, mips: false, anisotropy: 1 }),
    bloom: await ctx.texture(base + close.bloom, { srgb: true, mips: false, anisotropy: 1 }),
    fine: await ctx.texture(base + close.fine, { srgb: false, anisotropy: 16 }),
  }
  const closeup = new Closeup(closeMaps)
  const deepView = new Deep(false, planet.material.uniforms)
  terrain.add(deepLook.on ? deepView.mesh : closeup.mesh)
  const deepSun = new THREE.Vector3()
  const deepLaid = new Deep(true, planet.material.uniforms)
  const fallGlobePower = new THREE.Vector3(1, 1, 1)
  const fallScenePower = new THREE.Vector3(1, 1, 1)
  if (deepLook.on) orbit.add(deepLaid.mesh)
  const laid = new Closeup({ ...closeMaps, tone: toneMap }, true)
  orbit.add(laid.mesh)
  const laySeat = new THREE.Vector3()
  const layTurn = new THREE.Quaternion()
  const layEast = new THREE.Vector3()
  const layNorth = new THREE.Vector3()
  const layOut = new THREE.Vector3()
  const spinAxis = new THREE.Vector3(0, 1, 0)
  const layBack = new THREE.Quaternion()
  const terrainMid = (plan.seg.terrain.start + plan.seg.terrain.end) / 2

  const light = new THREE.Vector3()
  const camera = new THREE.Vector3()
  const turn = new THREE.Quaternion()
  const side = new THREE.Vector3()
  const sideCam = new THREE.Vector3()
  const ringLit = new THREE.Vector3()
  const ringSeat = new THREE.Vector3()
  const edgeSun = new THREE.Vector3()
  const edgeTurn = THREE.MathUtils.degToRad(look.limb.edge.wideDeg)
  const holdPose = plan.hold(plan.holdMid - plan.seg.hold.start)
  const holdDirection = new THREE.Vector3()
  const seatAt = (kind: 'dive' | 'rise'): THREE.Vector3 => {
    const time = handoverOf(plan.id, kind)!.time
    return plan.eye(kind, time, 'orbit').position.clone().applyQuaternion(plan.laid(time).invert())
  }
  const layRef = { dive: seatAt('dive'), rise: seatAt('rise') }
  // The scene from code reads the globe's own map (deep.json, far). toBody: the turn from the scene's frame to the globe's. In the view
  // from the ground the globe is not drawn, so the state of its map is set there for the scene alone, by the same laws: the hold's
  // share by the eye's angle from the hold's axis as in the dive, and through the surface view down to none at the angle the rise
  // begins at, since the rise shows the globe without it (the eye travels from groundOff[0] to groundOff[1] degrees there, one way).
  const bodyBack = planet.mesh.quaternion.clone().invert()
  const toBody = new THREE.Quaternion()
  const seen = new THREE.Vector3()
  const offGround = (time: number): number => THREE.MathUtils.radToDeg(plan.twin(plan.terrain(time - plan.seg.terrain.start), time).position.angleTo(holdPose.position))
  const groundOff = [offGround(plan.seg.terrain.start), offGround(plan.seg.terrain.end)]
  const streamAt = (elapsed: number): number => THREE.MathUtils.degToRad(look.stream.degPerSecond) * eased(elapsed, look.stream.fullSeconds, look.stream.easeSeconds)
  const stormAt = (elapsed: number): number => THREE.MathUtils.degToRad(look.storm.degPerSecond) * eased(elapsed, look.storm.fullSeconds, look.storm.easeSeconds)
  const homeAt = (offAxis: number): number => 1 - smooth((offAxis - look.holdness.fromDeg) / (look.holdness.toDeg - look.holdness.fromDeg))
  const cirrusPx = (high: number): number => move.cirrus.px * bufferFrame() * (1 - smooth((high - move.cirrus.height[0]!) / (move.cirrus.height[1]! - move.cirrus.height[0]!)))

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
        camera.copy(world.position).negate().applyQuaternion(turn.copy(state.rotation).invert())
        if (deepLook.on) {
          const pu = planet.material.uniforms
          const kind = state.segment.kind
          seen.copy(camera).sub(deepView.centre).applyQuaternion(plan.laid(state.time))
          const offAxis = THREE.MathUtils.radToDeg(seen.angleTo(holdPose.position))
          const home = kind === 'rise' ? 0 : homeAt(offAxis) * (kind === 'terrain' ? 1 - smooth((offAxis - groundOff[0]!) / (groundOff[1]! - groundOff[0]!)) : 1)
          const elapsed = state.time - plan.holdMid
          pu.uSpin!.value = plan.spin(state.time)
          pu.uStream!.value = streamAt(elapsed)
          pu.uStormAngle!.value = stormAt(elapsed)
          ;(pu.uHold!.value as THREE.Vector2).x = home * look.held.amount
          ;(pu.uCirrus!.value as THREE.Vector4).set(look.cirrus.amount * (1 - home), look.cirrus.bend, look.cirrus.shadow, look.cirrus.floor)
          ;(pu.uClump!.value as THREE.Vector3).fromArray(look.cirrus.clump)
          pu.uCirrusPx!.value = cirrusPx(seen.length() / (deepView.centre.length() - 1) - 1)
          ;(pu.uShadow!.value as THREE.Vector3).y = look.clouds.shadowSoft * bufferFrame()
          pu.uLine!.value = bufferFrame()
          ;(pu.uEnd!.value as THREE.Vector3).x = 0
          deepView.update(camera, deepSun.copy(plan.lightDir).applyQuaternion(plan.laid(state.time).invert()), state.time - terrainMid, 2 * Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) / view.format.height, gain, shot.post.vignette, view.format.width / view.format.height, toBody.copy(bodyBack).multiply(plan.laid(state.time)))
        }
        else closeup.update(camera, state.time - terrainMid, gain, shot.post.vignette, view.format.width / view.format.height, shot.post.bloomStrength)
        return
      }
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      const end = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * endLook.blend) : 1) : 0
      light.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      camera.copy(world.position).negate()
      const elapsed = state.time - plan.holdMid
      const offAxis = THREE.MathUtils.radToDeg(camera.angleTo(holdDirection.copy(holdPose.position).applyQuaternion(state.rotation)))
      const rising = state.segment.kind === 'rise'
      const home = ending || rising ? 0 : homeAt(offAxis)
      const pu = planet.material.uniforms
      const grade = rising ? look.near.rise : look.near.dive
      const high = camera.length() - 1
      const tone = smooth(Math.log(closeLook.lay.tone[0]! / Math.max(high, 1e-6)) / Math.log(closeLook.lay.tone[0]! / closeLook.lay.tone[1]!))
      const low = tone
      const closeLight = Math.pow(tone, closeLook.lay.lightPower)
      const ground = smooth(Math.log(closeLook.lay.ground[0]! / Math.max(high, 1e-6)) / Math.log(closeLook.lay.ground[0]! / closeLook.lay.ground[1]!))
      const lens = shot.post.vignette * Math.max(home, tone)
      const near = look.near.amount * low
      const deep = smooth((look.diving.from - high) / (look.diving.from - look.diving.to))
      const line = 1 - smooth((look.lineFade[0] - high) / (look.lineFade[0] - look.lineFade[1]))
      const kind = state.segment.kind
      const show = deepLook.on && !ending ? 1 - smooth(Math.log(Math.max(high, 1e-6) / deepLook.globe.height[1]!) / Math.log(deepLook.globe.height[0]! / deepLook.globe.height[1]!)) : 0
      // The place's own picture begins above the scene as a whole (deep.json far.height, by the eye's height alone): the scene is drawn from there.
      const placed = deepLook.on && deepLook.far.on === 1 && !ending && high < deepLook.far.height[0]!
      const lay = ending || deepLook.on ? 0 : kind === 'dive' ? smooth((state.u - closeLook.lay.dive[0]!) / (closeLook.lay.dive[1]! - closeLook.lay.dive[0]!)) : kind === 'rise' ? 1 - smooth((state.u - closeLook.lay.rise[0]!) / (closeLook.lay.rise[1]! - closeLook.lay.rise[0]!)) : kind === 'terrain' ? 1 : 0
      const settle = ending ? 0 : 1 - smooth((high - closeLook.lay.settle[1]!) / (closeLook.lay.settle[0]! - closeLook.lay.settle[1]!))
      const limb = ending ? 0 : 1 - smooth(Math.log(Math.max(high, 1e-6) / closeLook.lay.glow[1]!) / Math.log(closeLook.lay.glow[0]! / closeLook.lay.glow[1]!))
      const layEdge = closeLook.lay.edge[1]! + (closeLook.lay.edge[0]! - closeLook.lay.edge[1]!) * smooth(Math.log(Math.max(high, 1e-6) / closeLook.lay.edgeHeight[1]!) / Math.log(closeLook.lay.edgeHeight[0]! / closeLook.lay.edgeHeight[1]!))
      if (lay > 0) {
        laySeat.copy(camera).applyQuaternion(layBack.copy(state.rotation).invert())
        laid.update(laid.lay(laySeat, plan.laid(state.time), lay, lay * tone, ground, settle, limb, rising ? layRef.rise : layRef.dive, grade, near, layEdge), state.time - terrainMid, gain * state.weight, lens, view.format.width / view.format.height, shot.post.bloomStrength * settle)
        layTurn.copy(laid.mesh.quaternion).invert().multiply(planet.mesh.quaternion)
        const spin = plan.spin(state.time)
        layEast.copy(pu.uSpotE!.value as THREE.Vector3).applyAxisAngle(spinAxis, spin).applyQuaternion(layTurn)
        layNorth.copy(pu.uSpotU!.value as THREE.Vector3).applyAxisAngle(spinAxis, spin).applyQuaternion(layTurn)
        layOut.copy(pu.uSpotN!.value as THREE.Vector3).applyAxisAngle(spinAxis, spin).applyQuaternion(layTurn)
        laid.toned(layEast, layNorth, layOut, (pu.uPatchOff!.value as THREE.Vector2[])[patches.place.shownFrom]!, (pu.uPatchScale!.value as number[])[patches.place.shownFrom]!, patches.place.tone.stops * (1 - closeLight))
      }
      const fall = deepLook.on && !ending ? 1 - smooth(Math.log(Math.max(high, 1e-6) / deepLook.globe.fall.height[1]!) / Math.log(deepLook.globe.fall.height[0]! / deepLook.globe.fall.height[1]!)) : 0
      for (let c = 0; c < 3; c++) {
        const p = deepLook.globe.fall.power[c]!
        fallGlobePower.setComponent(c, 1 + fall * (p - 1))
        fallScenePower.setComponent(c, (1 + fall * (p - 1)) / p)
      }
      ;(pu.uFallPivot!.value as THREE.Vector3).fromArray(deepLook.globe.fall.pivot)
      ;(pu.uFallPower!.value as THREE.Vector3).copy(fallGlobePower)
      pu.uFallBlue!.value = deepLook.globe.fall.blue / Math.max(fall, 1e-4)
      if (show > 0 || placed) {
        laySeat.copy(camera).applyQuaternion(layBack.copy(state.rotation).invert())
        deepLaid.update(deepLaid.lay(laySeat, plan.laid(state.time), show, fallScenePower, pu.uFallBlue!.value as number), deepSun.copy(plan.lightDir).applyQuaternion(layBack.copy(plan.laid(state.time)).invert()), state.time - terrainMid, 2 * Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) / view.format.height, gain * state.weight, lens, view.format.width / view.format.height, toBody.copy(bodyBack).multiply(plan.laid(state.time)))
      }
      const thin = ending ? 1 : smooth(Math.sqrt(high * (high + 2)) / look.airThin.reach)
      const moving = kind === 'dive' || kind === 'rise' ? 1 - smooth((high - move.near.height[0]!) / (move.near.height[1]! - move.near.height[0]!)) : 0
      air.update(camera, light, state.rotation, home, line, gain * state.weight, near, grade.air, 1 - deep, thin, (1 - limb) * (1 - show), moving, move.rim, smooth((high - move.rim.dimHeight[0]!) / (move.rim.dimHeight[1]! - move.rim.dimHeight[0]!)))
      pu.uAirGround!.value = 1 - limb
      const distant = ending ? 0 : 1 - smooth(Math.log(Math.max(high, 1e-6) / closeLook.lay.distant.height[1]!) / Math.log(closeLook.lay.distant.height[0]! / closeLook.lay.distant.height[1]!))
      ;(pu.uDistantAir!.value as THREE.Vector4).set(closeLook.lay.distant.air[0]!, closeLook.lay.distant.air[1]!, closeLook.lay.distant.air[2]!, closeLook.lay.distant.veil)
      ;(pu.uDistant!.value as THREE.Vector4).set((rising ? closeLook.lay.distant.rise : kind === 'dive' ? closeLook.lay.distant.dive : 0) * distant, closeLook.lay.distant.slant[0]!, closeLook.lay.distant.slant[1]!, Math.log2((pu.uMapWidth!.value as number) / closeLook.lay.distant.texels))
      pu.uFlow!.value = look.flow.amount * (1 - home * (1 - deep)) * (1 - end * (1 - endLook.limb.flow))
      ;(pu.uCirrus!.value as THREE.Vector4).set(look.cirrus.amount * (1 - home) * (1 - end), look.cirrus.bend, look.cirrus.shadow, look.cirrus.floor)
      ;(pu.uClump!.value as THREE.Vector3).fromArray(look.cirrus.clump)
      pu.uCirrusPx!.value = kind === 'dive' || kind === 'rise' ? cirrusPx(high) : 0
      ;(pu.uShadow!.value as THREE.Vector3).y = look.clouds.shadowSoft * bufferFrame()
      // The plate levels come in by the texels of their parent a 1080th of the frame's height (an angle), not a pixel of the format
      // that happens to be drawn, so the film is one picture at 1920 and at 3840 wide (the Builder's note 501). The factor is the
      // engine's one measure (src/core/frame.ts, bufferFrame): 1 at 16 by 9, 2 at the 4K capture, one half at the preview. The soft
      // edge of the cloud shadows, the cirrus's pixel term and the size under which the globe is a point read the same measure.
      pu.uLine!.value = bufferFrame()
      ;(pu.uRimDir!.value as THREE.Vector3).copy(rimAim).applyQuaternion(state.rotation).multiplyScalar(home).add(light).normalize()
      ;(pu.uCutDir!.value as THREE.Vector3).copy(cutAim).applyQuaternion(state.rotation).multiplyScalar(home).add(light).normalize()
      ;(pu.uCut!.value as THREE.Vector4).w = home
      ;(pu.uDarkDir!.value as THREE.Vector3).copy(darkAim).applyQuaternion(state.rotation).multiplyScalar(home).add(light).normalize()
      ;(pu.uVeilDir!.value as THREE.Vector3).copy(veilAim).applyQuaternion(state.rotation).multiplyScalar(home).add(light).normalize()
      ;(pu.uLimbDark!.value as THREE.Vector3).x = look.limb.dark * home * (1 - deep)
      ;(pu.uAirShade!.value as THREE.Vector4).w = home
      ;(pu.uNight!.value as THREE.Vector4).x = look.night.flat * (1 - home)
      ;(pu.uMelt!.value as THREE.Vector2).x = look.limb.melt[1] + (look.limb.melt[0] - look.limb.melt[1]) * home
      side.copy(light).cross(sideCam.copy(camera).normalize()).normalize()
      edgeSun.copy(light).addScaledVector(sideCam, -light.dot(sideCam)).normalize()
      ;(pu.uEdgeSun!.value as THREE.Vector3).copy(edgeSun)
      ;(pu.uEdgeSide!.value as THREE.Vector3).copy(side).negate()
      ;(pu.uEdgeWideDir!.value as THREE.Vector3).copy(edgeSun).multiplyScalar(Math.cos(edgeTurn)).addScaledVector(side, -Math.sin(edgeTurn))
      ;(pu.uEdgeShape!.value as THREE.Vector4).w = home * look.limb.edge.amount * line
      ;(pu.uFieldSide!.value as THREE.Vector4).set(side.x, side.y, side.z, home * look.field.amount * (1 - low))
      ;(pu.uHold!.value as THREE.Vector2).x = home * look.held.amount
      ;(pu.uPlace!.value as THREE.Vector3).z = lay
      pu.uShown!.value = lay
      pu.uToneAmt!.value = patches.place.tone.stops * closeLight
      ;(pu.uPlain!.value as THREE.Vector3).z = lay * tone
      planet.update(plan.spin(state.time), streamAt(elapsed), stormAt(elapsed), gain, state.weight, near, grade.gain)
      ;(pu.uNearFall!.value as THREE.Vector3).set(THREE.MathUtils.degToRad(grade.fall[0]!), THREE.MathUtils.degToRad(grade.fall[1]!), 1 - (1 - grade.fall[2]!) * (1 - smooth((high - grade.fallAltitude[0]!) / (grade.fallAltitude[1]! - grade.fallAltitude[0]!))))
      ;(pu.uNear!.value as THREE.Vector4).z = grade.power
      ;(pu.uNear!.value as THREE.Vector4).w = grade.saturation
      ;(pu.uNearTint!.value as THREE.Vector4).set(grade.tint[0]!, grade.tint[1]!, grade.tint[2]!, grade.pivot)
      pu.uVignette!.value = lens
      pu.uAspect!.value = view.format.width / view.format.height
      turn.setFromAxisAngle(plan.axis, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * elapsed)
      triton.mesh.position.copy(state.time < terrainMid ? moonHome : moonStage).applyQuaternion(turn)
      triton.mesh.quaternion.copy(moonSpin.setFromAxisAngle(moonUp, THREE.MathUtils.degToRad(look.triton.spinDegPerSecond) * elapsed)).multiply(moonHold)
      const staged = state.time >= terrainMid
      const moonLook = staged ? look.triton.rise : look.triton
      triton.shape(moonLook.terminator, moonLook.power, moonLook.ambient, look.triton.gain, moonLook.bump, moonLook.rim, moonLook.wrap, moonLook.lift)
      moonSun.copy(light)
      if (staged) moonSun.lerp(shot.sun.dir, look.triton.rise.sun).normalize()
      triton.update(moonLight.copy(moonAim).applyQuaternion(state.rotation).multiplyScalar(home).add(moonSun).normalize(), gain * state.weight)
      ring.update(light, state.rotation, THREE.MathUtils.degToRad(look.ring.degPerSecond) * elapsed, home, gain * state.weight)
      const crescent = smooth((THREE.MathUtils.radToDeg(camera.angleTo(light)) - endLook.limb.crescent.phase[0]!) / (endLook.limb.crescent.phase[1]! - endLook.limb.crescent.phase[0]!))
      air.ending(end, Math.sin(Math.PI - camera.angleTo(light) - Math.asin(Math.min(1 / camera.length(), 1))), endLook.air, endLook.limb.crescent.bias * crescent)
      ringLit.fromArray(look.ring.normal).normalize().applyQuaternion(state.rotation)
      if (ringLit.dot(light) < 0) ringLit.negate()
      const behind = smooth((THREE.MathUtils.radToDeg(camera.angleTo(light)) - endLook.limb.shinePhase[0]!) / (endLook.limb.shinePhase[1]! - endLook.limb.shinePhase[0]!))
      planet.ending(end, look.limb, look.cloud, look.deck, look.night, ringLit, endLook.limb.shineNear + (1 - endLook.limb.shineNear) * behind, endLook.limb, crescent)
      ring.ending(end, camera, endLook.ring)
      ring.along(move.ring.along * moving)
      air.ring(ringLit, ringSeat.copy(ring.mesh.position).applyQuaternion(state.rotation), look.ring.inner, look.ring.outer)
      ring.solid(rising ? smooth(Math.log(Math.max(high, 1e-6) / look.ring.solid.height[0]) / Math.log(look.ring.solid.height[1] / look.ring.solid.height[0])) : ending ? 1 - end : 0)
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      const visible = radiusPx > 0.6 * bufferFrame()
      planet.mesh.visible = visible && show < 1
      deepLaid.mesh.visible = visible && (show > 0 || placed)
      air.mesh.visible = visible
      triton.mesh.visible = visible
      ring.mesh.visible = visible
      laid.mesh.visible = visible && lay > 0
      far.update(radiusPx, view, plan.p.tint, gain)
    },
    dispose: () => {
      planet.dispose()
      field.texture.dispose()
      air.dispose()
      triton.dispose()
      ring.dispose()
      far.dispose()
      closeup.dispose()
      deepView.dispose()
      deepLaid.dispose()
      laid.dispose()
    },
  }
}
