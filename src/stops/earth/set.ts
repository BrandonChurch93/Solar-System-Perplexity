import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import type { SetFactory } from '../../core/types'
import { DIAG_GLSL, diagUniform } from '../../diagnostics/diag'
import { smooth } from '../../director/rig'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { Air } from './air'
import { patches } from './assets'
import { Globe, direction } from './globe'
import * as look from './look'
import { plan } from './plan'

const PLATE_VERT = /* glsl */ `
out vec2 vUv;
out vec3 vView;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`

const PLATE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform vec2 uMapSize;
uniform float uGain;
in vec2 vUv;
in vec3 vView;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
void main() {
  vec2 uv = vUv * 3.0 - 1.0;
  vec3 col = inverseFilmic(texture(uMap, uv).rgb) * uGain;
  outColor = diagOut(vec4(col, 1.0), diagTexels(uv * uMapSize), 1.0, vec3(0.85, 0.3, 0.25), vec2(0.0), length(vView));
}`

export const createSet: SetFactory = async (ctx) => {
  const base = 'earth/' + ctx.assets + '/'
  const fit = plan.fit
  const world = new THREE.Group()
  const orbit = new THREE.Group()
  const terrain = new THREE.Group()
  world.add(orbit, terrain)

  const map = await ctx.texture(base + 'wrap-surface.jpg', { srgb: true, anisotropy: 16, repeat: true })
  const cloud = await ctx.texture(base + 'wrap-cloud.webp', { srgb: true, anisotropy: 16, repeat: true })
  const emissive = await ctx.texture(base + 'wrap-emissive.webp', { srgb: true, anisotropy: 8, repeat: true })
  const patchTextures: THREE.Texture[] = []
  for (const level of patches.levels) patchTextures.push(await ctx.texture(base + level.file, { srgb: true, anisotropy: 16 }))

  const globe = new Globe({
    map, mapWidth: (map.image as unknown as { width: number }).width, cloud, emissive, look: look.globe,
    patches: { textures: patchTextures, widthsDeg: patches.levels.map((l) => l.widthDeg), spot: direction(patches.spot.lon, patches.spot.lat), feather: patches.feather, fade: patches.fade },
  })
  globe.mesh.quaternion.fromArray(fit.globe.quaternion)
  globe.mesh.scale.fromArray(fit.globe.scale)
  const air = new Air(look.air, diagUniform)
  orbit.add(globe.mesh, air.mesh)

  const far = new FarPoint()
  orbit.add(far.points)

  const close = await ctx.texture(base + 'standin-close.jpg', { srgb: true, anisotropy: 8, mirror: true })
  const closeSize = close.image as unknown as { width: number; height: number }
  const plateMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: PLATE_VERT, fragmentShader: PLATE_FRAG, uniforms: { uMap: { value: close }, uMapSize: { value: new THREE.Vector2(closeSize.width, closeSize.height) }, uGain: { value: 1 }, uDiag: diagUniform } })
  const t = plan.p.terrain
  const overscan = 1 + (0.5 * t.forward + 0.5 * Math.abs(t.side) + 0.5 * Math.abs(t.rise)) / 10 + Math.tan(THREE.MathUtils.degToRad(0.5 * Math.max(Math.abs(t.yawDeg), Math.abs(t.pitchDeg))))
  const h = 20 * Math.tan(THREE.MathUtils.degToRad(t.vfov) / 2) * overscan
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(h * (closeSize.width / closeSize.height) * 3, h * 3), plateMat)
  plate.position.set(0, 0, -10)
  terrain.add(plate)

  const light = new THREE.Vector3()
  const camera = new THREE.Vector3()
  const glowHome = new THREE.Vector3().fromArray(look.air.dir).normalize()
  const ease = look.globe.drift.ease

  return {
    id: plan.id,
    world,
    sky: [],
    update: (state, shot, view) => {
      const inOrbit = state.view === 'orbit'
      orbit.visible = inOrbit && state.weight > 0
      terrain.visible = !inOrbit
      const gain = 1 / shot.post.exposure
      plateMat.uniforms.uGain!.value = gain
      if (!inOrbit) return
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      light.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      camera.copy(world.position).negate()
      const d = look.descent
      const low = ending ? 0 : 1 - smooth((Math.log(Math.max(camera.length() - 1, 1e-4)) - Math.log(d.low)) / (Math.log(d.high) - Math.log(d.low)))
      const x = plan.seg.hold.end - state.time
      const flow = x > 0 ? (-x * x) / (x + ease) : 0
      const aspect = view.format.width / view.format.height
      globe.update(light, plan.spin(state.time), gain, state.weight, flow, state.time - plan.holdMid)
      const gu = globe.material.uniforms
      gu.uVignette!.value = shot.post.vignette * (1 - low)
      gu.uAspect!.value = aspect
      const au = air.material.uniforms
      ;(au.uCam!.value as THREE.Vector3).copy(camera)
      ;(au.uGlowDir!.value as THREE.Vector3).copy(glowHome).applyQuaternion(state.rotation).lerp(light, Math.max(low, lit)).normalize()
      au.uGain!.value = gain * state.weight
      au.uWide!.value = 1 - low
      au.uVignette!.value = shot.post.vignette * (1 - low)
      au.uAspect!.value = aspect
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      const visible = radiusPx > 0.6
      globe.mesh.visible = visible
      air.mesh.visible = visible
      far.update(radiusPx, view, plan.p.tint, gain)
    },
    dispose: () => {
      globe.dispose()
      air.dispose()
      far.dispose()
      plateMat.dispose()
      plate.geometry.dispose()
    },
  }
}
