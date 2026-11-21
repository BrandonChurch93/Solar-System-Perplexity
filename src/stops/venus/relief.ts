import * as THREE from 'three'
import type { RenderView, SetContext } from '../../core/types'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'

export interface CloudLayerDef {
  color: string
  alpha?: string
  dist: string
  box: [number, number, number, number]
  distSize: [number, number]
  tint: [number, number, number]
  edge?: [number, number]
  under?: boolean
}

export interface CloudReliefDef {
  imageSize: [number, number]
  vfovDeg: number
  up: [number, number, number]
  radius: number
  sun: [number, number]
  layers: CloudLayerDef[]
  masks: string
  maskBox: [number, number, number, number]
  air: string
}

export interface CloudMotion {
  cell: number
  hazeDir: [number, number]
  hazeSpeed: number; flowSeconds: number
  swayRad: number
  swayPerSecond: number
  edgeDeg: number
  air: { azDeg: number; elevDeg: number; power: number; below: [number, number, number]; belowDeg: number; holdDeg: number; sunHideDeg: [number, number]; cut: [number, number, number]; gain: number }
}

const AIR_VERT = /* glsl */ `
uniform vec3 uUp;
uniform float uRadius;
out vec3 vDir;
out vec3 vClip;
out vec3 vUp;
out vec3 vWorld;
out float vDip;
void main() {
  vDir = position;
  vWorld = mat3(modelMatrix) * position;
  vec3 eye = -transpose(mat3(modelViewMatrix)) * modelViewMatrix[3].xyz + uUp * (uRadius + 1.0);
  float r = max(length(eye), uRadius + 0.02);
  vUp = eye / r;
  vDip = acos(uRadius / r);
  gl_Position = projectionMatrix * vec4(mat3(modelViewMatrix) * position, 1.0);
  vClip = gl_Position.xyw;
  gl_Position.z = gl_Position.w * 0.9999;
}`

