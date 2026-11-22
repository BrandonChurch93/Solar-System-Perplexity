import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { EQUIRECT_GLSL } from '../../space/sky'

export interface MoonLook {
  center: number[]
  radius: number
  quaternion: number[]
  sun: number[]
  earthshine: number[]
  albedoScale: number
  terminator: number[]
  power: number
  lift: number
}

const VERT = /* glsl */ `
uniform float uPad;
out vec3 vView;
out vec3 vClip;
flat out vec3 vCentre;
flat out mat3 vBack;
flat out float vRadius;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  mat3 turn = mat3(modelViewMatrix);
  float size = length(turn[0]);
  vCentre = modelViewMatrix[3].xyz;
  vBack = transpose(turn) / size;
  vRadius = size / (1.0 + uPad);
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform sampler2D uLit;
uniform float uMapWidth;
uniform float uGrad;
uniform float uGain;
uniform float uScale;
uniform vec3 uSun;
uniform vec3 uSunColor;
uniform vec3 uEarthshine;
uniform vec3 uTerminator;
uniform float uVignette;
uniform float uAspect;
in vec3 vView;
in vec3 vClip;
flat in vec3 vCentre;
flat in mat3 vBack;
flat in float vRadius;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
void main() {
  vec3 ray = normalize(vView);
  vec3 near = ray * dot(vCentre, ray) - vCentre;
  float off = length(near);
  float cover = clamp((vRadius - off) / max(fwidth(off), 1e-7) + 0.5, 0.0, 1.0);
  float inside = min(off, vRadius * 0.9995);
  vec3 d = normalize(vBack * (near * (inside / max(off, 1e-7)) - ray * sqrt(vRadius * vRadius - inside * inside)));
  float ndl = dot(d, uSun);
  float shade = smoothstep(uTerminator.x, uTerminator.y, ndl) * pow(max(ndl, 0.0), uTerminator.z);
  vec3 albedo = inverseFilmic(equirectGrad(uMap, d, uGrad).rgb) * uScale;
  vec3 col = albedo * uSunColor * shade + uEarthshine;
  vec4 lit = equirectGrad(uLit, d, uGrad);
  vec2 q = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float vig = 1.0 / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
  col = mix(col, inverseFilmic(lit.rgb), lit.a) * uGain * vig;
  vec4 o = diagOut(vec4(col, 1.0), diagTexelsDir(d, uMapWidth), 1.0, vec3(0.9, 0.6, 0.15), vec2(0.0), length(vView));
  float keep = uDiag == 0 ? cover : step(0.5, cover);
  if (keep <= 0.0) discard;
  outColor = o * keep;
}`

const PAD = 0.25

export class Moon {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly home: THREE.Vector3
  private readonly inverse = new THREE.Quaternion()
  private readonly turn = new THREE.Quaternion()
  private readonly lift: number

  constructor(look: MoonLook, map: THREE.Texture, lit: THREE.Texture) {
    this.lift = look.lift
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: map }, uLit: { value: lit }, uMapWidth: { value: (map.image as unknown as { width: number }).width },
        uGain: { value: 1 }, uScale: { value: look.albedoScale },
        uSun: { value: new THREE.Vector3(1, 0, 0) }, uSunColor: { value: new THREE.Vector3().fromArray(look.sun) }, uEarthshine: { value: new THREE.Vector3().fromArray(look.earthshine) },
        uTerminator: { value: new THREE.Vector3(look.terminator[0], look.terminator[1], look.power) },
        uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
        uDiag: diagUniform, uGrad: gradUniform, uPad: { value: PAD },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), this.material)
    this.mesh.scale.setScalar(look.radius * (1 + PAD))
    this.mesh.renderOrder = 1
    this.mesh.quaternion.fromArray(look.quaternion)
    this.home = new THREE.Vector3().fromArray(look.center)
    this.inverse.copy(this.mesh.quaternion).invert()
  }

  update(sunLocal: THREE.Vector3, axis: THREE.Vector3, angle: number, gain: number, vignette: number, aspect: number): void {
    const u = this.material.uniforms
    this.mesh.position.copy(this.home).applyQuaternion(this.turn.setFromAxisAngle(axis, angle))
    ;(u.uSun!.value as THREE.Vector3).copy(sunLocal).applyQuaternion(this.inverse)
    u.uGain!.value = gain * this.lift
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
