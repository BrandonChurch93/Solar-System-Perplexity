import * as THREE from 'three'
import { DIAG_GLSL, diagUniform } from '../../diagnostics/diag'
import type { RockAsset } from './store'
import spec from './belt.json'

const VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vView;
void main() {
  vLocal = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform samplerCube uMap;
uniform samplerCube uHeight;
uniform samplerCube uAo;
uniform sampler2D uDetail;
uniform vec3 uSunB;
uniform vec3 uEyeB;
uniform vec3 uSunTint;
uniform vec3 uTint;
uniform vec3 uFill;
uniform vec4 uShape;
uniform vec2 uTile;
uniform vec3 uLook;
uniform vec3 uNight;
uniform vec3 uRelief;
uniform vec3 uCrisp;
uniform vec3 uShade;
uniform float uGain;
uniform float uMapWidth;
uniform float uCounted;
in vec3 vLocal;
in vec3 vView;
out vec4 outColor;
${DIAG_GLSL}
float shade(vec3 p, vec3 l) {
  float lit = 1.0;
  float t = 0.01;
  for (int i = 0; i < 26; i++) {
    vec3 q = p + l * t;
    float len = length(q);
    if (len > 1.02) break;
    float gap = len - textureLod(uHeight, q, 0.0).r;
    lit = min(lit, clamp(gap / (t * uCrisp.y) + 0.35, 0.0, 1.0));
    t += 0.01 + t * 0.16;
  }
  return lit;
}
vec4 tile(vec3 p, vec3 w, float scale) {
  return texture(uDetail, p.zy * scale) * w.x + texture(uDetail, p.xz * scale) * w.y + texture(uDetail, p.xy * scale) * w.z;
}
vec3 lift(vec4 t, vec3 w, vec3 n) {
  vec2 g = t.xy - 0.5;
  vec3 a = vec3(0.0, g.y, g.x) * w.x + vec3(g.x, 0.0, g.y) * w.y + vec3(g.x, g.y, 0.0) * w.z;
  return a - n * dot(a, n);
}
void main() {
  vec3 d = normalize(vLocal);
  vec4 m = texture(uMap, d, uCrisp.x);
  vec3 n = normalize(m.xyz * 2.0 - 1.0);
  vec3 g = normalize(textureLod(uMap, d, 5.0).xyz * 2.0 - 1.0);
  n = normalize(g + (n - g) * uShape.x);
  vec3 nf = normalize(texture(uMap, d, uCrisp.x + uShade.x).xyz * 2.0 - 1.0);
  nf = normalize(g + (nf - g) * uShape.x);
  vec3 w = pow(abs(g), vec3(4.0));
  w /= w.x + w.y + w.z;
  vec4 t1 = tile(vLocal, w, uTile.x);
  vec4 t2 = tile(vLocal.yzx + 0.37, w.yzx, uTile.y);
  vec3 bump = lift(t1, w, n) + lift(t2, w.yzx, n.yzx).zxy * 0.6;
  n = normalize(n - bump * uShape.y);
  nf = normalize(nf - bump * uShape.y * uShade.z);
  vec3 v = normalize(uEyeB - vLocal);
  float mu0 = max(dot(n, uSunB), 0.0);
  float mu = max(dot(n, v), 0.0);
  float body = mix(mu0, 2.0 * mu0 / (mu0 + max(mu, 0.3) + 0.05), uLook.x);
  float graze = 1.0 - max(dot(g, v), 0.0);
  float back = smoothstep(0.1, 0.4, 0.5 - 0.5 * dot(uSunB, v));
  float edge = pow(graze, 2.5) * smoothstep(-uRelief.z, 0.35, dot(g, uSunB)) * back;
  float sh = 1.0;
  for (int k = 0; k < (uShape.w > 0.0 && (mu0 > 0.0 || edge > 0.0) ? 1 : 0); k++) sh = shade(d * textureLod(uHeight, d, 0.0).r + g * 0.004, uSunB);
  float cavity = mix(1.0, clamp(t1.z * 1.5 + 0.2, 0.0, 1.2) * clamp(t2.z * 1.5 + 0.2, 0.0, 1.2), 0.6);
  float ao = texture(uAo, d).r * cavity;
  float tone = pow(m.a, uLook.y) * uLook.z * (0.8 + 0.4 * mix(t1.w, t2.w, 0.4));
  vec3 albedo = uTint * tone * mix(vec3(0.94, 0.98, 1.05), vec3(1.05, 1.0, 0.93), clamp(tone * 1.4, 0.0, 1.0));
  float pit = texture(uAo, d).r;
  vec3 sun = uSunTint * (body * sh * mix(uRelief.x, 1.0, cavity) * mix(1.0, pit, uRelief.y) + uShape.z * edge * (0.35 + 0.65 * sh));
  float side = max(dot(nf, normalize(cross(uSunB, v) + 0.6 * v - 0.3 * uSunB)), 0.0);
  vec3 col = albedo * (sun + uFill * (ao * mix(1.0, pit, uShade.y)) * (uNight.x + uNight.y * max(dot(nf, v), 0.0) + uNight.z * graze * graze + uCrisp.z * side)) * uGain;
  outColor = diagOut(vec4(col, 1.0), diagTexelsDir(d, uMapWidth), uCounted, vec3(0.6, 0.4, 0.8), vec2(0.0), length(vView));
}`

export type RockLook = Partial<typeof spec.light>

export function rockMaterial(asset: RockAsset, detail: THREE.Texture, look?: RockLook): THREE.ShaderMaterial {
  const l = { ...spec.light, ...look }
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uMap: { value: asset.map }, uHeight: { value: asset.height }, uAo: { value: asset.ao }, uDetail: { value: detail },
      uSunB: { value: new THREE.Vector3(1, 0, 0) }, uEyeB: { value: new THREE.Vector3(0, 0, 5) },
      uSunTint: { value: new THREE.Vector3(1, 1, 1) }, uTint: { value: new THREE.Vector3().fromArray(l.tint) }, uFill: { value: new THREE.Vector3().fromArray(l.fill) },
      uShape: { value: new THREE.Vector4(l.bump, l.detail, l.rim, l.shadow) }, uTile: { value: new THREE.Vector2(l.tile[0], l.tile[1]) }, uLook: { value: new THREE.Vector3(l.seeliger, l.contrast, l.lift) },
      uNight: { value: new THREE.Vector3().fromArray(l.night) }, uRelief: { value: new THREE.Vector3().fromArray(l.relief) }, uCrisp: { value: new THREE.Vector3().fromArray(l.crisp) }, uShade: { value: new THREE.Vector3().fromArray(l.shade) },
      uGain: { value: 1 }, uMapWidth: { value: asset.size * 4 }, uCounted: { value: 1 }, uDiag: diagUniform,
    },
  })
}
