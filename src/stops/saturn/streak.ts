import * as THREE from 'three'
import { diagUniform } from '../../diagnostics/diag'

export interface StreakLook {
  gain: number
  fade: number
  upper: [number, number, number]
  lower: [number, number, number]
  smudge: [number, number, number]
  halo: [number, number, number]
  left: [number, number, number]
  mid: [number, number, number]
  right: [number, number, number]
  second: [number, number, number]
  blue: [number, number, number]
  wash: [number, number, number]
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
uniform vec3 uUpper;
uniform vec3 uLower;
uniform vec3 uSmudge;
uniform vec3 uHalo;
uniform vec3 uLeft;
uniform vec3 uMid;
uniform vec3 uRight;
uniform vec3 uSecond;
uniform vec3 uBlue;
uniform vec3 uWash;
out vec4 outColor;
float line(float y, float at, float width) {
  float t = (y - at) / width;
  return exp(-0.5 * t * t) + 0.25 * exp(-0.5 * t * t / 9.0);
}
void main() {
  if (uDiag != 0) discard;
  float x = vAt.x;
  float end = smoothstep(0.93, 1.0, x);
  vec3 along = uLeft * (smoothstep(uUpper.x - 0.02, uUpper.x, x) * exp(-max(x - uUpper.x, 0.0) / 0.035)) + uMid * smoothstep(uUpper.x + 0.015, uUpper.x + 0.075, x) + uRight * pow(end, 1.5);
  vec3 col = along * line(vAt.y, uUpper.y, uUpper.z);
  col += uSecond * (smoothstep(uLower.x, uLower.x + 0.04, x) * (1.0 - 0.45 * end) * line(vAt.y, uLower.y, uLower.z));
  vec2 s = (vAt - uSmudge.xy) / vec2(uSmudge.z, uSmudge.z * 0.36);
  col += uBlue * exp(-0.5 * dot(s, s));
  float hy = (vAt.y - uHalo.y) / (uHalo.z * (1.0 + 1.6 * smoothstep(0.955, 1.0, x)));
  col += uWash * (smoothstep(uHalo.x, uHalo.x + 0.045, x) * exp(-0.5 * hy * hy));
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
        uUpper: { value: new THREE.Vector3().fromArray(look.upper) }, uLower: { value: new THREE.Vector3().fromArray(look.lower) }, uSmudge: { value: new THREE.Vector3().fromArray(look.smudge) }, uHalo: { value: new THREE.Vector3().fromArray(look.halo) },
        uLeft: { value: new THREE.Vector3().fromArray(look.left) }, uMid: { value: new THREE.Vector3().fromArray(look.mid) }, uRight: { value: new THREE.Vector3().fromArray(look.right) }, uSecond: { value: new THREE.Vector3().fromArray(look.second) },
        uBlue: { value: new THREE.Vector3().fromArray(look.blue) }, uWash: { value: new THREE.Vector3().fromArray(look.wash) },
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
