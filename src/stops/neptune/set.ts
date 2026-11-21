import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import type { SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { diagUniform } from '../../diagnostics/diag'
import { smooth } from '../../director/rig'
import { Air } from './air'
import { moon as moonAsset, plate as plateAsset, ringMap, wrap } from './assets'
import { limbField } from './field'
import * as look from './look'
import { plan } from './plan'
import { NeptunePlanet } from './planet'
import { Plate } from './plate'
import { Ring } from './ring'
import skyJson from './sky.json'
import { Triton } from './triton'

function direction(lonDeg: number, latDeg: number): THREE.Vector3 {
  const lon = THREE.MathUtils.degToRad(lonDeg)
  const lat = THREE.MathUtils.degToRad(latDeg)
  return new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon))
}

export const createSet: SetFactory = async (ctx) => {
  const base = 'neptune/' + ctx.assets + '/'
  const fit = plan.fit
  const world = new THREE.Group()
  const orbit = new THREE.Group()
  const terrain = new THREE.Group()
  world.add(orbit, terrain)

  const map = await ctx.texture(base + wrap.file, { srgb: true, anisotropy: 16, repeat: true })
  const field = limbField()
  const planet = new NeptunePlanet({
    field,
    map, mapWidth: (map.image as unknown as { width: number }).width, code: look.code, deck: look.deck, cloud: look.cloud, air: look.air, limb: look.limb, clouds: look.clouds,
    storm: { axis: direction(look.storm.lon, look.storm.lat), radiusDeg: look.storm.radiusDeg },
  })
  planet.mesh.quaternion.fromArray(fit.globe.quaternion)
  planet.mesh.scale.fromArray(fit.globe.scale)
  const air = new Air(look.air, diagUniform)
  air.share(planet.material.uniforms)
  orbit.add(planet.mesh, air.mesh)
  const rimAim = new THREE.Vector3().fromArray(look.limb.rimAim)
  const darkAim = new THREE.Vector3().fromArray(look.limb.darkAim)
  const veilAim = new THREE.Vector3().fromArray(look.limb.veilAim)

  const tritonFit = fit.moons![0]!
  const moonMap = await ctx.texture(base + moonAsset.file, { srgb: true, anisotropy: 16, repeat: true })
  const triton = new Triton({ map: moonMap, mapWidth: (moonMap.image as unknown as { width: number }).width, radius: tritonFit.radius, gain: look.triton.gain, sun: look.triton.sun, ambient: look.triton.ambient, terminator: look.triton.terminator, power: look.triton.power, bump: look.triton.bump, rim: look.triton.rim })
  orbit.add(triton.mesh)
  const moonHome = new THREE.Vector3().fromArray(tritonFit.position)
  const moonUp = new THREE.Vector3().fromArray(look.triton.up).normalize()
  const moonHold = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), moonUp)
  const moonSpin = new THREE.Quaternion()
  const moonAim = new THREE.Vector3().fromArray(look.triton.aim)
  const moonLight = new THREE.Vector3()

  const ring = new Ring({ ...look.ring, map: await ctx.texture(base + ringMap.file, { srgb: false, anisotropy: 16, repeat: true }) })
  orbit.add(ring.mesh)

  const far = new FarPoint()
  orbit.add(far.points)

  const plate = new Plate(await ctx.texture(base + plateAsset.file, { srgb: true, anisotropy: 8, mirror: true }), plan.p.terrain)
  terrain.add(plate.mesh)

  const light = new THREE.Vector3()
  const camera = new THREE.Vector3()
  const turn = new THREE.Quaternion()
  const side = new THREE.Vector3()
  const sideCam = new THREE.Vector3()
  const holdPose = plan.hold(plan.holdMid - plan.seg.hold.start)
  const holdDirection = new THREE.Vector3()

  const sky: SkyPatch[] = []
  for (const [view, def] of Object.entries(skyJson)) {
    const wide = 1 + 2 * def.margin
    const t = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2) * wide
    sky.push({ view: view as ViewKind, texture: await ctx.texture(base + def.file, { srgb: true, mips: false, anisotropy: 1 }), aim: new THREE.Quaternion(), tan: [t * 16 / 9, t], gain: def.gain, add: def.add, ring: def.ring as [number, number, number, number], edge: def.margin / wide })
  }

  return {
    id: plan.id,
    world,
    sky,
    update: (state, shot, view) => {
      const inOrbit = state.view === 'orbit'
      orbit.visible = inOrbit && state.weight > 0
      terrain.visible = !inOrbit
      const gain = 1 / shot.post.exposure
      if (!inOrbit) {
        plate.material.uniforms.uGain!.value = gain
        return
      }
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      light.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      camera.copy(world.position).negate()
      const elapsed = state.time - plan.holdMid
      const bounded = Math.min(Math.max(elapsed, -12), 12)
      const offAxis = THREE.MathUtils.radToDeg(camera.angleTo(holdDirection.copy(holdPose.position).applyQuaternion(state.rotation)))
      const home = ending ? 0 : 1 - smooth((offAxis - look.holdness.fromDeg) / (look.holdness.toDeg - look.holdness.fromDeg))
      const pu = planet.material.uniforms
      air.update(camera, light, state.rotation, home, 1 - smooth((look.lineFade[0] - (camera.length() - 1)) / (look.lineFade[0] - look.lineFade[1])), gain * state.weight)
      ;(pu.uRimDir!.value as THREE.Vector3).copy(rimAim).applyQuaternion(state.rotation).multiplyScalar(home).add(light).normalize()
      ;(pu.uDarkDir!.value as THREE.Vector3).copy(darkAim).applyQuaternion(state.rotation).multiplyScalar(home).add(light).normalize()
      ;(pu.uVeilDir!.value as THREE.Vector3).copy(veilAim).applyQuaternion(state.rotation).multiplyScalar(home).add(light).normalize()
      ;(pu.uLimbDark!.value as THREE.Vector3).x = look.limb.dark * home
      ;(pu.uAirShade!.value as THREE.Vector4).w = home
      side.copy(light).cross(sideCam.copy(camera).normalize()).normalize()
      ;(pu.uFieldSide!.value as THREE.Vector4).set(side.x, side.y, side.z, home * look.field.amount)
      planet.update(plan.spin(state.time), THREE.MathUtils.degToRad(look.stream.degPerSecond) * elapsed, THREE.MathUtils.degToRad(look.storm.degPerSecond) * bounded, gain, state.weight)
      pu.uVignette!.value = shot.post.vignette * home
      pu.uAspect!.value = view.format.width / view.format.height
      turn.setFromAxisAngle(plan.axis, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * elapsed)
      triton.mesh.position.copy(moonHome).applyQuaternion(turn)
      triton.mesh.quaternion.copy(moonSpin.setFromAxisAngle(moonUp, THREE.MathUtils.degToRad(look.triton.spinDegPerSecond) * elapsed)).multiply(moonHold)
      triton.update(moonLight.copy(moonAim).applyQuaternion(state.rotation).multiplyScalar(home).add(light).normalize(), gain * state.weight)
      ring.update(light, state.rotation, THREE.MathUtils.degToRad(look.ring.degPerSecond) * elapsed, home, gain * state.weight)
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      const visible = radiusPx > 0.6
      planet.mesh.visible = visible
      air.mesh.visible = visible
      triton.mesh.visible = visible
      ring.mesh.visible = visible
      far.update(radiusPx, view, plan.p.tint, gain)
    },
    dispose: () => {
      planet.dispose()
      field.texture.dispose()
      air.dispose()
      triton.dispose()
      ring.dispose()
      far.dispose()
      plate.dispose()
    },
  }
}
