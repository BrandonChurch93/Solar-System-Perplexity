import * as THREE from 'three'
import { config } from '../../config'
import { bufferFrame } from '../../core/frame'
import { FarPoint } from '../../bodies/farpoint'
import type { Pose, SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { diagUniform } from '../../diagnostics/diag'
import { handoverOf } from '../../director/handover'
import { drift, smooth } from '../../director/rig'
import { patches, place, relief as reliefDefs, wrap } from './assets'
import { Globe } from './globe'
import * as look from './look'
import { below, deck, plan, veil as timing } from './plan'
import { CloudRelief } from './relief'
import { HoldRim, LIMB, Rim, limbFrame } from './rim'
import skyJson from './sky.json'
import { Veil } from './veil'

function direction(lonDeg: number, latDeg: number): THREE.Vector3 {
  const lon = THREE.MathUtils.degToRad(lonDeg)
  const lat = THREE.MathUtils.degToRad(latDeg)
  return new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon))
}

const PROBES: [number, number][] = [[0, 0], [0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]]

function slide(a: Pose, b: Pose, width: number, height: number): number {
  const ta = Math.tan(THREE.MathUtils.degToRad(a.vfov) / 2)
  const tb = Math.tan(THREE.MathUtils.degToRad(b.vfov) / 2)
  const aspect = width / height
  const back = b.quaternion.clone().invert()
  const ray = new THREE.Vector3()
  let most = 0
  for (const [x, y] of PROBES) {
    ray.set(x * ta * aspect, y * ta, -1).normalize().applyQuaternion(a.quaternion)
    const along = a.position.dot(ray)
    const h = along * along - a.position.lengthSq() + 1
    if (h < 0) continue
    const v = ray.multiplyScalar(-along - Math.sqrt(h)).add(a.position).sub(b.position).applyQuaternion(back)
    if (v.z >= 0) continue
    most = Math.max(most, Math.hypot(((v.x / -v.z / (tb * aspect)) - x) * width / 2, ((v.y / -v.z / tb) - y) * height / 2))
  }
  return most
}

interface Swap { at: number; turn: THREE.Quaternion; up: THREE.Vector3; upTerrain: THREE.Vector3; height: number; rate: number; sun: THREE.Vector3; fwd: THREE.Vector3; right: THREE.Vector3; e1: THREE.Vector3; e2: THREE.Vector3 }

function swapOf(kind: 'dive' | 'rise', sunTerrain: THREE.Vector3, fwd: THREE.Vector3, right: THREE.Vector3): Swap {
  const at = plan.coverCenter(kind === 'dive' ? plan.seg.dive! : plan.seg.rise)
  const tiny = 1e-6
  const dt = timing[kind].span / config.fps
  const shot = (t: number): Pose => plan.eyeShot(kind, t).pose
  const o = shot(kind === 'dive' ? at - tiny : at)
  const g = shot(kind === 'dive' ? at : at - tiny)
  const o2 = shot(kind === 'dive' ? at - tiny - dt : at + dt)
  const height = o.position.length() - 1
  const turn = o.quaternion.clone().multiply(g.quaternion.clone().invert())
  const up = o.position.clone().normalize()
  const sun = sunTerrain.clone().applyQuaternion(turn)
  const e1 = sun.clone().addScaledVector(up, -sun.dot(up)).normalize()
  return {
    at, turn, height, up, sun, e1,
    e2: new THREE.Vector3().crossVectors(up, e1),
    upTerrain: g.position.clone().sub(deck.centre).normalize(),
    rate: Math.log((o2.position.length() - 1) / height) / (kind === 'dive' ? -dt : dt),
    fwd: fwd.clone().applyQuaternion(turn),
    right: right.clone().applyQuaternion(turn),
  }
}

