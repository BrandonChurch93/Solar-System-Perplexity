import * as THREE from 'three'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'

const VERT = /* glsl */ `
out vec3 vRay;
out vec2 vNdc;
void main() {
  vRay = transpose(mat3(viewMatrix)) * vec3((position.x + projectionMatrix[2][0]) / projectionMatrix[0][0], (position.y + projectionMatrix[2][1]) / projectionMatrix[1][1], -1.0);
  vNdc = position.xy;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform mat3 uAim;
uniform vec4 uRect;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform vec4 uLimb;
uniform vec2 uLimbEdge;
uniform vec4 uSmall;
uniform vec3 uPale;
uniform vec4 uGrain;
uniform vec3 uLimbTravel;
uniform vec4 uCorona;
uniform float uTravel;
uniform vec3 uPaint;
uniform mat3 uBefore;
uniform int uTaps;
uniform vec2 uSpan;
uniform int uDiag;
in vec3 vRay;
in vec2 vNdc;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
vec2 hash2(vec2 p) {
  uvec2 q = uvec2(ivec2(p + 8192.0));
  uint n = q.x * 1597334673u ^ q.y * 3812015801u;
  n = (n ^ (n >> 15u)) * 2246822519u;
  uint m = (n ^ (n >> 13u)) * 3266489917u;
  return vec2(float(n >> 9u), float(m >> 9u)) / 8388607.0;
}
float cells(vec2 x) {
  vec2 i = floor(x);
  vec2 f = x - i;
  float a = 8.0;
  float b = 8.0;
  for (int v = -2; v <= 2; v++) {
    for (int u = -2; u <= 2; u++) {
      vec2 o = vec2(float(u), float(v));
      vec2 d = o + hash2(i + o) - f;
      float s = dot(d, d);
      b = min(b, max(a, s));
      a = min(a, s);
    }
  }
  return sqrt(b) - sqrt(a);
}
float ring(float t, float n, float seed) {
  float x = t * n;
  float i = floor(x);
  float f = x - i;
  f = f * f * (3.0 - 2.0 * f);
  return mix(hash2(vec2(mod(i, n), seed)).x, hash2(vec2(mod(i + 1.0, n), seed)).x, f);
}
float region(vec2 s, vec3 at, float fine) {
  vec2 e = (s - at.xy) / at.z;
  float plage = 1.0 + 0.22 * exp(-0.5 * dot(e, e)) * (0.5 + fine);
  float one = length(e - vec2(-0.45, 0.1));
  float two = length(e - vec2(0.6, -0.2)) / 0.7;
  float pen = max(1.0 - smoothstep(0.38, 0.6, one), 1.0 - smoothstep(0.38, 0.6, two));
  float umb = max(1.0 - smoothstep(0.2, 0.32, one), 1.0 - smoothstep(0.2, 0.32, two));
  return plage * (1.0 - 0.25 * pen - 0.4 * umb);
}
void main() {
  vec3 p = uAim * normalize(vRay);
  vec2 uv = ((p.xy / max(-p.z, 1e-3) - uRect.xy) / uRect.zw - 0.5) / uSmall.x + 0.5;
  vec2 q = vNdc * 0.5 * vec2(uAspect, 1.0);
  float k = uGain / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
  float held = length(uv - 0.5) / uLimb.w;
  vec2 dd = (uv - 0.5 - uPaint.xy) / uPaint.z;
  float r = length(dd);
  vec3 shade = mix(mix(vec3(1.0) - uLimb.rgb * (1.0 - sqrt(max(1.0 - held * held, 0.0))), vec3(1.0), smoothstep(uLimbEdge.x, uLimbEdge.y, held)), mix(vec3(1.0) - uLimbTravel * (1.0 - sqrt(max(1.0 - r * r, 0.0))), vec3(1.0), smoothstep(uLimbEdge.x, uLimbEdge.y, r)), uTravel);
  vec3 p0 = uBefore * vRay;
  vec2 uv0 = ((p0.xy / max(-p0.z, 1e-3) - uRect.xy) / uRect.zw - 0.5) / uSmall.x + 0.5;
  vec2 span = (uv0 - uv) * uSpan.x;
  vec2 gx = dFdx(uv) * uSpan.y;
  vec2 gy = dFdy(uv) * uSpan.y;
  vec3 c = vec3(0.0);
  for (int j = 0; j < uTaps; j++) c += inverseFilmic(textureGrad(uMap, uv + span * ((float(j) + 0.5) / float(uTaps) - 0.5), gx, gy).rgb);
  c /= float(uTaps);
  vec3 glow = inverseFilmic(textureLod(uMap, uv, 5.0).rgb);
  float rr = min(r, 0.999);
  vec2 s = dd * (asin(rr) / max(rr, 1e-4));
  float fine = smoothstep(0.0, 0.62, cells(s * uGrain.z));
  float coarse = smoothstep(0.0, 0.5, cells(s * (uGrain.z * 0.23) + 17.0));
  float inside = 1.0 - smoothstep(0.86, 0.985, r);
  float grain = 1.0 + mix(uGrain.x, uGrain.y, uTravel) * inside * ((fine - 0.46) + uGrain.w * (coarse - 0.7));
  float spots = mix(1.0, region(s, vec3(-0.4, 0.58, 0.1), fine) * region(s, vec3(0.33, 0.7, 0.075), fine) * region(s, vec3(0.85, 0.3, 0.11), fine), uTravel);
  float t = atan(dd.y, dd.x) / 6.2831853 + 0.5;
  float beyond = uTravel * smoothstep(1.03, 1.12, r);
  float reach = uCorona.y + uCorona.z * ring(t, 17.0, 11.0);
  float lobes = (1.0 - uCorona.x + 2.0 * uCorona.x * ring(t, 23.0, 3.0)) * (1.0 - smoothstep(reach - uCorona.w, reach + uCorona.w, r));
  c = c + (c - glow) * ((lobes - 1.0) * beyond);
  c = max(c, vec3(0.0)) * shade * (grain * mix(1.0, spots, inside));
  c = mix(c, uPale * (dot(c, vec3(0.3, 0.5, 0.2)) * uSmall.z), uSmall.y);
  vec2 e = min(uv, 1.0 - uv);
  outColor = vec4(c * (k * smoothstep(0.0, uSmall.w, min(e.x, e.y))), 0.0);
  if (uDiag >= 2 || p.z > -1e-3 || uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;
}`

