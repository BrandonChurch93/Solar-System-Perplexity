import * as THREE from 'three'
import { diagUniform } from '../../diagnostics/diag'

const VERT = /* glsl */ `
out vec3 vLocal;
flat out vec3 vCamL;
void main() {
  vLocal = position;
  vCamL = (inverse(modelMatrix) * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uHalo;
uniform vec2 uHaloSize;
uniform vec2 uRange;
uniform mat4 modelMatrix;
uniform vec3 uSunW;
uniform float uGain;
uniform int uDiag;
in vec3 vLocal;
flat in vec3 vCamL;
out vec4 outColor;
void main() {
  vec3 dir = normalize(vLocal - vCamL);
  float t = max(-dot(vCamL, dir), 0.0);
  vec3 pc = vCamL + dir * t;
  float b = length(pc);
  float ndl = dot(normalize(mat3(modelMatrix) * (pc / b)), uSunW);
  float x = sqrt(clamp((b - uRange.x) / (uRange.y - uRange.x), 0.0, 1.0));
  vec2 uv = vec2((clamp(ndl * 0.5 + 0.5, 0.0, 1.0) * (uHaloSize.x - 1.0) + 0.5) / uHaloSize.x, (x * (uHaloSize.y - 1.0) + 0.5) / uHaloSize.y);
  vec3 col = textureLod(uHalo, uv, 0.0).rgb * (1.0 - smoothstep(0.9, 1.0, x));
  outColor = vec4(col * uGain, 0.0);
  if (uDiag >= 2) discard;
}`

export class Halo {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(lut: THREE.Texture, size: [number, number], range: [number, number]) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uHalo: { value: lut }, uHaloSize: { value: new THREE.Vector2().fromArray(size) }, uRange: { value: new THREE.Vector2().fromArray(range) }, uSunW: { value: new THREE.Vector3(1, 0, 0) }, uGain: { value: 1 }, uDiag: diagUniform },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      transparent: true,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(range[1] + 0.02, 128, 64), this.material)
    this.mesh.renderOrder = 5
  }

  update(sun: THREE.Vector3, gain: number): void {
    const u = this.material.uniforms
    ;(u.uSunW!.value as THREE.Vector3).copy(sun)
    u.uGain!.value = gain
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
