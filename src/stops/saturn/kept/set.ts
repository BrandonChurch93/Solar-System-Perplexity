import * as THREE from 'three'
import { FarPoint } from '../../../bodies/farpoint'
import { bufferFrame, frameUniform } from '../../../core/frame'
import type { SetFactory } from '../../../core/types'
import { smooth } from '../../../director/rig'
import { Globe, Shell } from './globe'
import { duskAt, dustAt, dustShadeAt, fineShare, gradeShare, hazeDayAt, latToneAt, leanAt, zoneShare } from '../grade'
import { Ice } from './ice'
import * as look from './look'
import { plan } from './plan'
import { layoutUniforms, profileUniforms } from './profile'
import { Rings } from './rings'
import { shotMatrix, shotUniforms } from '../shot'
import apronJson from '../apron.json'
import bloomJson from '../bloom.json'
import toneJson from '../skim-tone.json'
import closeGlobe from '../closeGlobe.json'
import globeLight from '../globe-light.json'
import skimLight from '../skim-light.json'
import layoutJson from '../layout.json'
import innerJson from '../inner.json'
import polarJson from '../polar.json'
import lightJson from '../light.json'
import ringsJson from '../rings.json'
import shadowJson from '../shadow.json'
import skimJson from '../skim.json'
import { Streak } from '../streak'
import { Titan } from '../titan'

