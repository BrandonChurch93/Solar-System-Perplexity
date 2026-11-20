import * as THREE from 'three'
import type { RenderView, SetContext } from '../core/types'
import { DIAG_GLSL, diagUniform, gradUniform } from '../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../post/chain'

export interface ReliefLayerDef {
  color: string
  alpha?: string
  dist: string
  box: [number, number, number, number]
  distSize: [number, number]
  tint: [number, number, number]
}

export interface ReliefDef {
  imageSize: [number, number]
  vfovDeg: number
  layers: ReliefLayerDef[]
  masks: string
  maskBox: [number, number, number, number]
  mistDir: [number, number]
}

export interface ReliefAir {
  pitchDeg: number
  dipDeg: number
  cool: [number, number, number]
  coolScaleDeg: number
  warm: [number, number, number]
  warmScaleDeg: number
  side: [number, number]
  starScaleDeg: number
  starCut: number
  veil: number
  drift?: [number, number, number, number]
}

export interface ReliefValley { top: number; soft: number; strength: number; color: [number, number, number]; wind: [number, number]; speed: number; scale: number; stretch: number; churn: number; mask: [number, number]; cut: [number, number] }

export interface ReliefMotion { mistSpeed: number; dustSpeed: number; dustDir: [number, number]; mesh: number; air?: ReliefAir; valley?: ReliefValley; pitchDeg?: number }

const NOISE_GLSL = /* glsl */ `
float vhash(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}
float vnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(vhash(i), vhash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(vhash(i + vec3(0.0, 1.0, 0.0)), vhash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y);
  float b = mix(mix(vhash(i + vec3(0.0, 0.0, 1.0)), vhash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(vhash(i + vec3(0.0, 1.0, 1.0)), vhash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y);
  return mix(a, b, f.z);
}`

const AIR_VERT = /* glsl */ `
out vec3 vDir;
out vec3 vClip;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * vec4(mat3(modelViewMatrix) * position, 1.0);
  vClip = gl_Position.xyw;
  gl_Position.z = gl_Position.w * 0.9999;
}`