const AIR_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uAir;
uniform vec3 uUp;
uniform vec3 uFwd;
uniform vec3 uRight;
uniform vec3 uSpan;
uniform vec4 uBelow;
uniform float uHold;
uniform vec3 uSun;
uniform vec2 uSunHide;
uniform vec3 uCut;
uniform float uGain;
uniform float uThrough;
uniform float uVignette;
uniform float uAspect;
uniform int uDiag;
in vec3 vDir;
in vec3 vClip;
in vec3 vUp;
in vec3 vWorld;
in float vDip;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
void main() {
  if (uDiag >= 2) discard;
  vec3 d = normalize(vDir);
  vec3 up = normalize(vUp);
  float s = clamp(dot(d, up), -1.0, 1.0);
  float elev = asin(s) + vDip;
  vec3 level = d - up * s;
  float az = atan(dot(level, uRight), dot(level, uFwd));
  vec2 uv = vec2(clamp(az / uSpan.x * 0.5 + 0.5, 0.0, 1.0), pow(clamp(elev / uSpan.y, 0.0, 1.0), uSpan.z));
  vec3 glow = inverseFilmic(textureLod(uAir, uv, 0.0).rgb);
  float cut = uCut.z * smoothstep(uCut.x, uCut.y, dot(glow, vec3(0.3, 0.5, 0.2)));
  cut = max(cut, 1.0 - smoothstep(uSunHide.x, uSunHide.y, acos(clamp(dot(normalize(vWorld), uSun), -1.0, 1.0))));
  cut = mix(cut, 1.0, smoothstep(0.0, -0.003, elev));
  glow = mix(glow, uBelow.rgb, smoothstep(-uHold, -uHold - uBelow.w, elev));
  vec2 q = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float vig = 1.0 / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
  outColor = vec4(glow * pow(vec3(uThrough), vec3(1.0, 1.5, 2.4)) * uGain * vig, cut);
}`

const VERT = /* glsl */ `
in vec2 aImage;
out vec2 vImage;
out vec2 vUv;
out vec3 vView;
out vec3 vClip;
void main() {
  vImage = aImage;
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
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
uniform vec2 uEdge;
uniform vec2 uHaze;
uniform vec4 uSway;
uniform vec4 uLens;
uniform vec3 uUp;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform vec3 uLayer;
uniform float uGrad;
in vec2 vImage;
in vec2 vUv;
in vec3 vView;
in vec3 vClip;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
void main() {
  vec2 mq = (vImage - uMaskBox.xy) / uMaskBox.zw;
  vec3 m = texture(uMasks, vec2(mq.x, 1.0 - mq.y)).rgb;
  vec2 arm = (vImage - uSway.xy) * vec2(uSway.z, 1.0);
  vec2 shift = uHaze * m.r + vec2(-arm.y / uSway.z, arm.x) * uSway.w * m.g;
  vec2 uv = vUv - vec2(shift.x, -shift.y) * uToLayer;
  vec4 texel = textureGrad(uColor, uv, dFdx(vUv) * uGrad, dFdy(vUv) * uGrad);
  float alpha = texture(uAlpha, vUv).r;
  if (uHasAlpha < 0.5) {
    vec3 ray = normalize(vec3((2.0 * vImage.x - 1.0) * uLens.x, (1.0 - 2.0 * vImage.y) * uLens.y, -1.0));
    alpha = smoothstep(0.0, -uLens.w, asin(clamp(dot(ray, uUp), -1.0, 1.0)) + uLens.z);
  }
  alpha *= smoothstep(0.0, uEdge.x, vUv.x) * smoothstep(0.0, uEdge.y, 1.0 - vUv.x);
  if (alpha < 0.004) discard;
  vec2 q = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float vig = 1.0 / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
  vec3 col = inverseFilmic(texel.rgb) * uGain * vig;
  if (uDiag >= 2 && alpha < 0.5) discard;
  outColor = diagOut(vec4(col * alpha, alpha), diagTexels(uv * uSize), 1.0, uLayer, shift * 60.0, length(vView));
}`

interface Layer { mesh: THREE.Mesh; material: THREE.ShaderMaterial }

const rad = THREE.MathUtils.degToRad

const BLEND = {
  transparent: true,
  blending: THREE.CustomBlending,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneMinusSrcAlphaFactor,
  blendSrcAlpha: THREE.OneFactor,
  blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
} as const

export class CloudRelief {
  readonly group = new THREE.Group()
  private readonly layers: Layer[] = []
  private air: Layer | null = null
  private readonly motion: CloudMotion

  private constructor(motion: CloudMotion) {
    this.motion = motion
  }

  static async load(ctx: SetContext, base: string, def: CloudReliefDef, motion: CloudMotion): Promise<CloudRelief> {
    const r = new CloudRelief(motion)
    const [W, H] = def.imageSize
    const th = Math.tan(rad(def.vfovDeg) / 2)
    const aspect = W / H
    const up = new THREE.Vector3().fromArray(def.up).normalize()
    const fwd = new THREE.Vector3(0, 0, -1).addScaledVector(up, up.z).normalize()
    const right = new THREE.Vector3().crossVectors(fwd, up).normalize()
    const dip = Math.acos(def.radius / (def.radius + 1))
    const masks = await ctx.texture(base + def.masks, { srgb: false, mips: false })
    const a = motion.air
    const airMap = await ctx.texture(base + def.air, { srgb: true, mips: false })
    const airMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: AIR_VERT,
      fragmentShader: AIR_FRAG,
      uniforms: {
        uAir: { value: airMap }, uUp: { value: up }, uFwd: { value: fwd }, uRight: { value: right }, uRadius: { value: def.radius },
        uSpan: { value: new THREE.Vector3(rad(a.azDeg), rad(a.elevDeg), a.power) }, uBelow: { value: new THREE.Vector4(a.below[0], a.below[1], a.below[2], rad(a.belowDeg)) }, uHold: { value: rad(a.holdDeg) }, uSun: { value: new THREE.Vector3(0, 0, 1) }, uSunHide: { value: new THREE.Vector2(rad(a.sunHideDeg[0]), rad(a.sunHideDeg[1])) },
        uCut: { value: new THREE.Vector3().fromArray(a.cut) }, uGain: { value: 1 }, uThrough: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uDiag: diagUniform,
      },
      ...BLEND,
      side: THREE.BackSide,
      depthTest: false,
      depthWrite: false,
    })
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), airMaterial)
    dome.frustumCulled = false
    dome.renderOrder = -1
    r.group.add(dome)
    r.air = { mesh: dome, material: airMaterial }

    for (let k = 0; k < def.layers.length; k++) {
      const l = def.layers[k]!
      const color = await ctx.texture(base + l.color, { srgb: true, anisotropy: 8 })
      const alpha = l.alpha ? await ctx.texture(base + l.alpha, { srgb: false, anisotropy: 4 }) : null
      const dist = new Float32Array(await ctx.buffer(base + l.dist))
      const [dw, dh] = l.distSize
      if (dist.length !== dw * dh) throw new Error('relief distance size mismatch: ' + l.dist)
      const [x0, y0, bw, bh] = l.box
      const cell = motion.cell * W / 5632
      const nx = Math.max(2, Math.round(bw / cell))
      const ny = Math.max(2, Math.round(bh / cell))
      const cols = nx + 1
      const rows = ny + 1
      const position = new Float32Array(cols * rows * 3)
      const uv = new Float32Array(cols * rows * 2)
      const image = new Float32Array(cols * rows * 2)
      const sample = (x: number, y: number): number => {
        const px = Math.min(Math.max(x - 0.5, 0), dw - 1)
        const py = Math.min(Math.max(y - 0.5, 0), dh - 1)
        const ix = Math.min(Math.floor(px), dw - 2)
        const iy = Math.min(Math.floor(py), dh - 2)
        const tx = px - ix
        const ty = py - iy
        return (dist[iy * dw + ix]! * (1 - tx) + dist[iy * dw + ix + 1]! * tx) * (1 - ty) + (dist[(iy + 1) * dw + ix]! * (1 - tx) + dist[(iy + 1) * dw + ix + 1]! * tx) * ty
      }
      let n = 0
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const fx = i / nx
          const fy = j / ny
          const ix = (x0 + fx * bw) / W
          const iy = (y0 + fy * bh) / H
          const dir = new THREE.Vector3((2 * ix - 1) * th * aspect, (1 - 2 * iy) * th, -1).normalize()
          const dd = sample(fx * dw, fy * dh)
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
          const p = j * cols + i
          index[m++] = p; index[m++] = p + cols; index[m++] = p + 1
          index[m++] = p + 1; index[m++] = p + cols; index[m++] = p + cols + 1
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
          uColor: { value: color }, uAlpha: { value: alpha ?? masks }, uMasks: { value: masks }, uHasAlpha: { value: alpha ? 1 : 0 },
          uSize: { value: new THREE.Vector2(size.width, size.height) }, uMaskBox: { value: new THREE.Vector4(def.maskBox[0] / W, def.maskBox[1] / H, def.maskBox[2] / W, def.maskBox[3] / H) }, uToLayer: { value: new THREE.Vector2(W / bw, H / bh) }, uEdge: { value: new THREE.Vector2(Math.max(l.edge?.[0] ?? 0, 1e-6), Math.max(l.edge?.[1] ?? 0, 1e-6)) },
          uHaze: { value: new THREE.Vector2() }, uSway: { value: new THREE.Vector4(def.sun[0], def.sun[1], aspect, 0) }, uLens: { value: new THREE.Vector4(th * aspect, th, dip, rad(motion.edgeDeg)) }, uUp: { value: up },
          uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uLayer: { value: new THREE.Vector3().fromArray(l.tint) }, uDiag: diagUniform, uGrad: gradUniform,
        },
        ...BLEND,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: !l.under,
      })
      const mesh = new THREE.Mesh(geo, material)
      mesh.frustumCulled = false
      mesh.renderOrder = k
      r.group.add(mesh)
      r.layers.push({ mesh, material })
    }
    return r
  }

  update(time: number, gain: number, vignette: number, view: RenderView, sun: THREE.Vector3, sky = 1): void {
    const m = this.motion
    const dt = Math.min(Math.max(time, -m.flowSeconds), m.flowSeconds)
    const aspect = view.format.width / view.format.height
    if (this.air) {
      const u = this.air.material.uniforms
      u.uGain!.value = gain * m.air.gain
      u.uThrough!.value = sky
      ;(u.uSun!.value as THREE.Vector3).copy(sun)
      u.uVignette!.value = vignette
      u.uAspect!.value = aspect
    }
    const sway = m.swayRad * Math.sin(m.swayPerSecond * dt)
    for (const l of this.layers) {
      const u = l.material.uniforms
      ;(u.uHaze!.value as THREE.Vector2).set(m.hazeDir[0] * m.hazeSpeed * dt, m.hazeDir[1] * m.hazeSpeed * dt)
      ;(u.uSway!.value as THREE.Vector4).w = sway
      u.uGain!.value = gain
      u.uVignette!.value = vignette
      u.uAspect!.value = aspect
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
