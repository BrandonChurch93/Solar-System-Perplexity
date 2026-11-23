import * as THREE from 'three'
import type { RenderView, SetContext } from '../../core/types'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import deck from './deck.json'
import fields from './deck-fields.json'

const OCTAVES = 10

const VERT = /* glsl */ `
uniform vec3 uS;
uniform vec3 uEx;
uniform vec3 uEy;
uniform vec3 uEn;
out vec3 vDir;
out vec3 vEye;
out vec2 vNdc;
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  vNdc = position.xy;
  vec4 v = inverse(projectionMatrix) * vec4(position.xy, -1.0, 1.0);
  mat3 toLocal = transpose(mat3(modelViewMatrix));
  vec3 d = toLocal * (v.xyz / v.w);
  vec3 q = -toLocal * modelViewMatrix[3].xyz - uS;
  vDir = vec3(dot(d, uEx), dot(d, uEy), dot(d, uEn));
  vEye = vec3(dot(q, uEx), dot(q, uEy), dot(q, uEn));
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uHeightNear;
uniform sampler2D uHeightMid;
uniform sampler2D uHeightFar;
uniform sampler2D uColorNear;
uniform sampler2D uColorMid;
uniform sampler2D uColorFar;
uniform sampler2D uLight;
uniform sampler2D uView;
uniform vec2 uViewOrigin;
uniform vec4 uViewRange;
uniform vec4 uViewTexel;
uniform vec3 uFitEye;
uniform vec4 uTrust;
uniform vec2 uBlend;
uniform vec4 uNear;
uniform vec4 uMid;
uniform vec4 uFar;
uniform vec4 uReach;
uniform vec2 uHeightRange;
uniform float uAlbedoScale;
uniform float uRadius;
uniform vec2 uShell;
uniform vec4 uMarch;
uniform float uPixel;
uniform float uGrad;
uniform vec4 uDetail;
uniform vec4 uDetailLook;
uniform vec2 uSunAz;
uniform vec4 uSunElev;
uniform vec4 uLightRange;
uniform vec4 uShade;
uniform vec4 uShadow;
uniform vec3 uSkyLight;
uniform vec4 uHaze;
uniform vec3 uHazeWarm;
uniform vec3 uHazeCool;
uniform vec4 uLimb;
uniform vec3 uLimbColor;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
in vec3 vDir;
in vec3 vEye;
in vec2 vNdc;
out vec4 outColor;
${DIAG_GLSL}
float hash(ivec2 p) {
  uint h = uint(p.x) * 0x9E3779B1u ^ uint(p.y) * 0x85EBCA77u;
  h ^= h >> 15;
  h *= 0x2C1B3C6Du;
  h ^= h >> 12;
  h *= 0x297A2D39u;
  h ^= h >> 15;
  return float(h) * (1.0 / 4294967296.0);
}
float vnoise(vec2 p) {
  vec2 f = floor(p);
  ivec2 i = ivec2(f);
  f = p - f;
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + ivec2(1, 0)), u.x), mix(hash(i + ivec2(0, 1)), hash(i + ivec2(1, 1)), u.x), u.y);
}
float above(vec3 p) {
  float n = dot(p, p) + 2.0 * uRadius * p.z;
  return n / (sqrt(uRadius * uRadius + n) + uRadius);
}
vec2 levels(vec2 g) {
  vec2 a = abs(g - uNear.xy) * (2.0 * uNear.z);
  vec2 b = abs(g - uMid.xy) * (2.0 * uMid.z);
  float wn = 1.0 - smoothstep(uBlend.x, uBlend.y, max(a.x, a.y));
  float wm = 1.0 - smoothstep(uBlend.x, uBlend.y, max(b.x, b.y));
  return vec2(wn, (1.0 - wn) * wm);
}
vec3 unfilm(vec3 y) {
  y = min(y, vec3(0.985));
  vec3 k = 0.59 * y - 0.03;
  vec3 q = 2.43 * y - 2.51;
  return (-k - sqrt(max(k * k - 0.56 * q * y, 0.0))) / (2.0 * q);
}
vec4 seenAt(vec3 p, vec3 D, float t, float foot, float fall) {
  vec2 o = p.xy - uViewOrigin;
  float d = length(o);
  float lift = 1.0 + d * d / (2.0 * uRadius);
  vec2 uv = vec2((atan(o.x, o.y) - uViewRange.x) * uViewRange.y, (atan(lift, d) - uViewRange.z) * uViewRange.w);
  float row = uViewTexel.y * (d * d + lift * lift) / max(2.0 - lift, 1e-3);
  float lod = log2(max(max(foot / max(d * uViewTexel.x, 1e-6), foot / (max(fall, 0.02) * row)), 1.0));
  vec4 c = textureLod(uView, uv, lod);
  float len = uViewTexel.z * exp2(uViewTexel.w * (1.0 - c.a));
  float smear = len * length(cross(D, normalize(p - uFitEye))) / foot;
  bool inside = uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0 && c.a > 0.004;
  return vec4(unfilm(c.rgb), inside ? 1.0 - smoothstep(uTrust.x, uTrust.y, smear) : 0.0);
}
float stored(vec2 g, vec2 w) {
  float h = 0.0;
  for (int k = 0; k < (w.x > 0.0 ? 1 : 0); k++) h += w.x * textureLod(uHeightNear, (g - uNear.xy) * uNear.z + 0.5, 0.0).r;
  for (int k = 0; k < (w.y > 0.0 ? 1 : 0); k++) h += w.y * textureLod(uHeightMid, (g - uMid.xy) * uMid.z + 0.5, 0.0).r;
  float wf = 1.0 - w.x - w.y;
  for (int k = 0; k < (wf > 0.0 ? 1 : 0); k++) h += wf * textureLod(uHeightFar, (g - uFar.xy) * uFar.z + 0.5, 0.0).r;
  return uHeightRange.x + h * uHeightRange.y;
}
float cutOf(vec2 w) {
  return (w.x * uNear.w + w.y * uMid.w + (1.0 - w.x - w.y) * uFar.w) * uDetail.z;
}
float made(vec2 g, float cut, float foot) {
  float least = uDetail.w * foot;
  int k0 = max(int(floor(log2(uDetail.x / (1.4 * cut)))), 0);
  int k1 = min(int(ceil(log2(uDetail.x / least))), ${OCTAVES - 1});
  float sum = 0.0;
  for (int k = k0; k <= k1; k++) {
    float wave = uDetail.x * exp2(-float(k));
    float use = (1.0 - smoothstep(0.7 * cut, 1.4 * cut, wave)) * smoothstep(least, 2.5 * least, wave);
    float a = 0.6 * float(k);
    vec2 q = (mat2(cos(a), sin(a), -sin(a), cos(a)) * g) / wave + vec2(17.3, -9.1) * float(k);
    sum += use * wave * (abs(2.0 * vnoise(q) - 1.0) - 0.5);
  }
  return sum * uDetail.y;
}
vec3 colour(vec2 g, vec2 w, float foot) {
  vec4 c = vec4(0.0);
  for (int k = 0; k < (w.x > 0.0 ? 1 : 0); k++) c += w.x * textureLod(uColorNear, (g - uNear.xy) * uNear.z + 0.5, log2(max(foot / uNear.w, 1.0)));
  for (int k = 0; k < (w.y > 0.0 ? 1 : 0); k++) c += w.y * textureLod(uColorMid, (g - uMid.xy) * uMid.z + 0.5, log2(max(foot / uMid.w, 1.0)));
  float wf = 1.0 - w.x - w.y;
  for (int k = 0; k < (wf > 0.0 ? 1 : 0); k++) c += wf * textureLod(uColorFar, (g - uFar.xy) * uFar.z + 0.5, log2(max(foot / uFar.w, 1.0)));
  return c.rgb * uAlbedoScale;
}
void main() {
  vec3 D = normalize(vDir);
  vec3 E = vEye;
  float bD = dot(D, E) + uRadius * D.z;
  float e2 = dot(E, E);
  float high = e2 + 2.0 * uRadius * E.z;
  float cTop = high - 2.0 * uRadius * uShell.y - uShell.y * uShell.y;
  float cLow = high - 2.0 * uRadius * uShell.x - uShell.x * uShell.x;
  float dTop = bD * bD - cTop;
  float dLow = bD * bD - cLow;
  float tangent = bD < 0.0 ? sqrt(max(high + uRadius * uRadius - bD * bD, 0.0)) - uRadius : high / (sqrt(uRadius * uRadius + high) + uRadius);
  bool inside = dTop > 0.0 && (cTop < 0.0 || bD < 0.0);
  float t0 = inside ? max(-bD - sqrt(max(dTop, 0.0)), 0.0) : 0.0;
  float t1 = inside ? (dLow > 0.0 && -bD - sqrt(max(dLow, 0.0)) > 0.0 ? -bD - sqrt(max(dLow, 0.0)) : -bD + sqrt(max(dTop, 0.0))) : 0.0;
  float pix = uPixel * uGrad;
  float t = t0;
  float tPrev = t0;
  float gap = 1.0;
  float gapPrev = 1.0;
  bool hit = false;
  vec2 w = vec2(0.0);
  int steps = 0;
  for (int i = 0; i < (inside ? int(uMarch.w) : 0); i++) {
    vec3 p = E + D * t;
    w = levels(p.xy);
    gap = above(p) - stored(p.xy, w);
    steps = i;
    if (gap < uMarch.z * t * pix) { hit = true; break; }
    if (t > t1) break;
    tPrev = t;
    gapPrev = gap;
    float fall = max(-(D.z + (D.x * p.x + D.y * p.y) / uRadius), 0.0);
    t += max(gap / (fall + uMarch.x), uMarch.y * t * pix);
  }
  for (int i = 0; i < (hit ? 3 : 0); i++) {
    float tm = gapPrev > 0.0 && gap < gapPrev ? tPrev + (t - tPrev) * gapPrev / (gapPrev - gap) : 0.5 * (t + tPrev);
    vec3 p = E + D * tm;
    float gm = above(p) - stored(p.xy, w);
    if (gm > 0.0) { tPrev = tm; gapPrev = gm; } else { t = tm; gap = gm; }
  }
  float cut = cutOf(w);
  for (int i = 0; i < (hit ? 2 : 0); i++) {
    vec3 p = E + D * t;
    float fall = max(-(D.z + (D.x * p.x + D.y * p.y) / uRadius), 0.02);
    t -= clamp((made(p.xy, cut, t * pix) - (above(p) - stored(p.xy, w))) / (fall + 0.5), -2.0 * cut, 2.0 * cut);
  }
  vec2 q = vNdc * 0.5 * vec2(uAspect, 1.0);
  float vig = 1.0 / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
  vec3 col = vec3(0.0);
  float alpha = 0.0;
  float texels = 0.0;
  vec3 tint = vec3(float(steps) / uMarch.w, 0.0, 0.0);
  float sunward = dot(E.xy + D.xy * (hit ? t : 30.0), uSunAz);
  vec4 seen = vec4(0.0);
  for (int k = 0; k < (hit ? 1 : 0); k++) {
    vec3 p = E + D * t;
    seen = seenAt(p, D, t, t * pix, max(-(D.z + (D.x * p.x + D.y * p.y) / uRadius), 0.0));
    alpha = 1.0;
    tint.b = seen.a;
  }
  for (int k = 0; k < (hit && seen.a < 1.0 ? 1 : 0); k++) {
    vec3 p = E + D * t;
    vec2 g = p.xy;
    float foot = t * pix;
    float e = max(foot, uDetailLook.x);
    float base = stored(g, w);
    float fine = made(g, cut, foot);
    float hx = stored(g + vec2(e, 0.0), w) + made(g + vec2(e, 0.0), cut, foot) - stored(g - vec2(e, 0.0), w) - made(g - vec2(e, 0.0), cut, foot);
    float hy = stored(g + vec2(0.0, e), w) + made(g + vec2(0.0, e), cut, foot) - stored(g - vec2(0.0, e), w) - made(g - vec2(0.0, e), cut, foot);
    vec3 n = normalize(vec3(-hx / (2.0 * e), -hy / (2.0 * e), 1.0));
    float u = dot(g, uSunAz);
    float elev = clamp(uSunElev.x + uSunElev.y * u, uSunElev.z, uSunElev.w);
    vec3 L = vec3(uSunAz * cos(elev), sin(elev));
    float ndl = dot(n, L);
    float shadow = 1.0;
    float ts = uShadow.x;
    int shades = 0;
    for (int i = 0; i < (ndl > -uShade.x ? int(uShadow.w) : 0); i++) {
      vec3 ps = vec3(g, base + fine + ts * ts * (1.0 - L.z * L.z) / (2.0 * uRadius)) + L * ts;
      float gs = ps.z - stored(ps.xy, w);
      shadow = min(shadow, uShadow.y * gs / ts + 0.5);
      shades = i;
      if (shadow <= 0.0 || ps.z > uShell.y) break;
      ts += max(gs * uShadow.z, uShadow.x);
    }
    shadow = clamp(shadow, 0.0, 1.0);
    float direct = clamp((ndl + uShade.x) / (1.0 + uShade.x), 0.0, 1.0) * shadow;
    float lightAt = texture(uLight, vec2((u - uLightRange.x) * uLightRange.y, 0.5)).r;
    float open = clamp(0.5 + 0.5 * n.z, 0.0, 1.0);
    float hollow = clamp(1.0 + uShade.z * fine / max(cut * uDetail.y, 1e-5), 0.3, 1.7);
    vec3 albedo = colour(g, w, foot);
    col = albedo * lightAt * (uShade.y * direct + uSkyLight * open * hollow) * uShade.w;
    float through = exp(-uHaze.x * t);
    vec3 haze = mix(uHazeCool, uHazeWarm, smoothstep(uHaze.z, uHaze.w, u)) * texture(uLight, vec2((u + uHaze.y - uLightRange.x) * uLightRange.y, 0.5)).r;
    col = col * through + haze * (1.0 - through);
    texels = foot / (uDetail.x * exp2(-float(${OCTAVES - 1})));
    tint.g = float(shades) / uShadow.w;
  }
  col = mix(col, seen.rgb, seen.a);
  float rise = max(tangent - uShell.x, 0.0);
  float glow = hit ? 0.0 : uLimb.x * exp(-rise / uLimb.y) + uLimb.z * exp(-rise / uLimb.w);
  float sunSide = texture(uLight, vec2((sunward - uLightRange.x) * uLightRange.y, 0.5)).r;
  col += uLimbColor * glow * sunSide;
  alpha = max(alpha, clamp(glow * sunSide, 0.0, 1.0));
  outColor = diagOut(vec4(col * uGain * vig, alpha), texels, 1.0, tint, vec2(0.0), t);
  if (alpha <= 0.0) discard;
}`

