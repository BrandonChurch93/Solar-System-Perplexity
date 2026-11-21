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
}

const VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vView;
out vec3 vClip;
void main() {
  vLocal = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
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
in vec3 vLocal;
in vec3 vView;
in vec3 vClip;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
void main() {
  vec3 d = normalize(vLocal);
  float ndl = dot(d, uSun);
  float shade = smoothstep(uTerminator.x, uTerminator.y, ndl) * pow(max(ndl, 0.0), uTerminator.z);
  vec3 albedo = inverseFilmic(equirectGrad(uMap, d, uGrad).rgb) * uScale;
  vec3 col = albedo * uSunColor * shade + uEarthshine;
  vec4 lit = equirectGrad(uLit, d, uGrad);
  vec2 q = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float vig = 1.0 / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
  col = mix(col, inverseFilmic(lit.rgb), lit.a) * uGain * vig;
  outColor = diagOut(vec4(col, 1.0), diagTexelsDir(d, uMapWidth), 1.0, vec3(0.9, 0.6, 0.15), vec2(0.0), length(vView));
}`

export class Moon {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly home: THREE.Vector3
  private readonly inverse = new THREE.Quaternion()
  private readonly turn = new THREE.Quaternion()

  constructor(look: MoonLook, map: THREE.Texture, lit: THREE.Texture) {
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
        uDiag: diagUniform, uGrad: gradUniform,
      },
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), this.material)
    this.mesh.scale.setScalar(look.radius)
    this.mesh.quaternion.fromArray(look.quaternion)
    this.home = new THREE.Vector3().fromArray(look.center)
    this.inverse.copy(this.mesh.quaternion).invert()
  }

  update(sunLocal: THREE.Vector3, axis: THREE.Vector3, angle: number, gain: number, vignette: number, aspect: number): void {
    const u = this.material.uniforms
    this.mesh.position.copy(this.home).applyQuaternion(this.turn.setFromAxisAngle(axis, angle))
    ;(u.uSun!.value as THREE.Vector3).copy(sunLocal).applyQuaternion(this.inverse)
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
