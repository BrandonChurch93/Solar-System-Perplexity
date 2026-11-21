import * as THREE from 'three'
import { config } from '../../config'
import { FarPoint } from '../../bodies/farpoint'
import type { Pose, SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { diagUniform } from '../../diagnostics/diag'
import { smooth } from '../../director/rig'
import { patches, relief as reliefDefs, wrap } from './assets'
import { Globe } from './globe'
import * as look from './look'
import { deck, plan, veil as timing } from './plan'
import { CloudRelief } from './relief'
import { HoldRim, LIMB, Rim, limbFrame } from './rim'
import skyJson from './sky.json'
import { Veil } from './veil'

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

interface Swap { at: number; turn: THREE.Quaternion; up: THREE.Vector3; upTerrain: THREE.Vector3; height: number; rate: number; sun: THREE.Vector3; fwd: THREE.Vector3; right: THREE.Vector3; e1: THREE.Vector3; e2: THREE.Vector3 }

function swapOf(kind: 'dive' | 'rise', sunTerrain: THREE.Vector3, fwd: THREE.Vector3, right: THREE.Vector3): Swap {
  const at = plan.coverCenter(kind === 'dive' ? plan.seg.dive! : plan.seg.rise)
  const tiny = 1e-6
  const dt = 0.125 / config.fps
  const shot = (t: number): Pose => (kind === 'dive' ? plan.dive(t) : plan.rise(t)).pose
  const o = shot(kind === 'dive' ? at - tiny : at)
  const g = shot(kind === 'dive' ? at : at - tiny)
  const o2 = shot(kind === 'dive' ? at - tiny - dt : at + dt)
  const height = o.position.length() - 1
  const turn = o.quaternion.clone().multiply(g.quaternion.clone().invert())
  const up = o.position.clone().normalize()
  const sun = sunTerrain.clone().applyQuaternion(turn)
  const e1 = sun.clone().addScaledVector(up, -sun.dot(up)).normalize()
  return {
    at, turn, height, up, sun, e1,
    e2: new THREE.Vector3().crossVectors(up, e1),
    upTerrain: g.position.clone().sub(deck.centre).normalize(),
    rate: Math.log((o2.position.length() - 1) / height) / (kind === 'dive' ? -dt : dt),
    fwd: fwd.clone().applyQuaternion(turn),
    right: right.clone().applyQuaternion(turn),
  }
}

export const createSet: SetFactory = async (ctx) => {
  const key = ctx.assets === 'full' ? 'full' : 'web'
  const base = 'venus/' + ctx.assets + '/'
  const fit = plan.fit
  const world = new THREE.Group()
  const orbit = new THREE.Group()
  const terrain = new THREE.Group()
  world.add(orbit, terrain)

  const map = await ctx.texture(base + 'wrap-color.jpg', { srgb: true, anisotropy: 4, repeat: true })
  const flowMap = await ctx.texture(base + 'wrap-flow.jpg', { srgb: false, repeat: true })
  const boltMap = await ctx.texture(base + 'bolt.jpg', { srgb: true })
  const patchTextures: THREE.Texture[] = []
  for (const level of patches.levels) patchTextures.push(await ctx.texture(base + level.file, { srgb: true, anisotropy: 16 }))
  const limbMap = await ctx.dataTexture(base + look.limb.file, LIMB.azimuth + 1, LIMB.half * 4, 4)
  const globeTurn = new THREE.Quaternion().fromArray(fit.globe.quaternion)
  const holdBack = globeTurn.clone().invert()
  const holdCam = new THREE.Vector3().fromArray(fit.camera.position)
  const holdMap = await ctx.texture(base + look.hold.file, { srgb: false })
  const holdRim = new HoldRim(await ctx.dataTexture(base + look.hold.rim.file, look.hold.rim.cols + 1, look.hold.rim.inside + look.hold.rim.outside, 4), holdCam, look.hold.near)
  const spotBody = plan.spot.clone().applyQuaternion(globeTurn.clone().invert())

  const globe = new Globe({
    map, mapWidth: wrap.sets[key].color[0], curve: look.curve, haze: look.haze, limb: limbMap, graze: look.graze, lift: look.lift, shade: look.shade, mauve: look.mauve, weave: { ...look.weave, camera: new THREE.Vector3().fromArray(fit.camera.position).applyQuaternion(globeTurn.clone().invert()) },
    rim: holdRim,
    hold: { ...look.hold, map: holdMap, right: new THREE.Vector3(1, 0, 0).applyQuaternion(holdBack), up: new THREE.Vector3(0, 1, 0).applyQuaternion(holdBack), forward: new THREE.Vector3(0, 0, -1).applyQuaternion(holdBack), centre: [-holdCam.x / holdCam.z, -holdCam.y / holdCam.z], half: look.hold.margin / Math.sqrt(holdCam.lengthSq() - 1), lod: Math.log2(wrap.sets[key].color[0] / look.hold.base) },
    patches: { textures: patchTextures, widthsDeg: patches.levels.map((l) => l.widthDeg), spot: spotBody, feather: patches.feather, fade: patches.fade },
    flow: { map: flowMap, strength: look.drift.strength, shadow: look.drift.shadow, shadowOffset: look.drift.shadowOffset },
    bolts: { map: boltMap, center: direction(wrap.bolt.lon, wrap.bolt.lat), widthDeg: wrap.bolt.widthDeg, gain: 1, color: look.boltColor, cells: look.cells.map((c) => ({ dir: direction(c.lon, c.lat), radiusDeg: c.radiusDeg, painted: c.painted })) },
  })
  globe.mesh.quaternion.copy(globeTurn)
  globe.mesh.scale.fromArray(fit.globe.scale)
  const rim = new Rim(limbMap, look.limb.radius, diagUniform, look.bloom.hide, holdRim)
  const far = new FarPoint()
  orbit.add(globe.mesh, rim.mesh, far.points)

  const ground = await CloudRelief.load(ctx, base, reliefDefs[key], look.relief)
  terrain.add(ground.group)
  const carry = ground.carry!
  const clouds = await ctx.texture(base + look.veil.file, { srgb: true, anisotropy: 1, repeat: true })
  const veil = new Veil(look.veil, clouds, carry, diagUniform)
  const sunTerrain = new THREE.Vector3(look.veil.sun[0], look.veil.sun[1], -1).normalize()
  const swaps = { dive: swapOf('dive', sunTerrain, carry.fwd, carry.right), rise: swapOf('rise', sunTerrain, carry.fwd, carry.right) }
  ;(globe.material.uniforms.uCarry!.value as THREE.Vector4).set(look.veil.grade.keep, look.veil.grade.gamma, look.veil.grade.pivot, look.veil.grade.gain)
  ;(globe.material.uniforms.uCarryTint!.value as THREE.Vector3).fromArray(look.veil.grade.tint)
  const back = new THREE.Quaternion()
  const localQ = new THREE.Quaternion()
  const localBack = new THREE.Quaternion()
  const localP = new THREE.Vector3()
  const centre = new THREE.Vector3()
  const eye = new THREE.Vector3()
  const veilTurn = new THREE.Quaternion()
  const sunCam = new THREE.Vector3()
  const airFwd = new THREE.Vector3()
  const airRight = new THREE.Vector3()
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
    near: veil.mesh,
    sky,
    update: (state, shot, view) => {
      const inOrbit = state.view === 'orbit'
      orbit.visible = inOrbit && state.weight > 0
      terrain.visible = !inOrbit
      const gain = 1 / shot.post.exposure
      const kind = state.segment.kind
      const covering = state.segment.stop === plan.id && (kind === 'dive' || kind === 'rise')
      const thick = covering ? plan.veilAmount(state.segment, state.time) : 0
      const released = covering ? smooth(plan.release(state.segment, state.time)) : 1
      const sw = swaps[kind === 'dive' ? 'dive' : 'rise']
      back.copy(state.rotation).invert()
      localQ.copy(back).multiply(shot.camera.quaternion)
      localBack.copy(localQ).invert()
      localP.copy(shot.camera.position).sub(state.origin).applyQuaternion(back)
      if (!inOrbit) {
        ground.update(state.time - terrainMid, gain, shot.post.vignette, view, shot.sun.dir)
        if (thick <= 0) {
          veil.hide()
          return
        }
        localP.sub(deck.centre).divideScalar(deck.radius)
        centre.copy(localP).negate().applyQuaternion(localBack)
        eye.copy(localP).normalize().sub(sw.upTerrain).applyQuaternion(sw.turn).add(sw.up).normalize()
        const fall = plan.drop(state.segment, state.time)
        const rush = Math.min(Math.abs(sw.rate * (plan.drop(state.segment, state.time + config.shutterFraction / config.fps) - fall)) / timing.rush, 1)
        eye.multiplyScalar(1 + sw.height * Math.exp(timing.slow * sw.rate * fall))
        veilTurn.copy(sw.turn).multiply(localQ)
        sunCam.copy(sunTerrain).applyQuaternion(localBack)
        veil.update(view.camera, view.format.width, view.format.height, centre, eye, rush, 1, veilTurn, thick, 0, sw, sunCam, 0, airFwd, airRight, gain, gain * look.relief.air.gain, shot.post.vignette)
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
      gu.uCarryOn!.value = 1 - released
      if (thick > 0 || released < 1) {
        centre.copy(localP).negate().applyQuaternion(localBack)
        sunCam.copy(sw.sun).applyQuaternion(localBack)
        airFwd.copy(sw.fwd).applyQuaternion(localBack)
        airRight.copy(sw.right).applyQuaternion(localBack)
        const high = Math.max(localP.length() - 1, 1e-6)
        const low = sw.height * Math.pow(high / sw.height, timing.slow)
        const after = Math.max((kind === 'dive' ? plan.dive(state.time + config.shutterFraction / config.fps) : plan.rise(state.time + config.shutterFraction / config.fps)).pose.position.length() - 1, 1e-6)
        eye.copy(localP).normalize().multiplyScalar(1 + low)
        veil.update(view.camera, view.format.width, view.format.height, centre, eye, Math.min(Math.abs(Math.log(after / high)) / timing.rush, 1), Math.asin(1 / (1 + low)) / Math.asin(1 / (1 + high)), localQ, thick, released, sw, sunCam, Math.pow(1 - released, look.veil.sunFade), airFwd, airRight, gain, gain * look.relief.air.gain, vignette)
      } else veil.hide()
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
      let smear = 1
      if (view.samples > 1 && state.segment.stop === plan.id && (kind === 'dive' || kind === 'rise') && thick < look.motion.hidden) {
        const dt = config.shutterFraction / (view.samples * config.fps)
        const a = kind === 'dive' ? plan.dive(state.time) : plan.rise(state.time)
        const b = kind === 'dive' ? plan.dive(state.time + dt) : plan.rise(state.time + dt)
        if (a.view === 'orbit' && b.view === 'orbit') {
          const px = slide(a.pose, b.pose, view.format.width, view.format.height)
          if (px > look.motion.from) taps = Math.min(Math.ceil(px / look.motion.step), look.motion.most)
          const scale = view.format.height / config.formats[config.formatKeys.master]!.height
          smear = 1 + Math.min(Math.max((px * view.samples / scale - look.motion.smear.from) * look.motion.smear.share, 0), look.motion.smear.most) * scale
          if (taps > 0) {
            turnBack.copy(a.pose.quaternion).invert()
            shift.copy(b.pose.position).sub(a.pose.position).applyQuaternion(turnBack)
            turn.copy(turnBack).multiply(b.pose.quaternion)
            zoom = Math.tan(THREE.MathUtils.degToRad(b.pose.vfov) / 2) / Math.tan(THREE.MathUtils.degToRad(a.pose.vfov) / 2)
          }
        }
      }
      globe.motion(taps, smear, camera, shot.camera.quaternion, shift, turn, zoom, view.camera.view?.offsetX ?? 0, view.camera.view?.offsetY ?? 0)
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      rim.update(camera, limbS, limbT, gain * state.weight * look.limb.gain * (1 - low), vignette, aspect, Math.min(LIMB.edgePx / radiusPx, 0.02), left)
      holdRim.update(camera, state.rotation, ending ? 0 : look.hold.weight * (1 - left))
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
      veil.dispose()
    },
  }
}
