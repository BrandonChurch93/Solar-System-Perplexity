import * as THREE from 'three'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'

export interface LensLook { gain: number; fade: [number, number] }
export interface LensFit { file: string; rect: number[]; sun: number[]; boost: number }

const VERT = /* glsl */ `
out vec2 vNdc;
void main() {
  vNdc = position.xy;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform vec2 uSun;
uniform vec2 uHome;
uniform vec4 uRect;
uniform float uAmount;
uniform float uGain;
uniform float uAspect;
uniform float uVignette;
uniform float uSlide;
uniform vec4 uCore;
uniform vec4 uCoreLine;
uniform vec4 uCoreJoin;
uniform vec3 uWarm;
uniform vec2 uPeak;
uniform float uTint;
uniform int uDiag;
in vec2 vNdc;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
void main() {
  vec2 p = vNdc * vec2(uAspect, 1.0);
  float d = dot(uSun, uSun);
  vec2 k = vec2(dot(uHome, uSun), uHome.y * uSun.x - uHome.x * uSun.y) / max(d, 1e-4);
  vec2 g = mix(vec2(p.x * k.x - p.y * k.y, p.x * k.y + p.y * k.x), p - uSun + uHome, uSlide);
  vec2 uv = (g - uRect.xy) / uRect.zw;
  vec2 v = vNdc * 0.5 * vec2(uAspect, 1.0);
  float gain = uGain * uAmount / mix(1.0, 1.0 / pow(1.0 + dot(v, v) * 0.9, 2.0), uVignette);
  bool outside = uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0;
  vec3 plate = inverseFilmic(textureGrad(uMap, uv, dFdx(uv), dFdy(uv)).rgb);
  vec3 peak = inverseFilmic(textureGrad(uMap, uPeak, vec2(0.0), vec2(0.0)).rgb);
  vec3 w = vec3(0.3, 0.5, 0.2);
  vec2 q = p - uSun;
  float r = abs(q.x);
  float left = step(q.x, 0.0);
  float limb = mix(uCore.z, uCore.y, left);
  float rise = smoothstep(limb * uCoreLine.z, limb * uCoreLine.w, r);
  float fall = r < uCoreJoin.w ? pow(uCoreJoin.w / max(r, 0.2), uCore.w) : max(1.0 - (r - uCoreJoin.w) / (uCoreJoin.z - uCoreJoin.w), 0.0);
  float hand = mix(1.0, 1.0 - smoothstep(uCoreJoin.x, uCoreJoin.y, r), left);
  float t = (q.y - uCoreLine.x) / uCoreLine.y;
  float core = uCore.x * rise * fall * hand * exp(-0.5 * t * t) * dot(peak, w);
  vec3 c = outside ? vec3(0.0) : mix(plate, uWarm * dot(plate, w), uTint);
  outColor = vec4((c + uWarm * core) * gain, 0.0);
  if (uDiag >= 2 || uAmount <= 0.0 || d < 1e-4 || (outside && uCore.x <= 0.0)) discard;
}`

export interface LensCore { row: number; sigma: number; rise: [number, number]; join: [number, number]; pivot: number; tail: number; power: number; warm: [number, number, number]; peak: [number, number] }

export class Lens {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly v = new THREE.Vector3()
  private readonly q = new THREE.Quaternion()

  constructor(map: THREE.Texture, private readonly fit: LensFit, private readonly look: LensLook, diag: THREE.IUniform<number>, slide = false, private readonly core: LensCore | null = null) {
    const r = fit.rect
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false, transparent: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      uniforms: {
        uMap: { value: map }, uSun: { value: new THREE.Vector2() }, uHome: { value: new THREE.Vector2(fit.sun[0], fit.sun[1]) }, uRect: { value: new THREE.Vector4(r[0], r[1], r[2]! - r[0]!, r[3]! - r[1]!) },
        uAmount: { value: 0 }, uGain: { value: 1 }, uAspect: { value: 16 / 9 }, uVignette: { value: 0 }, uSlide: { value: slide ? 1 : 0 }, uDiag: diag,
        uCore: { value: new THREE.Vector4(0, 1, 1, core?.power ?? 1) }, uCoreLine: { value: new THREE.Vector4(core?.row ?? 0, core?.sigma ?? 1, core?.rise[0] ?? 0, core?.rise[1] ?? 1) }, uCoreJoin: { value: new THREE.Vector4(core?.join[0] ?? 0, core?.join[1] ?? 1, core?.tail ?? 2, core?.pivot ?? 1) },
        uWarm: { value: new THREE.Vector3(...(core?.warm ?? [1, 1, 1])) }, uPeak: { value: new THREE.Vector2(...(core?.peak ?? [0.5, 0.5])) }, uTint: { value: 0 },
      },
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.frustumCulled = false
  }

  update(sun: THREE.Vector3, camera: THREE.PerspectiveCamera, amount: number, gain: number, vignette: number, aspect: number, whole = 0, limbLeft = 1, limbRight = 1): void {
    const u = this.material.uniforms
    const v = this.v.copy(sun).applyQuaternion(this.q.copy(camera.quaternion).invert())
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
    let seen = 0
    if (v.z < -1e-3) {
      const x = v.x / -v.z / tan
      const y = v.y / -v.z / tan
      ;(u.uSun!.value as THREE.Vector2).set(x, y)
      const out = Math.max(Math.abs(x) / aspect, Math.abs(y))
      seen = 1 - THREE.MathUtils.smoothstep(out, this.look.fade[0], this.look.fade[1])
    }
    u.uAmount!.value = (amount * seen * this.look.gain) / this.fit.boost
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
    const on = this.core ? whole : 0
    ;(u.uCore!.value as THREE.Vector4).set(on, limbLeft, limbRight, this.core?.power ?? 1)
    u.uTint!.value = on
    this.mesh.visible = amount * seen > 0
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
