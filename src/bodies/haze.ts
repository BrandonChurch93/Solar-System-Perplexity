import * as THREE from 'three'

interface HazeCore {
  scaleHeight: number
  day: [number, number, number]
  dayFrom: number
  dayTo: number
}

export interface HazeParams {
  scaleHeight: number
  depth: number
  day: [number, number, number]
  twilight: [number, number, number]
  night?: [number, number, number]
  dayFrom?: number
  dayTo?: number
  strength: number
  extinction: number
  forward: number
  top: number
  core?: HazeCore
}

export const HAZE_GLSL = /* glsl */ `
uniform vec3 uCam;
uniform vec3 uSunW;
uniform float uHazeH;
uniform float uHazeTau;
uniform vec3 uHazeDay;
uniform vec3 uHazeTwilight;
uniform vec3 uHazeNight;
uniform vec2 uHazeEdge;
uniform float uHazeStrength;
uniform float uHazeForward;
float hazeCh(float c, float scaleHeight) {
  float k = sqrt(1.5707963 / scaleHeight);
  return 1.0 / (max(c, 0.0) + 1.0 / k);
}
float hazeDensity(float h, float scaleHeight) {
  return exp(-max(h, 0.0) / scaleHeight);
}
float hazeDepthAt(vec3 dir, bool ground, float scaleHeight, out vec3 at) {
  float r = length(uCam);
  vec3 up = uCam / r;
  float c = dot(dir, up);
  float h = r - 1.0;
  float here = hazeDensity(h, scaleHeight);
  if (c >= 0.0) {
    at = up;
    return uHazeTau * here * hazeCh(c, scaleHeight);
  }
  float b = -r * c;
  vec3 tangent = uCam + dir * b;
  float rt = length(tangent);
  if (ground) {
    float disc = max(1.0 - rt * rt, 0.0);
    vec3 hit = uCam + dir * (b - sqrt(disc));
    at = normalize(hit);
    float mu = sqrt(disc);
    return max(uHazeTau * (hazeCh(mu, scaleHeight) - here * hazeCh(-c, scaleHeight)), 0.0);
  }
  at = tangent / rt;
  return max(uHazeTau * (2.0 * hazeDensity(rt - 1.0, scaleHeight) * hazeCh(0.0, scaleHeight) - here * hazeCh(-c, scaleHeight)), 0.0);
}
float hazeDepth(vec3 dir, bool ground, out vec3 at) {
  return hazeDepthAt(dir, ground, uHazeH, at);
}
float hazeForward(vec3 dir) {
  return 1.0 + uHazeForward * pow(max(dot(dir, uSunW), 0.0), 6.0);
}
vec3 hazeLight(vec3 at, vec3 dir) {
  float ndl = dot(at, uSunW);
  float day = smoothstep(uHazeEdge.x, uHazeEdge.y, ndl);
  float tw = smoothstep(-0.42, -0.04, ndl) * (1.0 - smoothstep(-0.04, 0.36, ndl));
  return ((uHazeDay * day * day + uHazeTwilight * tw) * hazeForward(dir) + uHazeNight) * uHazeStrength;
}`

const VERT = /* glsl */ `
out vec3 vPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`

const FRAG = /* glsl */ `
precision highp float;
in vec3 vPos;
uniform float uGain;
uniform int uDiag;
uniform float uCoreHeight;
uniform vec3 uCoreDay;
uniform vec3 uCoreSun;
uniform vec2 uCoreRange;
out vec4 outColor;
${HAZE_GLSL}
void main() {
  if (uDiag >= 2) discard;
  vec3 dir = normalize(vPos);
  float r = length(uCam);
  float b = -dot(uCam, dir);
  float rt2 = r * r - b * b;
  if (b > 0.0 && rt2 < 0.99) discard;
  vec3 at;
  float tau = hazeDepth(dir, false, at);
  vec3 col = hazeLight(at, dir) * (1.0 - exp(-tau));
  if (uCoreHeight > 0.0) {
    float coreTau = hazeDepthAt(dir, false, uCoreHeight, at);
    float day = smoothstep(uCoreRange.x, uCoreRange.y, dot(at, uCoreSun));
    col += uCoreDay * day * day * (1.0 - exp(-coreTau));
  }
  outColor = vec4(col * uGain, 0.0);
}`

export function hazeUniforms(p: HazeParams): Record<string, THREE.IUniform> {
  return {
    uCam: { value: new THREE.Vector3(0, 0, 3) },
    uSunW: { value: new THREE.Vector3(1, 0, 0) },
    uHazeH: { value: p.scaleHeight },
    uHazeTau: { value: p.depth },
    uHazeDay: { value: new THREE.Vector3().fromArray(p.day) },
    uHazeTwilight: { value: new THREE.Vector3().fromArray(p.twilight) },
    uHazeEdge: { value: new THREE.Vector2(p.dayFrom ?? -0.16, p.dayTo ?? 0.34) },
    uHazeNight: { value: new THREE.Vector3().fromArray(p.night ?? [0, 0, 0]) },
    uHazeStrength: { value: p.strength },
    uHazeForward: { value: p.forward },
  }
}

export class HazeShell {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(p: HazeParams, diag: THREE.IUniform<number>) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        ...hazeUniforms(p), uGain: { value: 1 }, uDiag: diag,
        uCoreHeight: { value: p.core?.scaleHeight ?? 0 },
        uCoreDay: { value: new THREE.Vector3().fromArray(p.core?.day ?? [0, 0, 0]) },
        uCoreSun: { value: new THREE.Vector3() },
        uCoreRange: { value: new THREE.Vector2(p.core?.dayFrom ?? 0, p.core?.dayTo ?? 1) },
      },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      transparent: true,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1 + p.top * p.scaleHeight, 160, 80), this.material)
    this.mesh.renderOrder = 5
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
