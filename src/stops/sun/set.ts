import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import type { SetFactory } from '../../core/types'
import { config } from '../../config'
import { Surface } from './convect'
import { LabGround } from './lab/ground'
import lab from './lab/lab.json'
import { Jets } from './jets'
import { Corona } from './corona'
import { Fringe } from './fringe'
import { SunGlobe } from './globe'
import { Ground } from './ground'
import { Arcade } from './arcs'
import leaveFit from './leave.json'
import place from './place.json'
import ring from './corona-ring.json'
import * as look from './look'
import { opening, plan } from './plan'
import { Prominences } from './prominence'
import { SkyCard } from './skycard'
import { lifeCalm, lifeFormat } from './life'
import { formatUniform, setFormat } from './format'
import { stage } from './stage'
import { farSun, globeShare } from '../../space/farsun/farsun'

export const createSet: SetFactory = async (ctx) => {
  const base = 'sun/' + ctx.assets + '/'
  const fit = plan.fit
  const world = new THREE.Group()
  const orbit = new THREE.Group()
  const terrain = new THREE.Group()
  world.add(orbit, terrain)

  const map = await ctx.texture(base + look.files.wrap, { srgb: true, anisotropy: 16, repeat: true })
  const grade = await ctx.texture(base + look.files.grade, { srgb: false, mips: false, anisotropy: 1, flipY: false })
  const plate = await ctx.texture(base + look.files.plate, { srgb: true, anisotropy: 16, mirror: true })
  const apron = await ctx.texture(base + look.files.apron, { srgb: true, anisotropy: 16, mirror: true })
  const field = await ctx.texture(base + look.files.field, { srgb: true, anisotropy: 16 })
  const lifeMap = (file: string): Promise<THREE.Texture> => ctx.texture(base + file, { srgb: false, anisotropy: 4, mirror: true })
  const life = { cellsPlate: await lifeMap(look.files.cellsPlate), swellPlate: await lifeMap(look.files.swellPlate), cellsApron: await lifeMap(look.files.cellsApron), swellApron: await lifeMap(look.files.swellApron) }
  const ground = new Ground(plate, apron, field, await ctx.texture(base + look.files.loopsGlow, { srgb: true, mips: false, anisotropy: 1 }), grade, look.ground, life, opening.on ? look.opening.seethe : undefined)
  // which ground stands is the stop's own key (place.json ground), not the lab's manifest
  // the levels of the place on the globe's face. With the lab's ground the first is its far twin: the lab's own bake
  // of that ground as it reads from far (file and width from the lab's manifest, lab.json far.level). It brings its
  // bands finer than place.plates.fineDeg only: under it stands the map's low band of that width, so the face keeps
  // the tones of the map at every distance and the twin comes in, like every level, as the map's texels run out
  const twin = place.ground === 'lab' ? [{ file: (lab.far.level.files as Record<string, string>)[ctx.assets]!.replace('public/assets/' + base, ''), widthDeg: lab.far.level.deg, fineDeg: place.plates.fineDeg }] : []
  const plates = [...twin, ...(place.plates.levels as { file: string; widthDeg: number }[]).map((l) => ({ ...l, fineDeg: 0 }))]
  const levels = await Promise.all(plates.map((l) => ctx.texture(base + l.file, { srgb: true, anisotropy: 16 })))
  const patches = { textures: levels, widthsDeg: plates.map((l) => l.widthDeg), fineDeg: plates.map((l) => l.fineDeg), spot: new THREE.Vector3().fromArray(place.globe.mapSpot), feather: place.plates.feather, fade: place.plates.fade as [number, number] }
  const fitTurn = new THREE.Quaternion().fromArray(fit.globe.quaternion)
  const mapToStage = new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().fromArray(place.stage.toBody).invert().multiply(fitTurn)))
  const globe = new SunGlobe({ map, grade, mapWidth: (map.image as unknown as { width: number }).width, look: look.globe, patches, place: { ground: ground.material.uniforms, toStage: mapToStage, capDeg: place.onGlobe.capDeg as [number, number], fade: place.onGlobe.fade as [number, number], lowLod: place.onGlobe.lowLod, spotKeep: place.onGlobe.spotKeep as [number, number] } })
  globe.mesh.quaternion.copy(fitTurn)
  orbit.add(globe.mesh)

  const corona = new Corona(await ctx.texture(base + look.files.corona, { srgb: true, anisotropy: 4, repeat: true }), look.corona, place.onGlobe.gas.near, ring.light)
  orbit.add(corona.mesh)

  const prominences = new Prominences(await ctx.texture(base + look.files.prominence, { srgb: true, anisotropy: 8 }), await ctx.texture(base + look.files.prominenceFlow, { srgb: false }), look.prominence)
  orbit.add(prominences.mesh)

  const backdrop = new SkyCard(await ctx.texture(base + look.sky.file, { srgb: true, mips: false, anisotropy: 1 }), look.sky)
  world.add(backdrop.mesh)

  const far = new FarPoint()
  orbit.add(far.points)
  world.add(farSun.mesh)
  const farBody = new THREE.Quaternion()

  const fringe = new Fringe(plate, await ctx.texture(base + look.files.haze, { srgb: true, anisotropy: 1 }), look.fringe)
  // the arcade stands at its place on the ball in every view: on the stage in the close view, and in orbit carried
  // with the ball's turn at the same coordinates, at its true size
  const loops = new Arcade()
  const standing = new THREE.Group()
  standing.add(loops.mesh)
  world.add(standing)
  const surface = place.ground === 'lab' ? new LabGround(ground.material.uniforms, map, mapToStage) : new Surface(ground.material.uniforms, map, mapToStage)
  const jets = new Jets(ground.material.uniforms)
  terrain.add(ground.mesh, surface.mesh, fringe.mesh, jets.glow, jets.mesh)
  const inGlobe = stage.centre.clone().multiplyScalar(-1 / stage.radius).applyQuaternion(plan.toGlobe)
  // the stage in the body's own frame at spin 0, for whoever draws the arcade from outside the stop: the far Sun's
  // group stands at the ball's centre with the body's turn times the spin about y, the stop's own group with the
  // carry (plan.carry: the turn at the time times the inverse of the turn at the anchor)
  const seatTurn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -plan.spin(plan.anchorTime)).multiply(fitTurn.clone().invert())
  loops.body(seatTurn.clone().multiply(plan.toGlobe), inGlobe.clone().applyQuaternion(seatTurn), 1 / stage.radius, plan.seg.terrain.start)
  // what the far Sun wears of the stop (read only, MAIL 1066 and 1070): the face, the gas (corona, prominences and
  // their numbers) and the arcade as a drawable that the far Sun hangs in its own group and asks to draw itself
  farSun.wear({ map, grade, mapWidth: (map.image as unknown as { width: number }).width, limb: look.globe.limb, rim: look.globe.rim, boil: look.globe.boil, hot: look.globe.hot, pulse: look.globe.pulse, cell: look.globe.cell, gas: { corona: corona.material.uniforms.uMap!.value, coronaLook: look.corona, prominence: prominences.material.uniforms.uMap!.value, flow: prominences.material.uniforms.uFlow!.value, prominenceLook: look.prominence, turn: fitTurn, arcade: { object: loops.mesh, draw: (v) => loops.draw(v) } } })
  const terrainMid = (plan.seg.terrain.start + plan.seg.terrain.end) / 2 + config.shutterFraction / (2 * config.fps)
  const eye = new THREE.Vector3()
  const eyeStage = new THREE.Vector3()
  const turn = new THREE.Quaternion()
  const carry = new THREE.Quaternion()
  const sight = new THREE.Quaternion()
  const wash = new THREE.Vector4()
  const burn = new THREE.Vector4()
  const pale = new THREE.Vector4()
  const hot = new THREE.Vector3().fromArray(look.leave.burn.hot)
  const toCam = new THREE.Quaternion()
  const inCam = new THREE.Vector3()
  const mWorld = new THREE.Matrix4()
  const mCam = new THREE.Matrix4()
  const mFit = new THREE.Matrix4()
  const mBack = new THREE.Matrix4()
  const cone = new THREE.Matrix3().set(leaveFit.cone[0]!, leaveFit.cone[1]!, leaveFit.cone[2]!, leaveFit.cone[1]!, leaveFit.cone[3]!, leaveFit.cone[4]!, leaveFit.cone[2]!, leaveFit.cone[4]!, leaveFit.cone[5]!)
  const mTurn = new THREE.Matrix3()
  const mCone = new THREE.Matrix3()
  const unfit = new THREE.Matrix3()
  orbit.matrixAutoUpdate = false
  const by = place.onGlobe.heights
  // the share of the corona's and the prominences' light that the lens holds beside the ground, by the eye's height
  // alone: a smooth step in the logarithm of the height between place.json onGlobe.gas from and to, no slope at
  // either end, the same law down and up and in every segment (MAIL 1146 point 2, MAIL 1199 point 3a, MAIL 1219
  // point 3). The gas itself stands on the ball at every height
  const gas = place.onGlobe.gas
  const gasAt = (height: number): number => THREE.MathUtils.smoothstep(Math.log(height), Math.log(gas.from), Math.log(gas.to))
  const seatQ = new THREE.Quaternion()
  const seatR = new THREE.Quaternion()
  const seatS = new THREE.Vector3()
  const seatC = new THREE.Vector3()
  const byFar = place.onGlobe.far
  const share = (x: number, r: [number, number]): number => THREE.MathUtils.smoothstep(x, r[0], r[1])
  const even = (x: number, r: [number, number]): number => 0.5 * (share(x, r) + THREE.MathUtils.clamp((x - r[0]) / (r[1] - r[0]), 0, 1))

  return {
    id: plan.id,
    world,
    update: (state, shot, view) => {
      const inOrbit = state.view === 'orbit'
      const kind = state.segment.kind
      farSun.mesh.visible = false
      const rising = kind === 'rise'
      const placing = inOrbit && rising
      orbit.visible = inOrbit && state.weight > 0
      terrain.visible = !inOrbit || placing
      if (placing) {
        carry.copy(plan.carry(state.time))
        terrain.quaternion.copy(carry).multiply(plan.toGlobe)
        terrain.scale.setScalar(1 / stage.radius)
        terrain.position.copy(inGlobe).applyQuaternion(carry)
      } else {
        terrain.quaternion.identity()
        terrain.scale.setScalar(1)
        terrain.position.set(0, 0, 0)
      }
      const gain = 1 / shot.post.exposure
      const aspect = view.format.width / view.format.height
      setFormat()
      const vignette = shot.post.vignette
      eye.copy(world.position).negate().applyQuaternion(turn.copy(world.quaternion).invert())
      if (placing) eye.applyQuaternion(turn.copy(carry).invert()).applyQuaternion(plan.toStage).multiplyScalar(stage.radius).add(stage.centre)
      const since = state.time - plan.seg.terrain.start
      // where the arcade hangs is a function of the frame alone: every frame takes it into the stop's own group here,
      // before any early return, and only a travel frame's far Sun takes it from there (below). A close frame drawn
      // after a travel frame found it under the hidden far Sun (G3 red on e1c18f46, MAIL 1237)
      loops.seat(false)
      if (loops.mesh.parent !== standing) standing.add(loops.mesh)
      if (inOrbit) {
        carry.copy(plan.carry(state.time))
        standing.quaternion.copy(carry).multiply(plan.toGlobe)
        standing.scale.setScalar(1 / stage.radius)
        standing.position.copy(inGlobe).applyQuaternion(carry)
        eyeStage.copy(world.position).negate().applyQuaternion(turn.copy(world.quaternion).invert()).applyQuaternion(turn.copy(carry).invert()).applyQuaternion(plan.toStage).multiplyScalar(stage.radius).add(stage.centre)
      } else {
        standing.quaternion.identity()
        standing.scale.setScalar(1)
        standing.position.set(0, 0, 0)
        eyeStage.copy(eye)
      }
      // the arcade's lines stand still and its plasma runs on the stop's clock. It leaves by its own size alone, a law
      // of the distance (MAIL 1070 point 2, MAIL 1421, arcs.json leave): whole while its loops can be told apart, gone
      // before they are a few soft dots. The hold and the travel stand farther than that and hold none of its light;
      // in the travel the far Sun takes it over with the globe (below) and asks the same law
      loops.update(since, eyeStage, (inOrbit ? state.weight : 1) * loops.sized(eyeStage, view.camera.fov), gain, vignette, aspect)
      const height = Math.max(inOrbit ? world.position.length() - 1 : eye.distanceTo(stage.centre) / stage.radius - 1, 1e-4)
      const above = (r: number[]): number => (rising ? THREE.MathUtils.smoothstep(Math.log(height), Math.log(r[0]!), Math.log(r[1]!)) : inOrbit ? 1 : 0)
      // what leaves with the distance from the eye to its own place (radii of the ball, even steps in the logarithm):
      // one law at every frame, no height of the eye and no clock; the close view holds nothing as far away as a range begins
      const gone = (d: number, r: number[]): number => THREE.MathUtils.smoothstep(Math.log(Math.max(d, 1e-6)), Math.log(r[0]!), Math.log(r[1]!))
      // one sky (MAIL 1199 point 3b): the film's sky stands behind the close view and the way up; the close view has no
      // sky picture of its own. The hold's picture stands at its own place among the stars at its whole light, behind
      // the ball as the hold sees it, and is not weighed by the eye's height or by the clock: the turn of the camera
      // on the way up brings its place into the frame (frame 360 holds it: without it the hold's match falls by 2.256)
      const shown = !inOrbit ? 0 : kind === 'travel' ? Math.min(1 - THREE.MathUtils.smoothstep(state.u, look.skyFade[0], look.skyFade[1]), globeShare(world.position.length())) : 1
      backdrop.update(shown, gain, vignette, aspect)
      if (terrain.visible) {
        const t = state.time - terrainMid
        ground.show(placing, 0, 0)
        ground.material.uniforms.uExact!.value = rising ? 1 : 0
        sight.copy(view.camera.quaternion).premultiply(turn.copy(world.quaternion).invert())
        if (placing) sight.premultiply(turn.copy(carry).invert()).premultiply(plan.toStage)
        ground.sight(sight, view.format.width, view.format.height)
        ground.haze(1 - above(by.haze))
        // the arcade stands as it is from the first frame: what it throws on the ground under its feet is a steady
        // share (arcs.json ground), with no event in it
        lifeCalm(ground.material.uniforms, t)
        ground.update(eye, t, gain, vignette, aspect, fringe.lod(view.camera.fov, view.format.height), 0, 0, since, loops.ground)
        lifeFormat(ground.material.uniforms, view.format.height)
        // the ground from functions is the same on both sides of the rise: on the globe's side it lies on the globe
        // and gives way to the globe's own face by the eye's height
        ground.mesh.visible = false
        surface.update(t, eye, placing ? 1 - above(by.surface) : 1, placing)
        ground.material.uniforms.uFieldFine!.value.x = rising ? above(by.field) : 0
        // the glow at the limb leaves by the distance from the eye to the limb, each jet by the distance to its own foot
        // (jets.ts)
        const limbFar = Math.sqrt((1 + height) ** 2 - 1)
        const glowLeft = 1 - gone(limbFar, byFar.glow)
        fringe.update(eye, t, gain, vignette, aspect, view.camera.fov, view.format.height, glowLeft)
        fringe.mesh.visible = false
        jets.update(t, glowLeft, height < byFar.jets[1]!)
        if (!inOrbit) {
          // the gas of the body in the close view, seated in the stage's frame as the arcade is: the same corona and
          // the same prominences at the same place on the ball as the globe's side draws them, by the same calls.
          // Where the lens holds none of their light (the table's share 0) nothing is drawn
          const closeShare = gasAt(height)
          if (closeShare > 0) {
            orbit.visible = true
            seatQ.copy(plan.toStage).multiply(turn.copy(plan.carry(state.time)).invert())
            orbit.matrix.compose(stage.centre, seatQ, seatS.setScalar(stage.radius))
            globe.mesh.visible = false
            far.points.visible = false
            seatC.copy(stage.centre).applyQuaternion(world.quaternion).add(world.position).divideScalar(stage.radius)
            unfit.identity()
            corona.update(seatC, unfit, seatR.copy(world.quaternion).multiply(seatQ), state.time - plan.holdMid, gain, vignette, aspect, look.corona, closeShare, look.corona.edge, 0, 1)
            prominences.update(state.time - plan.holdMid, plan.spin(state.time), gain, vignette, aspect, closeShare)
            corona.mesh.visible = true
            prominences.mesh.visible = true
          }
          return
        }
      }
      const elapsed = state.time - plan.holdMid
      const spin = plan.spin(state.time)
      globe.place(0, 1 - above(by.tidy), 1 - above(by.corona), 1 - above(by.spot))
      // while the ground lies on the globe its lanes and its spot reach under the globe's ball: the ball is drawn
      // first and leaves the depth to the ground (the ground covers all of the ball that can be seen from there)
      globe.material.depthWrite = !(placing && above(by.surface) < 1)
      // one law at every height and in every segment: the hold and the travel stand above the table's last row
      const glow = gasAt(height)
      const away = kind === 'travel' && inOrbit ? globeShare(world.position.length()) : 1
      const leaving = false
      const going = leaving ? even(state.u, look.leave.over) : 0
      const open = Math.pow(look.leave.open, going)
      const flat = leaving ? even(state.u, look.leave.wash) : 0
      const burnt = leaving ? share(state.u, look.leave.burn.over) : 0
      const fitted = leaving ? share(state.u, look.leave.fit) : 0
      const tucked = leaving ? share(state.u, look.leave.tuck) : 0
      const plateEnd = share(look.leave.gone, look.leave.plate)
      const level = going > 0 ? Math.min(Math.max(plateEnd - share(state.u, look.leave.plate), 0) / Math.max(state.weight, 1e-4), plateEnd * look.leave.cap) : 0
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
        const mx = mid * ex
        const my = mid * ey
        const l00 = 1 + fitted * (b00 - 1)
        const l01 = fitted * b01
        const l10 = fitted * b10
        const l11 = 1 + fitted * (b11 - 1)
        const cx = fitted * (px - (b00 * mx + b01 * my))
        const cy = fitted * (py - (b10 * mx + b11 * my))
        mFit.set(l00, l01, -cx, 0, l10, l11, -cy, 0, 0, 0, 1, 0, 0, 0, 0, 1)
        mBack.copy(mCam).multiply(mFit).multiply(mWorld.copy(mCam).invert())
        unfit.setFromMatrix4(mWorld.copy(mBack).invert())
        mWorld.compose(world.position, world.quaternion, world.scale)
        orbit.matrix.copy(mWorld).invert().multiply(mBack).multiply(mWorld)
      } else {
        orbit.matrix.identity()
        unfit.identity()
      }
      globe.update(elapsed, spin, gain, state.weight, vignette, aspect, undefined, undefined, open, wash.set(look.leave.pale[0] * level, look.leave.pale[1] * level, look.leave.pale[2] * level, going > 0 ? Math.max(flat, 1e-6) : 0), look.leave.shade)
      corona.update(world.position, unfit, state.rotation, elapsed, gain * Math.pow(look.leave.corona, going), vignette, aspect, look.corona, glow * state.weight * away, look.corona.edge * (1 - tucked) + look.leave.edge * fitted, look.leave.veil * going, look.leave.ceil * plateEnd * gain * (0.2126 * look.leave.pale[0] + 0.7152 * look.leave.pale[1] + 0.0722 * look.leave.pale[2]), pale.set(look.leave.hue[0], look.leave.hue[1], look.leave.hue[2], going), tucked >= 1, look.leave.soft)
      globe.limb(world.position, unfit, corona.toSet)
      prominences.update(elapsed, spin, gain * open, vignette, aspect, glow * state.weight * away, burn.set(burnt, look.leave.burn.wide, look.leave.burn.level, look.leave.burn.cover), hot)
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      // (the size on screen that the far Sun is drawn from is counted in 1080ths of the frame height, by the same
      // factor that the fades read)
      const visible = radiusPx / formatUniform.value > 0.6
      globe.mesh.visible = visible
      corona.mesh.visible = visible
      prominences.mesh.visible = visible
      far.update(radiusPx, view, plan.p.tint, gain)
      farSun.mesh.visible = orbit.visible && visible && away < 1 && kind === 'travel'
      if (farSun.mesh.visible) {
        // the far Sun may take the arcade in this call: it then hangs in the far Sun's group, in the body's frame
        loops.seat(true)
        farSun.material.depthTest = false
        farSun.set({ camera: view.camera, centre: world.position, body: farBody.copy(world.quaternion).multiply(fitTurn), spin, time: state.time, holdTime: elapsed, exposure: shot.post.exposure, burn: shot.sun.far?.burn ?? 0, vignette, aspect, height: view.format.height }, 1 - away, 0)
      }
      // drawn once: what the far Sun took in this frame it keeps, else the arcade stands in the stop's own group
      if (!(farSun.mesh.visible && loops.mesh.parent !== null && loops.mesh.parent !== standing)) {
        loops.seat(false)
        if (loops.mesh.parent !== standing) standing.add(loops.mesh)
      }
    },
    dispose: () => {
      farSun.wear(null)
      farSun.mesh.removeFromParent()
      globe.dispose()
      corona.dispose()
      prominences.dispose()
      far.dispose()
      backdrop.dispose()
      ground.dispose()
      surface.dispose()
      jets.dispose()
      fringe.dispose()
      loops.dispose()
    },
  }
}
