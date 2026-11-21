import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import type { SetContext, SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { diagUniform } from '../../diagnostics/diag'
import { drift, ramp, smooth } from '../../director/rig'
import { Relief } from '../../terrain/relief'
import { patches, relief, wrap } from './assets'
import { Globe } from './globe'
import { Lens } from './lens'
import * as look from './look'
import { plan } from './plan'
import skyJson from './sky.json'
import { SunPlate } from './sunplate'
import sunJson from './sunplate.json'

interface SkyDef { file: string; vfovDeg: number; margin: number; gain: number; add: boolean; ring: number[] }

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
  const sunPlate = new SunPlate(await ctx.texture(base + sunJson.file, { srgb: true, anisotropy: 4 }), sunJson.rect as [number, number, number, number], diagUniform)
  const sunAim = new THREE.Quaternion()
  const holdCam = plan.hold(plan.holdMid - plan.seg.hold.start).quaternion.clone().multiply(drift(plan.holdMid))
  orbit.add(sunPlate.mesh, globe.mesh, far.points)
  const lens = new Lens(look.lens, diagUniform)
  const near = new THREE.Group()
  near.add(lens.mesh)

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
    sky.push({ view: view as ViewKind, texture: await ctx.texture(base + def.file, { srgb: true, mips: false, anisotropy: 1 }), aim: new THREE.Quaternion(), tan: [tan * 16 / 9, tan], gain: def.gain, add: def.add, ring: def.ring as [number, number, number, number], edge: def.margin / wide })
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
      if (!inOrbit) {
        ground.update(state.time - terrainMid, gain, shot.post.vignette, view)
        return
      }
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      light.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      const offAxis = THREE.MathUtils.radToDeg(shot.sun.dir.angleTo(forward.set(0, 0, -1).applyQuaternion(view.camera.quaternion)))
      globe.update(light, shot.sun.dir, 1 - THREE.MathUtils.smoothstep(offAxis, look.light.glareLens[0], look.light.glareLens[1]), plan.spin(state.time), gain, state.weight, Math.min(holdRadius / Math.max(radiusPx / view.format.height, 1e-6), 1), shot.post.vignette, view.format.width / view.format.height)
      globe.mesh.visible = radiusPx > 0.6
      far.update(radiusPx, view, plan.p.tint, gain)
      const travel = state.segment.kind === 'travel' ? smooth(ramp(0.25, 0.8, state.u)) : 1
      const shown = state.segment.kind === 'travel' && state.segment.stop === plan.id ? 1 - travel : travel
      const tau = state.time - plan.holdMid
      const breath = 1 + look.sun.breathe * (Math.sin(tau * look.sun.rate) + 0.6 * Math.sin(tau * look.sun.rate * 1.63))
      const aspect = view.format.width / view.format.height
      sunPlate.update(sunAim.copy(state.rotation).multiply(holdCam), gain * shown * look.sun.gain * breath, shot.post.vignette, aspect)
      const sep = shot.sun.dir.angleTo(world.position)
      const disc = Math.asin(Math.min(1 / Math.max(distance, 1), 1))
      const clear = THREE.MathUtils.smoothstep(sep, disc - 0.6 * shot.sun.angularRadius, disc + 0.6 * shot.sun.angularRadius)
      lens.update(shot.sun.dir, view.camera, shown * clear * state.weight * (1 + 2 * (breath - 1)), gain, shot.post.vignette, aspect)
    },
    dispose: () => {
      globe.dispose()
      sunPlate.dispose()
      lens.dispose()
      far.dispose()
      ground.dispose()
    },
  }
}
