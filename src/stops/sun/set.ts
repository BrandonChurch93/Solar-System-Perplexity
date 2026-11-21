import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import type { SetFactory } from '../../core/types'
import { config } from '../../config'
import { Corona } from './corona'
import { Fringe } from './fringe'
import { SunGlobe } from './globe'
import { Ground } from './ground'
import { Loops } from './loops'
import * as look from './look'
import { plan } from './plan'
import { Prominences } from './prominence'
import { SkyCard } from './skycard'

export const createSet: SetFactory = async (ctx) => {
  const base = 'sun/' + ctx.assets + '/'
  const fit = plan.fit
  const world = new THREE.Group()
  const orbit = new THREE.Group()
  const terrain = new THREE.Group()
  world.add(orbit, terrain)

  const map = await ctx.texture(base + look.files.wrap, { srgb: true, anisotropy: 16, repeat: true })
  const globe = new SunGlobe({ map, mapWidth: (map.image as unknown as { width: number }).width, look: look.globe })
  globe.mesh.quaternion.fromArray(fit.globe.quaternion)
  orbit.add(globe.mesh)

  const corona = new Corona(await ctx.texture(base + look.files.corona, { srgb: true, anisotropy: 4, repeat: true }), look.corona)
  orbit.add(corona.mesh)

  const prominences = new Prominences(await ctx.texture(base + look.files.prominence, { srgb: true, anisotropy: 8 }), await ctx.texture(base + look.files.prominenceFlow, { srgb: false }), look.prominence)
  orbit.add(prominences.mesh)

  const backdrop = new SkyCard(await ctx.texture(base + look.sky.file, { srgb: true, mips: false, anisotropy: 1 }), look.sky)
  world.add(backdrop.mesh)

  const far = new FarPoint()
  orbit.add(far.points)

  const plate = await ctx.texture(base + look.files.plate, { srgb: true, anisotropy: 16, mirror: true })
  const ground = new Ground(plate, look.ground)
  const fringe = new Fringe(plate, look.fringe)
  const loops = new Loops(await ctx.texture(base + look.files.loops, { srgb: true, anisotropy: 8 }), (data, size) => ctx.floatTexture(data, size, size, true), look.loops)
  const backdropTerrain = new SkyCard(await ctx.texture(base + look.skyTerrain.file, { srgb: true, mips: false, anisotropy: 1 }), look.skyTerrain)
  terrain.add(ground.mesh, fringe.mesh, loops.mesh)
  world.add(backdropTerrain.mesh)
  const terrainMid = (plan.seg.terrain.start + plan.seg.terrain.end) / 2 + config.shutterFraction / (2 * config.fps)
  const eye = new THREE.Vector3()
  const turn = new THREE.Quaternion()

  return {
    id: plan.id,
    world,
    update: (state, shot, view) => {
      const inOrbit = state.view === 'orbit'
      orbit.visible = inOrbit && state.weight > 0
      terrain.visible = !inOrbit
      const gain = 1 / shot.post.exposure
      const aspect = view.format.width / view.format.height
      const vignette = shot.post.vignette
      const kind = state.segment.kind
      const shown = !inOrbit ? 0 : kind === 'travel' ? 1 - THREE.MathUtils.smoothstep(state.u, look.skyFade[0], look.skyFade[1]) : 1
      backdrop.update(shown, gain, vignette, aspect)
      backdropTerrain.update(inOrbit ? 0 : 1, gain, vignette, aspect)
      if (!inOrbit) {
        const t = state.time - terrainMid
        eye.copy(world.position).negate().applyQuaternion(turn.copy(world.quaternion).invert())
        ground.update(eye, t, gain, vignette, aspect, fringe.lod(view.camera.fov, view.format.height))
        fringe.update(eye, t, gain, vignette, aspect, view.camera.fov, view.format.height)
        loops.update(t, gain, vignette, aspect)
        return
      }
      const elapsed = state.time - plan.holdMid
      const spin = plan.spin(state.time)
      globe.update(elapsed, spin, gain, state.weight, vignette, aspect)
      corona.update(world.position, state.rotation, elapsed, gain * state.weight, vignette, aspect, look.corona)
      prominences.update(elapsed, spin, gain * state.weight, vignette, aspect)
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      const visible = radiusPx > 0.6
      globe.mesh.visible = visible
      corona.mesh.visible = visible
      prominences.mesh.visible = visible
      far.update(radiusPx, view, plan.p.tint, gain)
    },
    dispose: () => {
      globe.dispose()
      corona.dispose()
      prominences.dispose()
      far.dispose()
      backdrop.dispose()
      backdropTerrain.dispose()
      ground.dispose()
      fringe.dispose()
      loops.dispose()
    },
  }
}
