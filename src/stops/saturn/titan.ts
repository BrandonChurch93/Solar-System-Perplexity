import * as THREE from 'three'
import { DIAG_GLSL, diagUniform } from '../../diagnostics/diag'

export interface TitanLook {
  day: [number, number, number]
  rim: [number, number, number]
  night: [number, number, number]
  halo: [number, number, number]
  haloHeight: number
  terminator: [number, number]
  limb: number
  home: [number, number, number]
  size: number
}

const VERT = /* glsl */ `
out vec3 vPos;
out vec3 vView;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`

const FRAG = /* glsl */ `
precision highp float;
in vec3 vPos;
in vec3 vView;
uniform vec3 uCentre;
uniform float uRadius;
uniform vec3 uSun;
uniform vec3 uDay;
uniform vec3 uRim;
uniform vec3 uNight;
uniform vec3 uHalo;
uniform float uHaloHeight;
uniform vec2 uTerminator;
uniform float uLimb;
uniform float uGain;
out vec4 outColor;
${DIAG_GLSL}
void main() {
  vec3 dir = normalize(vPos);
  float b = dot(uCentre, dir);
  vec3 foot = dir * b - uCentre;
  float miss = length(foot) / uRadius;
  float px = length(vec2(dFdx(miss), dFdy(miss)));
  float disc = 1.0 - smoothstep(1.0 - 1.5 * px, 1.0 + 1.5 * px, miss);
  float z = sqrt(max(1.0 - miss * miss, 0.0));
  vec3 n = normalize(foot / uRadius - dir * z);
  float ndl = dot(n, uSun);
  float lit = smoothstep(uTerminator.x, uTerminator.y, ndl);
  vec3 body = (uDay * lit * mix(1.0, pow(max(z, 0.0), 0.6), uLimb) + uRim * lit * pow(1.0 - z, 3.0) + uNight) * disc * sqrt(disc);
  vec3 edge = normalize(foot);
  float glow = exp(-max(miss - 1.0, 0.0) / uHaloHeight) * smoothstep(-0.35, 0.5, dot(edge, uSun));
  vec3 col = body + uHalo * glow * (1.0 - disc * 0.6);
  float cover = max(disc, 0.0);
  outColor = diagOut(vec4(col * uGain, cover), 0.0, 0.0, vec3(0.9, 0.5, 0.1), vec2(0.0), length(vView));
  if (uDiag >= 2 && disc < 0.5) discard;
}`

export class Titan {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(radius: number, look: TitanLook) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG,
      uniforms: {
        uCentre: { value: new THREE.Vector3() }, uRadius: { value: radius }, uSun: { value: new THREE.Vector3(1, 0, 0) },
        uDay: { value: new THREE.Vector3().fromArray(look.day) }, uRim: { value: new THREE.Vector3().fromArray(look.rim) },
        uNight: { value: new THREE.Vector3().fromArray(look.night) }, uHalo: { value: new THREE.Vector3().fromArray(look.halo) },
        uHaloHeight: { value: look.haloHeight }, uTerminator: { value: new THREE.Vector2().fromArray(look.terminator) }, uLimb: { value: look.limb },
        uGain: { value: 1 }, uDiag: diagUniform,
      },
      transparent: true, depthWrite: false, premultipliedAlpha: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.6, 48, 24), this.material)
    this.mesh.renderOrder = 4
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
