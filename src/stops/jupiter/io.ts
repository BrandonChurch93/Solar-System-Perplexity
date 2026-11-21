import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { EQUIRECT_GLSL } from '../../space/sky'

export interface IoOptions {
  map: THREE.Texture
  mapWidth: number
  radius: number
  sun: [number, number, number]
  ambient: [number, number, number]
  bounce: [number, number, number]
  wrap: number
  power: number
  rim: number
}

const VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vWorldN;
out vec3 vPos;
out vec3 vView;
out vec3 vClip;
void main() {
  vLocal = position;
  vWorldN = normalize(mat3(modelMatrix) * position);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform float uMapWidth;
uniform float uGrad;
uniform float uGain;
uniform vec3 uSunW;
uniform vec3 uPlanetW;
uniform vec3 uSun;
uniform vec3 uAmbient;
uniform vec3 uBounce;
uniform vec3 uShape;
uniform float uEclipse;
uniform float uVignette;
uniform float uAspect;
in vec3 vLocal;
in vec3 vWorldN;
in vec3 vPos;
in vec3 vView;
in vec3 vClip;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
void main() {
  vec3 d = normalize(vLocal);
  vec3 n = normalize(vWorldN);
  float mu = clamp(dot(n, -normalize(vPos)), 0.0, 1.0);
  float ndl = dot(n, uSunW);
  float lit = pow(clamp((ndl + uShape.x) / (1.0 + uShape.x), 0.0, 1.0), uShape.y) * mix(1.0, pow(mu, 0.5), uShape.z);
  vec3 albedo = inverseFilmic(equirectGrad(uMap, d, uGrad).rgb);
  vec3 shade = uSun * lit * (1.0 - uEclipse) + uAmbient + uBounce * max(dot(n, uPlanetW), 0.0);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  vec3 col = albedo * shade * uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = diagOut(vec4(col, 1.0), diagTexelsDir(d, uMapWidth), 1.0, vec3(0.95, 0.85, 0.2), vec2(0.0), length(vView));
}`

export class Io {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(o: IoOptions) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: o.map }, uMapWidth: { value: o.mapWidth }, uGain: { value: 1 },
        uSunW: { value: new THREE.Vector3(1, 0, 0) }, uPlanetW: { value: new THREE.Vector3(0, 0, -1) },
        uSun: { value: new THREE.Vector3().fromArray(o.sun) }, uAmbient: { value: new THREE.Vector3().fromArray(o.ambient) }, uBounce: { value: new THREE.Vector3().fromArray(o.bounce) },
        uShape: { value: new THREE.Vector3(o.wrap, o.power, o.rim) }, uEclipse: { value: 0 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
        uDiag: diagUniform, uGrad: gradUniform,
      },
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(o.radius, 128, 64), this.material)
  }

  update(sun: THREE.Vector3, planet: THREE.Vector3, eclipse: number, gain: number, vignette: number, aspect: number): void {
    const u = this.material.uniforms
    ;(u.uSunW!.value as THREE.Vector3).copy(sun)
    ;(u.uPlanetW!.value as THREE.Vector3).copy(planet)
    u.uEclipse!.value = eclipse
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
