import * as THREE from 'three'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'

export interface AuroraLook {
  pa: number[]
  top: number
  eye: number[]
  sway: number[]
  wave: number[]
  stretch: number[]
  fade: number[]
  calm: number[]
  tail: number[]
  rays: number[]
}

const VERT = /* glsl */ `
out vec2 vUv;
out vec3 vClip;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform float uClock;
uniform float uGain;
uniform vec3 uSway;
uniform vec3 uWave;
uniform vec3 uStretch;
uniform float uVignette;
uniform float uAspect;
uniform int uDiag;
uniform float uAway;
uniform vec2 uTail;
uniform vec4 uRays;
in vec2 vUv;
in vec3 vClip;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
float cell(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}
float streak(float x) {
  float i = floor(x);
  float f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(cell(i), cell(i + 1.0), f);
}
void main() {
  if (uDiag >= 2) discard;
  float a = vUv.x * 6.2831853;
  float tall = 1.0 + uStretch.x * (sin(uStretch.y * a + uStretch.z * uClock) - sin(uStretch.y * a));
  float v = vUv.y / tall;
  float u = vUv.x + uSway.x * v * (sin(uSway.y * a + uSway.z * uClock + 4.0 * v) - sin(uSway.y * a + 4.0 * v));
  float bright = 1.0 + uWave.x * (sin(uWave.y * a - uWave.z * uClock) - sin(uWave.y * a));
  float rays = smoothstep(0.25, 0.75, 0.6 * streak(u * uRays.x) + 0.4 * streak(u * uRays.y + 17.0));
  vec3 col = inverseFilmic(texture(uMap, vec2(u, v)).rgb) * bright * step(v, 1.0) * (1.0 - uAway * smoothstep(uTail.x, uTail.y, vUv.x)) * mix(1.0, uRays.z + uRays.w * rays, uAway);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float lens = uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = vec4(col * lens, 0.0);
}`

export class Aurora {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  private readonly look: AuroraLook

  constructor(p: AuroraLook, map: THREE.Texture, diag: THREE.IUniform<number>) {
    this.look = p
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: map }, uClock: { value: 0 }, uGain: { value: 1 },
        uSway: { value: new THREE.Vector3().fromArray(p.sway) }, uWave: { value: new THREE.Vector3().fromArray(p.wave) }, uStretch: { value: new THREE.Vector3().fromArray(p.stretch) },
        uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uDiag: diag, uAway: { value: 0 }, uTail: { value: new THREE.Vector2().fromArray(p.tail) }, uRays: { value: new THREE.Vector4().fromArray(p.rays) },
      },
      side: THREE.DoubleSide,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      transparent: true,
      depthWrite: false,
      depthTest: true,
    })
    const nu = 256
    const nv = 16
    const eye = new THREE.Vector3().fromArray(p.eye)
    const r0 = eye.length()
    const axis = eye.clone().divideScalar(r0)
    const positions = new Float32Array((nu + 1) * (nv + 1) * 3)
    const uvs = new Float32Array((nu + 1) * (nv + 1) * 2)
    const ring = new THREE.Vector3()
    const at = new THREE.Vector3()
    let k = 0
    for (let j = 0; j <= nv; j++) {
      const h = (j / nv) * p.top
      const s = (1 + h) / r0
      for (let i = 0; i <= nu; i++) {
        const pa = THREE.MathUtils.degToRad(p.pa[0]! + (i / nu) * (p.pa[1]! - p.pa[0]!))
        ring.set(Math.sin(pa), Math.cos(pa), 0)
        ring.addScaledVector(axis, -ring.dot(axis)).normalize()
        at.copy(ring).multiplyScalar(Math.sqrt(1 - s * s)).addScaledVector(axis, s).multiplyScalar(1 + h)
        positions[k * 3] = at.x
        positions[k * 3 + 1] = at.y
        positions[k * 3 + 2] = at.z
        uvs[k * 2] = i / nu
        uvs[k * 2 + 1] = j / nv
        k++
      }
    }
    const index: number[] = []
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const a = j * (nu + 1) + i
        const b = a + nu + 1
        index.push(a, a + 1, b, a + 1, b + 1, b)
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    geometry.setIndex(index)
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 6
  }

  update(clock: number, gain: number, vignette: number, aspect: number, away: number): void {
    const u = this.material.uniforms
    const c = this.look.calm
    const x = Math.min(Math.max((Math.abs(clock) - c[0]!) / (c[1]! - c[0]!), 0), 1)
    const lively = 1 + (c[2]! - 1) * x * x * (3 - 2 * x)
    ;(u.uSway!.value as THREE.Vector3).x = this.look.sway[0]! * lively
    ;(u.uWave!.value as THREE.Vector3).x = this.look.wave[0]! * lively
    ;(u.uStretch!.value as THREE.Vector3).x = this.look.stretch[0]! * lively
    u.uClock!.value = clock
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
    u.uAway!.value = away
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
