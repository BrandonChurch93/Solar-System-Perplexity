import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import type { SetContext, SetFactory } from '../../core/types'
import { smooth } from '../../director/rig'
import { Globe } from './globe'
import { Halo } from './halo'
import * as look from './look'
import { Moon } from './moons'
import { plan } from './plan'

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
  const base = 'uranus/' + ctx.assets + '/'
  const fit = plan.fit
  const world = new THREE.Group()
  const orbit = new THREE.Group()
  const terrain = new THREE.Group()
  world.add(orbit, terrain)

  const map = await ctx.texture(base + 'wrap-color.jpg', { srgb: true, anisotropy: 16, repeat: true })
  const cloud = await ctx.texture(base + 'wrap-cloud.png', { srgb: false, anisotropy: 16, repeat: true })
  const light = await ctx.dataTexture(base + 'light.bin', look.globe.lightSize[0], look.globe.lightSize[1], 4)
  const haloLut = await ctx.dataTexture(base + 'halo.bin', look.halo.size[0], look.halo.size[1], 4)
  const globe = new Globe({ map, cloud, light, ...look.globe })
  globe.mesh.quaternion.fromArray(fit.globe.quaternion)
  const halo = new Halo(haloLut, look.halo.size, look.halo.range)
  orbit.add(globe.mesh, halo.mesh)

  const ringNormal = new THREE.Vector3().fromArray(fit.rings!.normal).normalize()
  const moonSize = look.moons.heightSize[key]
  const moons: { body: Moon; home: THREE.Vector3; spinAxis: THREE.Vector3; phase: number }[] = []
  for (const [i, m] of (fit.moons ?? []).entries()) {
    const body = new Moon({
      map: await ctx.texture(base + m.id + '-color.jpg', { srgb: true, anisotropy: 16, repeat: true }),
      height: ctx.floatTexture(await heights(ctx, base + m.id + '-height.bin', moonSize[0], moonSize[1]), moonSize[0], moonSize[1], true),
      heightWidth: moonSize[0], bump: look.moons.bump, sun: look.moons.sun, ambient: look.moons.ambient, bounce: look.moons.bounce,
    })
    body.mesh.scale.setScalar(m.radius)
    orbit.add(body.mesh)
    moons.push({ body, home: new THREE.Vector3().fromArray(m.position), spinAxis: new THREE.Vector3(0.3 - 0.5 * i, 1, 0.2).normalize(), phase: 1.1 + 2.3 * i })
  }

  const far = new FarPoint()
  orbit.add(far.points)

  const sun = new THREE.Vector3()
  const camera = new THREE.Vector3()
  const turn = new THREE.Quaternion()
  const bounce = new THREE.Vector3()

  return {
    id: plan.id,
    world,
    update: (state, shot, view) => {
      const inOrbit = state.view === 'orbit'
      orbit.visible = inOrbit && state.weight > 0
      terrain.visible = !inOrbit
      const gain = 1 / shot.post.exposure
      if (!inOrbit) return
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      sun.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      camera.copy(world.position).negate()
      const elapsed = state.time - plan.holdMid
      const aspect = view.format.width / view.format.height
      globe.update(sun, plan.spin(state.time), elapsed, gain, state.weight, shot.post.vignette, aspect)
      halo.update(camera, sun, gain * state.weight)
      turn.setFromAxisAngle(ringNormal, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * elapsed)
      for (const m of moons) {
        m.body.mesh.position.copy(m.home).applyQuaternion(turn)
        m.body.mesh.quaternion.setFromAxisAngle(m.spinAxis, m.phase + THREE.MathUtils.degToRad(look.moons.spinDegPerSecond) * elapsed)
        bounce.copy(m.body.mesh.position).negate().normalize().applyQuaternion(state.rotation)
        m.body.update(sun, bounce, gain * state.weight, shot.post.vignette, aspect)
      }
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      const visible = radiusPx > 0.6
      globe.mesh.visible = visible
      halo.mesh.visible = visible
      for (const m of moons) m.body.mesh.visible = visible
      far.update(radiusPx, view, plan.p.tint, gain)
    },
    dispose: () => {
      globe.dispose()
      halo.dispose()
      for (const m of moons) m.body.dispose()
      far.dispose()
    },
  }
}
