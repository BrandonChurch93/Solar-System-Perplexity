import * as THREE from 'three'
import { FarPoint } from '../../bodies/farpoint'
import type { SetContext, SetFactory, SkyPatch, ViewKind } from '../../core/types'
import { DIAG_GLSL, diagUniform } from '../../diagnostics/diag'
import { smooth } from '../../director/rig'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { patches, wrap } from './assets'
import { Globe } from './globe'
import * as look from './look'
import { plan } from './plan'
import skyJson from './sky.json'

interface SkyDef { file: string; vfovDeg: number; margin: number; gain: number; add: boolean; ring: number[] }

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

  const globe = new Globe({
    map, mapWidth: (map.image as unknown as { width: number }).width, height: wrapHeight, heightWidth: wrap.height ? sizes.height[0] : 4096, light: look.light,
    patches: patchTextures.length > 0 ? { textures: patchTextures, widthsDeg: patches.levels.map((l) => l.widthDeg), spot: direction(patches.spot.lon, patches.spot.lat), feather: patches.feather, fade: patches.fade, nearDeg: patches.nearDeg } : undefined,
  })
  globe.mesh.quaternion.fromArray(fit.globe.quaternion)
  const far = new FarPoint()
  orbit.add(globe.mesh, far.points)

  const close = await ctx.texture(base + 'standin-close.jpg', { srgb: true, anisotropy: 8, mirror: true })
  const closeSize = close.image as unknown as { width: number; height: number }
  const plateMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: PLATE_VERT, fragmentShader: PLATE_FRAG, uniforms: { uMap: { value: close }, uMapSize: { value: new THREE.Vector2(closeSize.width, closeSize.height) }, uGain: { value: 1 }, uDiag: diagUniform } })
  const t = plan.p.terrain
  const h = 2 * 10 * Math.tan(THREE.MathUtils.degToRad(t.vfov) / 2) * 1.2
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(h * (closeSize.width / closeSize.height) * 3, h * 3), plateMat)
  plate.position.set(0, 0, -10)
  terrain.add(plate)

  const light = new THREE.Vector3()
  const holdRadius = 1 / plan.hold(plan.holdMid - plan.seg.hold.start).position.length() / Math.tan(THREE.MathUtils.degToRad(fit.vfovDeg) / 2) / 2
  const sky: SkyPatch[] = []
  for (const [view, def] of Object.entries(skyJson as Record<string, SkyDef>)) {
    const wide = 1 + 2 * def.margin
    const tan = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2) * wide
    sky.push({ view: view as ViewKind, texture: await ctx.texture(base + def.file, { srgb: true, mips: false, anisotropy: 1 }), aim: new THREE.Quaternion(), tan: [tan * 16 / 9, tan], gain: def.gain, add: def.add, ring: def.ring as [number, number, number, number], edge: def.margin / wide })
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
      plateMat.uniforms.uGain!.value = gain
      if (!inOrbit) return
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      light.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      globe.update(light, plan.spin(state.time), gain, state.weight, Math.min(holdRadius / Math.max(radiusPx / view.format.height, 1e-6), 1), shot.post.vignette, view.format.width / view.format.height)
      globe.mesh.visible = radiusPx > 0.6
      far.update(radiusPx, view, plan.p.tint, gain)
    },
    dispose: () => {
      globe.dispose()
      far.dispose()
      plateMat.dispose()
      plate.geometry.dispose()
    },
  }
}
