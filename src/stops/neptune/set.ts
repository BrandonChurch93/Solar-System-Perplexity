import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import type { SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { diagUniform } from '../../diagnostics/diag'
import { smooth } from '../../director/rig'
import { Air } from './air'
import { close, held, moon as moonAsset, ringBands, ringMap, wrap } from './assets'
import { Closeup } from './closeup'
import { limbField } from './field'
import * as look from './look'
import { plan } from './plan'
import patches from './patches.json'
import { NeptunePlanet } from './planet'
import { Ring } from './ring'
import skyJson from './sky.json'
import { Triton } from './triton'

function direction(lonDeg: number, latDeg: number): THREE.Vector3 {
  const lon = THREE.MathUtils.degToRad(lonDeg)
  const lat = THREE.MathUtils.degToRad(latDeg)
  return new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon))
}

function eased(t: number, full: number, ease: number): number {
  const a = Math.abs(t)
  if (a <= full) return t
  const x = Math.min((a - full) / ease, 1)
  return Math.sign(t) * (full + ease * (x - 0.5 * x * x))
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
  const holdMap = await ctx.texture(base + held.file, { srgb: true, anisotropy: 16 })
  const patchTextures = await Promise.all(patches.levels.map((level) => ctx.texture(base + level.file, { srgb: true, anisotropy: 16 })))
  const planet = new NeptunePlanet({
    field, near: look.near.dive, night: look.night,
    map, mapWidth: (map.image as unknown as { width: number }).width, code: look.code, deck: look.deck, cloud: look.cloud, air: look.air, limb: look.limb, clouds: look.clouds,
    storm: { axis: direction(look.storm.lon, look.storm.lat), radiusDeg: look.storm.radiusDeg },
    patches: { textures: patchTextures, widthsDeg: patches.levels.map((l) => l.widthDeg), spot: direction(patches.spot.lon, patches.spot.lat), feather: patches.feather, fade: [patches.fade[0]!, patches.fade[1]!] },
    hold: { map: holdMap, box: look.held.box, head: look.held.head },
  })
  planet.mesh.quaternion.fromArray(fit.globe.quaternion)
  planet.mesh.scale.fromArray(fit.globe.scale)
  const air = new Air(look.air, diagUniform)
  air.share(planet.material.uniforms)
  orbit.add(planet.mesh, air.mesh)
  const rimAim = new THREE.Vector3().fromArray(look.limb.rimAim)
  const darkAim = new THREE.Vector3().fromArray(look.limb.darkAim)
  const cutAim = new THREE.Vector3().fromArray(look.limb.cutAim)
  const veilAim = new THREE.Vector3().fromArray(look.limb.veilAim)

  const tritonFit = fit.moons![0]!
  const moonMap = await ctx.texture(base + moonAsset.file, { srgb: true, anisotropy: 16, repeat: true })
  const triton = new Triton({ map: moonMap, mapWidth: (moonMap.image as unknown as { width: number }).width, radius: tritonFit.radius, gain: look.triton.gain, sun: look.triton.sun, ambient: look.triton.ambient, terminator: look.triton.terminator, power: look.triton.power, bump: look.triton.bump, rim: look.triton.rim })
  orbit.add(triton.mesh)
  const moonHome = new THREE.Vector3().fromArray(tritonFit.position)
  const moonStage = new THREE.Vector3().fromArray(look.triton.stage).applyAxisAngle(plan.axis, -THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * (plan.seg.rise.end - plan.holdMid))
  const moonUp = new THREE.Vector3().fromArray(look.triton.up).normalize()
  const moonHold = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), moonUp)
  const moonSpin = new THREE.Quaternion()
  const moonAim = new THREE.Vector3().fromArray(look.triton.aim)
  const moonLight = new THREE.Vector3()
  const moonSun = new THREE.Vector3()

  const ring = new Ring({ ...look.ring, map: await ctx.texture(base + ringMap.file, { srgb: false, anisotropy: 16, repeat: true }), bands: await ctx.texture(base + ringBands.file, { srgb: false, anisotropy: 16, repeat: true }) })
  orbit.add(ring.mesh)

  const far = new FarPoint()
  orbit.add(far.points)

  const closeup = new Closeup({
    deck: await ctx.texture(base + close.deck, { srgb: true, anisotropy: 16 }),
    cloud: await ctx.texture(base + close.cloud, { srgb: true, anisotropy: 16 }),
    deckWide: await ctx.texture(base + close.deckWide, { srgb: true, anisotropy: 16, mirror: true }),
    cloudWide: await ctx.texture(base + close.cloudWide, { srgb: true, anisotropy: 16, mirror: true }),
    height: await ctx.texture(base + close.height, { srgb: false, anisotropy: 4, mirror: true }),
    glow: await ctx.texture(base + close.glow, { srgb: true, mips: false, anisotropy: 1 }),
    bloom: await ctx.texture(base + close.bloom, { srgb: true, mips: false, anisotropy: 1 }),
  })
  terrain.add(closeup.mesh)
  const terrainMid = (plan.seg.terrain.start + plan.seg.terrain.end) / 2

  const light = new THREE.Vector3()
  const camera = new THREE.Vector3()
  const turn = new THREE.Quaternion()
  const side = new THREE.Vector3()
  const sideCam = new THREE.Vector3()
  const edgeSun = new THREE.Vector3()
  const edgeTurn = THREE.MathUtils.degToRad(look.limb.edge.wideDeg)
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
        camera.copy(world.position).negate().applyQuaternion(turn.copy(state.rotation).invert())
        closeup.update(camera, state.time - terrainMid, gain, shot.post.vignette, view.format.width / view.format.height, shot.post.bloomStrength)
        return
      }
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      light.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      camera.copy(world.position).negate()
      const elapsed = state.time - plan.holdMid
      const offAxis = THREE.MathUtils.radToDeg(camera.angleTo(holdDirection.copy(holdPose.position).applyQuaternion(state.rotation)))
      const home = ending ? 0 : 1 - smooth((offAxis - look.holdness.fromDeg) / (look.holdness.toDeg - look.holdness.fromDeg))
      const pu = planet.material.uniforms
      const rising = state.segment.kind === 'rise'
      const grade = rising ? look.near.rise : look.near.dive
      const high = camera.length() - 1
      const near = look.near.amount * (1 - smooth((high - grade.altitude[0]!) / (grade.altitude[1]! - grade.altitude[0]!)))
      air.update(camera, light, state.rotation, home, 1 - smooth((look.lineFade[0] - (camera.length() - 1)) / (look.lineFade[0] - look.lineFade[1])), gain * state.weight, near, grade.air)
      ;(pu.uRimDir!.value as THREE.Vector3).copy(rimAim).applyQuaternion(state.rotation).multiplyScalar(home).add(light).normalize()
      ;(pu.uCutDir!.value as THREE.Vector3).copy(cutAim).applyQuaternion(state.rotation).multiplyScalar(home).add(light).normalize()
      ;(pu.uCut!.value as THREE.Vector4).w = home
      ;(pu.uDarkDir!.value as THREE.Vector3).copy(darkAim).applyQuaternion(state.rotation).multiplyScalar(home).add(light).normalize()
      ;(pu.uVeilDir!.value as THREE.Vector3).copy(veilAim).applyQuaternion(state.rotation).multiplyScalar(home).add(light).normalize()
      ;(pu.uLimbDark!.value as THREE.Vector3).x = look.limb.dark * home
      ;(pu.uAirShade!.value as THREE.Vector4).w = home
      ;(pu.uNight!.value as THREE.Vector4).x = look.night.flat * (1 - home)
      ;(pu.uMelt!.value as THREE.Vector2).x = look.limb.melt[1] + (look.limb.melt[0] - look.limb.melt[1]) * home
      side.copy(light).cross(sideCam.copy(camera).normalize()).normalize()
      edgeSun.copy(light).addScaledVector(sideCam, -light.dot(sideCam)).normalize()
      ;(pu.uEdgeSun!.value as THREE.Vector3).copy(edgeSun)
      ;(pu.uEdgeSide!.value as THREE.Vector3).copy(side).negate()
      ;(pu.uEdgeWideDir!.value as THREE.Vector3).copy(edgeSun).multiplyScalar(Math.cos(edgeTurn)).addScaledVector(side, -Math.sin(edgeTurn))
      ;(pu.uEdgeShape!.value as THREE.Vector4).w = home * look.limb.edge.amount
      ;(pu.uFieldSide!.value as THREE.Vector4).set(side.x, side.y, side.z, home * look.field.amount)
      ;(pu.uHold!.value as THREE.Vector2).x = home * look.held.amount
      planet.update(plan.spin(state.time), THREE.MathUtils.degToRad(look.stream.degPerSecond) * eased(elapsed, look.stream.fullSeconds, look.stream.easeSeconds), THREE.MathUtils.degToRad(look.storm.degPerSecond) * eased(elapsed, look.storm.fullSeconds, look.storm.easeSeconds), gain, state.weight, near, grade.gain)
      ;(pu.uNearFall!.value as THREE.Vector3).set(THREE.MathUtils.degToRad(grade.fall[0]!), THREE.MathUtils.degToRad(grade.fall[1]!), 1 - (1 - grade.fall[2]!) * (1 - smooth((high - grade.fallAltitude[0]!) / (grade.fallAltitude[1]! - grade.fallAltitude[0]!))))
      ;(pu.uNear!.value as THREE.Vector4).z = grade.power
      ;(pu.uNear!.value as THREE.Vector4).w = grade.saturation
      ;(pu.uNearTint!.value as THREE.Vector4).set(grade.tint[0]!, grade.tint[1]!, grade.tint[2]!, grade.pivot)
      pu.uVignette!.value = shot.post.vignette * home
      pu.uAspect!.value = view.format.width / view.format.height
      turn.setFromAxisAngle(plan.axis, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * elapsed)
      triton.mesh.position.copy(state.time < terrainMid ? moonHome : moonStage).applyQuaternion(turn)
      triton.mesh.quaternion.copy(moonSpin.setFromAxisAngle(moonUp, THREE.MathUtils.degToRad(look.triton.spinDegPerSecond) * elapsed)).multiply(moonHold)
      const staged = state.time >= terrainMid
      const moonLook = staged ? look.triton.rise : look.triton
      triton.shape(moonLook.terminator, moonLook.power, moonLook.ambient, look.triton.gain, moonLook.bump)
      moonSun.copy(light)
      if (staged) moonSun.lerp(shot.sun.dir, look.triton.rise.sun).normalize()
      triton.update(moonLight.copy(moonAim).applyQuaternion(state.rotation).multiplyScalar(home).add(moonSun).normalize(), gain * state.weight)
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
      closeup.dispose()
    },
  }
}