export interface SunSurface { grain: [number, number]; cells: number; coarse: number; dive: [number, number]; disc: [number, number, number]; limb: [number, number, number]; corona: { depth: number; reach: [number, number]; soft: number } }
export interface SunLimb { dark: [number, number, number]; edge: [number, number] }
export interface SunSmall { to: number; pale: [number, number, number]; lift: number; white: [number, number]; feather: number }

export class SunPlate {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly m4 = new THREE.Matrix4()
  private readonly m5 = new THREE.Matrix4()
  private readonly q = new THREE.Quaternion()

  constructor(map: THREE.Texture, rect: [number, number, number, number], disc: number, limb: SunLimb, private readonly small: SunSmall, diag: THREE.IUniform<number>, private readonly surface: SunSurface) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false, transparent: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      uniforms: { uGrain: { value: new THREE.Vector4(surface.grain[0], surface.grain[1], surface.cells, surface.coarse) }, uLimbTravel: { value: new THREE.Vector3(...surface.limb) }, uCorona: { value: new THREE.Vector4(surface.corona.depth, surface.corona.reach[0], surface.corona.reach[1], surface.corona.soft) }, uTravel: { value: 0 }, uPaint: { value: new THREE.Vector3(...surface.disc) }, uMap: { value: map }, uAim: { value: new THREE.Matrix3() }, uRect: { value: new THREE.Vector4(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]) }, uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uLimb: { value: new THREE.Vector4(limb.dark[0], limb.dark[1], limb.dark[2], disc) }, uLimbEdge: { value: new THREE.Vector2(limb.edge[0], limb.edge[1]) }, uSmall: { value: new THREE.Vector4(1, 0, 1, 1e-4) }, uPale: { value: new THREE.Vector3().fromArray(small.pale) }, uBefore: { value: new THREE.Matrix3() }, uTaps: { value: 1 }, uSpan: { value: new THREE.Vector2(0, 1) }, uDiag: diag },
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = -10
  }

  update(aim: THREE.Quaternion, gain: number, vignette: number, aspect: number, shrink = 0, travel = 0, still = 0): void {
    this.mesh.visible = gain > 0
    const u = this.material.uniforms
    const white = THREE.MathUtils.smoothstep(shrink, this.small.white[0], this.small.white[1])
    ;(u.uSmall!.value as THREE.Vector4).set(Math.pow(this.small.to, shrink), white, this.small.lift, 1e-4 + this.small.feather * Math.min(shrink * 6, 1))
    ;(u.uAim!.value as THREE.Matrix3).setFromMatrix4(this.m4.makeRotationFromQuaternion(this.q.copy(aim).invert()))
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
    u.uTravel!.value = travel
    ;(u.uGrain!.value as THREE.Vector4).x = this.surface.grain[0] * still
  }

  smear(now: THREE.Quaternion, tanNow: number, before: THREE.Quaternion | null, tanBefore: number, aim: THREE.Quaternion, height: number, step: number, soft: number): void {
    const u = this.material.uniforms
    if (!before) {
      u.uTaps!.value = 1
      ;(u.uSpan!.value as THREE.Vector2).set(0, 1)
      return
    }
    const k = tanBefore / tanNow
    const m = this.m4.makeRotationFromQuaternion(this.q.copy(aim).invert())
    m.multiply(this.m5.makeRotationFromQuaternion(before))
    m.multiply(this.m5.makeScale(k, k, 1))
    m.multiply(this.m5.makeRotationFromQuaternion(this.q.copy(now).invert()))
    ;(u.uBefore!.value as THREE.Matrix3).setFromMatrix4(m)
    const px = (now.angleTo(before) * height) / (2 * tanNow)
    u.uTaps!.value = Math.min(Math.max(Math.ceil(px / step), 1), 8)
    ;(u.uSpan!.value as THREE.Vector2).set(1, 1 + soft * Math.min(px, 4))
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
