import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { EQUIRECT_GLSL } from '../../space/sky'

export interface TritonParams {
  map: THREE.Texture
  mapWidth: number
  radius: number
  gain: number
  sun: [number, number, number]
  ambient: [number, number, number]
  terminator: [number, number]
  power: number
  bump: number
  rim: number
}

const VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vWorldN;
out vec3 vView;
out vec3 vViewN;
void main() {
  vLocal = position;
  vViewN = normalMatrix * position;
  vWorldN = normalize(mat3(modelMatrix) * position);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform float uMapWidth;
uniform float uGrad;
uniform float uGain;
uniform vec3 uSun;
uniform vec3 uAmbient;
uniform vec3 uLightW;
uniform vec3 uShape;
uniform float uBump;
uniform float uRim;
uniform vec2 uWrap;
uniform mat4 modelMatrix;
in vec3 vLocal;
in vec3 vWorldN;
in vec3 vView;
in vec3 vViewN;
out vec4 outColor;
${EQUIRECT_GLSL}
${DIAG_GLSL}
void main() {
  vec3 d = normalize(vLocal);
  vec3 n = normalize(vWorldN);
  vec3 albedo = equirectGrad(uMap, d, uGrad).rgb;
  vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), d) + vec3(1e-5, 0.0, 0.0));
  vec3 north = cross(d, east);
  float eps = max(9.0 / uMapWidth, 2.5 * length(fwidth(d)));
  const vec3 LUM = vec3(0.3, 0.5, 0.2);
  float h = dot(albedo, LUM);
  float he = dot(equirectGrad(uMap, normalize(d + east * eps), uGrad).rgb, LUM);
  float hn = dot(equirectGrad(uMap, normalize(d + north * eps), uGrad).rgb, LUM);
  float polar = 1.0 - smoothstep(0.9, 0.98, abs(d.y));
  n = normalize(n - mat3(modelMatrix) * (east * (he - h) + north * (hn - h)) * (uBump * polar / (eps * length(modelMatrix[0].xyz))));
  float ndl = (dot(n, uLightW) + uWrap.x) / (1.0 + uWrap.x);
  float lit = smoothstep(uShape.x, uShape.y, ndl) * pow(max(ndl, 0.0), uShape.z) * uWrap.y;
  float mu = max(dot(normalize(vViewN), normalize(-vView)), 0.0);
  lit *= 1.0 + uRim * pow(abs(1.0 - mu), 3.0);
  vec3 col = albedo * (uSun * lit + uAmbient) * uGain;
  outColor = diagOut(vec4(col, 1.0), diagTexelsDir(d, uMapWidth), 1.0, vec3(0.9, 0.6, 0.15), vec2(0.0), length(vView));
}`

export class Triton {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(p: TritonParams) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: p.map }, uMapWidth: { value: p.mapWidth }, uGrad: gradUniform, uGain: { value: 1 },
        uSun: { value: new THREE.Vector3().fromArray(p.sun).multiplyScalar(p.gain) }, uAmbient: { value: new THREE.Vector3().fromArray(p.ambient).multiplyScalar(p.gain) },
        uLightW: { value: new THREE.Vector3(1, 0, 0) }, uShape: { value: new THREE.Vector3(p.terminator[0], p.terminator[1], p.power) }, uBump: { value: p.bump }, uRim: { value: p.rim }, uWrap: { value: new THREE.Vector2(0, 1) },
        uDiag: diagUniform,
      },
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), this.material)
    this.mesh.scale.setScalar(p.radius)
  }

  update(light: THREE.Vector3, gain: number): void {
    ;(this.material.uniforms.uLightW!.value as THREE.Vector3).copy(light)
    this.material.uniforms.uGain!.value = gain
  }

  shape(terminator: [number, number], power: number, ambient: [number, number, number], gain: number, bump: number, rim: number, wrap: number, lift: number): void {
    const u = this.material.uniforms
    ;(u.uShape!.value as THREE.Vector3).set(terminator[0], terminator[1], power)
    ;(u.uAmbient!.value as THREE.Vector3).fromArray(ambient).multiplyScalar(gain)
    u.uBump!.value = bump
    u.uRim!.value = rim
    ;(u.uWrap!.value as THREE.Vector2).set(wrap, lift)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
