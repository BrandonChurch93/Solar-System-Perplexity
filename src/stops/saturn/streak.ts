import * as THREE from 'three'
import { diagUniform } from '../../diagnostics/diag'

export interface StreakLook {
  gain: number
  upper: [number, number, number, number]
  lower: [number, number, number, number]
  smudge: [number, number, number, number]
  warm: [number, number, number]
  cool: [number, number, number]
  blue: [number, number, number]
}

const VERT = /* glsl */ `
uniform vec2 uTan;
out vec2 vAt;
void main() {
  vAt = vec2(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);
  gl_Position = projectionMatrix * vec4(position.x * uTan.x, position.y * uTan.y, -1.0, 1.0);
}`

const FRAG = /* glsl */ `
precision highp float;
in vec2 vAt;
uniform int uDiag;
uniform float uGain;
uniform vec4 uUpper;
uniform vec4 uLower;
uniform vec4 uSmudge;
uniform vec3 uWarm;
uniform vec3 uCool;
uniform vec3 uBlue;
out vec4 outColor;
float line(float y, float at, float width) {
  float t = (y - at) / width;
  return exp(-0.5 * t * t) + 0.25 * exp(-0.5 * t * t / 9.0);
}
void main() {
  if (uDiag != 0) discard;
  float run = smoothstep(uUpper.x, uUpper.x + 0.07, vAt.x);
  float end = smoothstep(0.9, 1.0, vAt.x);
  vec3 col = mix(uCool, uWarm, smoothstep(uUpper.x, 1.0, vAt.x)) * (uUpper.w * run * (0.45 + 0.55 * end) * line(vAt.y, uUpper.y, uUpper.z));
  col += mix(uCool, uWarm, 0.3 * end) * (uLower.w * smoothstep(uLower.x, uLower.x + 0.1, vAt.x) * (0.5 + 0.5 * end) * line(vAt.y, uLower.y, uLower.z));
  vec2 s = (vAt - uSmudge.xy) / vec2(uSmudge.z, uSmudge.z * 0.36);
  col += uBlue * (uSmudge.w * exp(-0.5 * dot(s, s)));
  outColor = vec4(col * uGain, 0.0);
}`

export class Streak {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(look: StreakLook) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG,
      uniforms: {
        uTan: { value: new THREE.Vector2(1, 1) }, uGain: { value: 0 }, uDiag: diagUniform,
        uUpper: { value: new THREE.Vector4().fromArray(look.upper) }, uLower: { value: new THREE.Vector4().fromArray(look.lower) }, uSmudge: { value: new THREE.Vector4().fromArray(look.smudge) },
        uWarm: { value: new THREE.Vector3().fromArray(look.warm) }, uCool: { value: new THREE.Vector3().fromArray(look.cool) }, uBlue: { value: new THREE.Vector3().fromArray(look.blue) },
      },
      transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 10
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
