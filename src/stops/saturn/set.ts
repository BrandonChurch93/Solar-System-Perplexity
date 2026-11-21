import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import type { SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { smooth } from '../../director/rig'
import { Globe, Shell } from './globe'
import * as look from './look'
import { plan } from './plan'
import { layoutUniforms, profileUniforms } from './profile'
import { Rings } from './rings'
import closeGlobe from './closeGlobe.json'
import layoutJson from './layout.json'
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
    box: new THREE.Vector4(-rad(closeGlobe.lonCentreDeg), rad(closeGlobe.lonHalfDeg), rad(closeGlobe.latDeg[0]!), rad(closeGlobe.latDeg[1]!)),
    size: new THREE.Vector2(patchSize[0], patchSize[1]),
  }
  const globe = new Globe(map, (map.image as unknown as { width: number }).width, table, patch, look.globe, look.haze, profile, polar)
  const shell = new Shell(look.shell, look.globe, profile, polar)
  const toTilt = tilt.quaternion.clone().invert()
  const layoutCamera = new THREE.PerspectiveCamera(layoutJson.vfovDeg, layoutJson.width / layoutJson.height, 0.01, 100)
  layoutCamera.position.copy(plan.skimPosition).addScaledVector(plan.skimForward, -layoutJson.back).applyQuaternion(toTilt)
  layoutCamera.quaternion.copy(toTilt).multiply(plan.skimQuaternion)
  layoutCamera.updateMatrixWorld(true)
  layoutCamera.updateProjectionMatrix()
  const layoutMatrix = new THREE.Matrix4().multiplyMatrices(layoutCamera.projectionMatrix, layoutCamera.matrixWorldInverse)
  const along = plan.skimPosition.clone().addScaledVector(plan.ringNormal, -plan.skimPosition.dot(plan.ringNormal)).normalize()
  const across = new THREE.Vector3().crossVectors(plan.ringNormal, along).applyQuaternion(toTilt)
  along.applyQuaternion(toTilt)
  const layout = layoutUniforms(await ctx.dataTexture(base + layoutJson.file, layoutJson.width, layoutJson.height, 4), layoutMatrix, layoutJson.width, layoutJson.height, along, across)
  const rings = new Rings(profile, layout, look.rings, polar)
  tilt.add(globe.mesh, shell.mesh, rings.group)

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
  const UP = new THREE.Vector3(0, 1, 0)
  const closeEl = THREE.MathUtils.degToRad(look.closeLight.elevationDeg)
  const closeTurn = THREE.MathUtils.degToRad(look.closeLight.turnDeg)
  const shadowTurn = new THREE.Quaternion().setFromUnitVectors(plan.lightDir.clone().applyQuaternion(tilt.quaternion.clone().invert()).normalize(), new THREE.Vector3().fromArray(shadowJson.local).normalize())
  const turn = new THREE.Quaternion()
  const moon = new THREE.Vector3()
  const spinRate = THREE.MathUtils.degToRad(plan.p.spinDegPerSecond)
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
      const el = THREE.MathUtils.lerp(Math.asin(THREE.MathUtils.clamp(sunL.y, -1, 1)), closeEl, close.value)
      lightL.set(sunL.x, 0, sunL.z).normalize().applyAxisAngle(UP, closeTurn * close.value).multiplyScalar(Math.cos(el))
      lightL.y = Math.sin(el)
      camS.set(camL.x, camL.y / polar, camL.z)
      sunS.set(lightL.x, lightL.y / polar, lightL.z).normalize()
      const gain = 1 / shot.post.exposure
      const elapsed = state.time - plan.holdMid
      const aspect = view.format.width / view.format.height

      const gu = globe.material.uniforms
      ;(gu.uCam!.value as THREE.Vector3).copy(camS)
      ;(gu.uSunW!.value as THREE.Vector3).copy(sunS)
      ;(gu.uSunL!.value as THREE.Vector3).copy(sunL)
      ;(gu.uLightL!.value as THREE.Vector3).copy(lightL)
      gu.uSpin!.value = plan.spin(state.time)
      gu.uDrift!.value = THREE.MathUtils.degToRad(look.globe.drift) * elapsed
      gu.uGain!.value = gain
      gu.uWeight!.value = state.weight
      gu.uVignette!.value = shot.post.vignette
      gu.uAspect!.value = aspect
      const su = shell.material.uniforms
      ;(su.uCam!.value as THREE.Vector3).copy(camS)
      ;(su.uSunW!.value as THREE.Vector3).copy(sunS)
      ;(su.uSunL!.value as THREE.Vector3).copy(sunL)
      su.uGain!.value = gain * state.weight
      const ru = rings.uniforms
      ;(ru.uCamL!.value as THREE.Vector3).copy(camL)
      ;(ru.uSunL!.value as THREE.Vector3).copy(sunL)
      ;(ru.uShadowL!.value as THREE.Vector3).copy(shadowL.copy(sunL).applyQuaternion(shadowTurn))
      ru.uGain!.value = gain
      ru.uWeight!.value = state.weight
      ru.uTime!.value = elapsed
      ru.uSpinRate!.value = spinRate
      ru.uVignette!.value = shot.post.vignette
      ru.uAspect!.value = aspect

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
      titan.dispose()
      far.dispose()
    },
  }
}
