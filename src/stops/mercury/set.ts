import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import { samplesFor } from '../../core/sampler'
import type { SetContext, SetFactory, Shot, SkyPatch, ViewKind } from '../../core/types'
import { diagUniform } from '../../diagnostics/diag'
import { drift, mix, ramp, smooth, smoother } from '../../director/rig'
import { Relief } from '../../terrain/relief'
import { closeAhead, closeImage, closeRadius, closeUp as nearUp, wideImage } from './close'
import { config } from '../../config'
import { patches, relief, wide, wrap } from './assets'
import fineJson from './fine.json'
import { Glare } from './glare'
import { Globe } from './globe'
import hazeJson from './haze.json'
import { Lens } from './lens'
import lensJson from './lens.json'
import { Limb } from './limb'
import limbJson from './limb.json'
import streakJson from './streak.json'
import * as look from './look'
import { plan } from './plan'
import { curve } from './pace'
import { Rim } from './rim'
import rimJson from './rim.json'
import skyJson from './sky.json'
import { SunPlate } from './sunplate'
import sunJson from './sunplate.json'

interface SkyDef { file: string; vfovDeg: number; margin: number; feather?: number; gain: number; add: boolean; ring: number[] }

function direction(lonDeg: number, latDeg: number): THREE.Vector3 {
  const lon = THREE.MathUtils.degToRad(lonDeg)
  const lat = THREE.MathUtils.degToRad(latDeg)
  return new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon))
}

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

const BORDER_HEAD = 'out vec4 outColor;'
const BORDER_CUT = 'if (alpha < 0.004) discard;'
const BORDER_UNIFORMS = '\nuniform vec4 uBorder;\nuniform vec3 uBorderCentre;\nuniform vec3 uBorderUp;'
const BORDER_GLSL = /* glsl */ `{
    vec3 bo = vEye - uBorderCentre;
    vec3 br = normalize(vLocal - vEye);
    float bb = dot(bo, br);
    float bd = bb * bb - dot(bo, bo) + uBorder.w * uBorder.w;
    vec3 bn = normalize(bo + br * (-bb - sqrt(max(bd, 0.0))));
    float ba = mix(4.0, acos(clamp(dot(bn, uBorderUp), -1.0, 1.0)), step(0.0, bd) * step(bb, 0.0));
    alpha *= 1.0 - uBorder.z * smoothstep(uBorder.x, uBorder.y, ba);
  }
  `