export const createSet: SetFactory = async (ctx) => {
  const key = ctx.assets === 'full' ? 'full' : 'web'
  const base = 'venus/' + ctx.assets + '/'
  const fit = plan.fit
  const world = new THREE.Group()
  const orbit = new THREE.Group()
  const terrain = new THREE.Group()
  world.add(orbit, terrain)

  const map = await ctx.texture(base + 'wrap-color.jpg', { srgb: true, anisotropy: 4, repeat: true })
  const flowMap = await ctx.texture(base + 'wrap-flow.jpg', { srgb: false, repeat: true })
  const boltMap = await ctx.texture(base + 'bolt.jpg', { srgb: true })
  const patchTextures: THREE.Texture[] = []
  for (const level of patches.levels) patchTextures.push(await ctx.texture(base + level.file, { srgb: true, anisotropy: 16 }))
  // The plates of the place: one set for the dive and one for the rise (the close side as it stands at the T of each).
  const placeTextures: THREE.Texture[] = []
  const placeRise: THREE.Texture[] = []
  for (const level of place.levels) {
    // A level that holds its light alone is one channel of display values; the globe shader takes them back to light itself.
    const kind = level.colourOf < 0 ? { srgb: true, anisotropy: 16 } : { srgb: false, channels: 1 as const, anisotropy: 16 }
    const dive = await ctx.texture(base + level.dive, kind)
    placeTextures.push(dive)
    placeRise.push(level.rise === level.dive ? dive : await ctx.texture(base + level.rise, kind))
  }
  const wideTexture = await ctx.texture(base + place.wide.file, { srgb: false, channels: 1 as const, anisotropy: 16 })
  // The far deck of T as a map in the frame of T, for each handover that has one (plates.json, atT.far.clear).
  const farMaps = { dive: place.far.files.dive ? await ctx.texture(base + place.far.files.dive, { srgb: false, anisotropy: 16 }) : null, rise: place.far.files.rise ? await ctx.texture(base + place.far.files.rise, { srgb: false, anisotropy: 16 }) : null }
  const limbMap = await ctx.dataTexture(base + look.limb.file, LIMB.azimuth + 1, LIMB.half * 4, 4)
  const globeTurn = new THREE.Quaternion().fromArray(fit.globe.quaternion)
  const holdBack = globeTurn.clone().invert()
  const holdCam = new THREE.Vector3().fromArray(fit.camera.position)
  const holdMap = await ctx.texture(base + look.hold.file, { srgb: false })
  const holdRim = new HoldRim(await ctx.dataTexture(base + look.hold.rim.file, look.hold.rim.cols + 1, look.hold.rim.inside + look.hold.rim.outside, 4), holdCam, look.hold.near)
  const spotBody = plan.spot.clone().applyQuaternion(globeTurn.clone().invert())

  const ground = await CloudRelief.load(ctx, base, reliefDefs[key], look.relief)
  const globe = new Globe({
    map, mapWidth: wrap.sets[key].color[0], mapFull: wrap.sets.full.color[0], curve: look.curve, haze: look.haze, limb: limbMap, graze: look.graze, lift: look.lift, shade: look.shade, mauve: look.mauve, weave: { ...look.weave, lod: Math.log2(wrap.sets[key].color[0] / look.weave.base), camera: new THREE.Vector3().fromArray(fit.camera.position).applyQuaternion(globeTurn.clone().invert()) },
    rim: holdRim,
    hold: { ...look.hold, map: holdMap, right: new THREE.Vector3(1, 0, 0).applyQuaternion(holdBack), up: new THREE.Vector3(0, 1, 0).applyQuaternion(holdBack), forward: new THREE.Vector3(0, 0, -1).applyQuaternion(holdBack), centre: [-holdCam.x / holdCam.z, -holdCam.y / holdCam.z], half: look.hold.margin / Math.sqrt(holdCam.lengthSq() - 1), lod: Math.log2(wrap.sets[key].color[0] / look.hold.base) },
    swirl: { axis: direction(look.swirl.lon, look.swirl.lat), wideDeg: look.swirl.wideDeg },
    patches: { textures: patchTextures, widthsDeg: patches.levels.map((l) => l.widthDeg), full: patches.full, exact: key === 'full', spot: spotBody, feather: patches.feather, fade: patches.fade },
    air: { deck: ground.deck!.colours, deckSpanDeg: look.relief.air.deckSpanDeg },
    place: { textures: placeTextures, rim: place.rim, widthsDeg: place.levels.map((l) => l.widthDeg), full: place.levels.map((l) => l.full), centre: new THREE.Vector3().fromArray(place.centre), feather: place.feather, fade: place.fade, forms: place.forms, tone: place.tone, far: place.far, wide: { ...place.wide, texture: wideTexture } },
    flow: { map: flowMap, strength: look.drift.strength, shadow: look.drift.shadow, shadowOffset: look.drift.shadowOffset },
    bolts: { map: boltMap, center: direction(wrap.bolt.lon, wrap.bolt.lat), widthDeg: wrap.bolt.widthDeg, gain: 1, color: look.boltColor, cells: look.cells.map((c) => ({ dir: direction(c.lon, c.lat), radiusDeg: c.radiusDeg, painted: c.painted })) },
  })
  globe.mesh.quaternion.copy(globeTurn)
  globe.mesh.scale.fromArray(fit.globe.scale)
  const rim = new Rim(limbMap, look.limb.radius, diagUniform, look.bloom.hide, holdRim)
  const far = new FarPoint()
  orbit.add(globe.mesh, rim.mesh, far.points)

  terrain.add(ground.group)
  orbit.add(ground.globeDome, ground.globeGround)
  const airTurn = new THREE.Quaternion()
  const airBack = new THREE.Quaternion()
  const hazeTurn = new THREE.Quaternion()
  const airEye = new THREE.Vector3()
  // The globe camera at the T of each handover, in the close scene from the centre of its deck sphere.
  const eyesAtT: Partial<Record<'dive' | 'rise', { time: number; eye: THREE.Vector3 }>> = {}
  const eyeAtT = (kind: 'dive' | 'rise'): THREE.Vector3 => {
    const time = handoverOf(plan.id, kind)?.time ?? (kind === 'dive' ? plan.seg.dive!.end : plan.seg.rise.start)
    const hit = eyesAtT[kind]
    if (hit && hit.time === time) return hit.eye
    const pose = plan.eye(kind, time, 'orbit')
    const eye = pose.position.clone().applyQuaternion(plan.turn(time).multiply(plan.terrainFrame).invert()).multiplyScalar(deck.radius)
    eyesAtT[kind] = { time, eye }
    return eye
  }
  // The axes of that camera in the close scene (columns right, up, back) and the tangent of half its field: the frame of T, inside which
  // the ground of the globe side is the surface view itself (relief.ts, uAxesT).
  const camsAtT: Partial<Record<'dive' | 'rise', { time: number; axes: THREE.Matrix3; tan: number }>> = {}
  const camAtT = (kind: 'dive' | 'rise'): { axes: THREE.Matrix3; tan: number } => {
    const time = handoverOf(plan.id, kind)?.time ?? (kind === 'dive' ? plan.seg.dive!.end : plan.seg.rise.start)
    const hit = camsAtT[kind]
    if (hit && hit.time === time) return hit
    const pose = plan.eye(kind, time, 'orbit')
    const q = plan.turn(time).multiply(plan.terrainFrame).invert().multiply(pose.quaternion.clone().multiply(drift(time)))
    const cam = { time, axes: new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)), tan: Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2) }
    camsAtT[kind] = cam
    return cam
  }
  // The same camera in the body fixed frame of the globe, the frame of the plates of the place (as assets-src/venus/place/tcam.ts).
  const bodyEyes: Partial<Record<'dive' | 'rise', { time: number; eye: THREE.Vector3 }>> = {}
  const bodyEyeAtT = (kind: 'dive' | 'rise'): THREE.Vector3 => {
    const time = handoverOf(plan.id, kind)?.time ?? (kind === 'dive' ? plan.seg.dive!.end : plan.seg.rise.start)
    const hit = bodyEyes[kind]
    if (hit && hit.time === time) return hit.eye
    const pose = plan.eye(kind, time, 'orbit')
    const eye = pose.position.clone().applyQuaternion(plan.turn(time).multiply(globeTurn).invert())
    bodyEyes[kind] = { time, eye }
    return eye
  }
  // The level line of sight of that camera in the same frame, and the line to its right: the axes of the map of the far deck of T.
  const bodyAxes: Partial<Record<'dive' | 'rise', { time: number; fwd: THREE.Vector3; right: THREE.Vector3 }>> = {}
  const bodyAxesAtT = (kind: 'dive' | 'rise'): { fwd: THREE.Vector3; right: THREE.Vector3 } => {
    const time = handoverOf(plan.id, kind)?.time ?? (kind === 'dive' ? plan.seg.dive!.end : plan.seg.rise.start)
    const hit = bodyAxes[kind]
    if (hit && hit.time === time) return hit
    const pose = plan.eye(kind, time, 'orbit')
    const up = pose.position.clone().applyQuaternion(plan.turn(time).multiply(globeTurn).invert()).normalize()
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(plan.turn(time).multiply(globeTurn).invert().multiply(pose.quaternion.clone().multiply(drift(time))))
    fwd.addScaledVector(up, -fwd.dot(up)).normalize()
    const axes = { time, fwd, right: new THREE.Vector3().crossVectors(fwd, up) }
    bodyAxes[kind] = axes
    return axes
  }
  const carry = { ...ground.carry!, soft: look.veil.sunSoft, tint: look.veil.sunTint }
  // The cover veil is never drawn any more (plan.veilAmount is 0 and plan.release is 1 on every frame of both moves), so its cloud
  // picture is not loaded: the sheet keeps a texture it never shows.
  const veil = new Veil(look.veil, map, carry, diagUniform)
  const sunTerrain = new THREE.Vector3(look.veil.sun[0], look.veil.sun[1], -1).normalize()
  const swaps = { dive: swapOf('dive', sunTerrain, carry.fwd, carry.right), rise: swapOf('rise', sunTerrain, carry.fwd, carry.right) }
  ;(globe.material.uniforms.uCarry!.value as THREE.Vector4).set(look.veil.grade.keep, look.veil.grade.gamma, look.veil.grade.pivot, look.veil.grade.gain)
  ;(globe.material.uniforms.uCarryTint!.value as THREE.Vector3).fromArray(look.veil.grade.tint)
  const back = new THREE.Quaternion()
  const localQ = new THREE.Quaternion()
  const localBack = new THREE.Quaternion()
  const localP = new THREE.Vector3()
  const centre = new THREE.Vector3()
  const eye = new THREE.Vector3()
  const veilTurn = new THREE.Quaternion()
  const sunCam = new THREE.Vector3()
  const airFwd = new THREE.Vector3()
  const airRight = new THREE.Vector3()
  const terrainMid = (plan.seg.terrain.start + plan.seg.terrain.end) / 2
  const riseAt = plan.seg.rise.start + look.drift.riseAt * (plan.seg.rise.end - plan.seg.rise.start)

  const tintLow = new THREE.Vector3().fromArray(look.descent.tint)
  const light = new THREE.Vector3()
  const limbS = new THREE.Vector3()
  const limbEye = new THREE.Vector3()
  const limbTurn = new THREE.Quaternion()
  // The glow of the limb in a dive and a rise: the eye of the far end of the move (the first frame of the dive, the end of the rise) in
  // the frame of the ground, with the frame of its limb. The glow is read for that eye, so it lies on the ground and moves with it.
  const limbHeld = (['dive', 'rise'] as const).map((move) => {
    const at = move === 'dive' ? plan.seg.dive!.start : plan.seg.rise.end
    const back = plan.turn(at).invert()
    const eye = plan.eyeShot(move, at, 'orbit').pose.position.clone().applyQuaternion(back)
    const s = new THREE.Vector3()
    const t = new THREE.Vector3()
    const sun = plan.lightDir.clone().applyQuaternion(back)
    limbFrame(eye, sun, s, t)
    return { eye, s, t, sun }
  })
  const limbOff = new THREE.Vector3()
  const limbSun = new THREE.Vector3()
  const limbT = new THREE.Vector3()
  const camera = new THREE.Vector3()
  const amps: number[] = look.cells.map(() => 0)
  const turnBack = new THREE.Quaternion()
  const turn = new THREE.Quaternion()
  const shift = new THREE.Vector3()
  let zoom = 1
  const sky: SkyPatch[] = []
  for (const [view, def] of Object.entries(skyJson)) {
    const wide = 1 + 2 * def.margin
    const t = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2) * wide
    sky.push({ view: view as ViewKind, texture: await ctx.texture(base + def.file, { srgb: true, mips: false, anisotropy: 1 }), aim: new THREE.Quaternion(), tan: [t * 16 / 9, t], gain: def.gain, add: def.add, ring: def.ring as [number, number, number, number], edge: def.feather / wide })
  }

  return {
    id: plan.id,
    world,
    near: veil.mesh,
    sky,
    update: (state, shot, view) => {
      const inOrbit = state.view === 'orbit'
      // On the globe side of the stop's own hold, dive and rise the surface view is drawn dry, and so is what the globe side shows later:
      // every program and buffer of the stop is made in the hold, none in a move (relief.ts, dryable).
      const own = state.segment.stop === plan.id && state.segment.kind !== 'travel'
      orbit.visible = inOrbit && state.weight > 0
      terrain.visible = !inOrbit || own
      ground.dry(inOrbit)
      const gain = 1 / shot.post.exposure
      const kind = state.segment.kind
      const covering = state.segment.stop === plan.id && (kind === 'dive' || kind === 'rise')
      const thick = covering ? plan.veilAmount(state.segment, state.time) : 0
      const released = covering ? smooth(plan.release(state.segment, state.time)) : 1
      const sw = swaps[kind === 'dive' ? 'dive' : 'rise']
      back.copy(state.rotation).invert()
      localQ.copy(back).multiply(shot.camera.quaternion)
      localBack.copy(localQ).invert()
      localP.copy(shot.camera.position).sub(state.origin).applyQuaternion(back)
      if (!inOrbit) {
        ground.update(state.time - terrainMid, gain, shot.post.vignette, view, shot.sun.dir)
        if (thick <= 0) {
          veil.hide()
          return
        }
        localP.sub(deck.centre).divideScalar(deck.radius)
        centre.copy(localP).negate().applyQuaternion(localBack)
        eye.copy(localP).normalize().sub(sw.upTerrain).applyQuaternion(sw.turn).add(sw.up).normalize()
        const fall = plan.drop(state.segment, state.time)
        const rush = Math.min(Math.abs(sw.rate * (plan.drop(state.segment, state.time + config.shutterFraction / config.fps) - fall)) / timing.rush, 1)
        eye.multiplyScalar(1 + sw.height * Math.exp(timing.slow * sw.rate * fall))
        veilTurn.copy(sw.turn).multiply(localQ)
        sunCam.copy(sunTerrain).applyQuaternion(localBack)
        veil.update(view.camera, view.format.width, view.format.height, centre, eye, rush, 1, veilTurn, thick, 0, sw, sunCam, 0, airFwd, airRight, gain, gain * look.relief.air.gain, shot.post.vignette, 1)
        return
      }
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      light.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      camera.copy(world.position).negate()
      const elapsed = Math.min(Math.max(state.time - plan.holdMid, look.drift.from), look.drift.to)
      const flowing = state.time > terrainMid ? Math.min(Math.max(state.time - riseAt, look.drift.from), look.drift.to) : elapsed
      const d = look.descent
      const low = ending ? 0 : 1 - smooth((Math.log(Math.max(camera.length() - 1, 1e-4)) - Math.log(d.low)) / (Math.log(d.high) - Math.log(d.low)))
      // The look of the hold goes out by the height of the camera in the dive (plates.json, leave); after the surface view it stays out.
      const left = ending ? 0 : state.time > terrainMid ? 1 : below(camera.length() - 1, place.leave.heights, smooth)
      for (let i = 0; i < amps.length; i++) amps[i] = ending ? 0 : look.flash(look.cells[i]!, state.time) * (1 - left)
      const gu = globe.material.uniforms
      // What is counted in pixels of the buffer is scaled by the engine's measure of the frame (src/core/frame.ts): buffer pixels a
      // master pixel. The globe's fades read it as uFrame (frameUniform).
      const frameScale = bufferFrame()
      ;(gu.uTint!.value as THREE.Vector3).set(1, 1, 1).lerp(tintLow, low)
      // The air of the place on the globe side is a field of the place (plates.json, air.field): the close side's own dome, seen from the
      // globe camera, and the air on the line of sight to the ground take their weight where the line of sight passes the place, not by
      // the height of the camera. What still goes by these heights is the lens darkening alone (lensOn, a grade over the frame).
      const ah = place.air.heights
      const lensOn = covering ? 1 - smooth((Math.log(Math.max(camera.length() - 1, 1e-4)) - Math.log(ah[0])) / (Math.log(ah[1]) - Math.log(ah[0]))) : 0
      const sh = place.air.sunHeights
      const sunOn = covering ? 1 - smooth((Math.log(Math.max(camera.length() - 1, 1e-4)) - Math.log(sh[0])) / (Math.log(sh[1]) - Math.log(sh[0]))) : 0
      airTurn.copy(plan.turn(state.time)).multiply(plan.terrainFrame)
      airEye.copy(localP).applyQuaternion(airBack.copy(airTurn).invert()).multiplyScalar(deck.radius)
      ground.updateGlobe(airEye, eyeAtT(state.time > terrainMid ? 'rise' : 'dive'), airTurn, covering ? state.weight : 0, place.air.field, sunOn * state.weight, covering ? below(camera.length() - 1, place.air.exactHeights) : 0, gain, shot.post.vignette, view, shot.sun.dir, own)
      // The ground of the close side itself, in below the heights of plates.json (ground): at the handover the globe side is the close side's scene.
      const heightT = eyeAtT(state.time > terrainMid ? 'rise' : 'dive').length() / deck.radius - 1
      // The tones of the ground by the law of the plates (plates.json, tone): the share of its stored tones by the height of the camera, and
      // the globe's colour at the place (ground.tone.under, as it stands at the near end of dusk.heights) at the exposure of this height.
      const groundPl = plan.placeLook(state.segment, camera.length() - 1)
      const groundHeight = Math.log(Math.max(camera.length() - 1, 1e-4))
      const toneShare = 1 - smooth((groundHeight - Math.log(place.tone.heights[0])) / (Math.log(place.tone.heights[1]) - Math.log(place.tone.heights[0])))
      const underAt = place.ground.tone.under[state.time > terrainMid ? 'rise' : 'dive']
      const groundTone = { look: [place.tone.air, toneShare, place.tone.cos[0], place.tone.cos[1]] as [number, number, number, number], ease: place.tone.ease[state.time > terrainMid ? 'rise' : 'dive'], power: place.tone.power, broad: place.ground.tone.broad, most: place.tone.live.most, contrast: place.tone.live.contrast, colour: place.tone.live.colour, under: underAt.map((v, i) => v * Math.pow(place.dusk.gain * place.dusk.tint[i]!, groundPl.dusk - 1)) as [number, number, number] }
      // Inside the frame of T true and skin hold in full above the heights of ground.release and are let go at T, where the globe side is
      // the surface view. The border of the ground and its far limit outside that frame stand still (plates.json, ground.frustum).
      // The near ground, which the camera of T sees from above (ground.keep), keeps all of its picture at every height, so no crest of
      // it goes out by height while the flat plate stands.
      const held = Math.max(1 - below((camera.length() - 1) / heightT, place.ground.release), 1e-6)
      const share = { weight: covering ? below(camera.length() - 1, place.ground.heights) * state.weight : 0, under: covering ? below(camera.length() - 1, place.ground.bandHeights) * state.weight : 0, band: place.ground.band, true: place.ground.true as [number, number], skin: place.ground.skin as [number, number], tall: place.ground.tall, held, keep: place.ground.keep, atT: camAtT(state.time > terrainMid ? 'rise' : 'dive'), frustum: [place.ground.frustum.margin[0]!, place.ground.frustum.margin[1]!, place.ground.frustum.wide] as [number, number, number], near: [place.ground.frustum.near[0]!, place.ground.frustum.near[1]!, place.ground.frustum.forms] as [number, number, number], flat: [place.ground.flat.sinElevation[0]!, place.ground.flat.sinElevation[1]!, place.ground.flat.horizon[1]!, place.ground.flat.horizon[0]!] as [number, number, number, number], matte: [place.ground.matte.width, place.ground.matte.forms, place.ground.matte.level, place.ground.matte.scale] as [number, number, number, number], tone: groundTone }
      ground.updateGround(share, state.time - terrainMid, airEye, eyeAtT(state.time > terrainMid ? 'rise' : 'dive'), airTurn, deck.centre, gain, shot.post.vignette, view, shot.sun.dir, own)
      const vignette = shot.post.vignette * (1 - low * (1 - lensOn))
      hazeTurn.copy(state.rotation).multiply(airTurn)
      ;(gu.uAirFwd!.value as THREE.Vector3).copy(ground.deck!.fwd).applyQuaternion(hazeTurn)
      ;(gu.uAirRight!.value as THREE.Vector3).copy(ground.deck!.right).applyQuaternion(hazeTurn)
      const hz = place.air.haze
      ;(gu.uAirHaze!.value as THREE.Vector4).set(covering ? hz.most : 0, hz.mu, hz.gain, THREE.MathUtils.degToRad(look.relief.air.deckSpanDeg))
      ;(gu.uAirField!.value as THREE.Vector3).set(place.air.field[0], place.air.field[1], place.air.top)
      gu.uCarryOn!.value = 1 - released
      const pl = plan.placeLook(state.segment, camera.length() - 1)
      const duskGain = Math.pow(place.dusk.gain, pl.dusk)
      // The weight of the place grows with nearness, from the first frame of the dive on, and is gone in the rise before the travel.
      const height = Math.log(Math.max(camera.length() - 1, 1e-4))
      const byHeight = (h: [number, number]): number => 1 - smooth((height - Math.log(h[0])) / (Math.log(h[1]) - Math.log(h[0])))
      gu.uPlaceOn!.value = pl.near ? pl.on * byHeight(place.show.heights) : pl.on
      const after = state.time > terrainMid
      for (let i = 0; i < placeTextures.length; i++) gu['uPlace' + i]!.value = (after ? placeRise : placeTextures)[i]
      ;(gu.uToneEye!.value as THREE.Vector3).copy(bodyEyeAtT(after ? 'rise' : 'dive'))
      gu.uToneEase!.value = place.tone.ease[after ? 'rise' : 'dive']
      ;(gu.uToneLook!.value as THREE.Vector4).y = byHeight(place.tone.heights)
      // The far deck of T: all of it at T, none from far.heights times the height of T upward (plates.json, atT.far.clear).
      const farMap = farMaps[after ? 'rise' : 'dive']
      const farAxes = bodyAxesAtT(after ? 'rise' : 'dive')
      gu.uFar!.value = farMap ?? map
      ;(gu.uFarLook!.value as THREE.Vector4).x = covering && farMap ? below((camera.length() - 1) / heightT, place.far.heights) : 0
      ;(gu.uFarFwd!.value as THREE.Vector3).copy(farAxes.fwd)
      ;(gu.uFarRight!.value as THREE.Vector3).copy(farAxes.right)
      ;(gu.uDusk!.value as THREE.Vector4).set(duskGain * Math.pow(place.dusk.tint[0], pl.dusk), duskGain * Math.pow(place.dusk.tint[1], pl.dusk), duskGain * Math.pow(place.dusk.tint[2], pl.dusk), duskGain / place.dusk.gain)
      // The plates hold the light of the place at the full gain and the full tint,
      // so they are drawn with the share of both that the globe has now: the place and the globe about it keep one colour at every exposure.
      // The fourth value: how far the colour of the plates is taken from their display value and not from their light (dusk.hue times
      // the share by which they are drawn dimmer than they are held), so a dimmed highlight does not turn red.
      const placeDusk = place.dusk.tint.map((t) => Math.pow(t, pl.dusk - 1) * duskGain / place.dusk.gain) as [number, number, number]
      ;(gu.uPlaceDusk!.value as THREE.Vector4).set(placeDusk[0], placeDusk[1], placeDusk[2], Math.min(Math.max(place.dusk.hue * (1 - (0.2126 * placeDusk[0] + 0.7152 * placeDusk[1] + 0.0722 * placeDusk[2])), 0), 1))
      ;(gu.uHoldLook!.value as THREE.Vector4).x = ending ? 0 : look.hold.weight
      ;(gu.uSwirl!.value as THREE.Vector4).w = state.time > terrainMid ? THREE.MathUtils.degToRad(look.swirl.deg) : 0
      gu.uWeaveLit!.value = state.time > terrainMid ? look.weave.rise.lit : look.weave.lit
      if (state.time > terrainMid) (gu.uWeaveRise!.value as THREE.Vector4).set(THREE.MathUtils.degToRad(2 * look.weave.rise.foldDeg), Math.log2(wrap.sets[key].color[0] / look.weave.rise.own), look.weave.rise.tone, look.weave.rise.flat)
      else (gu.uWeaveRise!.value as THREE.Vector4).set(0, 0, 0, 0)
      if (thick > 0 || released < 1) {
        centre.copy(localP).negate().applyQuaternion(localBack)
        sunCam.copy(sw.sun).applyQuaternion(localBack)
        airFwd.copy(sw.fwd).applyQuaternion(localBack)
        airRight.copy(sw.right).applyQuaternion(localBack)
        const high = Math.max(localP.length() - 1, 1e-6)
        const low = sw.height * Math.pow(high / sw.height, timing.slow)
        const after = Math.max(plan.eyeShot(kind === 'dive' ? 'dive' : 'rise', state.time + config.shutterFraction / config.fps).pose.position.length() - 1, 1e-6)
        eye.copy(localP).normalize().multiplyScalar(1 + low)
        const air = Math.pow(1 - released, look.veil.sunFade)
        veil.update(view.camera, view.format.width, view.format.height, centre, eye, Math.min(Math.abs(Math.log(after / high)) / timing.rush, 1), Math.asin(1 / (1 + low)) / Math.asin(1 / (1 + high)), localQ, thick, released, sw, sunCam, air, airFwd, airRight, gain, gain * look.relief.air.gain * (1 + look.veil.sunLift * air), vignette, 0)
      } else veil.hide()
      const aspect = view.format.width / view.format.height
      const heldLimb = covering ? limbHeld[kind === 'dive' ? 0 : 1]! : null
      if (heldLimb) {
        limbTurn.copy(state.rotation).multiply(plan.turn(state.time))
        limbEye.copy(heldLimb.eye).applyQuaternion(limbTurn)
        limbS.copy(heldLimb.s).applyQuaternion(limbTurn)
        limbT.copy(heldLimb.t).applyQuaternion(limbTurn)
        // The film may lay the camera off the plan's own move: the pass of the travel begins in the last frames of the rise, after its
        // judged frame (film.ts, passAhead). The far end of the move as the film flies it then lies off the plan's by that step, and the
        // travel reads the glow for its camera from its first frame. So the eye the glow is read for takes the same step: the camera less
        // the plan's own camera at this time. Where the film flies the plan's move the step is nothing and nothing is changed.
        const own = plan.eyeShot(kind === 'dive' ? 'dive' : 'rise', state.time)
        if (own.view === 'orbit') {
          limbOff.copy(own.pose.position).applyQuaternion(state.rotation).negate().add(camera)
          if (limbOff.lengthSq() >= 1e-16) {
            limbEye.add(limbOff)
            limbFrame(limbEye, limbSun.copy(heldLimb.sun).applyQuaternion(limbTurn), limbS, limbT)
          }
        }
      } else limbFrame(camera, light, limbS, limbT)
      gu.uVignette!.value = vignette
      gu.uAspect!.value = aspect
      const limbK = look.limb.gain * (heldLimb ? 1 : 1 - low)
      gu.uLimbK!.value = limbK
      gu.uLimbFar!.value = left
      gu.uLimbHeld!.value = heldLimb ? 1 : 0
      if (heldLimb) (gu.uLimbEye!.value as THREE.Vector3).copy(limbEye)
      ;(gu.uLimbS!.value as THREE.Vector3).copy(limbS)
      ;(gu.uLimbT!.value as THREE.Vector3).copy(limbT)
      globe.update(camera, light, state.rotation, plan.spin(state.time), THREE.MathUtils.degToRad(look.drift.bandDegPerSecond) * elapsed, THREE.MathUtils.degToRad(look.drift.flowDegPerSecond) * flowing, amps, gain, state.weight)
      let taps = 0
      let smear = 1
      if (view.samples > 1 && state.segment.stop === plan.id && (kind === 'dive' || kind === 'rise') && thick < look.motion.hidden) {
        // One sample's share of the shutter that is open: the engine may keep only a share of the film's shutter in a dive or a rise (E6, view.shutter).
        const dt = config.shutterFraction * (view.shutter ?? 1) / (view.samples * config.fps)
        const a = plan.eyeShot(kind, state.time)
        const b = plan.eyeShot(kind, state.time + dt)
        if (a.view === 'orbit' && b.view === 'orbit') {
          const px = slide(a.pose, b.pose, view.format.width, view.format.height)
          const scale = frameScale
          if (px / scale > look.motion.from) taps = Math.min(Math.ceil(px / scale / look.motion.step), look.motion.most)
          smear = 1 + Math.min(Math.max((px * view.samples / scale - look.motion.smear.from) * look.motion.smear.share, 0), look.motion.smear.most) * scale
          if (taps > 0) {
            turnBack.copy(a.pose.quaternion).invert()
            shift.copy(b.pose.position).sub(a.pose.position).applyQuaternion(turnBack)
            turn.copy(turnBack).multiply(b.pose.quaternion)
            zoom = Math.tan(THREE.MathUtils.degToRad(b.pose.vfov) / 2) / Math.tan(THREE.MathUtils.degToRad(a.pose.vfov) / 2)
          }
        }
      }
      globe.motion(taps, smear, camera, shot.camera.quaternion, shift, turn, zoom, view.camera.view?.offsetX ?? 0, view.camera.view?.offsetY ?? 0)
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      // The edge of the limb (LIMB.edgePx) and the size under which the globe is not drawn are counted in pixels of the master frame (d253).
      rim.update(camera, limbS, limbT, gain * state.weight * limbK, vignette, aspect, Math.min(LIMB.edgePx * frameScale / radiusPx, 0.02), left, heldLimb ? limbEye : null)
      holdRim.update(camera, state.rotation, ending ? 0 : look.hold.weight * (1 - left))
      const visible = radiusPx / frameScale > 0.6
      globe.mesh.visible = visible
      rim.mesh.visible = visible
      far.update(radiusPx, view, plan.p.tint, gain)
    },
    dispose: () => {
      globe.dispose()
      rim.dispose()
      far.dispose()
      ground.dispose()
      veil.dispose()
    },
  }
}
