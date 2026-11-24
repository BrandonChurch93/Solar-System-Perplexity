import * as THREE from 'three'
import { HazeShell } from '../../bodies/haze'
import { MoonBody } from '../../bodies/moonbody'
import { Planet } from '../../bodies/planet'
import type { SetContext, SetFactory, SkyPatch, TextureOptions, ViewKind } from '../../core/types'
import { diagUniform } from '../../diagnostics/diag'
import { smooth } from '../../director/rig'
import { FarPoint } from '../../bodies/farpoint'
import { Relief } from '../../terrain/relief'
import { patches, relief as reliefDefs, wrap } from './assets'
import * as look from './look'
import phobos from './phobos.json'
import { plan } from './plan'
import skyFrame from '../../space/skyframe.json'
import skyJson from './sky.json'
import nearJson from './near.json'
import { handoverOf } from '../../director/handover'
import { heightTexture } from '../../core/sets'
import country from './country.json'
import capJson from './cap.json'
import closeJson from './close.json'

function direction(lonDeg: number, latDeg: number): THREE.Vector3 {
  const lon = THREE.MathUtils.degToRad(lonDeg)
  const lat = THREE.MathUtils.degToRad(latDeg)
  return new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon))
}

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
  const base = 'mars/' + ctx.assets + '/'
  const fit = plan.fit
  const world = new THREE.Group()
  const orbit = new THREE.Group()
  const terrain = new THREE.Group()
  world.add(orbit, terrain)

  const sizes = wrap.sets[key]
  const single = (file: string, options: TextureOptions): TextureOptions => (patches.oneChannel.includes(file) ? ({ ...options, channels: 1 } as TextureOptions) : options)
  const lean: SetContext = { ...ctx, texture: (path, options = {}) => ctx.texture(path, single(path.slice(path.lastIndexOf('/') + 1), options)) }
  const map = await ctx.texture(base + 'wrap-color.jpg', { srgb: true, anisotropy: 16, repeat: true })
  const stormMask = await lean.texture(base + 'wrap-storm.png', { srgb: false, repeat: true })
  const wrapHeight = ctx.floatTexture(await heights(ctx, base + 'wrap-height.bin', sizes.height[0], sizes.height[1]), sizes.height[0], sizes.height[1], true)
  const patchTextures: THREE.Texture[] = []
  for (const level of patches.levels) patchTextures.push(await ctx.texture(base + level.file, { srgb: true, anisotropy: 16 }))

  const capLevels = []
  for (const l of country.levels) {
    const size = l.size[key]
    capLevels.push({ height: heightTexture(ctx, new Uint16Array(await ctx.buffer(base + l.height)), size), size, widthDeg: l.widthDeg, low: l.low, high: l.high })
  }
  const planet = new Planet({
    map, mapWidth: (map.image as unknown as { width: number }).width, height: wrapHeight, heightWidth: sizes.height[0], light: look.light, haze: { ...look.haze, glow: true }, grazing: look.grazing,
    cap: { levels: capLevels, border: capJson.border as [number, number], from: capJson.from as [number, number], cells: capJson.cells, pixel: THREE.MathUtils.degToRad(60) / 1080, fine: capJson.fine, reachDeg: capJson.reachDeg, feather: patches.feather, fade: patches.fade, light: capJson.light },
    patches: { textures: patchTextures, widthsDeg: patches.levels.map((l) => l.widthDeg), spot: direction(patches.spot.lon, patches.spot.lat), feather: patches.feather, fade: patches.fade, nearDeg: patches.nearDeg,
      ...(patches.levels.some((l) => l.own) ? { own: patches.levels.map((l) => l.own === true), ownGain: true } : {}), ...(patches.fadeMinor ? { fadeMinor: true } : {}) },
    storm: { mask: stormMask, axis: direction(wrap.storm.lon, wrap.storm.lat), radius: THREE.MathUtils.degToRad(wrap.storm.radiusDeg) },
  })
  const globeFit = new THREE.Quaternion().fromArray(fit.globe.quaternion)
  planet.mesh.quaternion.copy(globeFit)
  planet.mesh.scale.fromArray(fit.globe.scale)
  const shell = new HazeShell({ ...look.shellHaze, glow: true }, diagUniform)
  const halo = new HazeShell(look.haloHaze, diagUniform)
  halo.mesh.renderOrder = 4
  const glint = new HazeShell(look.glintHaze, diagUniform)
  glint.mesh.renderOrder = 4
  orbit.add(planet.mesh, shell.mesh, halo.mesh, glint.mesh)

  const moonSizes = phobos.sets[key]
  const moonHeights = await heights(ctx, base + 'phobos-height.bin', moonSizes.heightSize[0]!, moonSizes.heightSize[1]!)
  const moonMap = await ctx.texture(base + 'phobos-color.jpg', { srgb: true, anisotropy: 16, repeat: true })
  const moonLit = await ctx.texture(base + 'phobos-lit.jpg', { srgb: true, anisotropy: 16, repeat: true })
  const moonLitMask = await lean.texture(base + 'phobos-lit-mask.png', { srgb: false, repeat: true })
  const moon = new MoonBody({
    lit: { map: moonLit, mask: moonLitMask },
    map: moonMap, mapWidth: moonSizes.colorSize[0]!, height: ctx.floatTexture(moonHeights, moonSizes.heightSize[0]!, moonSizes.heightSize[1]!, true), heights: moonHeights,
    heightSize: [moonSizes.heightSize[0]!, moonSizes.heightSize[1]!], lo: phobos.lo, hi: phobos.hi, radius: phobos.radius, gain: look.moon.gain, ambient: look.moon.ambient, bounce: look.moon.bounce, sun: look.moon.sun, bump: look.moon.bump, power: look.moon.power, rim: look.moon.rim,
  })
  orbit.add(moon.mesh)
  const moonHome = new THREE.Vector3().fromArray(phobos.center)
  const moonHold = new THREE.Quaternion().fromArray(phobos.holdQuaternion)
  const tumbleAxis = new THREE.Vector3().fromArray(phobos.tumbleAxis).normalize()
  // the baked lit side of the moon is the hero's light as the hold's eye saw it: it goes with the angle at the moon
  // between the eye and that eye, in the moon's own frame (phobos.json lit), and the moon's own light takes over
  const moonHoldEye = plan.hold(plan.holdMid - plan.seg.hold.start).position.clone().sub(moonHome).applyQuaternion(moonHold.clone().invert()).normalize()
  const moonEye = new THREE.Vector3()
  const moonTurn = new THREE.Quaternion()

  const far = new FarPoint()
  orbit.add(far.points)

  const ground = await Relief.load(lean, base, reliefDefs[key], look.relief)
  terrain.add(ground.group)
  // the share of the close view's ground is the set's to give (close.json): asked once here so its shader is built with the others
  ground.presence(1)
  // In the globe's scene the close ground stands in front of the globe's own ground of the same place (the cap), which holds a made
  // ground where the close view's eye saw none: the depth is cleared between the close view's air and its meshes, so the meshes are
  // tested against each other only and the air, tested against the globe, lies on the sky alone. The whole of it is drawn after the
  // globe's halo, glint and shell: the thin rim of the far mesh writes depth and would cut the shell at the limb behind it.
  // The close view itself keeps its order.
  const closeAir = ground.group.children.find((o) => o.renderOrder === -1) as THREE.Mesh | undefined
  const closeDepth = new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3)), new THREE.MeshBasicMaterial({ colorWrite: false, depthTest: false, depthWrite: false, transparent: true }))
  closeDepth.frustumCulled = false
  closeDepth.renderOrder = -0.5
  closeDepth.visible = false
  closeDepth.onBeforeRender = (renderer) => renderer.clearDepth()
  ground.group.add(closeDepth)
  const closeScene = (on: boolean): void => {
    closeDepth.visible = on
    ground.group.renderOrder = on ? 10 : 0
    if (closeAir) (closeAir.material as THREE.Material).depthTest = on
  }
  const terrainMid = (plan.seg.terrain.start + plan.seg.terrain.end) / 2
  let eyeScaled = false

  const tintLow = new THREE.Vector3().fromArray(look.descent.tint)
  const hazeLow = new THREE.Vector3().fromArray(look.descent.hazeDay)
  const shellLow = new THREE.Vector3().fromArray(look.descent.shellDay)
  const shellTwilightLow = new THREE.Vector3().fromArray(look.descent.shellTwilight)
  const edgeLow = new THREE.Vector2().fromArray(look.descent.edge)
  const edge = new THREE.Vector2()
  // the glow of the close view's low Sun, as a direction in the stop's frame: from the twin of the dive at T
  const glowGround = new THREE.Vector3(1, 0, 0)
  const glowShell = new THREE.Vector3(1, 0, 0)
  const glowWorld = new THREE.Vector3()
  const ownGain: [number, number, number] = [1, 1, 1]
  const hasOwn = patches.levels.some((l) => l.own)
  const diveT = handoverOf(plan.id, 'dive')?.time
  if (diveT !== undefined) {
    const twin = plan.twin(plan.closePose('dive', diveT), diveT)
    const up = twin.position.clone().normalize()
    const ahead = new THREE.Vector3(0, 0, -1).applyQuaternion(twin.quaternion)
    ahead.addScaledVector(up, -ahead.dot(up)).normalize()
    const right = new THREE.Vector3().crossVectors(ahead, up)
    const aim = (out: THREE.Vector3, lobe: { rightDeg: number; upDeg: number }): void => {
      const a = THREE.MathUtils.degToRad(lobe.rightDeg)
      const e = THREE.MathUtils.degToRad(lobe.upDeg)
      out.copy(ahead).multiplyScalar(Math.cos(a)).addScaledVector(right, Math.sin(a)).multiplyScalar(Math.cos(e)).addScaledVector(up, Math.sin(e)).normalize()
    }
    aim(glowGround, nearJson.glow.ground)
    aim(glowShell, nearJson.glow.shell)
  }
  const light = new THREE.Vector3()
  const glow = new THREE.Vector3()
  const holdPose = plan.hold(plan.holdMid - plan.seg.hold.start)
  const holdTurn = holdPose.quaternion
  const holdDirection = new THREE.Vector3()
  const grazingHome = new THREE.Vector3().fromArray(look.grazing.highlightDir).normalize().applyQuaternion(holdTurn)
  const grazingSide = new THREE.Vector3().fromArray(look.grazing.sideDir).normalize().applyQuaternion(holdTurn)
  const shellHome = new THREE.Vector3().fromArray(look.shellDir).normalize().applyQuaternion(holdTurn)
  const glowHome = new THREE.Vector3().fromArray(look.haloDir).normalize().applyQuaternion(holdTurn)
  const glintHome = new THREE.Vector3().fromArray(look.glintDir).normalize().applyQuaternion(holdTurn)
  const haloCoreHome = new THREE.Vector3().fromArray(look.haloCoreDir).normalize().applyQuaternion(holdTurn)
  const glintCoreHome = new THREE.Vector3().fromArray(look.glintCoreDir).normalize().applyQuaternion(holdTurn)
  const camera = new THREE.Vector3()
  const bounce = new THREE.Vector3()
  const turn = new THREE.Quaternion()
  const moonWorld = new THREE.Quaternion()
  const moonLight = new THREE.Vector3()

  const sky: SkyPatch[] = []
  for (const [view, def] of Object.entries(skyJson)) {
    const wide = 1 + 2 * def.margin
    const t = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2) * wide
    sky.push({ view: view as ViewKind, texture: await ctx.texture(base + def.file, { srgb: true, mips: false, anisotropy: 1 }), aim: new THREE.Quaternion().fromArray(skyFrame.patches.mars[view as ViewKind]), tan: [t * 16 / 9, t], gain: def.gain, add: def.add, ring: def.ring as [number, number, number, number], edge: def.margin / wide, unfold: def.unfold as [number, number] })
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
      // The relief builds its shader for a scaled group the first time it is updated under a scale (src/terrain/relief.ts, the eye of the
      // valley mist). Asked for on the first update of the set, so that it is built with the others and every frame, alone or in a run,
      // is drawn by the one shader. The scale is put back at once; each branch below sets its own.
      if (!eyeScaled) {
        eyeScaled = true
        terrain.scale.setScalar(2)
        ground.update(0, gain, shot.post.vignette, view)
        terrain.scale.setScalar(1)
      }
      if (!inOrbit) {
        terrain.position.set(0, 0, 0)
        terrain.quaternion.identity()
        terrain.scale.setScalar(1)
        closeScene(false)
        ground.presence(1)
        ground.update(state.time - terrainMid, gain, shot.post.vignette, view)
        return
      }
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      light.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      camera.copy(world.position).negate()
      planet.cap?.setPixel(THREE.MathUtils.degToRad(view.camera.fov) / 1080)
      const elapsed = state.time - plan.holdMid
      planet.material.uniforms.uStormAngle!.value = (wrap.storm.counterclockwise ? -1 : 1) * THREE.MathUtils.degToRad(look.storm.degPerSecond) * Math.min(Math.max(elapsed, -12), 12)
      const d = look.descent
      const low = ending ? 0 : 1 - smooth((Math.log(Math.max(camera.length() - 1, 1e-4)) - Math.log(d.low)) / (Math.log(d.high) - Math.log(d.low)))
      const pu = planet.material.uniforms
      ;(pu.uTint!.value as THREE.Vector3).set(1, 1, 1).lerp(tintLow, low)
      ;(pu.uHazeDay!.value as THREE.Vector3).fromArray(look.haze.day).lerp(hazeLow, low)
      pu.uHazeTau!.value = look.haze.depth * (1 + (d.hazeDepth - 1) * low)
      ;(pu.uGrazingShape!.value as THREE.Vector4).x = look.grazing.depth * (1 - low)
      const detail = look.obliqueDetail
      const offAxis = THREE.MathUtils.radToDeg(camera.angleTo(holdDirection.copy(holdPose.position).applyQuaternion(state.rotation)))
      const wide = smooth((offAxis - detail.viewFromDeg) / (detail.viewToDeg - detail.viewFromDeg))
      ;(pu.uGrazingDetail!.value as THREE.Vector4).set(
        THREE.MathUtils.lerp(look.grazing.detailFrom, detail.muFrom, wide),
        THREE.MathUtils.lerp(look.grazing.detailTo, detail.muTo, wide),
        look.grazing.detailBlur, 1 - low,
      )
      ;(pu.uGrazingSun!.value as THREE.Vector3).copy(grazingHome).applyQuaternion(state.rotation)
      ;(pu.uGrazingSide!.value as THREE.Vector3).copy(grazingSide).applyQuaternion(state.rotation)
      const su = shell.material.uniforms
      ;(su.uHazeDay!.value as THREE.Vector3).fromArray(look.shellHaze.day).lerp(shellLow, low)
      ;(su.uHazeTwilight!.value as THREE.Vector3).fromArray(look.shellHaze.twilight).lerp(shellTwilightLow, low)
      su.uHazeH!.value = THREE.MathUtils.lerp(look.shellHaze.scaleHeight, d.shellScaleHeight, low)
      su.uHazeTau!.value = THREE.MathUtils.lerp(look.shellHaze.depth, d.shellBaseDepth * d.shellDepth, low)
      edge.set(look.haze.dayFrom ?? -0.16, look.haze.dayTo ?? 0.34).lerp(edgeLow, low)
      ;(pu.uHazeEdge!.value as THREE.Vector2).copy(edge)
      ;(su.uHazeEdge!.value as THREE.Vector2).set(look.shellHaze.dayFrom ?? -0.16, look.shellHaze.dayTo ?? 0.34).lerp(edgeLow, low)
      const n = nearJson
      const near = ending || diveT === undefined ? 0 : 1 - smooth((Math.log(Math.max(camera.length() - 1, 1e-5)) - Math.log(n.low)) / (Math.log(n.high) - Math.log(n.low)))
      const mix = (v: THREE.Vector3, by: number[]): void => { v.set(v.x * (1 + (by[0]! - 1) * near), v.y * (1 + (by[1]! - 1) * near), v.z * (1 + (by[2]! - 1) * near)) }
      mix(pu.uTint!.value as THREE.Vector3, n.tint)
      mix(pu.uHazeDay!.value as THREE.Vector3, n.hazeDay)
      mix(su.uHazeDay!.value as THREE.Vector3, n.shellDay)
      mix(su.uHazeTwilight!.value as THREE.Vector3, n.shellTwilight)
      pu.uHazeTau!.value *= 1 + (n.hazeDepth - 1) * near
      su.uHazeTau!.value *= 1 + (n.shellDepth - 1) * near
      su.uHazeH!.value *= 1 + (n.shellScaleHeight - 1) * near
      pu.uHazeH!.value = look.haze.scaleHeight * (1 + (n.hazeScaleHeight - 1) * near)
      const gg = n.glow.ground
      const gs = n.glow.shell
      planet.setGlow(glowWorld.copy(glowGround).applyQuaternion(state.rotation), [gg.colour[0]! * near, gg.colour[1]! * near, gg.colour[2]! * near], gg.power)
      shell.setGlow(glowWorld.copy(glowShell).applyQuaternion(state.rotation), [gs.colour[0]! * near, gs.colour[1]! * near, gs.colour[2]! * near], gs.power)
      // the own levels carry the look of the place at T; on the way down the lit levels round them change with the
      // descent look, and the close view of the rise is lit brighter than that of the dive: a gain by height
      const table = state.time > terrainMid ? n.ownGain.rise : n.ownGain.dive
      const height = Math.log(Math.max(camera.length() - 1, 1e-5))
      ownGain[0] = ownGain[1] = ownGain[2] = 1
      if (!ending && diveT !== undefined) {
        let i = 0
        while (i < table.length - 2 && height < Math.log(table[i + 1]!.height)) i++
        const a = table[i]!
        const b = table[i + 1]!
        const k = Math.min(Math.max((Math.log(a.height) - height) / (Math.log(a.height) - Math.log(b.height)), 0), 1)
        // a lit level is multiplied with the descent tint, 1 high up and descent.tint near the ground, where the plates
        // were made: the own levels follow it by tintFollow
        // and the tint of near.json the same way: the plates hold the look at the height of the place picture
        for (let c = 0; c < 3; c++) ownGain[c] = (a.gain[c]! + (b.gain[c]! - a.gain[c]!) * k) * (1 + n.ownGain.tintFollow * ((1 + (d.tint[c]! - 1) * low) / d.tint[c]! - 1)) * ((1 + (n.tint[c]! - 1) * near) / n.tint[c]!)
      }
      if (hasOwn) planet.setOwnGain(ownGain)
      // The body's turn goes into the mesh, in double precision, and the planet is handed what is left of the spin, by the eye's height
      // (close.json turn). The planet's and the cap's programs turn by the cos and sin the graphics card gives them, and those are not of
      // length 1 together: at the dive's change of view the cap stood 0.00015 radii under its place, at the rise's 0.00020, against the
      // close view's own ground in the same frame (PLACE-NOTES, 24 November 10:40). Above turn.high the card turns the body as before.
      const tj = closeJson.turn
      const onMesh = 1 - smooth((Math.log(Math.max(camera.length() - 1, 1e-5)) - Math.log(tj.low)) / (Math.log(tj.high) - Math.log(tj.low)))
      const spin = plan.spin(state.time)
      if (onMesh > 0) planet.mesh.quaternion.setFromAxisAngle(plan.axis, spin * onMesh).multiply(globeFit)
      else planet.mesh.quaternion.copy(globeFit)
      planet.update(camera, light, spin * (1 - onMesh), gain, state.weight)
      pu.uVignette!.value = shot.post.vignette * (1 - low)
      pu.uAspect!.value = view.format.width / view.format.height
      ;(shell.material.uniforms.uCam!.value as THREE.Vector3).copy(camera)
      ;(shell.material.uniforms.uSunW!.value as THREE.Vector3).copy(shellHome).applyQuaternion(state.rotation).lerp(light, Math.max(low, lit)).normalize()
      shell.material.uniforms.uGain!.value = gain * state.weight
      ;(halo.material.uniforms.uCam!.value as THREE.Vector3).copy(camera)
      glow.copy(glowHome).applyQuaternion(state.rotation)
      ;(halo.material.uniforms.uSunW!.value as THREE.Vector3).copy(glow)
      ;(halo.material.uniforms.uCoreSun!.value as THREE.Vector3).copy(haloCoreHome).applyQuaternion(state.rotation)
      halo.material.uniforms.uGain!.value = gain * state.weight * (1 - low)
      ;(glint.material.uniforms.uCam!.value as THREE.Vector3).copy(camera)
      glow.copy(glintHome).applyQuaternion(state.rotation)
      ;(glint.material.uniforms.uSunW!.value as THREE.Vector3).copy(glow)
      ;(glint.material.uniforms.uCoreSun!.value as THREE.Vector3).copy(glintCoreHome).applyQuaternion(state.rotation)
      glint.material.uniforms.uGain!.value = gain * state.weight * (1 - low)
      turn.setFromAxisAngle(plan.axis, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * elapsed)
      moon.mesh.position.copy(moonHome).applyQuaternion(turn)
      moon.mesh.quaternion.setFromAxisAngle(tumbleAxis, THREE.MathUtils.degToRad(look.moon.tumbleDegPerSecond) * elapsed).multiply(moonHold)
      moonWorld.copy(state.rotation).multiply(moon.mesh.quaternion)
      moonEye.copy(camera).applyQuaternion(moonTurn.copy(state.rotation).invert()).sub(moon.mesh.position).applyQuaternion(moonTurn.copy(moon.mesh.quaternion).invert()).normalize()
      moon.material.uniforms.uLitOn!.value = 1 - smooth((THREE.MathUtils.radToDeg(moonEye.angleTo(moonHoldEye)) - phobos.lit.fromDeg) / (phobos.lit.toDeg - phobos.lit.fromDeg))
      bounce.copy(moon.mesh.position).negate().normalize().applyQuaternion(state.rotation)
      moonLight.fromArray(look.moon.sunBias).applyQuaternion(state.rotation).add(light).normalize()
      moon.update(moonLight, bounce, moonWorld, gain * state.weight, shot.post.vignette, view.format.width / view.format.height)
      // the close view's own ground in the globe's scene (close.json): at its true place through the twin, there by the eye's height
      const moving = !ending && state.segment.stop === plan.id && (state.segment.kind === 'dive' || state.segment.kind === 'rise')
      const c = closeJson.presence
      const there = moving ? 1 - smooth((Math.log(Math.max(camera.length() - 1, 1e-5)) - Math.log(c.low)) / (Math.log(c.high) - Math.log(c.low))) : 0
      terrain.visible = there > 0
      // the globe's own air leaves as the close view's air comes: one share by the height
      shell.material.uniforms.uGain!.value = gain * state.weight * (1 - there)
      if (there > 0) {
        const f = plan.twinFrame(state.time)
        terrain.position.copy(f.origin)
        terrain.quaternion.copy(f.rotation)
        terrain.scale.setScalar(f.scale)
        closeScene(true)
        ground.presence(there)
        ground.update(state.time - terrainMid, gain, shot.post.vignette, view)
      }
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      const visible = radiusPx > 0.6
      planet.mesh.visible = visible
      shell.mesh.visible = visible
      halo.mesh.visible = visible && low < 1
      glint.mesh.visible = visible && low < 1
      moon.mesh.visible = visible
      far.update(radiusPx, view, plan.p.tint, gain)
    },
    dispose: () => {
      planet.dispose()
      shell.dispose()
      halo.dispose()
      glint.dispose()
      moon.dispose()
      far.dispose()
      ground.dispose()
    },
  }
}
