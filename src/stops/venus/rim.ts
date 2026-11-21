import * as THREE from 'three'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'

export const LIMB = { azimuth: 64, half: 128, inside: 0.3, outside: 1.5, edgePx: 2 }

export const LIMB_GLSL = /* glsl */ `
uniform sampler2D uLimb;
uniform vec3 uLimbS;
uniform vec3 uLimbT;
vec4 limbAt(vec3 at, float row) {
  float phi = atan(dot(at, uLimbT), dot(at, uLimbS));
  float u = ((phi / 6.2831853 + 0.5) * ${LIMB.azimuth}.0 + 0.5) / ${LIMB.azimuth + 1}.0;
  return textureLod(uLimb, vec2(u, row / ${LIMB.half * 2}.0), 0.0);
}
vec4 limbGlow(vec3 at, float b) {
  float x = b - 1.0;
  float s = sqrt(clamp(abs(x) / (x < 0.0 ? ${LIMB.inside.toFixed(3)} : ${LIMB.outside.toFixed(3)}), 0.0, 1.0)) * ${LIMB.half - 1}.0;
  return limbAt(at, x < 0.0 ? ${LIMB.half}.0 - 0.5 - s : ${LIMB.half}.0 + 0.5 + s);
}
vec4 limbEdge(vec3 at) {
  return limbAt(at, ${LIMB.half}.0 - 0.5);
}`

const VERT = /* glsl */ `
out vec3 vPos;
out vec3 vClip;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
in vec3 vPos;
in vec3 vClip;
uniform vec3 uCam;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform int uDiag;
uniform float uEdge;
out vec4 outColor;
${LIMB_GLSL}
${INVERSE_FILMIC_GLSL}
vec3 shown(vec3 x) {
  return sqrt(clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 0.985));
}
void main() {
  if (uDiag >= 2) discard;
  vec3 dir = normalize(vPos);
  float along = -dot(uCam, dir);
  if (along <= 0.0) discard;
  vec3 p = uCam + dir * along;
  float b = length(p);
  if (b < 1.0) discard;
  vec3 at = p / b;
  vec3 glow = max(limbGlow(at, b).rgb, 0.0);
  float t = clamp((b - 1.0) / uEdge, 0.0, 1.0);
  for (int k = 0; k < (t < 1.0 ? 1 : 0); k++) {
    vec3 m = mix(shown(max(limbEdge(at).rgb, 0.0)), shown(glow), t * t * (3.0 - 2.0 * t));
    glow = inverseFilmic(m * m);
  }
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  vec3 col = glow * uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = vec4(col, 0.0);
}`

export function limbFrame(camera: THREE.Vector3, sun: THREE.Vector3, s: THREE.Vector3, t: THREE.Vector3): void {
  const d = camera.length()
  const vx = -camera.x / d
  const vy = -camera.y / d
  const vz = -camera.z / d
  const k = sun.x * vx + sun.y * vy + sun.z * vz
  s.set(sun.x - vx * k, sun.y - vy * k, sun.z - vz * k)
  if (s.lengthSq() < 1e-8) s.set(vy, -vx, 0).lengthSq() < 1e-8 && s.set(0, vz, -vy)
  s.normalize()
  t.set(vy * s.z - vz * s.y, vz * s.x - vx * s.z, vx * s.y - vy * s.x)
}

export class Rim {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(lut: THREE.Texture, radius: number, diag: THREE.IUniform<number>) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uCam: { value: new THREE.Vector3(0, 0, 3) }, uLimb: { value: lut }, uLimbS: { value: new THREE.Vector3(1, 0, 0) }, uLimbT: { value: new THREE.Vector3(0, 1, 0) },
        uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uEdge: { value: 0.003 }, uDiag: diag,
      },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 48), this.material)
    this.mesh.renderOrder = 6
  }

  update(camera: THREE.Vector3, s: THREE.Vector3, t: THREE.Vector3, gain: number, vignette: number, aspect: number, edge: number): void {
    const u = this.material.uniforms
    ;(u.uCam!.value as THREE.Vector3).copy(camera)
    ;(u.uLimbS!.value as THREE.Vector3).copy(s)
    ;(u.uLimbT!.value as THREE.Vector3).copy(t)
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
    u.uEdge!.value = edge
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