// The set of the kept build (main), drawn for the approach, the hold and the first part of the dive: see ../set.ts.
// The sky patches of the stop are given by the model set.
export const createKept: SetFactory = async (ctx) => {
  const window = skimJson.handover.kept
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
  const poseW = { value: 0 }
  // the share of the hero picture's ring layout that is drawn (look.shapeShow): the rings are one rigid body,
  // true circles about the axis at every pose of the lens, so this is 0
  const bendW = { value: 0 }
  const holdEndFar = plan.hold(plan.seg.hold.end - plan.seg.hold.start).position.length()
  const polarW = { value: 0 }
  const skimL = plan.skimPosition.clone().applyQuaternion(toTilt)
  const skimM = shotMatrix(skimL, toTilt.clone().multiply(plan.skimQuaternion), plan.p.terrain.vfov, 16 / 9)
  const skimW = { value: 0 }
  const skimRay = new THREE.Vector3((look.skimJoin[0] - 0.5) * 2 * (16 / 9), (0.5 - look.skimJoin[1]) * 2, -1 / Math.tan(rad(plan.p.terrain.vfov) / 2)).applyQuaternion(toTilt.clone().multiply(plan.skimQuaternion))
  const skimJoin = skimL.clone().addScaledVector(skimRay, -skimL.y / skimRay.y)
  const joinA = new THREE.Vector3()
  const joinB = new THREE.Vector3()
  // the hold's light on the globe, a map of the body by latitude and by longitude from the Sun (globe-light.json)
  const bodyLight = await ctx.dataTexture(base + globeLight.file, globeLight.width, globeLight.height, 4)
  bodyLight.wrapS = THREE.RepeatWrapping
  bodyLight.needsUpdate = true
  const lights = {
    body: bodyLight,
    skim: { texture: await ctx.dataTexture(base + skimLight.file, skimLight.width, skimLight.height, 4), matrix: skimM, camera: skimL, weight: skimW },
  }
  const globe = new Globe(map, (map.image as unknown as { width: number }).width, table, patch, lights, look.globe, look.haze, profile, polar)
  const shell = new Shell(look.shell, look.globe, profile, polar, look.shellReach)
  // the edge of the day of the haze as the shell was built with it: its look in the hold (grade.ts hazeDayAt)
  const hazeDayFar = (shell.material.uniforms.uHazeEdge!.value as THREE.Vector2).clone()
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
  const innerMap = await ctx.texture(base + innerJson.file, { srgb: true, anisotropy: 16, repeat: true })
  const innerSize = innerJson.sets[key] as [number, number]
  const ringMap = { uPolarMap: { value: polarMap }, uPolarWarp: { value: polarWarp }, uPolarSpan: { value: new THREE.Vector2(polarJson.span[0], 1 / (polarJson.span[1]! - polarJson.span[0]!)) }, uPolarSize: { value: new THREE.Vector2(polarSize[0], polarSize[1]) }, uPolarFit: { value: new THREE.Vector4(look.polarEdge[0], look.polarEdge[1], look.polarDensity[0], look.polarDensity[1]) }, uInnerMap: { value: innerMap }, uInnerSpan: { value: new THREE.Vector2(innerJson.span[0], 1 / (innerJson.span[1]! - innerJson.span[0]!)) }, uInnerSize: { value: new THREE.Vector2(innerSize[0], innerSize[1]) }, uPolarW: polarW, uPolarShape: poseW, uPolarBend: bendW, uPolarOuter: { value: new THREE.Vector2(polarJson.edge - look.polarOuter[0], polarJson.edge - look.polarOuter[1]) } }
  const apronSize = apronJson.sets[key] as [number, number]
  const apronBox = new THREE.Vector4(-apronJson.left, -apronJson.below, 1 / (1 + apronJson.left + apronJson.right), 1 / (1 + apronJson.below))
  const apron = { uApronMap: { value: await ctx.texture(base + apronJson.file, { srgb: true, anisotropy: 16 }) }, uApronMask: { value: await ctx.texture(base + apronJson.mask, { srgb: false, anisotropy: 16 }) }, uApron: { value: apronBox }, uApronSize: { value: new THREE.Vector2(apronSize[0], apronSize[1]) }, uApronFit: { value: new THREE.Vector4(look.rings.apronEdge[0], look.rings.apronEdge[1], look.rings.apronEdge[2], 0) }, uBloomMap: { value: await ctx.texture(base + bloomJson.file, { srgb: false }) }, uDebloom: { value: new THREE.Vector2(look.rings.debloom, bloomJson.scale) }, uSkimHigh: { value: new THREE.Vector4().fromArray(look.rings.skimHigh) }, uSkimTone: { value: await ctx.dataTexture(base + toneJson.file, toneJson.width, toneJson.height, 4) }, uSkimToneW: { value: look.rings.skimTone } }
  const limb = { uLimbFit: { value: look.globe.limbFit }, uLimbLat: { value: new THREE.Vector2().fromArray(look.globe.limbLat) }, uLimbW: { value: 0 } }
  const rings = new Rings(profile, layout, { ...skimShot, ...ringMap, ...apron, ...limb }, look.rings, polar)
  tilt.add(globe.mesh, shell.mesh, rings.group)
  const ice = new Ice(look.ice, polar, { ...profile, ...layout }, skimM, skimShow)
  ;(ice.material.uniforms.uSkimL!.value as THREE.Vector3).copy(skimL)
  ;(ice.material.uniforms.uApron!.value as THREE.Vector4).copy(apronBox)
  tilt.add(ice.mesh)

  const streak = new Streak(look.streak)
  world.add(streak.mesh)

  const moonFit = fit.moons![0]!
  const titan = new Titan(moonFit.radius * look.titan.size, look.titan)
  body.add(titan.mesh)
  const moonHome = new THREE.Vector3().fromArray(look.titan.home)
  const far = new FarPoint()
  body.add(far.points)

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
      close.value = 1 - smooth((Math.log(Math.max(Math.abs(camL.y), 1e-3)) - logLo) / (logHi - logLo))
      // the hero's light is a property of the body, the same share at every pose of the lens (look.heroLight)
      poseW.value = look.heroLight
      bendW.value = poseW.value * look.shapeShow
      polarW.value = Math.max(smooth((Math.abs(camL.y) - look.polarHeight[0]) / (look.polarHeight[1] - look.polarHeight[0])), smooth((camL.length() - look.polarFar[0]) / (look.polarFar[1] - look.polarFar[0]))) * look.polarShow
      // this set stays the far picture: the model takes the picture over before the lens is near, so what this
      // set shows only near the sheet (the close layout, the skim's haze, the ice) is held out. None of it shows
      // at the heights and distances of the approach and the hold.
      const near = window.close
      // how far the lens has come nearer to the globe than it is at the end of the hold: the hold's own look of
      // the shade and the streak ends over this distance (look.rings.shadeSolid, look.streak.fade), by the
      // place of the lens and not by the clock
      const dove = holdEndFar - camL.length()
      close.value *= near
      const away = camL.distanceTo(skimL)
      gate.value = 1 - smooth((away - look.detailRange[0]) / (look.detailRange[1] - look.detailRange[0]))
      skimW.value = 1 - smooth((away - look.skimRange[0]) / (look.skimRange[1] - look.skimRange[0]))
      skimShow.value = skimW.value * look.rings.skimShow
      const el = THREE.MathUtils.lerp(Math.asin(THREE.MathUtils.clamp(sunL.y, -1, 1)), closeEl, close.value)
      lightL.set(sunL.x, 0, sunL.z).normalize().applyAxisAngle(UP, closeTurn * close.value).multiplyScalar(Math.cos(el))
      lightL.y = Math.sin(el)
      const wide = 1 + look.skimGrow[0] * skimW.value
      const tall = polar * (1 + look.skimGrow[1] * skimW.value)
      globe.mesh.scale.set(wide, tall, wide)
      shell.mesh.scale.set(wide, tall, wide)
      camS.set(camL.x / wide, camL.y / tall, camL.z / wide)
      ;(rings.uniforms.uGlobe!.value as THREE.Vector2).set(wide, tall)
      sunS.set(lightL.x, lightL.y / polar, lightL.z).normalize()
      const gain = 1 / shot.post.exposure
      const elapsed = state.time - plan.holdMid
      const aspect = view.format.width / view.format.height
      // what the look holds in pixels is an angle: pixels of the master, times the film's own factor
      const foot = bufferFrame()

      const gu = globe.material.uniforms
      const su = shell.material.uniforms
      ;(gu.uCam!.value as THREE.Vector3).copy(camS)
      gu.uEdgePx!.value = THREE.MathUtils.lerp(look.globe.edgePx, look.skimLimb[0], skimW.value) * foot
      gu.uEdgeLin!.value = look.skimLimb[1] * skimW.value
      gu.uLimbW!.value = poseW.value * look.limbShow
      ;(gu.uFine!.value as THREE.Vector4).set(look.globe.fine[0]! * foot, look.globe.fine[1]!, look.globe.fine[2]!, (1 - poseW.value) * (1 - close.value) * fineShare(camL.y))
      gu.uNightBlur!.value = (look.globe.nightBlurFar + (look.globe.nightBlur - look.globe.nightBlurFar) * close.value) * foot
      su.uLimbW!.value = gu.uLimbW!.value
      gu.uInflate!.value = look.globe.limbInflate
      ;(gu.uSunW!.value as THREE.Vector3).copy(sunS)
      ;(gu.uSunL!.value as THREE.Vector3).copy(sunL)
      ;(gu.uLightL!.value as THREE.Vector3).copy(lightL)
      gu.uSpin!.value = plan.spin(state.time)
      gu.uRingShadow!.value = look.globe.ringShadow * THREE.MathUtils.lerp(1, look.globe.ringShadowHero, poseW.value)
      su.uRingShadow!.value = gu.uRingShadow!.value
      gu.uGain!.value = gain
      gu.uWeight!.value = state.weight
      gu.uVignette!.value = shot.post.vignette
      gu.uAspect!.value = aspect
      duskAt(camL.y, gu.uDusk!.value as THREE.Vector4, gu.uDuskGrey!.value as THREE.Vector2, gu.uDuskTint!.value as THREE.Vector4)
      leanAt(camL.y, gu.uLean!.value as THREE.Vector4)
      dustAt(gu.uDust!.value as THREE.Vector4)
      dustShadeAt(gu.uDustShade!.value as THREE.Vector4)
      latToneAt(camL.y, gu.uLatFit!.value as THREE.Vector4)
      dustAt(su.uDust!.value as THREE.Vector4)
      hazeDayAt(camL.y, hazeDayFar, su.uHazeEdge!.value as THREE.Vector2)
      ;(su.uCam!.value as THREE.Vector3).copy(camS)
      ;(su.uSunW!.value as THREE.Vector3).copy(sunS)
      ;(su.uSunL!.value as THREE.Vector3).copy(sunL)
      su.uGain!.value = gain * state.weight
      const ru = rings.uniforms
      ;(ru.uFoot!.value as THREE.Vector3).set(foot, foot * polarJson.sets.full[0]! / polarSize[0], foot * innerJson.sets.full[0]! / innerSize[0])
      ru.uSeam!.value = window.seam
      ;(ru.uCamL!.value as THREE.Vector3).copy(camL)
      ;(ru.uGrade!.value as THREE.Vector4).x = gradeShare(camL.y)
      ;(ru.uGradeLow!.value as THREE.Vector4).w = zoneShare(camL.y)
      rings.cull(camL, close.value)
      ;(ru.uSunL!.value as THREE.Vector3).copy(sunL)
      ;(ru.uShadowL!.value as THREE.Vector3).copy(shadowL.copy(sunL).applyQuaternion(shadowTurn).lerp(shadowClose.copy(lightL).applyAxisAngle(UP, THREE.MathUtils.degToRad(look.rings.shadowClose[0])).setY(Math.sin(THREE.MathUtils.degToRad(look.rings.shadowClose[1]))), close.value).normalize())
      ru.uGain!.value = gain
      ru.uLimbW!.value = gu.uLimbW!.value
      ru.uWeight!.value = state.weight
      ;(ru.uSolid!.value as THREE.Vector2).x = smooth(dove / look.rings.shadeSolid[1])
      const soft = smooth(dove / look.rings.shadeSolid[1]) * (1 - poseW.value) * (1 - close.value)
      ;(ru.uPenumbra!.value as THREE.Vector3).set(THREE.MathUtils.lerp(look.rings.penumbra[0], look.rings.penumbraAway[0], soft), THREE.MathUtils.lerp(look.rings.penumbra[1], look.rings.penumbraAway[1], soft), THREE.MathUtils.lerp(look.rings.penumbra[2], look.rings.penumbraAway[2], soft))
      ru.uTime!.value = elapsed
      ru.uSpinRate!.value = spinRate
      ru.uVignette!.value = shot.post.vignette
      ru.uAspect!.value = aspect
      // The floor under the evened ring light (rings.ts, evenInverse): only in frames larger than the 1080p master, where single
      // ring strands came out teal. At 1080p and below it is 0 and the approved picture is drawn as before.
      ru.uEvenFloor!.value = frameUniform.value > 1 ? 0.75 : 0
      ;(ru.uSkimFit!.value as THREE.Vector4).w = Math.max(ru.uGrad!.value as number, look.rings.skimFoot)
      const hazeW = (1 - smooth((away - look.shellRange[0]) / (look.shellRange[1] - look.shellRange[0]))) * near
      ;(su.uHazeTwilight!.value as THREE.Vector3).fromArray(look.shell.twilight).multiplyScalar(1 - hazeW)
      ;(su.uHazeDay!.value as THREE.Vector3).fromArray(look.shell.day).multiply(dayTone.set(1, 1, 1).lerp(shellSkim, hazeW))
      su.uHazeH!.value = THREE.MathUtils.lerp(look.shell.scaleHeight, look.shellSkimDepth[0], hazeW)
      su.uHazeTau!.value = THREE.MathUtils.lerp(look.shell.depth, look.shellSkimDepth[1], hazeW)
      ;(gu.uRimNight!.value as THREE.Vector4).fromArray(look.globe.rimNight).multiplyScalar(1 - hazeW).setW(look.globe.rimNight[3])
      const parted = smooth((away - look.skimAway[0]) / (look.skimAway[1] - look.skimAway[0]))
      ;(ru.uSkimFit!.value as THREE.Vector4).x = THREE.MathUtils.lerp(look.rings.skimEdge[0], look.rings.skimEdge[1], parted)
      ru.uSkimNear!.value = 1 - parted
      ;(ru.uApronFit!.value as THREE.Vector4).w = look.rings.apronShow * (1 - smooth((away - look.rings.apronAway[0]) / (look.rings.apronAway[1] - look.rings.apronAway[0])))
      ;(ru.uSkimCam!.value as THREE.Vector3).copy(skimL)
      const swing = THREE.MathUtils.radToDeg(joinA.copy(skimJoin).sub(skimL).angleTo(joinB.copy(skimJoin).sub(camL)))
      ru.uSkimPart!.value = smooth((swing - look.skimSwing[0]) / (look.skimSwing[1] - look.skimSwing[0]))
      ;(ru.uSkimUnder!.value as THREE.Vector4).fromArray(look.skimUnder)
      ru.uSkimGap!.value = smooth((swing - look.skimGap[0]) / (look.skimGap[1] - look.skimGap[0]))
      ;(ru.uSkimFill!.value as THREE.Vector3).fromArray(look.skimFill)
      ;(layout.uLayCam!.value as THREE.Vector4).set(skimL.x / wide, skimL.y / tall, skimL.z / wide, 1 / wide)
      ;(layout.uLayEye!.value as THREE.Vector4).set(camS.x, camS.y, camS.z, skimL.x * skimJoin.z - skimL.z * skimJoin.x < 0 ? -1 : 1)
      ;(layout.uLayEdge!.value as THREE.Vector2).fromArray(look.layEdge)
      ;(layout.uLayFill!.value as THREE.Vector4).set(ru.uSkimGap!.value * look.layFill[0], 1 - look.layFill[1], look.layFill[2], look.layFill[3])

      const iu = ice.material.uniforms
      const iceW = (1 - smooth((Math.abs(camL.y) - look.ice.heightRange[0]) / (look.ice.heightRange[1] - look.ice.heightRange[0]))) * near
      ice.mesh.visible = iceW > 0 && camL.y * sunL.y > 0
      ;(iu.uCamL!.value as THREE.Vector3).copy(camL)
      ;(iu.uShadowL!.value as THREE.Vector3).copy(shadowL)
      ;(iu.uView!.value as THREE.Vector2).set(view.format.width, view.format.height)
      iu.uGain!.value = gain * state.weight * iceW

      const ku = streak.material.uniforms
      const half = Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2)
      ;(ku.uTan!.value as THREE.Vector2).set(half * view.format.width / view.format.height, half)
      ku.uGain!.value = gain * state.weight * poseW.value * look.streak.gain * (1 - smooth(dove / look.streak.fade))
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
      tu.uEdgePx!.value = look.titan.edgePx * foot

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
      streak.dispose()
      far.dispose()
    },
  }
}
