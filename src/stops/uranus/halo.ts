import * as THREE from 'three'
import { diagUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { LIGHT_GLSL } from './globe'

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
uniform sampler2D uMap;
uniform sampler2D uShade;
uniform mat3 uToGlobe;
uniform vec4 uBandRate;
uniform float uSpin;
uniform float uTime;
uniform vec4 uRim;
uniform vec2 uRimSun;
in vec3 vLocal;
flat in vec3 vCamL;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${LIGHT_GLSL}
vec2 lonLat(vec3 d) {
  return vec2(atan(d.x, d.z) / 6.283185307179586 + 0.5, asin(clamp(d.y, -1.0, 1.0)) / 3.141592653589793 + 0.5);
}
void main() {
  vec3 dir = normalize(vLocal - vCamL);
  float t = max(-dot(vCamL, dir), 0.0);
  vec3 pc = vCamL + dir * t;
  float b = length(pc);
  float ndl = dot(normalize(mat3(modelMatrix) * (pc / b)), uSunW);
  float x = sqrt(clamp((b - uRange.x) / (uRange.y - uRange.x), 0.0, 1.0));
  vec2 uv = vec2((clamp(ndl * 0.5 + 0.5, 0.0, 1.0) * (uHaloSize.x - 1.0) + 0.5) / uHaloSize.x, (x * (uHaloSize.y - 1.0) + 0.5) / uHaloSize.y);
  vec3 col = textureLod(uHalo, uv, 0.0).rgb * (1.0 - smoothstep(0.9, 1.0, x));
  vec3 d0 = uToGlobe * (pc / b);
  float turn = uSpin + uTime * (uBandRate.x + uBandRate.y * sin(uBandRate.z * asin(clamp(d0.y, -1.0, 1.0)) + uBandRate.w));
  vec3 d = vec3(cos(turn) * d0.x - sin(turn) * d0.z, d0.y, sin(turn) * d0.x + cos(turn) * d0.z);
  vec3 rim = inverseFilmic(textureLod(uMap, lonLat(d), uRim.w).rgb) * lightAt(ndl, uRim.z) * textureLod(uShade, lonLat(d0), 0.0).rgb;
  col = max(col, rim * (uRim.x * exp(-max(b - 1.0, 0.0) / uRim.y) * (1.0 - smoothstep(uRimSun.x, uRimSun.y, ndl))));
  outColor = vec4(col * uGain, 0.0);
  if (uDiag >= 2) discard;
}`

export interface RimOptions {
  map: THREE.Texture
  light: THREE.Texture
  shade: THREE.Texture
  lightSize: [number, number]
  bandRate: [number, number, number, number]
  turn: THREE.Quaternion
  rim: [number, number, number, number]
  rimSun: [number, number]
}

export class Halo {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(lut: THREE.Texture, size: [number, number], range: [number, number], o: RimOptions) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uHalo: { value: lut }, uHaloSize: { value: new THREE.Vector2().fromArray(size) }, uRange: { value: new THREE.Vector2().fromArray(range) }, uSunW: { value: new THREE.Vector3(1, 0, 0) }, uGain: { value: 1 }, uDiag: diagUniform,
        uMap: { value: o.map }, uLight: { value: o.light }, uShade: { value: o.shade }, uLightSize: { value: new THREE.Vector2().fromArray(o.lightSize) },
        uToGlobe: { value: new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(o.turn.clone().invert())) },
        uBandRate: { value: new THREE.Vector4().fromArray(o.bandRate) }, uSpin: { value: 0 }, uTime: { value: 0 }, uRim: { value: new THREE.Vector4().fromArray(o.rim) }, uRimSun: { value: new THREE.Vector2().fromArray(o.rimSun) },
      },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      transparent: true,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(range[1] + 0.02, 128, 64), this.material)
    this.mesh.renderOrder = 5
  }

  update(sun: THREE.Vector3, gain: number, spin: number, time: number): void {
    const u = this.material.uniforms
    ;(u.uSunW!.value as THREE.Vector3).copy(sun)
    u.uGain!.value = gain
    u.uSpin!.value = spin
    u.uTime!.value = time
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
