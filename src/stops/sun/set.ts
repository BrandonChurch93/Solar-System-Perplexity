import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import type { SetFactory } from '../../core/types'
import { config } from '../../config'
import { Corona } from './corona'
import { Flare } from './flare'
import { Fringe } from './fringe'
import { SunGlobe } from './globe'
import { Ground } from './ground'
import { Loops } from './loops'
import leaveFit from './leave.json'
import * as look from './look'
import { opening, plan } from './plan'
import { Prominences } from './prominence'
import { SkyCard } from './skycard'
import { stage } from './stage'

export const createSet: SetFactory = async (ctx) => {
  const base = 'sun/' + ctx.assets + '/'
  const fit = plan.fit
  const world = new THREE.Group()
  const orbit = new THREE.Group()
  const terrain = new THREE.Group()
  world.add(orbit, terrain)

  const map = await ctx.texture(base + look.files.wrap, { srgb: true, anisotropy: 16, repeat: true })
  const grade = await ctx.texture(base + look.files.grade, { srgb: false, mips: false, anisotropy: 1, flipY: false })
  const globe = new SunGlobe({ map, grade, mapWidth: (map.image as unknown as { width: number }).width, look: look.globe })
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
  const apron = await ctx.texture(base + look.files.apron, { srgb: true, anisotropy: 16, mirror: true })
  const field = await ctx.texture(base + look.files.field, { srgb: true, anisotropy: 16 })
  const ground = new Ground(plate, apron, field, await ctx.texture(base + look.files.loopsGlow, { srgb: true, mips: false, anisotropy: 1 }), grade, look.ground, opening.on ? look.opening.seethe : undefined)
  if (opening.on) ground.land(look.opening.surge.reach, look.opening.surge.veil)
  const fringe = new Fringe(plate, look.fringe)
  const loops = new Loops(await ctx.texture(base + look.files.loops, { srgb: true, anisotropy: 8 }), grade, (data, size) => ctx.floatTexture(data, size, size, true), look.loops, opening.on ? look.opening : undefined)
  const backdropTerrain = new SkyCard(await ctx.texture(base + look.skyTerrain.file, { srgb: true, mips: false, anisotropy: 1 }), look.skyTerrain)
  terrain.add(ground.mesh, fringe.mesh, loops.mesh)
  world.add(backdropTerrain.mesh)
  const flare = new Flare(look.flare)
  world.add(flare.mesh)
  const flareAt = plan.window[0] + look.flare.at
  const kernel = stage.onGround(stage.feet[0]![0]!, stage.feet[0]![1]!).sub(stage.centre).setLength(stage.radius + look.flare.lift).add(stage.centre)
  const kernelGlobe = kernel.clone().sub(stage.centre).divideScalar(stage.radius).applyQuaternion(plan.toGlobe)
  const inGlobe = stage.centre.clone().multiplyScalar(-1 / stage.radius).applyQuaternion(plan.toGlobe)
  const terrainMid = (plan.seg.terrain.start + plan.seg.terrain.end) / 2 + config.shutterFraction / (2 * config.fps)
  const eye = new THREE.Vector3()
  const turn = new THREE.Quaternion()
  const carry = new THREE.Quaternion()
  const spark = new THREE.Vector3()
  const tint = new THREE.Vector3()
  const tint2 = new THREE.Vector3().fromArray(look.dissolve.tint)
  const calm = new THREE.Vector4()
  const wash = new THREE.Vector4()
  const burn = new THREE.Vector4()
  const hot = new THREE.Vector3().fromArray(look.leave.burn.hot)
  const toCam = new THREE.Quaternion()
  const inCam = new THREE.Vector3()
  const centre = new THREE.Vector3()
  const mWorld = new THREE.Matrix4()
  const mCam = new THREE.Matrix4()
  const mFit = new THREE.Matrix4()
  const mBack = new THREE.Matrix4()
  const cone = new THREE.Matrix3().set(leaveFit.cone[0]!, leaveFit.cone[1]!, leaveFit.cone[2]!, leaveFit.cone[1]!, leaveFit.cone[3]!, leaveFit.cone[4]!, leaveFit.cone[2]!, leaveFit.cone[4]!, leaveFit.cone[5]!)
  const mTurn = new THREE.Matrix3()
  const mCone = new THREE.Matrix3()
  orbit.matrixAutoUpdate = false
  const d = look.dissolve
  const share = (x: number, r: [number, number]): number => THREE.MathUtils.smoothstep(x, r[0], r[1])

  return {
    id: plan.id,
    world,
    update: (state, shot, view) => {
      const inOrbit = state.view === 'orbit'
      const kind = state.segment.kind
      const x = kind === 'rise' ? plan.blend(state.time) : inOrbit ? 9 : -9
      const mixed = inOrbit && x < 1
      orbit.visible = inOrbit && state.weight > 0
      terrain.visible = !inOrbit || mixed
      if (mixed) {
        carry.copy(plan.carry(state.time))
        terrain.quaternion.copy(carry).multiply(plan.toGlobe)
        terrain.scale.setScalar(1 / stage.radius)
        terrain.position.copy(inGlobe).applyQuaternion(carry)
        backdropTerrain.mesh.quaternion.copy(plan.toGlobe)
      } else {
        terrain.quaternion.identity()
        terrain.scale.setScalar(1)
        terrain.position.set(0, 0, 0)
        backdropTerrain.mesh.quaternion.identity()
      }
      const gain = 1 / shot.post.exposure
      const aspect = view.format.width / view.format.height
      const vignette = shot.post.vignette
      const skyIn = share(x, d.sky)
      const shown = !inOrbit ? 0 : kind === 'travel' ? 1 - THREE.MathUtils.smoothstep(state.u, look.skyFade[0], look.skyFade[1]) : skyIn
      backdrop.update(shown, gain, vignette, aspect)
      backdropTerrain.update(terrain.visible ? 1 - skyIn : 0, gain, vignette, aspect)
      const burst = kind === 'rise' ? flare.amount(state.time - flareAt) : 0
      flare.update(inOrbit ? spark.copy(kernelGlobe).applyQuaternion(mixed ? carry : carry.identity()) : kernel, world, view.camera, burst, inOrbit ? 1 / stage.radius : 1, gain, aspect)
      if (terrain.visible) {
        const t = state.time - terrainMid
        eye.copy(world.position).negate().applyQuaternion(turn.copy(world.quaternion).invert())
        if (mixed) eye.applyQuaternion(turn.copy(carry).invert()).applyQuaternion(plan.toStage).multiplyScalar(stage.radius).add(stage.centre)
        ground.show(mixed, 1 - share(x, d.ground), 1 - share(x, d.site))
        const since = state.time - plan.seg.terrain.start
        const open = opening.on && kind === 'terrain' ? 1 - share(since, look.opening.fade) : 0
        const feet = loops.pulse(since)
        const surge = loops.surge(since, open)
        ground.update(eye, t, gain * (1 + d.lit.amount * share(x, d.lit.over)), vignette, aspect, fringe.lod(view.camera.fov, view.format.height), look.flare.ground * burst, open, since, look.opening.feet.ground * open * 0.5 * (feet[0] + feet[1]), look.opening.surge.ground * surge[3], look.opening.surge.kick * surge[2])
        fringe.update(eye, t, gain, vignette, aspect, view.camera.fov, view.format.height, 1 - share(x, d.fringe))
        const strands = 1 - share(x, d.loops)
        loops.mesh.visible = strands > 0
        const late = kind === 'rise' ? share(state.time - plan.window[0], d.lean) : 0
        loops.update(t, gain * strands, vignette, aspect, burst * look.flare.loops, Math.max(look.flare.cut * burst * burst, d.cut * late), late, open, since)
        if (!inOrbit) return
      }
      const elapsed = state.time - plan.holdMid
      const spin = plan.spin(state.time)
      const glow = share(x, d.corona)
      const match = 1 - share(x, d.match)
      const dim = 1 + (d.glow - 1) * match
      const leaving = kind === 'travel'
      const going = leaving ? share(state.u, look.leave.over) : 0
      const open = 1 + (look.leave.open - 1) * going
      const flat = leaving ? share(state.u, look.leave.wash) : 0
      const burnt = leaving ? share(state.u, look.leave.burn.over) : 0
      const fitted = leaving ? share(state.u, look.leave.fit) : 0
      const plateEnd = share(look.leave.gone, look.leave.plate)
      const level = going > 0 ? Math.min(Math.max(plateEnd - share(state.u, look.leave.plate), 0) / Math.max(state.weight, 1e-4), plateEnd * look.leave.cap) : 0
      centre.copy(world.position)
      if (fitted > 0) {
        toCam.copy(view.camera.quaternion).invert()
        inCam.copy(world.position).applyQuaternion(toCam)
        const depth = -inCam.z
        mCam.makeRotationFromQuaternion(view.camera.quaternion)
        mTurn.setFromMatrix4(mCam)
        mCone.copy(mTurn).transpose().multiply(cone).multiply(mTurn)
        const q = mCone.elements
        const det = q[0]! * q[4]! - q[3]! * q[3]!
        const px = (q[4]! * q[6]! - q[3]! * q[7]!) / det
        const py = (q[0]! * q[7]! - q[3]! * q[6]!) / det
        const k = q[6]! * px + q[7]! * py - q[8]!
        const m00 = q[0]! / k
        const m01 = q[3]! / k
        const m11 = q[4]! / k
        const root = Math.sqrt(m00 * m11 - m01 * m01)
        const t = Math.sqrt(m00 + m11 + 2 * root)
        const below = (m00 + root) * (m11 + root) - m01 * m01
        const s00 = t * (m11 + root) / below
        const s01 = -t * m01 / below
        const s11 = t * (m00 + root) / below
        const alpha = Math.asin(Math.min(1 / inCam.length(), 1))
        const rho = Math.hypot(inCam.x, inCam.y)
        const theta = Math.atan2(rho, depth)
        const ex = rho > 1e-9 ? inCam.x / rho : 1
        const ey = rho > 1e-9 ? inCam.y / rho : 0
        const hi = Math.tan(theta + alpha)
        const lo = Math.tan(theta - alpha)
        const mid = (hi + lo) / 2
        const along = (hi - lo) / 2
        const across = Math.sqrt(Math.max((mid * Math.sin(theta) + Math.cos(theta)) ** 2 / Math.cos(alpha) ** 2 - mid * mid - 1, 1e-12))
        const i00 = ex * ex / along + ey * ey / across
        const i01 = ex * ey / along - ex * ey / across
        const i11 = ey * ey / along + ex * ex / across
        const b00 = s00 * i00 + s01 * i01
        const b01 = s00 * i01 + s01 * i11
        const b10 = s01 * i00 + s11 * i01
        const b11 = s01 * i01 + s11 * i11
        const near = 1 + Math.sin(alpha) ** 2
        const mx = mid * ex
        const my = mid * ey
        const nx = (px - (b00 * mx + b01 * my)) / near + (b00 * inCam.x + b01 * inCam.y) / depth
        const ny = (py - (b10 * mx + b11 * my)) / near + (b10 * inCam.x + b11 * inCam.y) / depth
        const l00 = 1 + fitted * (b00 - 1)
        const l01 = fitted * b01
        const l10 = fitted * b10
        const l11 = 1 + fitted * (b11 - 1)
        const tx = fitted * (nx * depth - (b00 * inCam.x + b01 * inCam.y))
        const ty = fitted * (ny * depth - (b10 * inCam.x + b11 * inCam.y))
        mFit.set(l00, l01, 0, tx, l10, l11, 0, ty, 0, 0, 1, 0, 0, 0, 0, 1)
        mWorld.compose(world.position, world.quaternion, world.scale)
        orbit.matrix.copy(mWorld).invert().multiply(mCam).multiply(mFit).multiply(mBack.copy(mCam).invert()).multiply(mWorld)
        centre.set(l00 * inCam.x + l01 * inCam.y + tx, l10 * inCam.x + l11 * inCam.y + ty, inCam.z).applyQuaternion(view.camera.quaternion).divideScalar(Math.sqrt(Math.max((l00 * l00 + l01 * l01 + l10 * l10 + l11 * l11 - Math.sqrt(Math.max((l00 * l00 + l01 * l01 + l10 * l10 + l11 * l11) ** 2 - 4 * (l00 * l11 - l01 * l10) ** 2, 0))) / 2, 1e-9)))
      } else orbit.matrix.identity()
      globe.update(elapsed, spin, gain, state.weight, vignette, aspect, tint.set(1, 1, 1).lerp(tint2, match), calm.set(d.calm.knee[0], d.calm.knee[1], d.calm.knee[2], d.calm.press * match), open, wash.set(look.leave.pale[0] * level, look.leave.pale[1] * level, look.leave.pale[2] * level, going > 0 ? Math.max(flat, 1e-6) : 0))
      corona.update(centre, state.rotation, elapsed, gain * dim * (1 + (look.leave.corona - 1) * going), vignette, aspect, look.corona, glow * state.weight, look.corona.edge + (look.leave.edge - look.corona.edge) * fitted)
      prominences.update(elapsed, spin, gain * dim * open, vignette, aspect, glow * state.weight, burn.set(burnt, look.leave.burn.wide, look.leave.burn.level, look.leave.burn.cover), hot)
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
      flare.dispose()
      backdrop.dispose()
      backdropTerrain.dispose()
      ground.dispose()
      fringe.dispose()
      loops.dispose()
    },
  }
}
