import * as THREE from 'three'
import { config } from '../../config'
import { FarPoint } from '../../bodies/farpoint'
import type { Pose, SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { diagUniform } from '../../diagnostics/diag'
import { smooth } from '../../director/rig'
import { patches, relief as reliefDefs, wrap } from './assets'
import { Globe } from './globe'
import * as look from './look'
import { plan } from './plan'
import { CloudRelief } from './relief'
import { LIMB, Rim, limbFrame } from './rim'
import skyJson from './sky.json'

function direction(lonDeg: number, latDeg: number): THREE.Vector3 {
  const lon = THREE.MathUtils.degToRad(lonDeg)
  const lat = THREE.MathUtils.degToRad(latDeg)
  return new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon))
}

const PROBES: [number, number][] = [[0, 0], [0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]]

function slide(a: Pose, b: Pose, width: number, height: number): number {
  const ta = Math.tan(THREE.MathUtils.degToRad(a.vfov) / 2)
  const tb = Math.tan(THREE.MathUtils.degToRad(b.vfov) / 2)
  const aspect = width / height
  const back = b.quaternion.clone().invert()
  const ray = new THREE.Vector3()
  let most = 0
  for (const [x, y] of PROBES) {
    ray.set(x * ta * aspect, y * ta, -1).normalize().applyQuaternion(a.quaternion)
    const along = a.position.dot(ray)
    const h = along * along - a.position.lengthSq() + 1
    if (h < 0) continue
    const v = ray.multiplyScalar(-along - Math.sqrt(h)).add(a.position).sub(b.position).applyQuaternion(back)
    if (v.z >= 0) continue
    most = Math.max(most, Math.hypot(((v.x / -v.z / (tb * aspect)) - x) * width / 2, ((v.y / -v.z / tb) - y) * height / 2))
  }
  return most
}

