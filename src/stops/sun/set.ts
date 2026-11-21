import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import type { SetFactory } from '../../core/types'
import { SunGlobe } from './globe'
import * as look from './look'
import { plan } from './plan'

export const createSet: SetFactory = async (ctx) => {
  const base = 'sun/' + ctx.assets + '/'
  const fit = plan.fit
  const world = new THREE.Group()
  const orbit = new THREE.Group()
  const terrain = new THREE.Group()
  world.add(orbit, terrain)

  const map = await ctx.texture(base + look.wrapFile, { srgb: true, anisotropy: 16, repeat: true })
  const globe = new SunGlobe({ map, mapWidth: (map.image as unknown as { width: number }).width, look: look.globe })
  globe.mesh.quaternion.fromArray(fit.globe.quaternion)
  orbit.add(globe.mesh)

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
      if (!inOrbit) return
      const elapsed = state.time - plan.holdMid
      globe.update(elapsed, plan.spin(state.time), gain, state.weight, shot.post.vignette, view.format.width / view.format.height)
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      globe.mesh.visible = radiusPx > 0.6
      far.update(radiusPx, view, plan.p.tint, gain)
    },
    dispose: () => {
      globe.dispose()
      far.dispose()
    },
  }
}
