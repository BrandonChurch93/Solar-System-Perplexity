import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import { samplesFor } from '../../core/sampler'
import type { SetContext, SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { diagUniform } from '../../diagnostics/diag'
import { drift, mix, ramp, smooth, smoother } from '../../director/rig'
import { Relief } from '../../terrain/relief'
import { closeAhead, closeImage, closeRadius, closeUp as nearUp, wideImage } from './close'
import { config } from '../../config'
import { patches, relief, wide, wrap } from './assets'
import { Glare } from './glare'
import { Globe } from './globe'
import hazeJson from './haze.json'
import { Lens } from './lens'
import lensJson from './lens.json'
import { Limb } from './limb'
import limbJson from './limb.json'
import streakJson from './streak.json'
import * as look from './look'
import { plan } from './plan'
import { curve } from './pace'
import reliefJson from './relief.json'
import { Rim } from './rim'
import rimJson from './rim.json'
import skyJson from './sky.json'
import { SkyPlate } from './skyplate'
import { clearance, ride } from './sunpath'
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
  const swap = plan.rise(covers[1]!)
  const held = clearance(lowSunAt(covers[1]!, new THREE.Quaternion(), true).clone(), swap.pose.position.clone().negate(), swap.pose.position.length())
  const sunShown = new THREE.Vector3()
  const rimSun = new THREE.Vector3()
  const sunTurn = new THREE.Quaternion()
  const toCamera = new THREE.Quaternion()
  const inCamera = new THREE.Vector3()
  const seen = (dir: THREE.Vector3, tan: number): [number, number] | null => {
    inCamera.copy(dir).applyQuaternion(toCamera)
    return inCamera.z > -0.02 ? null : [inCamera.x / -inCamera.z / tan, inCamera.y / -inCamera.z / tan]
  }

  const ground = await Relief.load(ctx, base, relief[key], look.relief)
  const under = await Relief.load(ctx, base, wide[key], look.relief)
  under.group.position.fromArray(wide.position)
  under.group.quaternion.fromArray(wide.quaternion)
  delete under.group.userData.shield
  under.group.traverse((o) => {
    if ((o as THREE.Mesh).material) o.renderOrder = -1
  })
  const wipe = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: 'void main() { gl_Position = vec4(position.xy, 1.0, 1.0); }', fragmentShader: 'void main() { gl_FragColor = vec4(0.0); }', transparent: true, colorWrite: false, depthFunc: THREE.AlwaysDepth, depthWrite: true }))
  wipe.frustumCulled = false
  wipe.renderOrder = -0.5
  const limb = new Limb(await ctx.texture(base + limbJson.file, { srgb: true, mips: false, anisotropy: 1 }), nearUp.clone().multiplyScalar(-(closeRadius + 1)), closeRadius, closeAhead, new THREE.Vector3().crossVectors(closeAhead, nearUp), limbJson.az as [number, number], limbJson.el as [number, number], diagUniform)
  const rim = new Rim(await ctx.texture(base + rimJson.file, { srgb: true, mips: false, anisotropy: 1 }), new Float32Array(await ctx.buffer(base + rimJson.mesh)), rimJson.columns, diagUniform)
  terrain.add(limb.mesh)
  terrain.add(rim.mesh)
  terrain.add(under.group)
  terrain.add(wipe)
  terrain.add(ground.group)
  const maps = (group: THREE.Group, name: string): THREE.Texture | undefined => {
    let found: THREE.Texture | undefined
    group.traverse((o) => {
      found ??= ((o as THREE.Mesh).material as THREE.ShaderMaterial | undefined)?.uniforms?.[name]?.value as THREE.Texture | undefined
    })
    return found
  }
  const shot = maps(ground.group, 'uColor')
  const around = maps(under.group, 'uColor')
  const aroundAlpha = maps(under.group, 'uAlpha')
  const hasClose = !!shot && !!around && !!aroundAlpha
  if (hasClose) {
    const toClose = plan.anchor.frame.clone().invert().multiply(new THREE.Quaternion().fromArray(fit.globe.quaternion))
    const toWide = under.group.quaternion.clone().invert()
    globe.close(shot, toClose, nearUp, closeRadius, closeImage.focal, closeImage.center, closeImage.box, look.close.far, look.close.feather)
    globe.haze(hazeJson.sun, hazeJson.fromDeg, hazeJson.toDeg, hazeJson.gain, look.close.haze.cut, look.close.haze.calm)
    globe.wide(around, aroundAlpha, toWide.clone().multiply(toClose), nearUp.clone().multiplyScalar(closeRadius + 1).add(under.group.position).applyQuaternion(toWide), wideImage.focal, wideImage.center, wideImage.box, look.close.wide.feather[0]![1], [0, 1], 0, closeRadius, wideImage.sink, look.close.wide.drop, look.close.wide.margin, look.close.wide.blur)
  }
  const terrainMid = (plan.seg.terrain.start + plan.seg.terrain.end) / 2
  const wideFar = curve(look.close.wide.far)
  const wideFeather = curve(look.close.wide.feather)
  const above = (pose: { position: THREE.Vector3 } | null): number => Math.acos(closeRadius / (closeRadius + 1 + (pose ? pose.position.dot(nearUp) : 0)))

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
  globe.plain(look.carry.tint)
  if (patchTextures.length > 0) globe.mend(direction(look.mend.lon, look.mend.lat), look.mend.reach, look.mend.from)

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
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2)
      const aspect = view.format.width / view.format.height
      toCamera.copy(view.camera.quaternion).invert()
      if (!inOrbit) {
        glare.update(on ? Math.pow(Math.max((above(plan.low(state.time)) - above(null)) / (above(plan.low(covers[first ? 0 : 1]!)) - above(null)), 0), look.glare.height) : 0, lowSunAt(state.time, state.rotation, false), view.camera, gain, aspect, state.time)
        ground.update(state.time - terrainMid, gain, shot.post.vignette, view)
        under.update(state.time - terrainMid, gain, shot.post.vignette, view)
        limb.update(low.gain * shot.skyGlow * shot.skyExposure, shot.post.vignette, aspect)
        rim.update(gain, shot.post.vignette, aspect)
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
        const lift = look.sun.lift
        ride(lowSunAt(state.time, state.rotation, true), shot.sun.dir, world.position, world.position.length(), smoother(ramp(lift.frames[0], lift.frames[1], fromRise)), held, THREE.MathUtils.degToRad(lift.floor), sunShown)
        rimSun.copy(sunShown)
        glareSun.copy(sunShown)
        shrink = Math.max(ramp(tanFrom, tanTo, tanHalf), 1 - smoother(ramp(lift.grow[0], lift.grow[1], fromRise)))
        plate = smoother(ramp(lift.plate[0], lift.plate[1], fromRise))
        ghosts = smoother(ramp(lift.ghost[0], lift.ghost[1], fromRise))
      }
      glare.update(on ? glare.bloom(first ? fromDive : fromRise, first ? 'dive' : 'rise') : 0, glareSun, view.camera, gain, aspect, state.time)
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
      const covered = mine && hasClose && (kind === 'dive' || kind === 'rise')
      const close = covered ? 1 - THREE.MathUtils.smoothstep(distance - 1, look.close.height[0], look.close.height[1]) : 0
      const grade = diving ? smoother(ramp(look.carry.dive[0], look.carry.dive[1], fromDive)) : rising ? 1 - smoother(ramp(look.carry.rise[0], look.carry.rise[1], fromRise)) : 0
      globe.near(close, (wideImage.sink / closeRadius) * close)
      const high = (distance - 1) * closeRadius
      const capped = covered ? 1 - THREE.MathUtils.smoothstep(high, look.close.lift.height[0], look.close.lift.height[1]) : 0
      const way = rising ? 'rise' : 'dive'
      globe.clear(close > 0 ? look.close.haze.amount * THREE.MathUtils.smoothstep(high, look.close.haze.height[0], look.close.haze.height[1]) : 0, look.close.haze.level[way], [mix(-0.85, look.close.lift.cap[0], capped), mix(1.6, look.close.lift.cap[1], capped)], [look.close.lift.knee[way][0], look.close.lift.knee[way][1] * capped], close > 0 ? THREE.MathUtils.smoothstep(high, look.close.haze.calmHeight[0], look.close.haze.calmHeight[1]) : 0)
      const reach = wideFar(high)
      globe.reach(reach - look.close.wide.soft, reach, wideFeather(high), look.close.wide.over)
      globe.carry(mix(look.carry.gain, look.carry.lift, grade), look.carry.knee, look.carry.grey * grade)
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
      const sep = sunShown.angleTo(world.position)
      const disc = Math.asin(Math.min(1 / Math.max(distance, 1), 1))
      const clear = THREE.MathUtils.smoothstep(sep, disc - 0.6 * shot.sun.angularRadius, disc + 0.6 * shot.sun.angularRadius)
      const ghost = shown * clear * state.weight * (1 + 2 * (breath - 1)) * ghosts
      lens.update(sunShown, view.camera, ghost, gain, shot.post.vignette, aspect)
      streak.update(sunShown, view.camera, ghost, gain, shot.post.vignette, aspect)
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
      under.dispose()
      limb.dispose()
      rim.dispose()
      wipe.geometry.dispose()
      wipe.material.dispose()
    },
  }
}
