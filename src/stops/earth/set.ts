import * as THREE from 'three'
import { coverWindow } from '../../director/timeline'
import { FarPoint } from '../../bodies/farpoint'
import type { SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { config } from '../../config'
import { diagUniform } from '../../diagnostics/diag'
import { smooth } from '../../director/rig'
import { Air } from './air'
import { Aurora } from './aurora'
import { patches } from './assets'
import { Veil, type Deck } from './veil'
import { Globe, direction } from './globe'
import { Moon } from './moon'
import { Ground, type GroundDef } from './relief'
import reliefJson from './relief.json'
import * as look from './look'
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

  const globe = new Globe({
    map, mapWidth: (map.image as unknown as { width: number }).width, cloud, emissive, far: farMap, farCloud, look: look.globe,
    sunHold: plan.lightDir.clone().applyQuaternion(new THREE.Quaternion().fromArray(fit.globe.quaternion).invert()),
    patches: { textures: patchTextures, widthsDeg: patches.levels.map((l) => l.widthDeg), spot: direction(patches.spot.lon, patches.spot.lat), feather: patches.feather, fade: patches.fade },
  })
  globe.mesh.quaternion.fromArray(fit.globe.quaternion)
  globe.mesh.scale.fromArray(fit.globe.scale)
  const glow = await ctx.texture(base + 'air-glow.png', { srgb: false, mips: false, repeat: true, flipY: false })
  const curtain = new Aurora(look.aurora, await ctx.texture(base + 'aurora.webp', { srgb: true, anisotropy: 4 }))
  const air = new Air(look.air, glow, diagUniform, curtain)
  const shape = new THREE.Group()
  const m = look.shape
  shape.matrixAutoUpdate = false
  shape.matrix.set(m[0]![0]!, m[0]![1]!, m[0]![2]!, 0, m[1]![0]!, m[1]![1]!, m[1]![2]!, 0, m[2]![0]!, m[2]![1]!, m[2]![2]!, 0, 0, 0, 0, 1)
  const unshape = new THREE.Matrix3().setFromMatrix4(shape.matrix).invert()
  shape.add(globe.mesh, air.mesh)
  orbit.add(shape)
  const tilt = new THREE.Quaternion().fromArray(fit.globe.quaternion)
  const untilt = tilt.clone().invert()
  const upAxis = new THREE.Vector3(0, 1, 0)

  const moonMap = await ctx.texture(base + 'moon-color.jpg', { srgb: true, anisotropy: 8, repeat: true })
  const moonLit = await ctx.texture(base + 'moon-lit.webp', { srgb: true, anisotropy: 8, repeat: true })
  const moon = new Moon(look.moon, moonMap, moonLit)
  orbit.add(moon.mesh)

  const far = new FarPoint()
  orbit.add(far.points)

  const veil = new Veil(diagUniform)
  world.add(veil.mesh)

  const ground = await Ground.load(ctx, base, reliefJson as GroundDef, look.ground)
  terrain.add(ground.group)
  const terrainMid = (plan.seg.terrain.start + plan.seg.terrain.end) / 2 + config.shutterFraction / (2 * config.fps)

  const sky: SkyPatch[] = []
  for (const [view, def] of Object.entries(skyJson)) {
    const wide = 1 + 2 * def.margin
    const tan = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2) * wide
    sky.push({ view: view as ViewKind, texture: await ctx.texture(base + def.file, { srgb: true, mips: false, anisotropy: 1 }), aim: new THREE.Quaternion(), tan: [tan * 16 / 9, tan], gain: def.gain, add: def.add, ring: def.ring as [number, number, number, number], edge: def.edge })
  }

  const light = new THREE.Vector3()
  const camera = new THREE.Vector3()
  const eye = new THREE.Vector3()
  const eyeWorld = new THREE.Vector3()
  const back = new THREE.Quaternion()
  const sunLocal = new THREE.Vector3()
  const sunView = new THREE.Vector3()
  const airTint = new THREE.Vector3()
  const turn = new THREE.Quaternion()
  const seaCentre = new THREE.Vector3().fromArray(reliefJson.nadir).normalize().multiplyScalar(reliefJson.radius + 1)
  const sea = { nadir: new THREE.Vector3(), alpha: 0 }
  const upAt = seaCentre.clone().normalize().negate()
  const east = new THREE.Vector3().crossVectors(upAt, new THREE.Vector3(0, 0, 1)).normalize()
  const lay = new THREE.Matrix4().makeBasis(east, new THREE.Vector3().crossVectors(upAt, east), upAt).transpose()
  const wisps = { ...look.veil.near, eye: new THREE.Vector3(), turn: new THREE.Matrix3() }
  const spin = new THREE.Matrix4()
  const layer: Deck = { grain: look.veil.deck.grain, gain: look.veil.deck.gain, rush: 0, shade: 1, turn: new THREE.Matrix3() }
  const glowHome = new THREE.Vector3().fromArray(look.air.dir).normalize()
  const auroraHome = new THREE.Vector3().fromArray(look.aurora.eye).normalize()
  const stand = new THREE.Vector3()
  const eyeDir = new THREE.Vector3()
  const lean = new THREE.Quaternion()
  const ease = look.globe.drift.ease
  const home = plan.hold(plan.seg.hold.end - plan.seg.hold.start).position.length()

  return {
    id: plan.id,
    world,
    sky,
    update: (state, shot, view) => {
      const inOrbit = state.view === 'orbit'
      orbit.visible = inOrbit && state.weight > 0
      terrain.visible = !inOrbit
      const gain = 1 / shot.post.exposure
      const seg = state.segment
      let thin = 0
      let grow = 0
      if (seg.stop === plan.id && (seg.kind === 'dive' || seg.kind === 'rise')) {
        const w = coverWindow(seg)!
        const centre = w.centerFrame / config.fps
        const from = w.firstFrame / config.fps - look.veil.lead
        const to = (w.lastFrame + 1) / config.fps + look.veil.tail[seg.kind === 'dive' ? 0 : 1]
        const full = seg.kind === 'dive' ? (w.firstFrame + look.veil.full * (w.lastFrame + 1 - w.firstFrame)) / config.fps : centre
        grow = (state.time - from) / (full - from)
        thin = look.veil.peak[seg.kind === 'dive' ? 0 : 1] * (state.time < centre ? smooth((state.time - from) / (full - from)) : smooth((to - state.time) / (to - centre)))
      }
      if (!inOrbit) {
        back.copy(state.rotation).invert()
        sea.nadir.copy(world.position).applyQuaternion(back).add(seaCentre)
        sea.alpha = Math.asin(Math.min(reliefJson.radius / sea.nadir.length(), 1))
        sea.nadir.normalize().applyQuaternion(state.rotation).applyQuaternion(turn.copy(shot.camera.quaternion).invert())
        eye.copy(world.position).applyQuaternion(back).negate()
        wisps.eye.copy(eye).applyMatrix4(lay)
        wisps.turn.setFromMatrix4(spin.makeRotationFromQuaternion(turn.copy(back).multiply(shot.camera.quaternion)).premultiply(lay))
        veil.update(shot.cover, thin, shot.post.exposure, shot.camera.vfov, view.format.width / view.format.height, null, sea, look.veil.rim, seg.kind === 'dive' ? wisps : null)
        ground.update(state.time - terrainMid, gain, shot.post.vignette, shot.post.bloomStrength, view, eye)
        return
      }
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      light.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      let deck: Deck | null = null
      if (seg.stop === plan.id && seg.kind === 'dive') {
        const k = look.veil.deck
        layer.rush = smooth((grow - k.rush[0]) / (k.rush[1] - k.rush[0]))
        layer.shade = 1 - smooth((grow - k.lit[0]) / (k.lit[1] - k.lit[0]))
        layer.turn.setFromMatrix4(spin.makeRotationFromQuaternion(lean.setFromAxisAngle(upAxis, plan.spin(state.time)).premultiply(tilt).multiply(untilt).invert().multiply(back.copy(state.rotation).invert()).multiply(shot.camera.quaternion)))
        deck = layer
      }
      veil.update(shot.cover, thin, shot.post.exposure, shot.camera.vfov, view.format.width / view.format.height, sunView.copy(light).applyQuaternion(turn.copy(shot.camera.quaternion).invert()), null, look.veil.rim, null, deck)
      camera.copy(world.position).negate()
      const d = look.descent
      const low = ending ? 0 : 1 - smooth((Math.log(Math.max(camera.length() - 1, 1e-4)) - Math.log(d.low)) / (Math.log(d.high) - Math.log(d.low)))
      const x = plan.seg.hold.end - state.time
      const flow = x > 0 ? (-x * x) / (x + ease) : 0
      const aspect = view.format.width / view.format.height
      back.copy(state.rotation).invert()
      eye.copy(camera).applyQuaternion(back).applyMatrix3(unshape)
      eyeWorld.copy(eye).applyQuaternion(state.rotation)
      const near = Math.sqrt((home * home - 1) / Math.max(camera.lengthSq() - 1, 1e-6))
      const away = plan.clock(state.time) !== state.time ? smooth((near - look.back[0]!) / (look.back[1]! - look.back[0]!)) : smooth((state.time - plan.seg.hold.end + look.away[0]!) / (look.away[0]! + look.away[1]!))
      const pace = seg.stop === plan.id && (seg.kind === 'dive' || seg.kind === 'rise') ? plan.pace(seg.kind, state.time) : 0
      const lights = 1 - look.lights[2]! * smooth((pace - look.lights[0]!) / (look.lights[1]! - look.lights[0]!))
      globe.update(light, eyeWorld, state.rotation, plan.spin(state.time), gain, state.weight, flow, plan.clock(state.time) - plan.holdMid, away, 0)
      const gu = globe.material.uniforms
      gu.uLights!.value = lights
      gu.uVignette!.value = shot.post.vignette * (1 - low)
      ;(gu.uBloomPre!.value as THREE.Vector4).x = shot.post.bloomStrength
      gu.uAspect!.value = aspect
      const au = air.material.uniforms
      ;(au.uCam!.value as THREE.Vector3).copy(eye)
      ;(au.uGlowDir!.value as THREE.Vector3).copy(light).applyQuaternion(back).multiplyScalar(Math.max(low, lit)).addScaledVector(glowHome, 1 - Math.max(low, lit)).normalize()
      au.uGain!.value = gain * state.weight
      au.uWide!.value = 1 - low
      au.uAway!.value = away
      au.uFree!.value = plan.clock(state.time) !== state.time ? 1 : away
      const thinAir = 1 + (d.air - 1) * low
      ;(au.uHeight!.value as THREE.Vector4).set(look.air.heights[0]! * thinAir, look.air.heights[1]! * thinAir, look.air.heights[2]!, look.air.heights[3]!)
      const layers = au.uColor!.value as THREE.Vector3[]
      const tint = seg.kind === 'rise' ? d.glow.rise : d.glow.dive
      for (let i = 0; i < 2; i++) layers[i]!.fromArray(look.air.colors[i]!).multiply(airTint.set(1 + (tint[0] - 1) * low, 1 + (tint[1] - 1) * low, 1 + (tint[2] - 1) * low))
      au.uPhysical!.value = Math.max(low, lit)
      au.uVignette!.value = shot.post.vignette * (1 - low)
      au.uAspect!.value = aspect
      curtain.turn.setFromAxisAngle(upAxis, plan.spin(state.time)).premultiply(tilt).multiply(untilt)
      stand.copy(auroraHome).applyQuaternion(curtain.turn)
      curtain.turn.premultiply(lean.setFromUnitVectors(stand, eyeDir.copy(eye).normalize()))
      const high = smooth((eye.length() - 1 - look.aurora.fade[0]!) / (look.aurora.fade[1]! - look.aurora.fade[0]!))
      sunLocal.copy(light).applyQuaternion(back)
      curtain.update(plan.clock(state.time) - plan.holdMid, high, sunLocal)
      moon.update(sunLocal, plan.axis, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * (plan.clock(state.time) - plan.holdMid), gain * state.weight, shot.post.vignette, aspect)
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      const visible = radiusPx > 0.6
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
      veil.dispose()
      ground.dispose()
    },
  }
}
