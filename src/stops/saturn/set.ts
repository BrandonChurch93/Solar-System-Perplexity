import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import type { SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { smooth } from '../../director/rig'
import { Globe, Shell } from './globe'
import { Ice } from './ice'
import * as look from './look'
import { plan } from './plan'
import { layoutUniforms, profileUniforms } from './profile'
import { Rings } from './rings'
import { shotMatrix, shotUniforms } from './shot'
import closeGlobe from './closeGlobe.json'
import holdLight from './hold-light.json'
import skimLight from './skim-light.json'
import layoutJson from './layout.json'
import polarJson from './polar.json'
import lightJson from './light.json'
import ringsJson from './rings.json'
import shadowJson from './shadow.json'
import skyJson from './sky.json'
import { Titan } from './titan'

export const createSet: SetFactory = async (ctx) => {
  const key = ctx.assets === 'full' ? 'full' : 'web'
  const base = 'saturn/' + ctx.assets + '/'
  const fit = plan.fit
  const polar = fit.globe.scale[1]!
  const world = new THREE.Group()
  const body = new THREE.Group()
  const tilt = new THREE.Group()
  world.add(body)
  body.add(tilt)
  tilt.quaternion.fromArray(fit.globe.quaternion)

  const close = { value: 0 }
  const sizes = ringsJson.sets[key]
  const profile = profileUniforms(await ctx.dataTexture(base + 'rings.bin', sizes.width, sizes.height, 4), key, close)
  const map = await ctx.texture(base + 'wrap-color.jpg', { srgb: true, anisotropy: 16, repeat: true })
  const table = await ctx.dataTexture(base + lightJson.file, lightJson.width, lightJson.height, 4)
  const rad = THREE.MathUtils.degToRad
  const patchSize = closeGlobe.sets[key] as [number, number]
  const patch = {
    texture: await ctx.texture(base + closeGlobe.file, { srgb: true, anisotropy: 16 }),
    table: await ctx.dataTexture(base + closeGlobe.light.file, closeGlobe.light.width, closeGlobe.light.height, 4),
    box: new THREE.Vector4(-rad(closeGlobe.lonCentreDeg), rad(closeGlobe.lonHalfDeg), rad(closeGlobe.latDeg[0]!), rad(closeGlobe.latDeg[1]!)),
    size: new THREE.Vector2(patchSize[0], patchSize[1]),
  }
  const toTilt = tilt.quaternion.clone().invert()
  const heroPose = plan.hold(plan.holdMid - plan.seg.hold.start)
  const heroL = heroPose.position.clone().applyQuaternion(toTilt)
  const heroM = shotMatrix(heroL, toTilt.clone().multiply(heroPose.quaternion), heroPose.vfov, 16 / 9)
  const poseW = { value: 0 }
  const polarW = { value: 0 }
  const skimL = plan.skimPosition.clone().applyQuaternion(toTilt)
  const skimM = shotMatrix(skimL, toTilt.clone().multiply(plan.skimQuaternion), plan.p.terrain.vfov, 16 / 9)
  const skimW = { value: 0 }
  const lights = {
    hold: { texture: await ctx.dataTexture(base + holdLight.file, holdLight.width, holdLight.height, 4), matrix: heroM, camera: heroL, weight: poseW },
    skim: { texture: await ctx.dataTexture(base + skimLight.file, skimLight.width, skimLight.height, 4), matrix: skimM, camera: skimL, weight: skimW },
  }
  const globe = new Globe(map, (map.image as unknown as { width: number }).width, table, patch, lights, look.globe, look.haze, profile, polar)
  const shell = new Shell(look.shell, look.globe, profile, polar)
  const layoutCamera = new THREE.PerspectiveCamera(layoutJson.vfovDeg, layoutJson.width / layoutJson.height, 0.01, 100)
  layoutCamera.position.copy(plan.skimPosition).addScaledVector(plan.skimForward, -layoutJson.back).applyQuaternion(toTilt)
  layoutCamera.quaternion.copy(toTilt).multiply(plan.skimQuaternion)
  layoutCamera.updateMatrixWorld(true)
  layoutCamera.updateProjectionMatrix()
  const layoutMatrix = new THREE.Matrix4().multiplyMatrices(layoutCamera.projectionMatrix, layoutCamera.matrixWorldInverse)
  const along = plan.skimPosition.clone().addScaledVector(plan.ringNormal, -plan.skimPosition.dot(plan.ringNormal)).normalize()
  const across = new THREE.Vector3().crossVectors(plan.ringNormal, along).applyQuaternion(toTilt)
  along.applyQuaternion(toTilt)
  const gate = { value: 1 }
  const skimShow = { value: 0 }
  const layout = layoutUniforms(await ctx.dataTexture(base + layoutJson.file, layoutJson.width, layoutJson.height, 4), await ctx.dataTexture(base + layoutJson.even, layoutJson.width, layoutJson.height, 1), await ctx.dataTexture(base + 'layout-tone.bin', layoutJson.width, layoutJson.height, 4), skimW, gate, layoutMatrix, layoutJson.width, layoutJson.height, along, across)
  const skimShot = shotUniforms('Skim', { map: await ctx.texture(base + 'skim-rings.jpg', { srgb: true, anisotropy: 16 }), mask: await ctx.texture(base + 'skim-rings-mask.png', { srgb: false, anisotropy: 16 }), matrix: skimM, weight: skimShow })
  const polarMap = await ctx.texture(base + polarJson.file, { srgb: true, anisotropy: 16, repeat: true })
  const polarWarp = await ctx.dataTexture(base + polarJson.warp.file, polarJson.warp.width, polarJson.warp.height, 1)
  polarWarp.wrapS = THREE.RepeatWrapping
  polarWarp.needsUpdate = true
  const polarSize = polarJson.sets[key] as [number, number]
  const ringMap = { uPolarMap: { value: polarMap }, uPolarWarp: { value: polarWarp }, uPolarSpan: { value: new THREE.Vector2(polarJson.span[0], 1 / (polarJson.span[1]! - polarJson.span[0]!)) }, uPolarSize: { value: new THREE.Vector2(polarSize[0], polarSize[1]) }, uPolarFit: { value: new THREE.Vector4(look.polarEdge[0], look.polarEdge[1], look.polarDensity[0], look.polarDensity[1]) }, uPolarW: polarW, uPolarShape: poseW, uPolarOuter: { value: new THREE.Vector2(polarJson.edge - look.polarOuter[0], polarJson.edge - look.polarOuter[1]) } }
  const rings = new Rings(profile, layout, { ...skimShot, ...ringMap }, look.rings, polar)
  tilt.add(globe.mesh, shell.mesh, rings.group)
  const ice = new Ice(look.ice, polar, { ...profile, ...layout })
  ;(ice.material.uniforms.uSkimL!.value as THREE.Vector3).copy(skimL)
  tilt.add(ice.mesh)

  const moonFit = fit.moons![0]!
  const titan = new Titan(moonFit.radius, look.titan)
  body.add(titan.mesh)
  const moonHome = new THREE.Vector3().fromArray(moonFit.position)
  const far = new FarPoint()
  body.add(far.points)

  const sky: SkyPatch[] = []
  for (const [view, def] of Object.entries(skyJson)) {
    const wide = 1 + 2 * def.margin
    const t = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2) * wide
    sky.push({ view: view as ViewKind, texture: await ctx.texture(base + def.file, { srgb: true, mips: false, anisotropy: 1 }), aim: new THREE.Quaternion(), tan: [t * 16 / 9, t], gain: def.gain, add: def.add, ring: def.ring as [number, number, number, number], edge: def.margin / wide, weight: (time, v) => plan.patchWeight(time, v) })
  }

  const toTerrain = plan.terrainFrame.clone().invert()
  const terrainOffset = plan.spot.clone().negate().applyQuaternion(toTerrain)
  const centre = new THREE.Vector3()
  const total = new THREE.Quaternion()
  const toRing = new THREE.Quaternion()
  const camL = new THREE.Vector3()
  const camS = new THREE.Vector3()
  const sunL = new THREE.Vector3()
  const sunS = new THREE.Vector3()
  const light = new THREE.Vector3()
  const shadowL = new THREE.Vector3()
  const lightL = new THREE.Vector3()
  const shadowClose = new THREE.Vector3()
  const UP = new THREE.Vector3(0, 1, 0)
  const closeEl = THREE.MathUtils.degToRad(look.closeLight.elevationDeg)
  const closeTurn = THREE.MathUtils.degToRad(look.closeLight.turnDeg)
  const shadowTurn = new THREE.Quaternion().setFromUnitVectors(plan.lightDir.clone().applyQuaternion(tilt.quaternion.clone().invert()).normalize(), new THREE.Vector3().fromArray(shadowJson.local).normalize())
  const turn = new THREE.Quaternion()
  const moon = new THREE.Vector3()
  const spinRate = THREE.MathUtils.degToRad(plan.p.spinDegPerSecond)
  const dayTone = new THREE.Vector3()
  const shellSkim = new THREE.Vector3().fromArray(look.shellSkim)
  const logLo = Math.log(look.closeRange[0])
  const logHi = Math.log(look.closeRange[1])

  return {
    id: plan.id,
    world,
    sky,
    update: (state, shot, view) => {
      const inOrbit = state.view === 'orbit'
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
      close.value = 1 - smooth((Math.log(Math.max(Math.abs(camL.y), 1e-3)) - logLo) / (logHi - logLo))
      poseW.value = 1 - smooth((camL.distanceTo(heroL) - look.heroRange[0]) / (look.heroRange[1] - look.heroRange[0]))
      polarW.value = Math.max(smooth((Math.abs(camL.y) - look.polarHeight[0]) / (look.polarHeight[1] - look.polarHeight[0])), smooth((camL.length() - look.polarFar[0]) / (look.polarFar[1] - look.polarFar[0]))) * look.polarShow
      const away = camL.distanceTo(skimL)
      gate.value = 1 - smooth((away - look.detailRange[0]) / (look.detailRange[1] - look.detailRange[0]))
      skimW.value = 1 - smooth((away - look.skimRange[0]) / (look.skimRange[1] - look.skimRange[0]))
      skimShow.value = skimW.value * look.rings.skimShow
      const el = THREE.MathUtils.lerp(Math.asin(THREE.MathUtils.clamp(sunL.y, -1, 1)), closeEl, close.value)
      lightL.set(sunL.x, 0, sunL.z).normalize().applyAxisAngle(UP, closeTurn * close.value).multiplyScalar(Math.cos(el))
      lightL.y = Math.sin(el)
      camS.set(camL.x, camL.y / polar, camL.z)
      sunS.set(lightL.x, lightL.y / polar, lightL.z).normalize()
      const gain = 1 / shot.post.exposure
      const elapsed = state.time - plan.holdMid
      const aspect = view.format.width / view.format.height

      const gu = globe.material.uniforms
      const su = shell.material.uniforms
      ;(gu.uCam!.value as THREE.Vector3).copy(camS)
      ;(gu.uSunW!.value as THREE.Vector3).copy(sunS)
      ;(gu.uSunL!.value as THREE.Vector3).copy(sunL)
      ;(gu.uLightL!.value as THREE.Vector3).copy(lightL)
      gu.uSpin!.value = plan.spin(state.time)
      gu.uRingShadow!.value = look.globe.ringShadow * THREE.MathUtils.lerp(1, look.globe.ringShadowHero, poseW.value)
      su.uRingShadow!.value = gu.uRingShadow!.value
      gu.uDrift!.value = THREE.MathUtils.degToRad(look.globe.drift) * elapsed
      gu.uGain!.value = gain
      gu.uWeight!.value = state.weight
      gu.uVignette!.value = shot.post.vignette
      gu.uAspect!.value = aspect
      ;(su.uCam!.value as THREE.Vector3).copy(camS)
      ;(su.uSunW!.value as THREE.Vector3).copy(sunS)
      ;(su.uSunL!.value as THREE.Vector3).copy(sunL)
      su.uGain!.value = gain * state.weight
      const ru = rings.uniforms
      ;(ru.uCamL!.value as THREE.Vector3).copy(camL)
      rings.cull(camL, close.value)
      ;(ru.uSunL!.value as THREE.Vector3).copy(sunL)
      ;(ru.uShadowL!.value as THREE.Vector3).copy(shadowL.copy(sunL).applyQuaternion(shadowTurn).lerp(shadowClose.copy(lightL).applyAxisAngle(UP, THREE.MathUtils.degToRad(look.rings.shadowClose[0])).setY(Math.sin(THREE.MathUtils.degToRad(look.rings.shadowClose[1]))), close.value).normalize())
      ru.uGain!.value = gain
      ru.uWeight!.value = state.weight
      ru.uTime!.value = elapsed
      ru.uSpinRate!.value = spinRate
      ru.uVignette!.value = shot.post.vignette
      ru.uAspect!.value = aspect
      ;(ru.uSkimFit!.value as THREE.Vector4).w = Math.max(ru.uGrad!.value as number, look.rings.skimFoot)
      ;(su.uHazeTwilight!.value as THREE.Vector3).fromArray(look.shell.twilight).multiplyScalar(1 - skimW.value)
      ;(su.uHazeDay!.value as THREE.Vector3).fromArray(look.shell.day).multiply(dayTone.set(1, 1, 1).lerp(shellSkim, skimW.value))
      ;(gu.uRimNight!.value as THREE.Vector4).fromArray(look.globe.rimNight).multiplyScalar(1 - skimW.value).setW(look.globe.rimNight[3])
      const parted = smooth((away - look.skimAway[0]) / (look.skimAway[1] - look.skimAway[0]))
      ;(ru.uSkimFit!.value as THREE.Vector4).x = THREE.MathUtils.lerp(look.rings.skimEdge[0], look.rings.skimEdge[1], parted)
      ru.uSkimNear!.value = 1 - parted
      ;(ru.uSkimCam!.value as THREE.Vector3).copy(skimL)

      const iu = ice.material.uniforms
      const iceW = 1 - smooth((Math.abs(camL.y) - look.ice.heightRange[0]) / (look.ice.heightRange[1] - look.ice.heightRange[0]))
      ice.mesh.visible = iceW > 0 && camL.y * sunL.y > 0
      ;(iu.uCamL!.value as THREE.Vector3).copy(camL)
      ;(iu.uShadowL!.value as THREE.Vector3).copy(shadowL)
      ;(iu.uView!.value as THREE.Vector2).set(view.format.width, view.format.height)
      iu.uTime!.value = elapsed
      iu.uGain!.value = gain * state.weight * iceW

      turn.setFromAxisAngle(plan.axis, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * elapsed)
      titan.mesh.position.copy(moonHome).applyQuaternion(turn)
      moon.copy(titan.mesh.position).applyQuaternion(total).add(centre)
      const tu = titan.material.uniforms
      ;(tu.uCentre!.value as THREE.Vector3).copy(moon)
      ;(tu.uSun!.value as THREE.Vector3).copy(light)
      tu.uGain!.value = gain * state.weight

      const distance = centre.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      const visible = radiusPx > 0.6
      tilt.visible = visible
      titan.mesh.visible = visible
      far.update(radiusPx, view, plan.p.tint, gain)
    },
    dispose: () => {
      globe.dispose()
      shell.dispose()
      rings.dispose()
      ice.dispose()
      titan.dispose()
      far.dispose()
    },
  }
}