const AIR_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uUp;
uniform float uDip;
uniform vec3 uCool;
uniform vec3 uWarm;
uniform vec4 uScale;
uniform vec2 uSide;
uniform float uSpan;
uniform float uVeil;
uniform vec4 uDrift;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform int uDiag;
in vec3 vDir;
in vec3 vClip;
out vec4 outColor;
${NOISE_GLSL}
void main() {
  if (uDiag >= 2) discard;
  vec3 d = normalize(vDir);
  float elev = max(asin(clamp(dot(d, uUp), -1.0, 1.0)) + uDip, 0.0);
  float across = clamp(d.x / max(-d.z, 0.2) / uSpan, -1.0, 1.0) * 0.5 + 0.5;
  float side = mix(uSide.x, uSide.y, across);
  float az = atan(d.x, -d.z);
  vec3 dq = vec3(az * uDrift.y - uDrift.z, elev * uDrift.w, uDrift.z * 0.4);
  float streak = 1.0 + uDrift.x * (0.65 * vnoise(dq) + 0.35 * vnoise(dq * vec3(2.3, 1.7, 1.0) + 5.2) - 0.5) * 2.0;
  vec3 glow = uCool * exp(-elev / uScale.x) * side + uWarm * exp(-elev / uScale.y) * mix(1.0, side, 0.35) * streak;
  float cut = 1.0 - (1.0 - uVeil) * (1.0 - uScale.w * exp(-elev / uScale.z));
  vec2 q = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float vig = 1.0 / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
  outColor = vec4(glow * uGain * vig, cut);
}`

const VERT = /* glsl */ `
in vec2 aImage;
out vec2 vImage;
out vec2 vUv;
out vec3 vView;
out vec3 vClip;
out vec3 vLocal;
out vec3 vEye;
void main() {
  vImage = aImage;
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  vLocal = position;
  vEye = -transpose(mat3(modelViewMatrix)) * modelViewMatrix[3].xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uColor;
uniform sampler2D uAlpha;
uniform sampler2D uMasks;
uniform float uHasAlpha;
uniform vec2 uSize;
uniform vec4 uMaskBox;
uniform vec2 uToLayer;
uniform vec2 uMist;
uniform vec2 uDust;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform vec3 uLayer;
uniform float uGrad;
uniform vec3 uUpL;
uniform vec4 uValley;
uniform vec4 uValleyFlow;
uniform vec4 uValleyShape;
uniform vec3 uValleyColor;
in vec2 vImage;
in vec2 vUv;
in vec3 vView;
in vec3 vClip;
in vec3 vLocal;
in vec3 vEye;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${NOISE_GLSL}
float valleyDensity(vec3 p) {
  float h = dot(p, uUpL);
  vec3 fwd = vec3(0.0, uUpL.z, -uUpL.y);
  vec2 g = vec2(p.x, dot(p, fwd));
  vec2 w = uValleyFlow.xy;
  vec2 along = vec2(dot(g, w), dot(g, vec2(-w.y, w.x)));
  along.x -= uValleyFlow.z;
  vec3 q = vec3(along.x / uValleyShape.y, along.y, h * 1.6 + uValleyFlow.w) * uValleyShape.x;
  float n = 0.55 * vnoise(q) + 0.3 * vnoise(q * 2.03 + 7.1) + 0.15 * vnoise(q * 4.1 + 3.3);
  return smoothstep(uValley.x, uValley.x - uValley.y, h) * smoothstep(uValleyShape.z, uValleyShape.w, n);
}
void main() {
  vec2 mq = (vImage - uMaskBox.xy) / uMaskBox.zw;
  vec3 m = texture(uMasks, vec2(mq.x, 1.0 - mq.y)).rgb;
  vec2 shift = uMist * m.r + uDust * m.g;
  vec2 uv = vUv - vec2(shift.x, -shift.y) * uToLayer;
  vec4 texel = textureGrad(uColor, uv, dFdx(vUv) * uGrad, dFdy(vUv) * uGrad);
  float alpha = uHasAlpha > 0.5 ? texture(uAlpha, vUv).r : texel.a;
  if (alpha < 0.004) discard;
  vec2 q = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float vig = 1.0 / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
  vec3 col = inverseFilmic(texel.rgb) * uGain * vig;
  float hE = dot(vEye, uUpL);
  float hP = dot(vLocal, uUpL);
  if (uValley.z > 0.0 && hP < uValley.x && hE > hP) {
    float t0 = clamp((uValley.x - hE) / (hP - hE), 0.0, 1.0);
    vec3 ray = vLocal - vEye;
    float sum = 0.0;
    for (int i = 0; i < 4; i++) sum += valleyDensity(vEye + ray * mix(t0, 1.0, (float(i) + 0.5) / 4.0));
    float tau = uValley.z * sum * 0.25 * (1.0 - t0) * length(ray) * (uValley.w + m.r);
    float f = 1.0 - exp(-tau);
    col = mix(col, uValleyColor * uGain * vig, f);
  }
  if (uDiag >= 2 && alpha < 0.5) discard;
  outColor = diagOut(vec4(col * alpha, alpha), diagTexels(uv * uSize), 1.0, uLayer, shift * 60.0, length(vView));
}`

interface Layer { mesh: THREE.Mesh; material: THREE.ShaderMaterial }

const rad = THREE.MathUtils.degToRad

export class Relief {
  readonly group = new THREE.Group()
  private readonly layers: Layer[] = []
  private air: Layer | null = null
  private readonly def: ReliefDef
  private readonly motion: ReliefMotion

  private constructor(def: ReliefDef, motion: ReliefMotion) {
    this.def = def
    this.motion = motion
  }

  static async load(ctx: SetContext, base: string, def: ReliefDef, motion: ReliefMotion): Promise<Relief> {
    const r = new Relief(def, motion)
    const [W, H] = def.imageSize
    const masks = await ctx.texture(base + def.masks, { srgb: false, mips: false })
    const th = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2)
    const aspect = W / H
    const a = motion.air
    if (a) {
      const material = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: AIR_VERT,
        fragmentShader: AIR_FRAG,
        uniforms: {
          uUp: { value: new THREE.Vector3(0, Math.cos(rad(a.pitchDeg)), Math.sin(rad(a.pitchDeg))) }, uDip: { value: rad(a.dipDeg) },
          uCool: { value: new THREE.Vector3().fromArray(a.cool) }, uWarm: { value: new THREE.Vector3().fromArray(a.warm) },
          uScale: { value: new THREE.Vector4(rad(a.coolScaleDeg), rad(a.warmScaleDeg), rad(a.starScaleDeg), a.starCut) },
          uSide: { value: new THREE.Vector2().fromArray(a.side) }, uVeil: { value: a.veil }, uDrift: { value: new THREE.Vector4(0, 1, 0, 1) }, uSpan: { value: th * aspect },
          uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uDiag: diagUniform,
        },
        transparent: true,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
        blendSrcAlpha: THREE.OneFactor,
        blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
        side: THREE.BackSide,
        depthTest: false,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), material)
      mesh.frustumCulled = false
      mesh.renderOrder = -1
      r.group.add(mesh)
      r.air = { mesh, material }
    }
    for (let k = 0; k < def.layers.length; k++) {
      const l = def.layers[k]!
      const color = await ctx.texture(base + l.color, { srgb: true, anisotropy: 8 })
      const alpha = l.alpha ? await ctx.texture(base + l.alpha, { srgb: false, anisotropy: 4 }) : null
      const dist = new Float32Array(await ctx.buffer(base + l.dist))
      const [dw, dh] = l.distSize
      if (dist.length !== dw * dh) throw new Error('relief distance size mismatch: ' + l.dist)
      const [x0, y0, bw, bh] = l.box
      const nx = Math.max(2, Math.round(bw >= bh ? motion.mesh : (motion.mesh * bw) / bh))
      const ny = Math.max(2, Math.round(bw >= bh ? (motion.mesh * bh) / bw : motion.mesh))
      const position = new Float32Array((nx + 1) * (ny + 1) * 3)
      const uv = new Float32Array((nx + 1) * (ny + 1) * 2)
      const image = new Float32Array((nx + 1) * (ny + 1) * 2)
      const sample = (fx: number, fy: number): number => {
        const px = Math.min(Math.max(fx * dw - 0.5, 0), dw - 1)
        const py = Math.min(Math.max(fy * dh - 0.5, 0), dh - 1)
        const ix = Math.min(Math.floor(px), dw - 2)
        const iy = Math.min(Math.floor(py), dh - 2)
        const tx = px - ix
        const ty = py - iy
        const a = dist[iy * dw + ix]!
        const b = dist[iy * dw + ix + 1]!
        const c = dist[(iy + 1) * dw + ix]!
        const d = dist[(iy + 1) * dw + ix + 1]!
        return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty
      }
      let n = 0
      for (let j = 0; j <= ny; j++) {
        for (let i = 0; i <= nx; i++) {
          const fx = i / nx
          const fy = j / ny
          const ix = (x0 + fx * bw) / W
          const iy = (y0 + fy * bh) / H
          const dir = new THREE.Vector3((2 * ix - 1) * th * aspect, (1 - 2 * iy) * th, -1).normalize()
          const dd = sample(fx, fy)
          position[n * 3] = dir.x * dd
          position[n * 3 + 1] = dir.y * dd
          position[n * 3 + 2] = dir.z * dd
          uv[n * 2] = fx
          uv[n * 2 + 1] = 1 - fy
          image[n * 2] = ix
          image[n * 2 + 1] = iy
          n++
        }
      }
      const index = new Uint32Array(nx * ny * 6)
      let m = 0
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const a = j * (nx + 1) + i
          const b = a + 1
          const c = a + nx + 1
          const d = c + 1
          index[m++] = a; index[m++] = c; index[m++] = b
          index[m++] = b; index[m++] = c; index[m++] = d
        }
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(position, 3))
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
      geo.setAttribute('aImage', new THREE.BufferAttribute(image, 2))
      geo.setIndex(new THREE.BufferAttribute(index, 1))
      const size = color.image as unknown as { width: number; height: number }
      const material = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uColor: { value: color }, uAlpha: { value: alpha ?? color }, uMasks: { value: masks }, uHasAlpha: { value: alpha ? 1 : 0 },
          uSize: { value: new THREE.Vector2(size.width, size.height) }, uMaskBox: { value: new THREE.Vector4(def.maskBox[0] / W, def.maskBox[1] / H, def.maskBox[2] / W, def.maskBox[3] / H) }, uToLayer: { value: new THREE.Vector2(W / bw, H / bh) },
          uMist: { value: new THREE.Vector2() }, uDust: { value: new THREE.Vector2() }, uGain: { value: 1 }, uVignette: { value: 0 },
          uAspect: { value: 16 / 9 }, uLayer: { value: new THREE.Vector3().fromArray(l.tint) }, uDiag: diagUniform, uGrad: gradUniform,
          uUpL: { value: new THREE.Vector3(0, Math.cos(rad(motion.pitchDeg ?? 0)), Math.sin(rad(motion.pitchDeg ?? 0))) }, uValley: { value: new THREE.Vector4(0, 1, 0, 0) }, uValleyFlow: { value: new THREE.Vector4(1, 0, 0, 0) }, uValleyShape: { value: new THREE.Vector4(1, 1, 0, 1) }, uValleyColor: { value: new THREE.Vector3() },
        },
        transparent: true,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
        blendSrcAlpha: THREE.OneFactor,
        blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: true,
      })
      const mesh = new THREE.Mesh(geo, material)
      mesh.frustumCulled = false
      mesh.renderOrder = k
      r.group.add(mesh)
      r.layers.push({ mesh, material })
    }
    return r
  }

  update(dt: number, gain: number, vignette: number, view: RenderView): void {
    const d = this.def
    const m = this.motion
    if (this.air) {
      const u = this.air.material.uniforms
      const f = m.air?.drift
      if (f) (u.uDrift!.value as THREE.Vector4).set(f[0], f[1], f[2] * dt + 40, f[3])
      u.uGain!.value = gain
      u.uVignette!.value = vignette
      u.uAspect!.value = view.format.width / view.format.height
    }
    for (const l of this.layers) {
      const u = l.material.uniforms
      ;(u.uMist!.value as THREE.Vector2).set(d.mistDir[0] * m.mistSpeed * dt, d.mistDir[1] * m.mistSpeed * dt)
      ;(u.uDust!.value as THREE.Vector2).set(m.dustDir[0] * m.dustSpeed * dt, m.dustDir[1] * m.dustSpeed * dt)
      const v = m.valley
      if (v) {
        const wl = Math.hypot(v.wind[0], v.wind[1])
        ;(u.uValley!.value as THREE.Vector4).set(v.top, v.soft, v.strength * v.mask[1], v.mask[0] / Math.max(v.mask[1], 1e-6))
        ;(u.uValleyFlow!.value as THREE.Vector4).set(v.wind[0] / wl, v.wind[1] / wl, v.speed * dt, v.churn * dt)
        ;(u.uValleyShape!.value as THREE.Vector4).set(v.scale, v.stretch, v.cut[0], v.cut[1])
        ;(u.uValleyColor!.value as THREE.Vector3).fromArray(v.color)
      }
      u.uGain!.value = gain
      u.uVignette!.value = vignette
      u.uAspect!.value = view.format.width / view.format.height
    }
  }

  dispose(): void {
    if (this.air) {
      this.air.mesh.geometry.dispose()
      this.air.material.dispose()
    }
    for (const l of this.layers) {
      l.mesh.geometry.dispose()
      l.material.dispose()
    }
  }
}