type Level = { centre: number[]; size: number; pixels: Record<string, number> }

async function heightMap(ctx: SetContext, path: string, size: number): Promise<THREE.DataTexture> {
  const raw = new Uint16Array(await ctx.buffer(path))
  if (raw.length !== size * size) throw new Error('deck height size mismatch: ' + path)
  const data = new Float32Array(raw.length)
  for (let i = 0; i < raw.length; i++) data[i] = raw[i]! / 65535
  return ctx.floatTexture(data, size, size)
}

export class CloudDeck {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  private constructor(uniforms: Record<string, THREE.IUniform>) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      depthTest: false,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.frustumCulled = false
  }

  static async load(ctx: SetContext, base: string): Promise<CloudDeck> {
    const maps = fields.maps as Record<string, Level>
    const uniforms: Record<string, THREE.IUniform> = {}
    for (const [name, key] of [['near', 'Near'], ['mid', 'Mid'], ['far', 'Far']] as const) {
      const m = maps[name]!
      const size = m.pixels[ctx.assets]!
      uniforms['uHeight' + key] = { value: await heightMap(ctx, base + 'deck-' + name + '-height.bin', size) }
      uniforms['uColor' + key] = { value: await ctx.texture(base + 'deck-' + name + '-color.png', { srgb: true, anisotropy: 1 }) }
      uniforms['u' + key] = { value: new THREE.Vector4(m.centre[0], m.centre[1], 1 / m.size, m.size / size) }
    }
    const level = new Float32Array(fields.light.level)
    const knots = fields.light.knots
    const c = fields.chart
    const l = deck.look
    const az = THREE.MathUtils.degToRad(deck.light.azimuthDeg)
    const rad = THREE.MathUtils.degToRad
    const v = fields.view
    const vp = (v.pixels as Record<string, number[]>)[ctx.assets]!
    Object.assign(uniforms, {
      uLight: { value: ctx.floatTexture(level, level.length, 1) },
      uView: { value: await ctx.texture(base + 'deck-view-color.png', { srgb: true, anisotropy: 1 }) },
      uViewOrigin: { value: new THREE.Vector2().fromArray(v.origin) },
      uViewRange: { value: new THREE.Vector4(v.theta[0]!, 1 / (v.theta[1]! - v.theta[0]!), v.psi[0]!, 1 / (v.psi[1]! - v.psi[0]!)) },
      uViewTexel: { value: new THREE.Vector4((v.theta[1]! - v.theta[0]!) / vp[0]!, (v.psi[1]! - v.psi[0]!) / vp[1]!, v.lengthRange[0]!, Math.log2(v.lengthRange[1]! / v.lengthRange[0]!)) },
      uFitEye: { value: new THREE.Vector3().fromArray(v.eye) },
      uTrust: { value: new THREE.Vector4().fromArray(l.trust) },
      uBlend: { value: new THREE.Vector2().fromArray(l.blend) },
      uLightRange: { value: new THREE.Vector4(knots[0]! - 0.5 * (knots[1]! - knots[0]!), 1 / (knots.length * (knots[1]! - knots[0]!)), 0, 0) },
      uS: { value: new THREE.Vector3().fromArray(c.origin) }, uEx: { value: new THREE.Vector3().fromArray(c.ex) }, uEy: { value: new THREE.Vector3().fromArray(c.ey) }, uEn: { value: new THREE.Vector3().fromArray(c.en) },
      uRadius: { value: c.radius },
      uReach: { value: new THREE.Vector4().fromArray(l.reach) },
      uHeightRange: { value: new THREE.Vector2(fields.heightRange[0]!, fields.heightRange[1]! - fields.heightRange[0]!) },
      uAlbedoScale: { value: fields.albedoScale },
      uShell: { value: new THREE.Vector2().fromArray(l.shell) },
      uMarch: { value: new THREE.Vector4().fromArray(l.march) },
      uPixel: { value: 0.001 },
      uDetail: { value: new THREE.Vector4().fromArray(l.detail) },
      uDetailLook: { value: new THREE.Vector4().fromArray(l.detailLook) },
      uSunAz: { value: new THREE.Vector2(Math.cos(az), Math.sin(az)) },
      uSunElev: { value: new THREE.Vector4(rad(deck.light.elevDeg[0]!), rad(deck.light.elevDeg[1]!), rad(deck.light.elevDeg[2]!), rad(deck.light.elevDeg[3]!)) },
      uShade: { value: new THREE.Vector4().fromArray(l.shade) },
      uShadow: { value: new THREE.Vector4().fromArray(l.shadow) },
      uSkyLight: { value: new THREE.Vector3().fromArray(l.skyLight) },
      uHaze: { value: new THREE.Vector4().fromArray(l.haze) },
      uHazeWarm: { value: new THREE.Vector3().fromArray(l.hazeWarm) },
      uHazeCool: { value: new THREE.Vector3().fromArray(l.hazeCool) },
      uLimb: { value: new THREE.Vector4().fromArray(l.limb) },
      uLimbColor: { value: new THREE.Vector3().fromArray(l.limbColor) },
      uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uDiag: diagUniform, uGrad: gradUniform,
    })
    return new CloudDeck(uniforms)
  }

  update(gain: number, vignette: number, view: RenderView): void {
    const u = this.material.uniforms
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = view.format.width / view.format.height
    u.uPixel!.value = 2 * Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) / view.format.height
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
