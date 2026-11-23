import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import { config } from '../../config'
import type { SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { smooth } from '../../director/rig'
import { ringField } from './field'
import { Globe, Shell } from './globe'
import { Grains, type Lens } from './grains'
import { iceField } from './ice'
import * as look from './look'
import { plan } from './plan'
import { Sheet } from './sheet'
import { shotMatrix } from './shot'
import holdLight from './hold-light.json'
import iceJson from './ice.json'
import lightJson from './light.json'
import sheetJson from './sheet.json'
import skimJson from './skim.json'
import skyJson from './sky.json'
import { Streak } from './streak'
import { Titan } from './titan'

export const createSet: SetFactory = async (ctx) => {
  const base = 'saturn/' + ctx.assets + '/'
  const fit = plan.fit
  const polar = fit.globe.scale[1]!
  const world = new THREE.Group()
  const body = new THREE.Group()
  const tilt = new THREE.Group()
  world.add(body)
  body.add(tilt)
  tilt.quaternion.fromArray(fit.globe.quaternion)

  const field = ringField(ctx)
  const map = await ctx.texture(base + 'wrap-color.jpg', { srgb: true, anisotropy: 16, repeat: true })
  const table = await ctx.dataTexture(base + lightJson.file, lightJson.width, lightJson.height, 4)
  const toTilt = tilt.quaternion.clone().invert()
  const heroPose = plan.hold(plan.holdMid - plan.seg.hold.start)
  const heroL = heroPose.position.clone().applyQuaternion(toTilt)
  const heroM = shotMatrix(heroL, toTilt.clone().multiply(heroPose.quaternion), heroPose.vfov, 16 / 9)
  const poseW = { value: 0 }
  const hold = { texture: await ctx.dataTexture(base + holdLight.file, holdLight.width, holdLight.height, 4), matrix: heroM, camera: heroL, weight: poseW }
  const globe = new Globe(map, (map.image as unknown as { width: number }).width, table, hold, look.globe, look.haze, field.uniforms, polar)
  const shell = new Shell(look.shell, look.globe, field.uniforms, polar, look.shellReach)
  const ice = iceField()
  const sheet = new Sheet(field, ice, polar)
  tilt.add(globe.mesh, shell.mesh, sheet.group)
  shell.mesh.renderOrder = 2.5

  // the ice near the lens, grain by grain
  const grains = new Grains(sheet.uniforms, ice, iceJson.orbit.syncRadius)
  tilt.add(grains.points)

  const streak = new Streak(look.streak)
  world.add(streak.mesh)

  const moonFit = fit.moons![0]!
  const titan = new Titan(moonFit.radius * look.titan.size, look.titan)
  body.add(titan.mesh)
  const moonHome = new THREE.Vector3().fromArray(look.titan.home)
  const far = new FarPoint()
  body.add(far.points)

  const sky: SkyPatch[] = []
  for (const [view, def] of Object.entries(skyJson)) {
    const wide = 1 + 2 * def.margin
    const t = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2) * wide
    sky.push({ view: view as ViewKind, texture: await ctx.texture(base + def.file, { srgb: true, mips: false, anisotropy: 1 }), aim: new THREE.Quaternion(), tan: [t * 16 / 9, t], gain: def.gain, add: def.add, ring: def.ring as [number, number, number, number], edge: def.margin / wide, weight: () => look.patchShow })
  }

  const toTerrain = plan.terrainFrame.clone().invert()
  const terrainOffset = plan.spot.clone().negate().applyQuaternion(toTerrain)
  const centre = new THREE.Vector3()
  const total = new THREE.Quaternion()
  const toRing = new THREE.Quaternion()
  const seat = new THREE.Quaternion()
  const seatBack = new THREE.Quaternion()
  const bodyBack = new THREE.Quaternion()
  const toBody = new THREE.Matrix4()
  const camL = new THREE.Vector3()
  const camS = new THREE.Vector3()
  const sunL = new THREE.Vector3()
  const sunS = new THREE.Vector3()
  const light = new THREE.Vector3()
  const turn = new THREE.Quaternion()
  const moon = new THREE.Vector3()
  const moved = new THREE.Vector3()
  const lens: Lens = { position: camL, quaternion: new THREE.Quaternion(), turns: 0, tan: [1, 1], slack: 0 }
  const farthestIce = skimJson.outer.end[1]!
  const tune = skimJson.light
  const tintDense = new THREE.Vector3().fromArray(tune.tint.near.dense)
  const tintThin = new THREE.Vector3().fromArray(tune.tint.near.thin)
  const logLo = Math.log(tune.heights[0]!)
  const logHi = Math.log(tune.heights[1]!)

  return {
    id: plan.id,
    world,
    sky,
    update: (state, shot, view) => {
      const inOrbit = state.view === 'orbit'
      const turned = plan.seat(state.time)
      if (turned.w !== 1) {
        seat.copy(shot.camera.quaternion).multiply(turned).multiply(seatBack.copy(shot.camera.quaternion).invert())
        world.position.applyQuaternion(seat)
        world.quaternion.premultiply(seat)
      }
      if (inOrbit) {
        body.position.set(0, 0, 0)
        body.quaternion.identity()
      } else {
        body.position.copy(terrainOffset)
        body.quaternion.copy(toTerrain)
      }
      world.visible = state.weight > 0
      centre.copy(body.position).applyQuaternion(world.quaternion).add(world.position)
      total.copy(world.quaternion).multiply(body.quaternion)
      toRing.copy(total).multiply(tilt.quaternion).invert()
      camL.copy(centre).negate().applyQuaternion(toRing)
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      light.copy(plan.lightDir).applyQuaternion(total).lerp(shot.sun.dir, lit).normalize()
      sunL.copy(light).applyQuaternion(toRing)
      const close = 1 - smooth((Math.log(Math.max(Math.abs(camL.y), 1e-3)) - logLo) / (logHi - logLo))
      poseW.value = 1 - smooth((camL.distanceTo(heroL) - tune.heroRange[0]!) / (tune.heroRange[1]! - tune.heroRange[0]!))
      camS.set(camL.x, camL.y / polar, camL.z)
      sunS.set(sunL.x, sunL.y / polar, sunL.z).normalize()
      const gain = 1 / shot.post.exposure
      const globeGain = gain * THREE.MathUtils.lerp(tune.globe[0]!, tune.globe[1]!, close)
      const elapsed = state.time - plan.holdMid
      const aspect = view.format.width / view.format.height

      const gu = globe.material.uniforms
      const su = shell.material.uniforms
      ;(gu.uCam!.value as THREE.Vector3).copy(camS)
      gu.uLimbW!.value = poseW.value * look.limbShow
      ;(gu.uFine!.value as THREE.Vector4).w = (1 - poseW.value) * (1 - close)
      gu.uNightBlur!.value = look.globe.nightBlurFar + (look.globe.nightBlur - look.globe.nightBlurFar) * close
      su.uLimbW!.value = gu.uLimbW!.value
      gu.uInflate!.value = gu.uLimbW!.value > 0 ? look.globe.limbInflate : 1
      ;(gu.uSunW!.value as THREE.Vector3).copy(sunS)
      ;(gu.uSunL!.value as THREE.Vector3).copy(sunL)
      ;(gu.uLightL!.value as THREE.Vector3).copy(sunL)
      gu.uSpin!.value = plan.spin(state.time)
      gu.uRingShadow!.value = look.globe.ringShadow * THREE.MathUtils.lerp(1, look.globe.ringShadowHero, poseW.value)
      su.uRingShadow!.value = gu.uRingShadow!.value
      gu.uDrift!.value = THREE.MathUtils.degToRad(look.globe.drift) * elapsed
      gu.uGain!.value = globeGain
      gu.uWeight!.value = state.weight
      gu.uVignette!.value = shot.post.vignette
      gu.uAspect!.value = aspect
      ;(su.uCam!.value as THREE.Vector3).copy(camS)
      ;(su.uSunW!.value as THREE.Vector3).copy(sunS)
      ;(su.uSunL!.value as THREE.Vector3).copy(sunL)
      su.uGain!.value = globeGain * state.weight * THREE.MathUtils.lerp(tune.halo.gain[0]!, tune.halo.gain[1]!, close)
      su.uHazeH!.value = look.shell.scaleHeight * THREE.MathUtils.lerp(tune.halo.height[0]!, tune.halo.height[1]!, close)
      ;(gu.uDusk!.value as THREE.Vector4).set(tune.dusk.from, tune.dusk.to, THREE.MathUtils.lerp(tune.dusk.amount[0]!, tune.dusk.amount[1]!, close), THREE.MathUtils.lerp(tune.dusk.night[0]!, tune.dusk.night[1]!, close))

      const half = Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2)
      const focal = view.format.height / 2 / half
      ice.set(plan.spin(state.time), close, focal)
      // one take of the frame: how far the lens moves and the orbits turn while its shutter is open
      const take = config.shutterFraction / config.fps / Math.max(view.samples, 1)
      moved.copy(plan.flight(state.time + take / 2).position).sub(plan.flight(state.time - take / 2).position).applyQuaternion(toTilt)
      ice.move.set(moved.x, moved.y, moved.z, (plan.spin(state.time + take / 2) - plan.spin(state.time - take / 2)) / (2 * Math.PI)).multiplyScalar(close)
      lens.quaternion.copy(toRing).multiply(view.camera.quaternion)
      lens.turns = plan.spin(state.time) / (2 * Math.PI)
      lens.tan[0] = half * aspect
      lens.tan[1] = half
      lens.slack = Math.hypot(ice.move.x, ice.move.y, ice.move.z) + 2 * Math.PI * farthestIce * Math.abs(ice.move.w)
      grains.set(focal, view.format.width, view.format.height, close, lens)
      const ru = sheet.uniforms
      ;(ru.uCamL!.value as THREE.Vector3).copy(camL)
      ;(ru.uSunL!.value as THREE.Vector3).copy(sunL)
      ;(ru.uShade!.value as THREE.Vector4).z = THREE.MathUtils.lerp(sheetJson.gain[0]!, sheetJson.gain[1]!, close) * THREE.MathUtils.lerp(tune.rings[0]!, tune.rings[1]!, close)
      ru.uSat!.value = THREE.MathUtils.lerp(tune.ringSaturation[0]!, tune.ringSaturation[1]!, close)
      field.set(close)
      sheet.set(close)
      ;(ru.uFlatten!.value as THREE.Vector4).set(tune.flatten.pivot, THREE.MathUtils.lerp(tune.flatten.power[0]!, tune.flatten.power[1]!, close), tune.flatten.width, tune.flatten.reach)
      ;(ru.uTintDense!.value as THREE.Vector3).fromArray(tune.tint.far.dense).lerp(tintDense, close)
      ;(ru.uTintThin!.value as THREE.Vector3).fromArray(tune.tint.far.thin).lerp(tintThin, close)
      ru.uGain!.value = gain
      ru.uWeight!.value = state.weight
      ru.uVignette!.value = shot.post.vignette
      ru.uAspect!.value = aspect

      const ku = streak.material.uniforms
      const tan = Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2)
      ;(ku.uTan!.value as THREE.Vector2).set(tan * view.format.width / view.format.height, tan)
      ku.uGain!.value = gain * state.weight * poseW.value * look.streak.gain * (1 - smooth((state.time - plan.seg.hold.end) / look.streak.fade))
      streak.mesh.visible = inOrbit && poseW.value > 0

      turn.setFromAxisAngle(plan.axis, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * elapsed)
      titan.mesh.position.copy(moonHome).applyQuaternion(turn)
      moon.copy(titan.mesh.position).applyQuaternion(total).add(centre)
      const tu = titan.material.uniforms
      ;(tu.uCentre!.value as THREE.Vector3).copy(moon)
      ;(tu.uSun!.value as THREE.Vector3).copy(light)
      ;(tu.uAxis!.value as THREE.Vector3).copy(plan.axis)
      ;(tu.uToBody!.value as THREE.Matrix3).setFromMatrix4(toBody.makeRotationFromQuaternion(bodyBack.copy(total).invert()))
      tu.uGain!.value = gain * state.weight

      const distance = centre.length()
      const radiusPx = (1 / Math.max(distance, 1)) / tan * (view.format.height / 2)
      const visible = radiusPx > 0.6
      tilt.visible = visible
      titan.mesh.visible = visible
      far.update(radiusPx, view, plan.p.tint, gain)
    },
    dispose: () => {
      globe.dispose()
      shell.dispose()
      sheet.dispose()
      grains.dispose()
      titan.dispose()
      streak.dispose()
      far.dispose()
    },
  }
}