export const createSet: SetFactory = async (ctx) => {
  const key = ctx.assets === 'full' ? 'full' : 'web'
  const base = 'venus/' + ctx.assets + '/'
  const fit = plan.fit
  const world = new THREE.Group()
  const orbit = new THREE.Group()
  const terrain = new THREE.Group()
  world.add(orbit, terrain)

  const map = await ctx.texture(base + 'wrap-color.jpg', { srgb: true, anisotropy: 16, repeat: true })
  const flowMap = await ctx.texture(base + 'wrap-flow.jpg', { srgb: false, repeat: true })
  const boltMap = await ctx.texture(base + 'bolt.jpg', { srgb: true })
  const patchTextures: THREE.Texture[] = []
  for (const level of patches.levels) patchTextures.push(await ctx.texture(base + level.file, { srgb: true, anisotropy: 16 }))
  const limbMap = await ctx.dataTexture(base + look.limb.file, LIMB.azimuth + 1, LIMB.half * 4, 4)
  const globeTurn = new THREE.Quaternion().fromArray(fit.globe.quaternion)
  const spotBody = plan.spot.clone().applyQuaternion(globeTurn.clone().invert())

  const globe = new Globe({
    map, mapWidth: wrap.sets[key].color[0], curve: look.curve, haze: look.haze, limb: limbMap, graze: look.graze, lift: look.lift, shade: look.shade, mauve: look.mauve,
    patches: { textures: patchTextures, widthsDeg: patches.levels.map((l) => l.widthDeg), spot: spotBody, feather: patches.feather, fade: patches.fade },
    flow: { map: flowMap, strength: look.drift.strength, shadow: look.drift.shadow, shadowOffset: look.drift.shadowOffset },
    bolts: { map: boltMap, center: direction(wrap.bolt.lon, wrap.bolt.lat), widthDeg: wrap.bolt.widthDeg, gain: 1, color: look.boltColor, cells: look.cells.map((c) => ({ dir: direction(c.lon, c.lat), radiusDeg: c.radiusDeg, painted: c.painted })) },
  })
  globe.mesh.quaternion.copy(globeTurn)
  globe.mesh.scale.fromArray(fit.globe.scale)
  const rim = new Rim(limbMap, look.limb.radius, diagUniform, look.bloom.hide)
  const far = new FarPoint()
  orbit.add(globe.mesh, rim.mesh, far.points)

  const ground = await CloudRelief.load(ctx, base, reliefDefs[key], look.relief)
  terrain.add(ground.group)
  const terrainMid = (plan.seg.terrain.start + plan.seg.terrain.end) / 2
  const riseAt = plan.seg.rise.start + look.drift.riseAt * (plan.seg.rise.end - plan.seg.rise.start)

  const tintLow = new THREE.Vector3().fromArray(look.descent.tint)
  const light = new THREE.Vector3()
  const limbS = new THREE.Vector3()
  const limbT = new THREE.Vector3()
  const camera = new THREE.Vector3()
  const amps: number[] = look.cells.map(() => 0)
  const turnBack = new THREE.Quaternion()
  const turn = new THREE.Quaternion()
  const shift = new THREE.Vector3()
  let zoom = 1
  const sky: SkyPatch[] = []
  for (const [view, def] of Object.entries(skyJson)) {
    const wide = 1 + 2 * def.margin
    const t = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2) * wide
    sky.push({ view: view as ViewKind, texture: await ctx.texture(base + def.file, { srgb: true, mips: false, anisotropy: 1 }), aim: new THREE.Quaternion(), tan: [t * 16 / 9, t], gain: def.gain, add: def.add, ring: def.ring as [number, number, number, number], edge: def.feather / wide })
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
        ground.update(state.time - terrainMid, gain, shot.post.vignette, view, shot.sun.dir, Math.pow(1 - plan.coverAmount(state.segment, state.time), 2))
        return
      }
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      light.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      camera.copy(world.position).negate()
      const elapsed = Math.min(Math.max(state.time - plan.holdMid, look.drift.from), look.drift.to)
      const flowing = state.time > terrainMid ? Math.min(Math.max(state.time - riseAt, look.drift.from), look.drift.to) : elapsed
      const d = look.descent
      const low = ending ? 0 : 1 - smooth((Math.log(Math.max(camera.length() - 1, 1e-4)) - Math.log(d.low)) / (Math.log(d.high) - Math.log(d.low)))
      const left = ending ? 0 : smooth((state.time - plan.seg.dive!.start) / look.leave.seconds)
      for (let i = 0; i < amps.length; i++) amps[i] = ending ? 0 : look.flash(look.cells[i]!, state.time) * (1 - left)
      const gu = globe.material.uniforms
      ;(gu.uTint!.value as THREE.Vector3).set(1, 1, 1).lerp(tintLow, low)
      const vignette = shot.post.vignette * (1 - low)
      const aspect = view.format.width / view.format.height
      limbFrame(camera, light, limbS, limbT)
      gu.uVignette!.value = vignette
      gu.uAspect!.value = aspect
      gu.uLimbK!.value = look.limb.gain * (1 - low)
      gu.uLimbFar!.value = left
      ;(gu.uLimbS!.value as THREE.Vector3).copy(limbS)
      ;(gu.uLimbT!.value as THREE.Vector3).copy(limbT)
      globe.update(camera, light, state.rotation, plan.spin(state.time), THREE.MathUtils.degToRad(look.drift.bandDegPerSecond) * elapsed, THREE.MathUtils.degToRad(look.drift.flowDegPerSecond) * flowing, amps, gain, state.weight)
      let taps = 0
      const kind = state.segment.kind
      if (view.samples > 1 && state.segment.stop === plan.id && (kind === 'dive' || kind === 'rise') && plan.coverAmount(state.segment, state.time) < look.motion.hidden) {
        const dt = config.shutterFraction / (view.samples * config.fps)
        const a = kind === 'dive' ? plan.dive(state.time) : plan.rise(state.time)
        const b = kind === 'dive' ? plan.dive(state.time + dt) : plan.rise(state.time + dt)
        if (a.view === 'orbit' && b.view === 'orbit') {
          const px = slide(a.pose, b.pose, view.format.width, view.format.height)
          if (px > look.motion.from) taps = Math.min(Math.ceil(px / look.motion.step), look.motion.most)
          if (taps > 0) {
            turnBack.copy(a.pose.quaternion).invert()
            shift.copy(b.pose.position).sub(a.pose.position).applyQuaternion(turnBack)
            turn.copy(turnBack).multiply(b.pose.quaternion)
            zoom = Math.tan(THREE.MathUtils.degToRad(b.pose.vfov) / 2) / Math.tan(THREE.MathUtils.degToRad(a.pose.vfov) / 2)
          }
        }
      }
      globe.motion(taps, camera, shot.camera.quaternion, shift, turn, zoom, view.camera.view?.offsetX ?? 0, view.camera.view?.offsetY ?? 0)
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      rim.update(camera, limbS, limbT, gain * state.weight * look.limb.gain * (1 - low), vignette, aspect, Math.min(LIMB.edgePx / radiusPx, 0.02), left)
      const visible = radiusPx > 0.6
      globe.mesh.visible = visible
      rim.mesh.visible = visible
      far.update(radiusPx, view, plan.p.tint, gain)
    },
    dispose: () => {
      globe.dispose()
      rim.dispose()
      far.dispose()
      ground.dispose()
    },
  }
}
