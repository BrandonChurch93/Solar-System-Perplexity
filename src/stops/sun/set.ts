import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import type { SetFactory } from '../../core/types'
import { Corona } from './corona'
import { SunGlobe } from './globe'
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
      if (!inOrbit) return
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
    },
  }
}
