import * as THREE from 'three'
import { Atmosphere } from '../../bodies/atmosphere'
import { Globe } from '../../bodies/globe'
import type { SetFactory } from '../../core/types'

export const createSpikeSet: SetFactory = async (ctx) => {
  const map = await ctx.texture('spike/' + ctx.assets + '/wrap.jpg', { srgb: true, anisotropy: 8 })
  const copies = Number(new URLSearchParams(location.search).get('copies') ?? 1)
  const extra: THREE.Texture[] = []
  for (let i = 1; i < copies; i++) extra.push(await ctx.texture('spike/' + ctx.assets + '/wrap.jpg?c=' + i, { srgb: true }))
  const globe = new Globe({ map })
  const air = new Atmosphere({ color: new THREE.Color(1.0, 0.55, 0.3), strength: 1.6, power: 3.5 })
  const world = new THREE.Group()
  world.add(globe.mesh, air.mesh)
  return {
    id: 'spike',
    world,
    update: (state, shot) => {
      const local = shot.sun.dir.clone()
      globe.material.uniforms.uSunDir!.value.copy(local)
      globe.material.uniforms.uSunColor!.value.copy(shot.sun.color).multiplyScalar(shot.sun.intensity)
      globe.material.uniforms.uSpin!.value = state.time * 0.02
      air.material.uniforms.uSunDir!.value.copy(local)
    },
    dispose: () => {
      globe.dispose()
      air.dispose()
      for (const t of extra) t.dispose()
    },
  }
}
