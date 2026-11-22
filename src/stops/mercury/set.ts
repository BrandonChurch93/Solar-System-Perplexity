import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import { samplesFor } from '../../core/sampler'
import type { SetContext, SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { diagUniform } from '../../diagnostics/diag'
import { drift, mix, ramp, smooth, smoother } from '../../director/rig'
import { Relief } from '../../terrain/relief'
import { closeImage, closePivot, closeRadius, closeUp as nearUp } from './close'
import { config } from '../../config'
import { patches, relief, wrap } from './assets'
import { Glare, type GlareSide } from './glare'
import { Globe } from './globe'
import { Lens } from './lens'
import lensJson from './lens.json'
import streakJson from './streak.json'
import * as look from './look'
import { plan } from './plan'
import { curve } from './pace'
import reliefJson from './relief.json'
import skyJson from './sky.json'
import { SkyPlate } from './skyplate'
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
  const sunPlate = new SunPlate(await ctx.texture(base + sunJson.file, { srgb: true, anisotropy: 4 }), sunJson.rect as [number, number, number, number], sunJson.disc, look.sun.limb, look.sun.small, diagUniform)
  const sunAim = new THREE.Quaternion()
  const holdCam = plan.hold(plan.holdMid - plan.seg.hold.start).quaternion.clone().multiply(drift(plan.holdMid))
  orbit.add(sunPlate.mesh, globe.mesh, far.points)
  const lens = new Lens(await ctx.texture(base + lensJson.file, { srgb: true, anisotropy: 1 }), lensJson, look.lens, diagUniform)
  const streak = new Lens(await ctx.texture(base + streakJson.file, { srgb: true, anisotropy: 1 }), streakJson, look.streak, diagUniform, true, look.streakCore)
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
  const closeBack = new THREE.Quaternion()
  const midDrift = drift((plan.seg.terrain.start + plan.seg.terrain.end) / 2).invert()
  const closeUp = new THREE.Vector3().fromArray(reliefJson.camera.up).applyQuaternion(midDrift)
  const lowSun = new THREE.Vector3()
  const lowSunAt = (time: number, rotation: THREE.Quaternion, inOrbit: boolean): THREE.Vector3 => {
    lowSun.copy(closeSun).applyQuaternion(closeAim).applyQuaternion(closeFix.copy(closeFrame).multiply(plan.turn(time).invert()).multiply(closeTurn).multiply(plan.terrainFrame))
    if (inOrbit) lowSun.applyQuaternion(plan.anchor.frame).applyQuaternion(plan.drawn(time))
    return lowSun.applyQuaternion(rotation)
  }
  const slide = look.sun.slide
  const slideX = curve(slide.track.map((k) => [k[0], k[1]] as [number, number]))
  const slideY = curve(slide.track.map((k) => [k[0], k[2]] as [number, number]))
  const tanFrom = Math.tan(THREE.MathUtils.degToRad(plan.dive(covers[0]! + slide.leave[0] / config.fps).pose.vfov) / 2)
  const tanTo = Math.tan(THREE.MathUtils.degToRad(plan.dive(covers[0]!).pose.vfov) / 2)
  const sunShown = new THREE.Vector3()
  const rimSun = new THREE.Vector3()
  const sunTurn = new THREE.Quaternion()
  const toCamera = new THREE.Quaternion()
  const plateBack = new THREE.Quaternion()
  const limbRay = new THREE.Vector3()
  const sunRect = sunJson.rect as [number, number, number, number]
  const inCamera = new THREE.Vector3()
  const seen = (dir: THREE.Vector3, tan: number): [number, number] | null => {
    inCamera.copy(dir).applyQuaternion(toCamera)
    return inCamera.z > -0.02 ? null : [inCamera.x / -inCamera.z / tan, inCamera.y / -inCamera.z / tan]
  }

  const ground = await Relief.load(ctx, base, relief[key], look.relief)
  terrain.add(ground.group)
  const shots: THREE.Texture[] = []
  ground.group.traverse((o) => {
    const found = ((o as THREE.Mesh).material as THREE.ShaderMaterial | undefined)?.uniforms?.uColor?.value as THREE.Texture | undefined
    if (found) shots.push(found)
  })
  const hasClose = shots.length > 0
  if (hasClose) globe.close(shots[0]!, plan.anchor.frame.clone().invert().multiply(new THREE.Quaternion().fromArray(fit.globe.quaternion)), nearUp, closePivot, look.close.turn, closeRadius, closeImage.focal, closeImage.center, closeImage.box, look.close.far, look.close.feather)
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

  const low = sky.find((p) => p.view === 'terrain')!
  const skyPlate = new SkyPlate(low.texture, low.tan, low.edge, closeUp, Math.sin(THREE.MathUtils.degToRad(reliefJson.camera.dipDeg)), look.sky.band.soft, diagUniform)
  orbit.add(skyPlate.mesh)
  globe.carry(look.carry.gain, look.carry.knee, 0)
  globe.plain(look.close.plain.tint, 0)
  globe.haze(look.haze.color, look.haze.peak)

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
      const kind = state.segment.kind
      const fromDive = (state.time - covers[0]!) * config.fps
      const fromRise = (state.time - covers[1]!) * config.fps
      const first = Math.abs(fromDive) <= Math.abs(fromRise)
      const side: GlareSide = first ? (inOrbit ? 'dive' : 'enter') : inOrbit ? 'rise' : 'leave'
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2)
      const aspect = view.format.width / view.format.height
      toCamera.copy(view.camera.quaternion).invert()
      if (!inOrbit) {
        glare.update(first ? fromDive : fromRise, side, on, lowSunAt(state.time, state.rotation, false), view.camera, gain, aspect, state.time)
        ground.update(state.time - terrainMid, gain, shot.post.vignette, view)
        return
      }
      const diving = mine && kind === 'dive'
      const rising = mine && kind === 'rise'
      sunShown.copy(shot.sun.dir)
      rimSun.copy(shot.sun.dir)
      glareSun.copy(shot.sun.dir)
      let shrink = 0
      let plate = 1
      let ghosts = 1
      if (diving) {
        const a = smoother(ramp(slide.leave[0], slide.leave[1], fromDive))
        if (a > 0) {
          const b = smoother(ramp(slide.lock[0], slide.lock[1], fromDive))
          let x = (slideX(fromDive) - 0.5) * 2 * aspect
          let y = (0.5 - slideY(fromDive)) * 2
          const from = seen(shot.sun.dir, tanHalf)
          if (from) {
            x = mix(from[0], x, a)
            y = mix(from[1], y, a)
          }
          const to = b > 0 ? seen(lowSunAt(state.time, state.rotation, true), tanHalf) : null
          if (to) {
            x = mix(x, to[0], b)
            y = mix(y, to[1], b)
          }
          sunShown.set(x * tanHalf, y * tanHalf, -1).normalize().applyQuaternion(view.camera.quaternion)
          rimSun.copy(sunShown)
          glareSun.copy(sunShown)
        }
        shrink = ramp(tanFrom, tanTo, tanHalf)
        plate = 1 - smoother(ramp(look.sun.hand[0], look.sun.hand[1], fromDive))
        ghosts = 1 - smoother(ramp(look.sun.ghost[0], look.sun.ghost[1], fromDive))
      } else if (rising) {
        const back = smoother(ramp(look.sun.back[0], look.sun.back[1], fromRise))
        plate = back
        ghosts = back
        glareSun.copy(lowSunAt(state.time, state.rotation, true))
        rimSun.copy(glareSun).lerp(shot.sun.dir, back).normalize()
      }
      glare.update(first ? fromDive : fromRise, side, on, glareSun, view.camera, gain, aspect, state.time)
      const skyWeight = diving ? smoother(ramp(look.sky.dive[0], look.sky.dive[1], fromDive)) : rising ? 1 - smoother(ramp(look.sky.rise[0], look.sky.rise[1], fromRise)) : 0
      const band = diving ? smoother(ramp(look.sky.band.dive[0], look.sky.band.dive[1], fromDive)) : rising ? 1 - smoother(ramp(look.sky.band.rise[0], look.sky.band.rise[1], fromRise)) : 0
      closeBack.copy(state.rotation).multiply(plan.drawn(state.time)).multiply(plan.anchor.frame).multiply(closeFix.copy(closeFrame).multiply(plan.turn(state.time).invert()).multiply(closeTurn).multiply(plan.terrainFrame)).multiply(closeAim).invert().premultiply(midDrift)
      const hole = diving ? smoother(ramp(look.sun.hole.dive[0], look.sun.hole.dive[1], fromDive)) : rising ? 1 - smoother(ramp(look.sun.hole.rise[0], look.sun.hole.rise[1], fromRise)) : 0
      const holeRadius = look.sun.hole.radius[rising ? 'rise' : 'dive']
      skyPlate.update(closeBack, skyWeight * state.weight, band, low.gain * shot.skyGlow * shot.skyExposure, shot.post.vignette, aspect, shot.sun.dir, hole * state.weight, holeRadius[0] * shot.sun.angularRadius, holeRadius[1] * shot.sun.angularRadius)
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      light.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / tanHalf * (view.format.height / 2)
      const offAxis = THREE.MathUtils.radToDeg(rimSun.angleTo(forward.set(0, 0, -1).applyQuaternion(view.camera.quaternion)))
      const close = mine && hasClose && (kind === 'dive' || kind === 'rise') ? 1 - THREE.MathUtils.smoothstep(distance - 1, look.close.height[0], look.close.height[1]) : 0
      globe.near(close, look.close.haze, look.close.soft)
      globe.carry(mix(look.carry.gain, look.carry.lift, close), look.carry.knee, look.carry.grey * close)
      const cut = diving ? smoother(ramp(look.cut.dive[0], look.cut.dive[1], fromDive)) : rising ? 1 - smoother(ramp(look.cut.rise[0], look.cut.rise[1], fromRise)) : 0
      const reach = look.cut.reach[diving ? 0 : 1]
      globe.cut(cut > 0 ? mix(closeRadius * Math.acos(Math.min(1 / distance, 1)) + look.cut.margin, reach, cut) : 0, mix(look.close.far[0], look.cut.far[0], cut), mix(look.close.far[1], look.cut.far[1], cut))
      globe.plain(look.close.plain.tint, 1 - THREE.MathUtils.smoothstep(cut, look.close.plain.until[0], look.close.plain.until[1]))
      globe.silhouette(look.light.silhouette.amp * THREE.MathUtils.smoothstep(distance - 1, look.light.silhouette.fade[0], look.light.silhouette.fade[1]))
      globe.night(state.time > covers[0]! ? look.light.nightAfter : 1, look.light.shoulder.strength * smoother(ramp(look.light.shoulder.frames[0], look.light.shoulder.frames[1], fromRise)))
      globe.update(light, rimSun, 1 - THREE.MathUtils.smoothstep(offAxis, look.light.glareLens[0], look.light.glareLens[1]), spin(state.time), gain, state.weight, Math.min(holdRadius / Math.max(radiusPx / view.format.height, 1e-6), 1), shot.post.vignette, aspect)
      globe.mesh.visible = radiusPx > 0.6
      const fast = view.samples > 1 && (diving || rising)
      const at = (t: number) => (kind === 'dive' ? plan.dive(t) : plan.rise(t))
      const now = fast ? at(state.time) : null
      const before = fast ? at(state.time - config.shutterFraction / (view.samples * config.fps)) : null
      const moving = now?.view === 'orbit' && before?.view === 'orbit'
      const jitter = moving ? samplesFor(view.samples)[view.sample] : undefined
      globe.smear(view.camera, moving ? now.pose : null, moving ? before.pose : null, look.smear, jitter?.jitterX ?? 0, jitter?.jitterY ?? 0, view.samples)
      far.update(radiusPx, view, plan.p.tint, gain)
      const travel = kind === 'travel' ? smooth(ramp(0.25, 0.8, state.u)) : 1
      const shown = kind === 'travel' && mine ? 1 - travel : travel
      const tau = state.time - plan.holdMid
      const breath = 1 + look.sun.breathe * (Math.sin(tau * look.sun.rate) + 0.6 * Math.sin(tau * look.sun.rate * 1.63))
      sunPlate.update(sunAim.copy(state.rotation).multiply(holdCam).premultiply(sunTurn.setFromUnitVectors(shot.sun.dir, sunShown)), gain * shown * look.sun.gain * breath * plate, shot.post.vignette, aspect, shrink)
      const whole = kind === 'travel' && !mine ? 1 - (shot.skyPatch ?? 1) : 0
      let limbLeft = 1
      let limbRight = 1
      if (whole > 0) {
        plateBack.copy(sunAim).invert()
        const at = limbRay.copy(sunShown).applyQuaternion(toCamera)
        const sx = at.x / -at.z
        const sy = at.y / -at.z + look.streakCore.row * tanHalf
        const edge = (sign: number): number => {
          let lo = 0
          let hi = 3
          for (let i = 0; i < 24; i++) {
            const mid = (lo + hi) / 2
            limbRay.set(sx + sign * mid * tanHalf, sy, -1).applyQuaternion(view.camera.quaternion).applyQuaternion(plateBack)
            const u = (limbRay.x / -limbRay.z - sunRect[0]) / (sunRect[2] - sunRect[0]) - 0.5
            const v = (limbRay.y / -limbRay.z - sunRect[1]) / (sunRect[3] - sunRect[1]) - 0.5
            if (limbRay.z < 0 && Math.hypot(u, v) < sunJson.disc) lo = mid
            else hi = mid
          }
          return lo
        }
        limbLeft = edge(-1)
        limbRight = edge(1)
      }
      const sep = sunShown.angleTo(world.position)
      const disc = Math.asin(Math.min(1 / Math.max(distance, 1), 1))
      const clear = THREE.MathUtils.smoothstep(sep, disc - 0.6 * shot.sun.angularRadius, disc + 0.6 * shot.sun.angularRadius)
      const ghost = shown * clear * state.weight * (1 + 2 * (breath - 1)) * ghosts
      lens.update(sunShown, view.camera, ghost, gain, shot.post.vignette, aspect)
      streak.update(sunShown, view.camera, ghost, gain, shot.post.vignette, aspect, whole, limbLeft, limbRight)
    },
    dispose: () => {
      globe.dispose()
      sunPlate.dispose()
      skyPlate.dispose()
      lens.dispose()
      streak.dispose()
      glare.dispose()
      far.dispose()
      ground.dispose()
    },
  }
}