export const createSet: SetFactory = async (ctx) => {
  const key = ctx.assets === 'full' ? 'full' : 'web'
  const base = 'mercury/' + ctx.assets + '/'
  const fit = plan.fit
  const world = new THREE.Group()
  const orbit = new THREE.Group()
  const terrain = new THREE.Group()
  world.add(orbit, terrain)

  const sizes = wrap.sets[key]
  const map = await ctx.texture(base + 'wrap-color.jpg', { srgb: true, anisotropy: 16, repeat: true })
  const wrapHeight = wrap.height
    ? ctx.floatTexture(await heights(ctx, base + 'wrap-height.bin', sizes.height[0], sizes.height[1]), sizes.height[0], sizes.height[1], true)
    : ctx.floatTexture(new Float32Array(8), 4, 2, true)
  const patchTextures: THREE.Texture[] = []
  for (const level of patches.levels) patchTextures.push(await ctx.texture(base + level.file, { srgb: true, anisotropy: 16 }))
  const risePlates: THREE.Texture[] = []
  for (const level of patches.rise) risePlates.push(await ctx.texture(base + level.file, { srgb: true, anisotropy: 16 }))
  const plateLevels = patches.rise.map((level) => level.level)
  const fineMap = await ctx.texture(base + fineJson.file, { srgb: false, channels: 1, repeat: true, anisotropy: 16 })
  const divePlates = plateLevels.map((level) => patchTextures[level]!)

  const globeOf = (): Globe => new Globe({
    map, mapWidth: (map.image as unknown as { width: number }).width, height: wrapHeight, heightWidth: wrap.height ? sizes.height[0] : 4096, light: look.light,
    patches: patchTextures.length > 0 ? { textures: patchTextures, widthsDeg: patches.levels.map((l) => l.widthDeg), spot: direction(patches.spot.lon, patches.spot.lat), feather: patches.feather, lean: patches.lean, fade: patches.fade, nearDeg: patches.nearDeg, place: patches.place } : undefined,
    fine: { texture: fineMap, period: fineJson.size[key][0]!, guardShare: fineJson.guardShare, top: fineJson.top, shift: look.fine.shift, edge: look.fine.edge, blur: look.fine.blur, shade: look.fine.shade },
  })
  const globe = globeOf()
  const shell = globeOf()
  const shellBase = new THREE.Quaternion()
  const shellTurn = new THREE.Quaternion()
  const bodyAxis = new THREE.Vector3(0, 1, 0)
  globe.mesh.quaternion.fromArray(fit.globe.quaternion)
  const far = new FarPoint()
  const sunPlate = new SunPlate(await ctx.texture(base + sunJson.file, { srgb: true, anisotropy: 4 }), sunJson.rect as [number, number, number, number], sunJson.disc, look.sun.limb, look.sun.small, diagUniform, look.sunSurface)
  const sunAim = new THREE.Quaternion()
  const sunWas = new THREE.Quaternion()
  const { FilmDirector } = await import('../../director/film')
  const { plans } = await import('../../director/plans')
  const film = new FilmDirector(plans)
  const holdCam = plan.hold(plan.holdMid - plan.seg.hold.start).quaternion.clone().multiply(drift(plan.holdMid))
  orbit.add(sunPlate.mesh, globe.mesh, far.points)
  const lens = new Lens(await ctx.texture(base + lensJson.file, { srgb: true, anisotropy: 1 }), lensJson, look.lens, diagUniform)
  const streak = new Lens(await ctx.texture(base + streakJson.file, { srgb: true, anisotropy: 1 }), streakJson, look.streak, diagUniform, true, look.streakCore)
  const over = new THREE.Group()
  const glare = new Glare(look.glare, diagUniform)
  over.add(lens.mesh, streak.mesh, glare.mesh)
  const covers = [look.path.dive.at / config.fps, look.path.rise.at / config.fps]
  const rests = [look.flight.rest[0] / config.fps, look.flight.rest[1] / config.fps]
  const keep = (x: number): number => (x <= look.glare.keep[0] ? x : look.glare.keep[0] + (look.glare.keep[1] - look.glare.keep[0]) * (1 - Math.exp(-(x - look.glare.keep[0]) / (look.glare.keep[1] - look.glare.keep[0]))))
  const spinRate = THREE.MathUtils.degToRad(plan.p.spinDegPerSecond)
  const spin = (time: number) => plan.spin(time) - spinRate * look.spinRest * plan.rested(time)
  const closeTan = Math.tan(THREE.MathUtils.degToRad(relief.full.vfovDeg) / 2)
  const closeSun = new THREE.Vector3((look.glare.terrainSun[0] - 0.5) * 2 * closeTan * relief.full.imageSize[0] / relief.full.imageSize[1], (0.5 - look.glare.terrainSun[1]) * 2 * closeTan, -1).normalize()
  const glareSun = new THREE.Vector3()
  const closeAim = plan.terrain((plan.seg.terrain.end - plan.seg.terrain.start) / 2).quaternion.clone()
  const closeTurn = plan.turn((plan.seg.terrain.start + plan.seg.terrain.end) / 2).clone()
  const closeFrame = plan.terrainFrame.clone().invert()
  const closeFix = new THREE.Quaternion()
  const lowSun = new THREE.Vector3()
  const lowSunAt = (time: number, rotation: THREE.Quaternion): THREE.Vector3 => lowSun.copy(closeSun).applyQuaternion(closeAim).applyQuaternion(closeFix.copy(closeFrame).multiply(plan.turn(time).invert()).multiply(closeTurn).multiply(plan.terrainFrame)).applyQuaternion(rotation)
  const lowTurn = film.sky.turns[plan.id]?.clone().invert() ?? new THREE.Quaternion()
  const skyBack = new THREE.Quaternion()
  const carried = new THREE.Vector3()
  const carriedSun = (rotation: THREE.Quaternion, shot: Shot, camera: { quaternion: THREE.Quaternion }): THREE.Vector3 => carried.copy(closeSun).applyQuaternion(closeAim).applyQuaternion(plan.terrainFrame).applyQuaternion(closeTurn).applyQuaternion(rotation).applyQuaternion(lowTurn).applyQuaternion(shot.skyTurn).applyQuaternion(skyBack.copy(shot.skyQuaternion).invert()).applyQuaternion(camera.quaternion)
  const after = plans[plans.findIndex((p) => p.id === plan.id) + 1]
  const skyDive = film.sky.orbits[plan.id]?.clone().invert() ?? new THREE.Quaternion()
  const skyRise = (after ? film.sky.orbits[after.id] : undefined)?.clone().invert() ?? skyDive
  const skyRide = (anchor: THREE.Quaternion, shot: Shot, camera: { quaternion: THREE.Quaternion }, out: THREE.Quaternion): THREE.Quaternion => out.copy(camera.quaternion).multiply(skyBack.copy(shot.skyQuaternion).invert()).multiply(shot.skyTurn).multiply(anchor)
  const sunDisc = Math.atan(sunJson.disc * (sunJson.rect[2]! - sunJson.rect[0]!))
  const sunShown = new THREE.Vector3()
  const rimSun = new THREE.Vector3()
  const kick = new THREE.Vector3()
  const sunTurn = new THREE.Quaternion()
  const lensAxis = new THREE.Vector3()
  const toCamera = new THREE.Quaternion()
  const plateBack = new THREE.Quaternion()
  const limbRay = new THREE.Vector3()
  const sunRect = sunJson.rect as [number, number, number, number]

  const ground = await Relief.load(ctx, base, relief[key], look.relief)
  const under = await Relief.load(ctx, base, wide[key], look.relief)
  under.group.position.fromArray(wide.position)
  under.group.quaternion.fromArray(wide.quaternion)
  delete under.group.userData.shield
  under.group.traverse((o) => {
    if ((o as THREE.Mesh).material) o.renderOrder = -1
  })
  const wipe = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: 'void main() { gl_Position = vec4(position.xy, 1.0, 1.0); }', fragmentShader: 'void main() { gl_FragColor = vec4(0.0); }', transparent: true, colorWrite: false, depthFunc: THREE.AlwaysDepth, depthWrite: true }))
  wipe.frustumCulled = false
  wipe.renderOrder = -0.5
  const limb = new Limb(await ctx.texture(base + limbJson.file, { srgb: true, mips: false, anisotropy: 1 }), nearUp.clone().multiplyScalar(-(closeRadius + 1)), closeRadius, closeAhead, new THREE.Vector3().crossVectors(closeAhead, nearUp), limbJson.az as [number, number], limbJson.el as [number, number], diagUniform)
  const rim = new Rim(await ctx.texture(base + rimJson.file, { srgb: true, mips: false, anisotropy: 1 }), new Float32Array(await ctx.buffer(base + rimJson.mesh)), rimJson.columns, diagUniform)
  const near = new THREE.Group()
  terrain.add(limb.mesh, shell.mesh)
  near.add(rim.mesh, under.group, wipe, ground.group)
  world.add(near)
  ground.presence(1)
  under.presence(1)
  const border = { value: new THREE.Vector4(THREE.MathUtils.degToRad(look.border.deg[0]), THREE.MathUtils.degToRad(look.border.deg[1]), 0, closeRadius) }
  const airShare = { value: 1 }
  for (const r of [ground, under]) {
    r.group.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined
      if (m?.uniforms?.uVeil && m.uniforms.uPresence) m.uniforms.uPresence = airShare
    })
  }
  near.updateMatrixWorld(true)
  const toNear = near.matrixWorld.clone().invert()
  for (const r of [ground, under]) {
    r.group.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined
      if (!m?.uniforms?.uHasAlpha) return
      if (m.fragmentShader.split(BORDER_HEAD).length !== 2 || m.fragmentShader.split(BORDER_CUT).length !== 2) throw new Error('the relief shader has no single place for the border of the place')
      const local = new THREE.Matrix4().multiplyMatrices(toNear, o.matrixWorld).invert()
      m.fragmentShader = m.fragmentShader.replace(BORDER_HEAD, BORDER_HEAD + BORDER_UNIFORMS).replace(BORDER_CUT, BORDER_GLSL + BORDER_CUT)
      m.uniforms.uBorder = border
      m.uniforms.uBorderCentre = { value: nearUp.clone().multiplyScalar(-(closeRadius + 1)).applyMatrix4(local) }
      m.uniforms.uBorderUp = { value: nearUp.clone().transformDirection(local) }
      m.needsUpdate = true
    })
  }
  const maps = (group: THREE.Group, name: string): THREE.Texture | undefined => {
    let found: THREE.Texture | undefined
    group.traverse((o) => {
      found ??= ((o as THREE.Mesh).material as THREE.ShaderMaterial | undefined)?.uniforms?.[name]?.value as THREE.Texture | undefined
    })
    return found
  }
  const shot = maps(ground.group, 'uColor')
  const around = maps(under.group, 'uColor')
  const aroundAlpha = maps(under.group, 'uAlpha')
  const hasClose = !!shot && !!around && !!aroundAlpha
  if (hasClose) {
    const toClose = plan.anchor.frame.clone().invert().multiply(new THREE.Quaternion().fromArray(fit.globe.quaternion))
    const toWide = under.group.quaternion.clone().invert()
    for (const g of [globe, shell]) {
      g.close(shot, toClose, nearUp, closeRadius, closeImage.focal, closeImage.center, closeImage.box, look.close.far, look.close.feather)
      g.haze(hazeJson.sun, hazeJson.fromDeg, hazeJson.toDeg, hazeJson.gain, look.close.haze.cut, look.close.haze.calm)
      g.wide(around, aroundAlpha, toWide.clone().multiply(toClose), nearUp.clone().multiplyScalar(closeRadius + 1).add(under.group.position).applyQuaternion(toWide), wideImage.focal, wideImage.center, wideImage.box, look.close.wide.feather[0]![1], [0, 1], 0, closeRadius, wideImage.sink, look.close.wide.drop, look.close.wide.margin, look.close.wide.blur)
    }
    shell.mesh.quaternion.copy(toClose)
    shellBase.copy(toClose)
  }
  const terrainMid = (plan.seg.terrain.start + plan.seg.terrain.end) / 2
  const wideFar = curve(look.close.wide.far)
  const wideFeather = curve(look.close.wide.feather)
  const above = (pose: { position: THREE.Vector3 } | null): number => Math.acos(closeRadius / (closeRadius + 1 + (pose ? pose.position.dot(nearUp) : 0)))
  const shine = (time: number, side: number): number => keep(Math.pow(Math.max((above(plan.low(time)) - above(null)) / (look.glare.top[side]! - above(null)), 0), look.glare.height))
  const lifted = (time: number): number => Math.log(1 + plan.low(time).position.dot(nearUp))
  const haloEnds = { dive: [lifted(covers[0]!), lifted(plan.seg.terrain.start)], rise: [lifted(covers[1]!), lifted(plan.seg.terrain.end)] }
  const by = (ends: [number, number], time: number): number => smoother(ramp(Math.log(ends[0]), Math.log(ends[1]), lifted(time)))
  const top = Math.exp(lifted(plan.seg.hold.end))
  const fromTop = (ends: [number, number], time: number): number => by([ends[0] * top, ends[1] * top], time)
  const glow = (time: number, side: number): number => shine(time, side) * (1 - by(side === 0 ? look.glare.fade.dive : look.glare.fade.rise, time))

  const light = new THREE.Vector3()
  const forward = new THREE.Vector3()
  const holdRadius = 1 / plan.hold(plan.holdMid - plan.seg.hold.start).position.length() / Math.tan(THREE.MathUtils.degToRad(fit.vfovDeg) / 2) / 2
  const sky: SkyPatch[] = []
  for (const [view, def] of Object.entries(skyJson as Record<string, SkyDef>)) {
    const wide = 1 + 2 * def.margin
    const tan = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2) * wide
    sky.push({ view: view as ViewKind, texture: await ctx.texture(base + def.file, { srgb: true, mips: false, anisotropy: 1 }), aim: new THREE.Quaternion(), tan: [tan * 16 / 9, tan], gain: def.gain, add: def.add, ring: def.ring as [number, number, number, number], edge: (def.feather ?? def.margin) / wide })
  }

  const low = sky.find((p) => p.view === 'terrain')!
  for (const g of [globe, shell]) {
    g.carry(look.carry.gain, look.carry.knee, 0)
    g.plain(look.carry.tint)
    g.place(patches.place.gain, 1)
    if (patchTextures.length > 0) g.mend(direction(look.mend.lon, look.mend.lat), look.mend.reach, look.mend.from)
  }
  shell.mesh.scale.setScalar(closeRadius)
  shell.mesh.position.copy(nearUp).multiplyScalar(-(closeRadius + 1))
  shell.mesh.renderOrder = -3
  const floor = Math.max(plan.low(plan.seg.terrain.start).position.dot(nearUp), plan.low(plan.seg.terrain.end).position.dot(nearUp))
  const toLow = new THREE.Quaternion()
  const paint = (g: Globe, time: number, diving: boolean, rising: boolean, distance: number, offAxis: number, sun: THREE.Vector3, glow: THREE.Vector3, far: THREE.Vector3, line: THREE.Vector3, spun: number, gain: number, weight: number, rim: number, vignette: number, aspect: number): void => {
    g.plates(plateLevels, rising ? risePlates : divePlates, rising)
    const close = 0
    const grade = diving ? by(look.carry.dive, time) : rising ? 1 - by(look.carry.rise, time) : 0
    g.near(close, 0)
    const high = (distance - 1) * closeRadius
    const capped = 0
    const way = rising ? 'rise' : 'dive'
    g.clear(close > 0 ? look.close.haze.amount * THREE.MathUtils.smoothstep(high, look.close.haze.height[0], look.close.haze.height[1]) : 0, look.close.haze.level[way], [mix(-0.85, look.close.lift.cap[0], capped), mix(1.6, look.close.lift.cap[1], capped)], [look.close.lift.knee[way][0], look.close.lift.knee[way][1] * capped], close > 0 ? THREE.MathUtils.smoothstep(high, look.close.haze.calmHeight[0], look.close.haze.calmHeight[1]) : 0)
    g.far(diving || rising ? 1 - THREE.MathUtils.smoothstep(distance - 1, look.far.height[0], look.far.height[1]) : 0, look.far.under[way], far, look.far)
    g.wash(close > 0 ? look.close.haze.wash.amount * (1 - THREE.MathUtils.smoothstep(high, look.close.haze.wash.height[0], look.close.haze.wash.height[1])) : 0, look.close.haze.wash.cap)
    const reach = wideFar(high)
    g.reach(reach - look.close.wide.soft, reach, wideFeather(high), look.close.wide.over)
    g.cap(rising ? THREE.MathUtils.smoothstep(high, look.close.wide.cap.height[0], look.close.wide.cap.height[1]) : 0, look.close.wide.cap.reach[0], look.close.wide.cap.reach[1], look.close.wide.cap.over, look.close.wide.cap.span)
    g.carry(mix(look.carry.gain, look.carry.lift, grade), look.carry.knee, look.carry.grey * grade)
    g.silhouette(look.light.silhouette.amp * THREE.MathUtils.smoothstep(distance - 1, look.light.silhouette.fade[0], look.light.silhouette.fade[1]))
    g.night(time > terrainMid ? look.light.nightAfter : 1, look.light.shoulder.strength * (rising ? by(look.light.shoulder.height, time) : diving || time < terrainMid ? 0 : 1))
    g.nightPlain(diving || rising ? 1 - THREE.MathUtils.smoothstep(distance - 1, look.light.nightPlain.height[0], look.light.nightPlain.height[1]) : 0, look.light.nightPlain.range)
    g.kick(line)
    g.spill(time > terrainMid ? look.light.rim.after : diving ? mix(1, look.light.rim.after, by(look.light.rim.fade, time)) : 1)
    g.update(sun, glow, 1 - THREE.MathUtils.smoothstep(offAxis, look.light.glareLens[0], look.light.glareLens[1]), spun, gain, weight, rim, vignette, aspect)
  }

  return {
    id: plan.id,
    world,
    over,
    sky,
    update: (state, shot, view) => {
      const inOrbit = state.view === 'orbit'
      const leaving = state.segment.stop === plan.id && state.segment.kind === 'travel'
      const body = leaving ? 1 : state.weight
      orbit.visible = inOrbit && body > 0
      terrain.visible = !inOrbit
      const kind = state.segment.kind
      const mine = state.segment.stop === plan.id
      const shows = !inOrbit ? 1 : mine && (kind === 'dive' || kind === 'rise') ? 1 - THREE.MathUtils.smoothstep(Math.log(1 + plan.low(state.time).position.dot(nearUp)), Math.log(look.under.height[0]), Math.log(look.under.height[1])) : 0
      near.visible = shows > 0
      border.value.z = inOrbit ? 1 : 0
      ground.presence(shows)
      under.presence(shows)
      airShare.value = inOrbit ? 0 : 1
      if (inOrbit && shows > 0) {
        const turn = plan.drawn(state.time)
        near.position.copy(plan.anchor.origin).applyQuaternion(turn)
        near.quaternion.copy(turn).multiply(plan.anchor.frame)
        near.scale.setScalar(1 / closeRadius)
      } else {
        near.position.set(0, 0, 0)
        near.quaternion.identity()
        near.scale.setScalar(1)
      }
      globe.mesh.renderOrder = inOrbit && shows > 0 ? -3 : 0
      const gain = 1 / shot.post.exposure
      lens.mesh.visible = false
      streak.mesh.visible = false
      const on = mine && state.weight > 0
      const first = Math.abs((state.time - rests[0]!) * config.fps) <= Math.abs((state.time - rests[1]!) * config.fps)
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2)
      const aspect = view.format.width / view.format.height
      toCamera.copy(view.camera.quaternion).invert()
      if (!inOrbit) {
        glare.update(on ? glow(state.time, first ? 0 : 1) : 0, lowSunAt(state.time, state.rotation), view.camera, gain, aspect, state.time)
        ground.update(state.time - terrainMid, gain, shot.post.vignette, view)
        under.update(state.time - terrainMid, gain, shot.post.vignette, view)
        const halo = !mine || (kind !== 'dive' && kind !== 'rise') ? 1 : smoother(ramp(haloEnds[kind][0]!, haloEnds[kind][1]!, lifted(state.time)))
        limb.update(low.gain * shot.skyGlow * shot.skyExposure * halo, shot.post.vignette, aspect)
        const shown = on && (kind === 'dive' || kind === 'rise') ? THREE.MathUtils.smoothstep(plan.low(state.time).position.dot(nearUp), floor, floor + look.under.span) : 0
        rim.update(gain * (1 - shown), shot.post.vignette, aspect)
        airShare.value = 1 - shown
        shell.mesh.visible = shown > 0
        border.value.z = shown
        if (shown > 0) {
          const high = film.shotAt(shot.frame, state.time, 'orbit')
          const above = high.sets.find((s) => s.id === plan.id)!
          const eye = high.camera
          const diving = kind === 'dive'
          toLow.copy(eye.quaternion).invert().premultiply(view.camera.quaternion)
          sunShown.copy(high.sun.dir).applyQuaternion(skyRide(diving ? skyDive : skyRise, high, eye, sunTurn))
          glareSun.copy(carriedSun(above.rotation, high, eye))
          light.copy(plan.lightDir).applyQuaternion(above.rotation)
          const distance = above.origin.distanceTo(eye.position)
          const offAxis = THREE.MathUtils.radToDeg(sunShown.angleTo(forward.set(0, 0, -1).applyQuaternion(eye.quaternion)))
          kick.fromArray(look.light.line.dir).applyQuaternion(above.rotation)
          for (const v of [light, sunShown, glareSun, kick]) v.applyQuaternion(toLow)
          shell.lens(lensAxis.set(0, 0, 1).applyQuaternion(toLow))
          const spun = spin(state.time)
          shell.mesh.quaternion.copy(shellBase).multiply(shellTurn.setFromAxisAngle(bodyAxis, -spun))
          paint(shell, state.time, diving, !diving, distance, offAxis, light, sunShown, glareSun, kick, spun, gain, state.weight, Math.min(holdRadius * distance * tanHalf * 2, 1), shot.post.vignette, aspect)
          shell.show(shown)
          shell.smear(view.camera, null, null, 0, 0, 0, view.samples)
        }
        return
      }
      const diving = mine && kind === 'dive'
      const rising = mine && kind === 'rise'
      sunShown.copy(shot.sun.dir)
      rimSun.copy(shot.sun.dir)
      glareSun.copy(shot.sun.dir)
      const shrink = 0
      let plate = 1
      let ghosts = 1
      if (diving || rising) {
        sunShown.applyQuaternion(skyRide(diving ? skyDive : skyRise, shot, view.camera, sunTurn))
        rimSun.copy(sunShown)
        glareSun.copy(carriedSun(state.rotation, shot, view.camera))
        plate = 1 - (shot.skyShare ?? 0)
        if (rising) ghosts = look.flare.after
      } else if (leaving) {
        ghosts = look.flare.after
      }
      glare.update(diving ? glow(state.time, 0) : rising ? glow(state.time, 1) : 0, glareSun, view.camera, gain, aspect, state.time)
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      light.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / tanHalf * (view.format.height / 2)
      const offAxis = THREE.MathUtils.radToDeg(rimSun.angleTo(forward.set(0, 0, -1).applyQuaternion(view.camera.quaternion)))
      if (shows > 0) {
        ground.update(state.time - terrainMid, gain, shot.post.vignette, view)
        under.update(state.time - terrainMid, gain, shot.post.vignette, view)
        rim.update(0, shot.post.vignette, aspect)
      }
      paint(globe, state.time, diving, rising, distance, offAxis, light, rimSun, glareSun, kick.fromArray(look.light.line.dir).applyQuaternion(state.rotation), spin(state.time), gain, state.weight, Math.min(holdRadius / Math.max(radiusPx / view.format.height, 1e-6), 1), shot.post.vignette, aspect)
      globe.mesh.visible = radiusPx > 0.6 && state.weight > 0
      const open = view.shutterSeconds ?? config.shutterFraction / config.fps
      const fast = view.samples > 1 && (diving || rising)
      const at = (t: number) => (kind === 'dive' ? plan.dive(t) : plan.rise(t))
      const now = fast ? at(state.time) : null
      const before = fast ? at(state.time - (open * (view.shutter ?? 1)) / view.samples) : null
      const moving = now?.view === 'orbit' && before?.view === 'orbit'
      const jitter = moving ? samplesFor(view.samples)[view.sample] : undefined
      globe.smear(view.camera, moving ? now.pose : null, moving ? before.pose : null, look.smear, jitter?.jitterX ?? 0, jitter?.jitterY ?? 0, view.samples)
      far.update(radiusPx, view, plan.p.tint, gain)
      if (state.weight <= 0) far.points.visible = false
      const travel = kind === 'travel' ? smooth(ramp(0.25, 0.8, state.u)) : 1
      const shown = kind === 'travel' && mine ? 1 - travel : travel
      const tau = state.time - plan.holdMid
      const breath = 1 + look.sun.breathe * (Math.sin(tau * look.sun.rate) + 0.6 * Math.sin(tau * look.sun.rate * 1.63))
      const arriving = kind === 'travel' && !mine
      const whole = arriving ? 1 - (shot.skyPatch ?? 1) : 0
      const surface = arriving ? 1 - smooth(ramp(look.sunLook[0], look.sunLook[1], state.u)) : 0
      const still = arriving || (mine && kind === 'hold') ? 1 : diving ? 1 - fromTop(look.sunSurface.dive, state.time) : 0
      const hide = arriving ? 1 - smoother(ramp(look.hide.fade[0]!, look.hide.fade[1]!, state.u)) : rising || leaving ? 1 : 0
      const beneath = arriving ? Math.pow(shot.sets.find((s) => s.id === state.segment.stop)?.weight ?? 0, look.hide.power) : 0
      const lift = arriving ? (Math.max(smooth(ramp(0.25, 0.8, look.hide.gone)) - shown, 0) * (1 - beneath)) / Math.max(shown, 1e-4) : 0
      sunPlate.update(sunAim.copy(state.rotation).multiply(holdCam).premultiply(diving || rising ? sunTurn : sunTurn.identity()), gain * shown * look.sun.gain * breath * plate * (shot.sun.far ? 0 : 1), shot.post.vignette, aspect, shrink, surface, still, hide, hide * (1 - beneath), look.hide.rate, hide * lift)
      const then = leaving && view.samples > 1 && shown > 0 ? film.shotAt(shot.frame, state.time - open / view.samples) : null
      sunPlate.smear(view.camera.quaternion, tanHalf, then ? then.camera.quaternion : null, then ? Math.tan(THREE.MathUtils.degToRad(then.camera.vfov) / 2) : tanHalf, then ? sunWas.copy(then.sets.find((s) => s.id === plan.id)?.rotation ?? state.rotation).multiply(holdCam) : sunAim, view.format.height, look.leaveStep, look.leaveSoft)
      let limbLeft = 1
      let limbRight = 1
      if (whole > 0) {
        plateBack.copy(sunAim).invert()
        const at = limbRay.copy(sunShown).applyQuaternion(toCamera)
        const sx = at.x / -at.z
        const sy = at.y / -at.z + look.streakCore.row * tanHalf
        const edge = (sign: number): number => {
          let lo = 0
          let hi = 3
          for (let i = 0; i < 24; i++) {
            const mid = (lo + hi) / 2
            limbRay.set(sx + sign * mid * tanHalf, sy, -1).applyQuaternion(view.camera.quaternion).applyQuaternion(plateBack)
            const u = (limbRay.x / -limbRay.z - sunRect[0]) / (sunRect[2] - sunRect[0]) - 0.5
            const v = (limbRay.y / -limbRay.z - sunRect[1]) / (sunRect[3] - sunRect[1]) - 0.5
            if (limbRay.z < 0 && Math.hypot(u, v) < sunJson.disc) lo = mid
            else hi = mid
          }
          return lo
        }
        limbLeft = edge(-1)
        limbRight = edge(1)
      }
      const sep = sunShown.angleTo(world.position)
      const disc = Math.asin(Math.min(1 / Math.max(distance, 1), 1))
      const soft = diving || rising ? sunDisc : 0.6 * shot.sun.angularRadius
      const clear = THREE.MathUtils.smoothstep(sep, disc - soft, disc + soft)
      const ghost = shown * clear * body * (1 + 2 * (breath - 1)) * ghosts
      const onBody = mix(look.flare.onBody[0], look.flare.onBody[1], diving ? fromTop(look.flare.dive, state.time) : rising || leaving ? 1 : 0)
      const offBody = diving ? mix(1, look.flare.offBody, fromTop(look.flare.dive, state.time)) : 1
      lens.shade(world.position, view.camera, Math.min(onBody / Math.max(offBody, 1e-6), 1))
      streak.shade(world.position, view.camera, onBody)
      lens.update(sunShown, view.camera, ghost * offBody * (arriving ? Math.pow(shot.skyPatch ?? 1, look.sun.ghostIn) : 1), gain, shot.post.vignette, aspect)
      streak.update(sunShown, view.camera, ghost, gain, shot.post.vignette, aspect, whole, limbLeft, limbRight)
    },
    dispose: () => {
      globe.dispose()
      shell.dispose()
      sunPlate.dispose()
      lens.dispose()
      streak.dispose()
      glare.dispose()
      far.dispose()
      ground.dispose()
      under.dispose()
      limb.dispose()
      rim.dispose()
      wipe.geometry.dispose()
      wipe.material.dispose()
    },
  }
}
