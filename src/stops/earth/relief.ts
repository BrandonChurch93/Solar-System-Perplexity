import * as THREE from 'three'
import type { RenderView, SetContext } from '../../core/types'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { NOISE_GLSL } from '../../terrain/relief'

type Box = [number, number, number, number]

export interface GroundDef {
  imageSize: [number, number]
  vfovDeg: number
  nadir: [number, number, number]
  radius: number
  ground: { file: string; box: Box; top: number; fade: number; under?: number; skip?: number; horizon: number[]; horizonSpan: [number, number] }
  towers?: { file: string; dist: string; box: Box; distSize: [number, number] }
  masks?: { file: string; box: Box }
  low?: { file: string }
}

export interface GroundLook {
  mesh: number
  towerMesh: number
  drift: [number, number]
  fold: number
  shimmer: [number, number, number, number]
  lock: [number, number]
  bloom: number
  plain: [number, number]
}

const VERT = /* glsl */ `
uniform vec3 uEye;
uniform vec4 uSea;
uniform vec2 uLock;
in vec2 aImage;
out vec2 vImage;
out vec2 vUv;
out vec3 vView;
out vec3 vClip;
out vec3 vLocal;
vec3 place(vec3 p) {
  float reach = length(p);
  vec3 d = p / reach;
  float c0 = length(uSea.xyz);
  vec3 n0 = uSea.xyz / c0;
  float up0 = acos(clamp(dot(d, n0), -1.0, 1.0));
  float lift = up0 - asin(uSea.w / c0);
  vec3 to = uSea.xyz - uEye;
  float c1 = length(to);
  vec3 n1 = to / c1;
  vec3 v = d * max(reach, sqrt(c0 * c0 - uSea.w * uSea.w)) - uEye;
  float far = length(v);
  vec3 w = v / far;
  float along = clamp(dot(w, n1), -1.0, 1.0);
  float turn = asin(min(uSea.w / c1, 1.0)) - asin(uSea.w / c0) + up0 - acos(along);
  vec3 side = normalize(w * along - n1);
  vec3 q = uEye + (cos(turn) * w + sin(turn) * side) * far;
  return mix(p, q, smoothstep(uLock.x, uLock.y, lift));
}
void main() {
  vImage = aImage;
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(place(position), 1.0);
  vView = mv.xyz;
  vLocal = position;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

const HEAD = /* glsl */ `
precision highp float;
uniform sampler2D uColor;
uniform sampler2D uMasks;
uniform sampler2D uLow;
uniform float uBloom;
uniform vec2 uPlain;
uniform vec2 uSize;
uniform vec4 uBox;
uniform vec4 uMaskBox;
uniform vec2 uImage;
uniform vec2 uDrift;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform vec3 uLayer;
uniform float uGrad;
in vec2 vImage;
in vec2 vUv;
in vec3 vView;
in vec3 vClip;
in vec3 vLocal;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${NOISE_GLSL}
vec3 masks() {
  vec2 mq = (vImage - uMaskBox.xy) / uMaskBox.zw;
  return texture(uMasks, vec2(mq.x, 1.0 - mq.y)).rgb;
}
float lens() {
  vec2 q = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  return 1.0 / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
}
vec3 clear(vec3 col, vec3 soft, float share) {
  vec2 q = clamp(vImage / uImage, 0.0, 1.0);
  vec3 low = inverseFilmic(textureLod(uLow, vec2(q.x, 1.0 - q.y), 0.0).rgb) * uGain;
  return max(col - uBloom * (share * low + uPlain.x * (col - soft)), 0.0) / (1.0 - uBloom);
}`

const GROUND_FRAG = /* glsl */ `
${HEAD}
uniform float uHorizon[9];
uniform vec2 uHorizonSpan;
uniform vec2 uTop;
uniform float uFold;
uniform float uUnder;
uniform vec4 uShimmer;
void main() {
  float hx = (vImage.x - uHorizonSpan.x) / uHorizonSpan.y;
  float hy = uHorizon[8];
  for (int i = 7; i >= 0; i--) hy = hy * hx + uHorizon[i];
  float ground = smoothstep(-1.0, 1.0, vImage.y - hy);
  vec3 m = masks();
  vec2 shift = uDrift * m.g;
  vec2 uv = vUv - vec2(shift.x, -shift.y) / uBox.zw;
  uv.y += 2.0 * max(vImage.y - uUnder, 0.0) / uBox.w;
  float over = max(uTop.x - vImage.y, 0.0);
  float fold = uFold * (1.0 - exp(-over / uFold));
  vec2 at = uv - vec2(0.0, (over + fold) / uBox.w);
  vec2 run = vec2(min(0.3 * over, 40.0) / uBox.z, 0.0);
  vec3 texel = textureGrad(uColor, at, dFdx(vUv) * uGrad + run, dFdy(vUv) * uGrad).rgb;
  vec3 wide = textureGrad(uColor, at, dFdx(vUv) * uPlain.y + run, dFdy(vUv) * uPlain.y).rgb;
  float fall = exp(min(vImage.y - uTop.x, 0.0) / uTop.y);
  vec3 col = inverseFilmic(texel) * fall;
  vec3 soft = inverseFilmic(wide) * fall;
  vec2 g = vLocal.xz * uShimmer.y;
  float fine = 1.0 - smoothstep(0.35, 1.0, max(fwidth(g.x), fwidth(g.y)));
  float sparkle = 0.6 * (vnoise(vec3(g, uShimmer.z + 7.3)) - vnoise(vec3(g, 7.3))) + 0.4 * (vnoise(vec3(g * 2.3 + 4.1, uShimmer.z * 1.7 + 3.1)) - vnoise(vec3(g * 2.3 + 4.1, 3.1)));
  float glint = 1.0 + uShimmer.x * m.r * fine * sparkle * 2.0;
  col = clear(col * glint * uGain * lens(), soft * glint * uGain * lens(), 1.0);
  outColor = diagOut(vec4(col, ground), diagTexels(uv * uSize), step(0.5, ground), uLayer, shift / uImage * 60.0, length(vView));
  if (uDiag >= 2 && ground < 0.5) discard;
}`

const TOWER_FRAG = /* glsl */ `
${HEAD}
void main() {
  vec3 m = masks();
  vec2 shift = uDrift * m.g;
  vec2 uv = vUv - vec2(shift.x, -shift.y) / uBox.zw;
  vec4 texel = textureGrad(uColor, uv, dFdx(vUv) * uGrad, dFdy(vUv) * uGrad);
  vec4 wide = textureGrad(uColor, uv, dFdx(vUv) * uPlain.y, dFdy(vUv) * uPlain.y);
  vec3 lit = inverseFilmic(texel.rgb) * uGain * lens();
  vec3 col = clear(lit, mix(lit, inverseFilmic(wide.rgb) * uGain * lens(), smoothstep(0.8, 1.0, wide.a)), texel.a);
  outColor = diagOut(vec4(col, texel.a), diagTexels(uv * uSize), 1.0, uLayer, shift / uImage * 60.0, length(vView));
  if (texel.a < 0.004 || (uDiag >= 2 && texel.a < 0.5)) discard;
}`

interface Layer { mesh: THREE.Mesh; material: THREE.ShaderMaterial }

export class Ground {
  readonly group = new THREE.Group()
  private readonly layers: Layer[] = []
  private readonly look: GroundLook
  private readonly blank: THREE.DataTexture
  private low = false

  private constructor(look: GroundLook) {
    this.look = look
    this.blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1)
    this.blank.needsUpdate = true
  }

  static async load(ctx: SetContext, base: string, def: GroundDef, look: GroundLook): Promise<Ground> {
    const r = new Ground(look)
    const [W, H] = def.imageSize
    const th = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2)
    const aspect = W / H
    const centre = new THREE.Vector3().fromArray(def.nadir).normalize().multiplyScalar(def.radius + 1)
    const tangent = Math.sqrt(centre.lengthSq() - def.radius * def.radius)
    const ray = (x: number, y: number): THREE.Vector3 => new THREE.Vector3((2 * x / W - 1) * th * aspect, (1 - 2 * y / H) * th, -1).normalize()
    const sea = (d: THREE.Vector3): number => {
      const b = d.dot(centre)
      const disc = b * b - tangent * tangent
      return disc > 0 && b > 0 ? b - Math.sqrt(disc) : tangent
    }
    const masks = def.masks ? await ctx.texture(base + def.masks.file, { srgb: false, mips: false }) : r.blank
    const maskBox = def.masks?.box ?? [0, 0, W, H]
    const low = def.low ? await ctx.texture(base + def.low.file, { srgb: true, mips: false }) : r.blank
    r.low = def.low !== undefined

    const build = (box: Box, top: number, under: number, cells: number, distance: (x: number, y: number, d: THREE.Vector3) => number): THREE.BufferGeometry => {
      const [x0, y0, bw, bh] = box
      const nx = Math.max(2, Math.round(cells))
      const ny = Math.max(2, Math.round((cells * (bh + top + under)) / bw))
      const cols = nx + 1
      const rows = ny + 1
      const position = new Float32Array(cols * rows * 3)
      const uv = new Float32Array(cols * rows * 2)
      const image = new Float32Array(cols * rows * 2)
      let n = 0
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const x = x0 + (i / nx) * bw
          const y = y0 - top + (j / ny) * (bh + top + under)
          const d = ray(x, y)
          const t = distance(x, y, d)
          position[n * 3] = d.x * t
          position[n * 3 + 1] = d.y * t
          position[n * 3 + 2] = d.z * t
          uv[n * 2] = (x - x0) / bw
          uv[n * 2 + 1] = 1 - (y - y0) / bh
          image[n * 2] = x
          image[n * 2 + 1] = y
          n++
        }
      }
      const index = new Uint32Array(nx * ny * 6)
      let m = 0
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const a = j * cols + i
          const b = a + 1
          const c = a + cols
          const e = c + 1
          index[m++] = a; index[m++] = c; index[m++] = b
          index[m++] = b; index[m++] = c; index[m++] = e
        }
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(position, 3))
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
      geo.setAttribute('aImage', new THREE.BufferAttribute(image, 2))
      geo.setIndex(new THREE.BufferAttribute(index, 1))
      return geo
    }

    const add = (geo: THREE.BufferGeometry, color: THREE.Texture, box: Box, fragment: string, tint: [number, number, number], order: number, depth: boolean, extra: Record<string, THREE.IUniform>): void => {
      const size = color.image as unknown as { width: number; height: number }
      const material = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: VERT,
        fragmentShader: fragment,
        uniforms: {
          uColor: { value: color }, uMasks: { value: masks }, uLow: { value: low }, uBloom: { value: 0 }, uPlain: { value: new THREE.Vector2(look.plain[0], look.plain[1]) }, uSize: { value: new THREE.Vector2(size.width, size.height) },
          uBox: { value: new THREE.Vector4().fromArray(box) }, uMaskBox: { value: new THREE.Vector4().fromArray(maskBox) }, uImage: { value: new THREE.Vector2(W, H) },
          uDrift: { value: new THREE.Vector2() }, uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
          uLayer: { value: new THREE.Vector3().fromArray(tint) }, uDiag: diagUniform, uGrad: gradUniform,
          uEye: { value: new THREE.Vector3() }, uSea: { value: new THREE.Vector4(centre.x, centre.y, centre.z, def.radius) }, uLock: { value: new THREE.Vector2().fromArray(look.lock) }, ...extra,
        },
        transparent: true,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
        blendSrcAlpha: THREE.OneFactor,
        blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
        side: THREE.DoubleSide,
        depthTest: depth,
        depthWrite: depth,
      })
      const mesh = new THREE.Mesh(geo, material)
      mesh.frustumCulled = false
      mesh.renderOrder = order
      r.group.add(mesh)
      r.layers.push({ mesh, material })
    }

    const g = def.ground
    const groundMap = await ctx.texture(base + g.file, { srgb: true, anisotropy: 8 })
    add(build(g.box, g.top, g.under ?? 0, look.mesh, (_x, _y, d) => sea(d)), groundMap, g.box, GROUND_FRAG, [0.25, 0.45, 0.85], 0, true, {
      uHorizon: { value: g.horizon.slice(0, 9) }, uHorizonSpan: { value: new THREE.Vector2().fromArray(g.horizonSpan) },
      uTop: { value: new THREE.Vector2(g.box[1], g.fade) }, uFold: { value: look.fold }, uUnder: { value: g.box[1] + g.box[3] - (g.skip ?? 0) }, uShimmer: { value: new THREE.Vector4(look.shimmer[0], look.shimmer[1], 0, 0) },
    })

    const t = def.towers
    if (t) {
      const map = await ctx.texture(base + t.file, { srgb: true, anisotropy: 8 })
      const lift = new Float32Array(await ctx.buffer(base + t.dist))
      const [dw, dh] = t.distSize
      if (lift.length !== dw * dh) throw new Error('relief distance size mismatch: ' + t.dist)
      const [x0, y0, bw, bh] = t.box
      const sample = (x: number, y: number): number => {
        const px = Math.min(Math.max(((x - x0) / bw) * dw - 0.5, 0), dw - 1)
        const py = Math.min(Math.max(((y - y0) / bh) * dh - 0.5, 0), dh - 1)
        const ix = Math.min(Math.floor(px), dw - 2)
        const iy = Math.min(Math.floor(py), dh - 2)
        const tx = px - ix
        const ty = py - iy
        const a = lift[iy * dw + ix]!
        const b = lift[iy * dw + ix + 1]!
        const c = lift[(iy + 1) * dw + ix]!
        const e = lift[(iy + 1) * dw + ix + 1]!
        return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + e * tx) * ty
      }
      add(build(t.box, 0, 0, look.towerMesh, (x, y, d) => sea(d) * (1 - sample(x, y))), map, t.box, TOWER_FRAG, [0.95, 0.9, 0.8], 1, false, {})
    }
    return r
  }

  update(dt: number, gain: number, vignette: number, bloom: number, view: RenderView, eye: THREE.Vector3): void {
    const k = this.look
    for (const l of this.layers) {
      const u = l.material.uniforms
      ;(u.uEye!.value as THREE.Vector3).copy(eye)
      ;(u.uDrift!.value as THREE.Vector2).set(k.drift[0] * dt, k.drift[1] * dt)
      if (u.uShimmer) (u.uShimmer.value as THREE.Vector4).z = k.shimmer[2] * dt
      u.uGain!.value = gain
      u.uVignette!.value = vignette
      u.uBloom!.value = this.low ? bloom * k.bloom : 0
      u.uAspect!.value = view.format.width / view.format.height
    }
  }

  dispose(): void {
    this.blank.dispose()
    for (const l of this.layers) {
      l.mesh.geometry.dispose()
      l.material.dispose()
    }
  }
}
