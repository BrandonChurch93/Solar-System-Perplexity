import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import { samplesFor } from '../../core/sampler'
import type { SetContext, SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { diagUniform } from '../../diagnostics/diag'
import { drift, ramp, smooth, smoother } from '../../director/rig'
import { Relief } from '../../terrain/relief'
import { config } from '../../config'
import { patches, relief, wrap } from './assets'
import { Glare, type GlareSide } from './glare'
import { Globe } from './globe'
import { Lens } from './lens'
import lensJson from './lens.json'
import streakJson from './streak.json'
import * as look from './look'
import { plan } from './plan'
import { above, limbLine, ride, skyline, type Line } from './ride'
import reliefJson from './relief.json'
import skyJson from './sky.json'
import { SunPlate } from './sunplate'
import sunJson from './sunplate.json'

interface SkyDef { file: string; vfovDeg: number; margin: number; feather?: number; gain: number; add: boolean; ring: number[] }

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
  const base = 'mercury/' + ctx.assets + '/'
  const fit = plan.fit
  const world = new THREE.Group()
  const orbit = new THREE.Group()
  const terrain = new THREE.Group()
  world.add(orbit, terrain)

  const sizes = wrap.sets[key]
  const map = await ctx.texture(base + 'wrap-color.jpg', { srgb: true, anisotropy: 16, repeat: true })
  const wrapHeight = wrap.height
    ? ctx.floatTexture(await heights(ctx, base + 'wrap-height.bin', sizes.height[0], sizes.height[1]), sizes.height[0], sizes.height[1], true)
    : ctx.floatTexture(new Float32Array(8), 4, 2, true)
  const patchTextures: THREE.Texture[] = []
  for (const level of patches.levels) patchTextures.push(await ctx.texture(base + level.file, { srgb: true, anisotropy: 16 }))

  const globe = new Globe({
    map, mapWidth: (map.image as unknown as { width: number }).width, height: wrapHeight, heightWidth: wrap.height ? sizes.height[0] : 4096, light: look.light,
    patches: patchTextures.length > 0 ? { textures: patchTextures, widthsDeg: patches.levels.map((l) => l.widthDeg), spot: direction(patches.spot.lon, patches.spot.lat), feather: patches.feather, fade: patches.fade, nearDeg: patches.nearDeg } : undefined,
  })
  globe.mesh.quaternion.fromArray(fit.globe.quaternion)
  const far = new FarPoint()
  const sunPlate = new SunPlate(await ctx.texture(base + sunJson.file, { srgb: true, anisotropy: 4 }), sunJson.rect as [number, number, number, number], sunJson.disc, look.sun.limb, diagUniform)
  const sunAim = new THREE.Quaternion()
  const holdCam = plan.hold(plan.holdMid - plan.seg.hold.start).quaternion.clone().multiply(drift(plan.holdMid))
  orbit.add(sunPlate.mesh, globe.mesh, far.points)
  const lens = new Lens(await ctx.texture(base + lensJson.file, { srgb: true, anisotropy: 1 }), lensJson, look.lens, diagUniform)
  const streak = new Lens(await ctx.texture(base + streakJson.file, { srgb: true, anisotropy: 1 }), streakJson, look.streak, diagUniform, true)
  const near = new THREE.Group()
  const glare = new Glare(look.glare, diagUniform)
  near.add(lens.mesh, streak.mesh, glare.mesh)
  const covers = [plan.coverCenter(plan.seg.dive!), plan.coverCenter(plan.seg.rise)]
  const spinRate = THREE.MathUtils.degToRad(plan.p.spinDegPerSecond)
  const spin = (time: number) => plan.spin(time) - spinRate * look.spinRest * Math.min(Math.max(time - covers[0]!, 0), covers[1]! - covers[0]!)
  const closeTan = Math.tan(THREE.MathUtils.degToRad(relief.full.vfovDeg) / 2)
  const closeSun = new THREE.Vector3((look.glare.terrainSun[0] - 0.5) * 2 * closeTan * relief.full.imageSize[0] / relief.full.imageSize[1], (0.5 - look.glare.terrainSun[1]) * 2 * closeTan, -1).normalize()
  const glareSun = new THREE.Vector3()
  const closeAim = plan.terrain((plan.seg.terrain.end - plan.seg.terrain.start) / 2).quaternion.clone()
  const closeTurn = plan.turn((plan.seg.terrain.start + plan.seg.terrain.end) / 2).clone()
  const closeFrame = plan.terrainFrame.clone().invert()
  const closeFix = new THREE.Quaternion()
  const closeUp = new THREE.Vector3().fromArray(reliefJson.camera.up)
  const closeLine = (pose: { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }): Line => skyline(pose, closeUp, reliefJson.camera.dipDeg, look.edge)
  const rests = [plan.dive(covers[0]!).pose, plan.rise(covers[1]! - 1e-4).pose].map((pose) => {
    const s = closeSun.clone().applyQuaternion(closeAim).applyQuaternion(pose.quaternion.clone().invert())
    const tan = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
    return above(closeLine(pose), s.x / -s.z / tan, s.y / -s.z / tan)
  })
  const rideSpan = [look.ride[0] / config.fps, look.ride[1] / config.fps]
  const sunShown = new THREE.Vector3()
  const sunTurn = new THREE.Quaternion()
  const centre = new THREE.Vector3()
  const toCamera = new THREE.Quaternion()

  const ground = await Relief.load(ctx, base, relief[key], look.relief)
  terrain.add(ground.group)
  const terrainMid = (plan.seg.terrain.start + plan.seg.terrain.end) / 2

  const light = new THREE.Vector3()
  const forward = new THREE.Vector3()
  const holdRadius = 1 / plan.hold(plan.holdMid - plan.seg.hold.start).position.length() / Math.tan(THREE.MathUtils.degToRad(fit.vfovDeg) / 2) / 2
  const sky: SkyPatch[] = []
  for (const [view, def] of Object.entries(skyJson as Record<string, SkyDef>)) {
    const wide = 1 + 2 * def.margin
    const tan = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2) * wide
    sky.push({ view: view as ViewKind, texture: await ctx.texture(base + def.file, { srgb: true, mips: false, anisotropy: 1 }), aim: new THREE.Quaternion(), tan: [tan * 16 / 9, tan], gain: def.gain, add: def.add, ring: def.ring as [number, number, number, number], edge: (def.feather ?? def.margin) / wide })
  }

  return {
    id: plan.id,
    world,
    near,
    sky,
    update: (state, shot, view) => {
      const inOrbit = state.view === 'orbit'
      orbit.visible = inOrbit && state.weight > 0
      terrain.visible = !inOrbit
      const gain = 1 / shot.post.exposure
      lens.mesh.visible = false
      streak.mesh.visible = false
      const mine = state.segment.stop === plan.id
      const on = mine && state.weight > 0
      const fromDive = (state.time - covers[0]!) * config.fps
      const fromRise = (state.time - covers[1]!) * config.fps
      const first = Math.abs(fromDive) <= Math.abs(fromRise)
      const side: GlareSide = first ? (inOrbit ? 'dive' : 'enter') : inOrbit ? 'rise' : 'leave'
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2)
      const aspect = view.format.width / view.format.height
      toCamera.copy(view.camera.quaternion).invert()
      let line: Line
      let radius = 50
      let lift = 0
      let haze = 0
      if (inOrbit) {
        line = limbLine(centre.copy(world.position).applyQuaternion(toCamera), tanHalf)
        radius = Math.min(1 / Math.sqrt(Math.max(world.position.lengthSq() - 1, 1e-6)) / tanHalf, 50)
        sunShown.copy(shot.sun.dir)
        const w = !mine ? 0 : state.time < covers[0]! ? smoother(ramp(covers[0]! - rideSpan[0]!, covers[0]!, state.time)) : state.time >= covers[1]! ? 1 - smoother(ramp(covers[1]!, covers[1]! + rideSpan[1]!, state.time)) : 0
        if (w > 0) ride(sunShown.applyQuaternion(toCamera), line, tanHalf, rests[state.time < covers[0]! ? 0 : 1]!, w).applyQuaternion(view.camera.quaternion)
        glareSun.copy(sunShown)
        lift = !mine ? 0 : state.time < covers[0]! ? smoother(ramp(covers[0]! - look.carry.frames[0] / config.fps, covers[0]!, state.time)) : state.time >= covers[1]! ? 1 - smoother(ramp(covers[1]!, covers[1]! + look.carry.frames[1] / config.fps, state.time)) : 0
        const h = look.haze
        haze = !mine ? 0 : state.time < covers[0]! ? (1 - smoother(ramp(h.dive[1], h.dive[0], -fromDive))) * (h.dive[3] + (1 - h.dive[3]) * smoother(ramp(0, h.dive[2], -fromDive))) : state.time >= covers[1]! ? (1 - smoother(ramp(h.rise[1], h.rise[2], fromRise))) * (h.rise[3] + (1 - h.rise[3]) * smoother(ramp(0, h.rise[0], fromRise))) : 0
      } else {
        const kind = state.segment.kind
        line = closeLine(mine && kind === 'dive' ? plan.dive(state.time).pose : mine && kind === 'rise' ? plan.rise(state.time).pose : plan.terrain(state.time - plan.seg.terrain.start))
        radius = line.radius ?? radius
        glareSun.copy(closeSun).applyQuaternion(closeAim).applyQuaternion(closeFix.copy(closeFrame).multiply(plan.turn(state.time).clone().invert()).multiply(closeTurn).multiply(plan.terrainFrame)).applyQuaternion(state.rotation)
      }
      glare.update(first ? fromDive : fromRise, side, on, glareSun, view.camera, line, radius, gain, aspect, state.time)
      if (!inOrbit) {
        ground.update(state.time - terrainMid, gain, shot.post.vignette, view)
        return
      }
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      light.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      const offAxis = THREE.MathUtils.radToDeg(sunShown.angleTo(forward.set(0, 0, -1).applyQuaternion(view.camera.quaternion)))
      globe.carry(Math.pow(look.carry.gain, lift), look.carry.knee, look.carry.grey * lift)
      globe.haze(look.haze.color, look.haze.peak * haze)
      globe.update(light, sunShown, 1 - THREE.MathUtils.smoothstep(offAxis, look.light.glareLens[0], look.light.glareLens[1]), spin(state.time), gain, state.weight, Math.min(holdRadius / Math.max(radiusPx / view.format.height, 1e-6), 1), shot.post.vignette, view.format.width / view.format.height)
      globe.mesh.visible = radiusPx > 0.6
      const kind = state.segment.kind
      const fast = view.samples > 1 && state.segment.stop === plan.id && (kind === 'dive' || kind === 'rise')
      const at = (t: number) => (kind === 'dive' ? plan.dive(t) : plan.rise(t))
      const now = fast ? at(state.time) : null
      const before = fast ? at(state.time - config.shutterFraction / (view.samples * config.fps)) : null
      const moving = now?.view === 'orbit' && before?.view === 'orbit'
      const jitter = moving ? samplesFor(view.samples)[view.sample] : undefined
      globe.smear(view.camera, moving ? now.pose : null, moving ? before.pose : null, look.smear, jitter?.jitterX ?? 0, jitter?.jitterY ?? 0, view.samples)
      far.update(radiusPx, view, plan.p.tint, gain)
      const travel = state.segment.kind === 'travel' ? smooth(ramp(0.25, 0.8, state.u)) : 1
      const shown = state.segment.kind === 'travel' && state.segment.stop === plan.id ? 1 - travel : travel
      const tau = state.time - plan.holdMid
      const breath = 1 + look.sun.breathe * (Math.sin(tau * look.sun.rate) + 0.6 * Math.sin(tau * look.sun.rate * 1.63))
      sunPlate.update(sunAim.copy(state.rotation).multiply(holdCam).premultiply(sunTurn.setFromUnitVectors(shot.sun.dir, sunShown)), gain * shown * look.sun.gain * breath, shot.post.vignette, aspect)
      const sep = sunShown.angleTo(world.position)
      const disc = Math.asin(Math.min(1 / Math.max(distance, 1), 1))
      const clear = THREE.MathUtils.smoothstep(sep, disc - 0.6 * shot.sun.angularRadius, disc + 0.6 * shot.sun.angularRadius)
      lens.update(sunShown, view.camera, shown * clear * state.weight * (1 + 2 * (breath - 1)), gain, shot.post.vignette, aspect)
      streak.update(sunShown, view.camera, shown * clear * state.weight * (1 + 2 * (breath - 1)), gain, shot.post.vignette, aspect)
    },
    dispose: () => {
      globe.dispose()
      sunPlate.dispose()
      lens.dispose()
      streak.dispose()
      glare.dispose()
      far.dispose()
      ground.dispose()
    },
  }
}
