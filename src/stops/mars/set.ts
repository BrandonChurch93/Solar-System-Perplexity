import * as THREE from 'three'
import { HazeShell } from '../../bodies/haze'
import { MoonBody } from '../../bodies/moonbody'
import { Planet } from '../../bodies/planet'
import type { SetContext, SetFactory, SkyPatch, ViewKind } from '../../core/types'
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
  const map = await ctx.texture(base + 'wrap-color.jpg', { srgb: true, anisotropy: 16, repeat: true })
  const stormMask = await ctx.texture(base + 'wrap-storm.png', { srgb: false, repeat: true })
  const wrapHeight = ctx.floatTexture(await heights(ctx, base + 'wrap-height.bin', sizes.height[0], sizes.height[1]), sizes.height[0], sizes.height[1], true)
  const patchTextures: THREE.Texture[] = []
  for (const level of patches.levels) patchTextures.push(await ctx.texture(base + level.file, { srgb: true, anisotropy: 16 }))

  const planet = new Planet({
    map, mapWidth: (map.image as unknown as { width: number }).width, height: wrapHeight, heightWidth: sizes.height[0], light: look.light, haze: look.haze,
    patches: { textures: patchTextures, widthsDeg: patches.levels.map((l) => l.widthDeg), spot: direction(patches.spot.lon, patches.spot.lat), feather: patches.feather, fade: patches.fade, nearDeg: patches.nearDeg },
    storm: { mask: stormMask, axis: direction(wrap.storm.lon, wrap.storm.lat), radius: THREE.MathUtils.degToRad(wrap.storm.radiusDeg) },
  })
  planet.mesh.quaternion.fromArray(fit.globe.quaternion)
  planet.mesh.scale.fromArray(fit.globe.scale)
  const shell = new HazeShell(look.shellHaze, diagUniform)
  const halo = new HazeShell(look.haloHaze, diagUniform)
  halo.mesh.renderOrder = 4
  const glint = new HazeShell(look.glintHaze, diagUniform)
  glint.mesh.renderOrder = 4
  orbit.add(planet.mesh, shell.mesh, halo.mesh, glint.mesh)

  const moonSizes = phobos.sets[key]
  const moonHeights = await heights(ctx, base + 'phobos-height.bin', moonSizes.heightSize[0]!, moonSizes.heightSize[1]!)
  const moonMap = await ctx.texture(base + 'phobos-color.jpg', { srgb: true, anisotropy: 16, repeat: true })
  const moonLit = await ctx.texture(base + 'phobos-lit.jpg', { srgb: true, anisotropy: 16, repeat: true })
  const moonLitMask = await ctx.texture(base + 'phobos-lit-mask.png', { srgb: false, repeat: true })
  const moon = new MoonBody({
    lit: { map: moonLit, mask: moonLitMask },
    map: moonMap, mapWidth: moonSizes.colorSize[0]!, height: ctx.floatTexture(moonHeights, moonSizes.heightSize[0]!, moonSizes.heightSize[1]!, true), heights: moonHeights,
    heightSize: [moonSizes.heightSize[0]!, moonSizes.heightSize[1]!], lo: phobos.lo, hi: phobos.hi, radius: phobos.radius, gain: look.moon.gain, ambient: look.moon.ambient, bounce: look.moon.bounce, sun: look.moon.sun, bump: look.moon.bump, power: look.moon.power, rim: look.moon.rim,
  })
  orbit.add(moon.mesh)
  const moonHome = new THREE.Vector3().fromArray(phobos.center)
  const moonHold = new THREE.Quaternion().fromArray(phobos.holdQuaternion)
  const tumbleAxis = new THREE.Vector3().fromArray(phobos.tumbleAxis).normalize()

  const far = new FarPoint()
  orbit.add(far.points)

  const ground = await Relief.load(ctx, base, reliefDefs[key], look.relief)
  terrain.add(ground.group)
  const terrainMid = (plan.seg.terrain.start + plan.seg.terrain.end) / 2

  const tintLow = new THREE.Vector3().fromArray(look.descent.tint)
  const hazeLow = new THREE.Vector3().fromArray(look.descent.hazeDay)
  const shellLow = new THREE.Vector3().fromArray(look.descent.shellDay)
  const edgeLow = new THREE.Vector2().fromArray(look.descent.edge)
  const edge = new THREE.Vector2()
  const light = new THREE.Vector3()
  const glow = new THREE.Vector3()
  const holdTurn = plan.hold(plan.holdMid - plan.seg.hold.start).quaternion
  const glowHome = new THREE.Vector3().fromArray(look.haloDir).normalize().applyQuaternion(holdTurn)
  const glintHome = new THREE.Vector3().fromArray(look.glintDir).normalize().applyQuaternion(holdTurn)
  const camera = new THREE.Vector3()
  const bounce = new THREE.Vector3()
  const turn = new THREE.Quaternion()
  const moonWorld = new THREE.Quaternion()
  const moonLight = new THREE.Vector3()

  const sky: SkyPatch[] = []
  for (const [view, def] of Object.entries(skyJson)) {
    const t = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2)
    sky.push({ view: view as ViewKind, texture: await ctx.texture(base + def.file, { srgb: true, anisotropy: 4 }), aim: new THREE.Quaternion().fromArray(skyFrame.patches.mars[view as ViewKind]), tan: [t * 16 / 9, t], gain: def.gain, add: def.add, ring: def.ring as [number, number, number, number], edge: def.edge })
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
      planet.material.uniforms.uStormAngle!.value = (wrap.storm.counterclockwise ? -1 : 1) * THREE.MathUtils.degToRad(look.storm.degPerSecond) * Math.min(Math.max(elapsed, -12), 12)
      const d = look.descent
      const low = ending ? 0 : 1 - smooth((Math.log(Math.max(camera.length() - 1, 1e-4)) - Math.log(d.low)) / (Math.log(d.high) - Math.log(d.low)))
      const pu = planet.material.uniforms
      ;(pu.uTint!.value as THREE.Vector3).set(1, 1, 1).lerp(tintLow, low)
      ;(pu.uHazeDay!.value as THREE.Vector3).fromArray(look.haze.day).lerp(hazeLow, low)
      pu.uHazeTau!.value = look.haze.depth * (1 + (d.hazeDepth - 1) * low)
      const su = shell.material.uniforms
      ;(su.uHazeDay!.value as THREE.Vector3).fromArray(look.shellHaze.day).lerp(shellLow, low)
      su.uHazeTau!.value = look.shellHaze.depth * (1 + (d.shellDepth - 1) * low)
      edge.set(look.haze.dayFrom ?? -0.16, look.haze.dayTo ?? 0.34).lerp(edgeLow, low)
      ;(pu.uHazeEdge!.value as THREE.Vector2).copy(edge)
      ;(su.uHazeEdge!.value as THREE.Vector2).set(look.shellHaze.dayFrom ?? -0.16, look.shellHaze.dayTo ?? 0.34).lerp(edgeLow, low)
      planet.update(camera, light, plan.spin(state.time), gain, state.weight)
      pu.uVignette!.value = shot.post.vignette * (1 - low)
      pu.uAspect!.value = view.format.width / view.format.height
      ;(shell.material.uniforms.uCam!.value as THREE.Vector3).copy(camera)
      ;(shell.material.uniforms.uSunW!.value as THREE.Vector3).copy(light)
      shell.material.uniforms.uGain!.value = gain * state.weight
      ;(halo.material.uniforms.uCam!.value as THREE.Vector3).copy(camera)
      glow.copy(glowHome).applyQuaternion(state.rotation)
      ;(halo.material.uniforms.uSunW!.value as THREE.Vector3).copy(glow)
      halo.material.uniforms.uGain!.value = gain * state.weight * (1 - low)
      ;(glint.material.uniforms.uCam!.value as THREE.Vector3).copy(camera)
      glow.copy(glintHome).applyQuaternion(state.rotation)
      ;(glint.material.uniforms.uSunW!.value as THREE.Vector3).copy(glow)
      glint.material.uniforms.uGain!.value = gain * state.weight * (1 - low)
      turn.setFromAxisAngle(plan.axis, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * elapsed)
      moon.mesh.position.copy(moonHome).applyQuaternion(turn)
      moon.mesh.quaternion.setFromAxisAngle(tumbleAxis, THREE.MathUtils.degToRad(look.moon.tumbleDegPerSecond) * elapsed).multiply(moonHold)
      moonWorld.copy(state.rotation).multiply(moon.mesh.quaternion)
      bounce.copy(moon.mesh.position).negate().normalize().applyQuaternion(state.rotation)
      moonLight.fromArray(look.moon.sunBias).applyQuaternion(state.rotation).add(light).normalize()
      moon.update(moonLight, bounce, moonWorld, gain * state.weight, shot.post.vignette, view.format.width / view.format.height)
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
