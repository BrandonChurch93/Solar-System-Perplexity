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
}

const VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vWorldN;
out vec3 vView;
void main() {
  vLocal = position;
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
in vec3 vLocal;
in vec3 vWorldN;
in vec3 vView;
out vec4 outColor;
${EQUIRECT_GLSL}
${DIAG_GLSL}
void main() {
  vec3 d = normalize(vLocal);
  vec3 n = normalize(vWorldN);
  vec3 albedo = equirectGrad(uMap, d, uGrad).rgb;
  float ndl = dot(n, uLightW);
  float lit = smoothstep(uShape.x, uShape.y, ndl) * pow(max(ndl, 0.0), uShape.z);
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
        uLightW: { value: new THREE.Vector3(1, 0, 0) }, uShape: { value: new THREE.Vector3(p.terminator[0], p.terminator[1], p.power) },
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

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
