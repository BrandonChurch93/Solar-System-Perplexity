import * as THREE from 'three'
import { Pass } from '../core/pass'
import { stream } from '../core/random'
import type { SkyPatch, SunState } from '../core/types'
import { INVERSE_FILMIC_GLSL } from '../post/chain'
import skyFrame from './skyframe.json'

export const EQUIRECT_GLSL = /* glsl */ `
const float PI = 3.141592653589793;
vec4 equirectGrad(sampler2D tex, vec3 dir, float grad) {
  float u = atan(dir.x, dir.z) / (2.0 * PI) + 0.5;
  float v = asin(clamp(dir.y, -1.0, 1.0)) / PI + 0.5;
  float u2 = fract(u + 0.5) - 0.5;
  vec2 dx = vec2(abs(dFdx(u)) < abs(dFdx(u2)) ? dFdx(u) : dFdx(u2), dFdx(v));
  vec2 dy = vec2(abs(dFdy(u)) < abs(dFdy(u2)) ? dFdy(u) : dFdy(u2), dFdy(v));
  return textureGrad(tex, vec2(u, v), dx * grad, dy * grad);
}
vec4 equirect(sampler2D tex, vec3 dir) {
  return equirectGrad(tex, dir, 1.0);
}`

const SKY_BAND_GLSL = /* glsl */ `
uniform sampler2D uBand;
uniform mat3 uGal;
uniform vec4 uBandMap;
uniform float uBandWiden;
uniform float uBandFadeEnd;
vec3 bandCoord(vec3 d) {
  vec3 g = uGal * d;
  float lat = asin(clamp(g.z, -1.0, 1.0));
  float t = (atan(g.y, g.x) / 6.283185307179586 + 0.5) * uBandMap.x + uBandMap.y;
  float x = lat / uBandMap.z;
  float v = 0.5 + x * (uBandWiden + (1.0 - uBandWiden) * 4.0 * x * x);
  return vec3(t, v, 1.0 - smoothstep(uBandMap.w, uBandFadeEnd, abs(x)));
}
vec3 bandPlane(vec3 d) {
  vec3 g = uGal * d;
  return transpose(uGal) * vec3(normalize(g.xy + vec2(1e-6, 0.0)), 0.0);
}
`


const SKY_PATCH_GLSL = /* glsl */ `
uniform sampler2D uPatchA;
uniform sampler2D uPatchB;
uniform mat3 uPatchM[2];
uniform vec4 uPatchLens[2];
uniform vec4 uPatchRing[2];
uniform vec3 uPatchMode[2];
vec3 patchCoord(int i, vec3 d) {
  vec3 pc = uPatchM[i] * d;
  vec2 uv = pc.xy / max(-pc.z, 1e-4) / uPatchLens[i].xy * 0.5 + 0.5;
  vec2 e = min(uv, 1.0 - uv);
  float inside = step(0.0, -pc.z) * smoothstep(0.0, uPatchMode[i].z, min(e.x, e.y));
  float r = length((uv - uPatchRing[i].xy) * vec2(uPatchLens[i].x / uPatchLens[i].y, 1.0));
  return vec3(uv, inside * smoothstep(uPatchRing[i].z, uPatchRing[i].w, r) * uPatchMode[i].x);
}
`

const SKY_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uSky;
uniform mat4 uInvProj;
uniform mat3 uRot;
uniform mat3 uFrame;
uniform vec3 uTint;
uniform vec3 uFloor;
uniform float uGamma;
uniform vec4 uBandGrade;
uniform vec4 uBandTint;
uniform float uExposure;
uniform float uGlow;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunRadius;
uniform float uSunGlare;
uniform float uTerrainBand;
uniform vec3 uBandClean;
uniform vec2 uLens;
in vec2 vUv;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${SKY_BAND_GLSL}
${SKY_PATCH_GLSL}
vec3 patchTexel(sampler2D s, vec3 p) {
  vec2 dx = dFdx(p.xy) * 0.25;
  vec2 dy = dFdy(p.xy) * 0.25;
  vec3 t = vec3(0.0);
  for (int k = 0; k < (p.z > 0.0 ? 1 : 0); k++) t = 0.25 * (texture(s, p.xy + dx + dy).rgb + texture(s, p.xy - dx + dy).rgb + texture(s, p.xy + dx - dy).rgb + texture(s, p.xy - dx - dy).rgb);
  return t;
}
vec3 patched(vec3 col, vec3 p, vec3 t, int i, float k) {
  vec3 c = (uPatchMode[i].y > 0.5 ? t : inverseFilmic(t)) * uPatchLens[i].z * k;
  return uPatchMode[i].y > 0.5 ? col + c * p.z : mix(col, c, p.z);
}
void main() {
  vec4 v = uInvProj * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec3 dir = normalize(uRot * (v.xyz / v.w));
  vec3 sd = uFrame * dir;
  vec3 col = equirect(uSky, sd).rgb;
  col = mix(vec3(dot(col, vec3(0.3, 0.5, 0.2))), col, 0.6);
  vec3 off = pow(max(col * uBandGrade.w, vec3(0.0)), vec3(uGamma)) * uTint;
  vec3 bc = bandCoord(sd);
  float t2 = fract(bc.x + 0.5) - 0.5;
  vec2 dx = vec2(abs(dFdx(bc.x)) < abs(dFdx(t2)) ? dFdx(bc.x) : dFdx(t2), dFdx(bc.y));
  vec2 dy = vec2(abs(dFdy(bc.x)) < abs(dFdy(t2)) ? dFdy(bc.x) : dFdy(t2), dFdy(bc.y));
  vec3 band = vec3(0.0);
  for (int k = 0; k < (bc.z > 0.0 ? 1 : 0); k++) {
    vec2 tx = uBandClean.x / vec2(textureSize(uBand, 0));
    vec3 b0 = textureGrad(uBand, bc.xy, dx, dy).rgb;
    vec2 gx = dx * uBandClean.z;
    vec2 gy = dy * uBandClean.z;
    vec3 lo = min(min(textureGrad(uBand, bc.xy + vec2(tx.x, tx.y), gx, gy).rgb, textureGrad(uBand, bc.xy + vec2(-tx.x, tx.y), gx, gy).rgb), min(textureGrad(uBand, bc.xy + vec2(tx.x, -tx.y), gx, gy).rgb, textureGrad(uBand, bc.xy - tx, gx, gy).rgb));
    lo = min(lo, min(min(textureGrad(uBand, bc.xy + vec2(tx.x * 1.41, 0.0), gx, gy).rgb, textureGrad(uBand, bc.xy - vec2(tx.x * 1.41, 0.0), gx, gy).rgb), min(textureGrad(uBand, bc.xy + vec2(0.0, tx.y * 1.41), gx, gy).rgb, textureGrad(uBand, bc.xy - vec2(0.0, tx.y * 1.41), gx, gy).rgb)));
    band = inverseFilmic(mix(min(b0, lo), b0, uBandClean.y));
    vec3 pd = bandPlane(sd);
    vec2 puv = vec2(atan(pd.x, pd.z) / (2.0 * PI) + 0.5, asin(clamp(pd.y, -1.0, 1.0)) / PI + 0.5);
    float region = clamp(sqrt(dot(textureLod(uSky, puv, log2(float(textureSize(uSky, 0).x)) - 6.0).rgb, vec3(0.3, 0.5, 0.2)) / uBandGrade.z), 0.7, 1.4);
    float bl = dot(band, vec3(0.3, 0.5, 0.2));
    band = mix(vec3(bl), band, uBandTint.w) * uBandTint.rgb * uBandGrade.x * region * pow(max(bl, 1e-5) / 0.05, uBandGrade.y - 1.0);
  }
  if (uGlow < 0.999) band *= uTerrainBand;
  col = (mix(off, band, bc.z) + uFloor) * uGlow * uExposure;
  vec3 pa = patchCoord(0, sd);
  vec3 pb = patchCoord(1, sd);
  vec3 ta = patchTexel(uPatchA, pa);
  vec3 tb = patchTexel(uPatchB, pb);
  vec2 lq = (vUv - 0.5) * vec2(uLens.y, 1.0);
  float pk = uGlow * uExposure / mix(1.0, 1.0 / pow(1.0 + dot(lq, lq) * 0.9, 2.0), uLens.x);
  col = patched(col, pa, ta, 0, pk);
  col = patched(col, pb, tb, 1, pk);
  for (int k = 0; k < (uSunGlare > 0.0 ? 1 : 0); k++) {
    float ang = acos(clamp(dot(dir, uSunDir), -1.0, 1.0));
    float x = ang / uSunRadius;
    float edge = fwidth(x) + 1e-4;
    float disc = smoothstep(1.0 + edge, 1.0 - edge, x);
    float limb = 0.45 + 0.55 * sqrt(max(1.0 - x * x, 0.0));
    float coreR = clamp(uSunRadius * 0.35, 0.0012, 0.004);
    float core = 40.0 * exp(-(ang * ang) / (coreR * coreR));
    float o = max(x, 1.0);
    float big = clamp(sqrt(0.02 / uSunRadius), 0.4, 1.0);
    float corona = 1.3 * big * pow(o, -3.6) + 0.035 * pow(o, -1.6) * exp(-o * 0.2);
    col += uSunColor * uSunGlare * (disc * (limb * 3.6 * big + core) + (1.0 - disc) * corona);
  }
  outColor = vec4(col, 0.0);
}`

const STAR_VERT = /* glsl */ `
uniform float uPixel;
uniform float uExposure;
uniform sampler2D uSky;
uniform float uHasSky;
uniform float uGlow;
in vec4 aStar;
in vec3 aColor;
out vec3 vColor;
uniform vec2 uCrowd;
uniform vec4 uTerrainStars;
uniform vec2 uCrowdShape;
out float vSize;
${SKY_BAND_GLSL}
${SKY_PATCH_GLSL}
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 0.0);
  gl_Position = projectionMatrix * vec4(mv.xyz, 1.0);
  gl_Position.z = 0.0;
  float size = aStar.x * uPixel;
  vSize = size;
  gl_PointSize = size;
  float crowd = 1.0;
  if (uHasSky > 0.5) {
    vec3 d = normalize(position);
    vec2 uv = vec2(atan(d.x, d.z) / 6.283185307179586 + 0.5, asin(clamp(d.y, -1.0, 1.0)) / 3.141592653589793 + 0.5);
    float lum = dot(textureLod(uSky, uv, 1.0).rgb, vec3(0.3, 0.5, 0.2));
    vec3 bc = bandCoord(d);
    float bandLum = dot(textureLod(uBand, bc.xy, uCrowd.y).rgb, vec3(0.3, 0.5, 0.2));
    float inBand = clamp(pow(bandLum / uCrowd.x, uCrowdShape.x), uCrowdShape.y, 2.3);
    float field = clamp(lum * 9.0, 0.14, 3.0) * mix(1.0, inBand, bc.z);
    crowd = mix(min(pow(field, 0.6), 1.0), field, aStar.z);
  }
  float lat = (uGal * normalize(position)).z;
  float b = aStar.y * (uGlow < 0.999 ? uTerrainStars.x * max(mix(1.0, crowd, uTerrainStars.y), 0.2) * mix(1.0, uTerrainStars.z, exp(-lat * lat / 0.012)) : crowd);
  if (uGlow < 0.999) b = min(b, uTerrainStars.w);
  b *= (1.0 - patchCoord(0, normalize(position)).z * uPatchLens[0].w) * (1.0 - patchCoord(1, normalize(position)).z * uPatchLens[1].w);
  vColor = aColor * b * uExposure;
}`

const STAR_FRAG = /* glsl */ `
precision highp float;
in vec3 vColor;
in float vSize;
uniform float uCore;
out vec4 outColor;
void main() {
  vec2 p = (gl_PointCoord - 0.5) * vSize;
  float r2 = dot(p, p);
  float core = exp(-r2 / uCore);
  float glow = 0.012 * exp(-r2 / (0.035 * vSize * vSize));
  outColor = vec4(vColor * (core + glow), 0.0);
}`

const BEHIND = { stencilWrite: true, stencilFunc: THREE.EqualStencilFunc, stencilRef: 0, stencilFuncMask: 0xff, stencilWriteMask: 0 } as const

const POLE = [0.45, 0.82, 0.35] as const
const GAMMA_TURN = 0.28
const STAR_MAX_SIZE = 11
const STAR_CULL_PAD_PX = 4

function galactic(): THREE.Matrix3 {
  const n = new THREE.Vector3(...POLE).normalize()
  const r = new THREE.Vector3(0, 1, 0).cross(n).normalize()
  const u = new THREE.Vector3().crossVectors(n, r)
  const x = r.clone().multiplyScalar(-Math.cos(GAMMA_TURN)).addScaledVector(u, -Math.sin(GAMMA_TURN))
  const y = new THREE.Vector3().crossVectors(n, x)
  return new THREE.Matrix3().set(x.x, x.y, x.z, y.x, y.y, y.z, n.x, n.y, n.z)
}

function bandMap(): THREE.Vector4 {
  const b = skyFrame.band
  return new THREE.Vector4(b.repeats, b.offsetDeg / 360 * b.repeats, THREE.MathUtils.degToRad(b.latSpanDeg), b.fadeStart)
}

export class Sky {
  cull = false
  private readonly pass: Pass
  private readonly stars: THREE.Points
  private readonly starScene = new THREE.Scene()
  private readonly rot = new THREE.Matrix3()
  private readonly m4 = new THREE.Matrix4()
  private readonly q = new THREE.Quaternion()
  private readonly frame = new THREE.Quaternion()
  private texture: THREE.Texture | null = null
  private band: THREE.Texture | null = null
  private readonly blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1)
  private readonly patchM = [new THREE.Matrix3(), new THREE.Matrix3()]
  private readonly patchLens = [new THREE.Vector4(1, 1, 0, 0), new THREE.Vector4(1, 1, 0, 0)]
  private readonly patchRing = [new THREE.Vector4(0, 0, 0, 1), new THREE.Vector4(0, 0, 0, 1)]
  private readonly patchMode = [new THREE.Vector3(0, 0, 0.05), new THREE.Vector3(0, 0, 0.05)]
  private readonly patchTex: THREE.Texture[] = [this.blank, this.blank]
  private readonly starPos: Float32Array
  private readonly starOrder: THREE.BufferAttribute
  private readonly starPlain: THREE.BufferGeometry
  private readonly starCulled: THREE.BufferGeometry
  private readonly starView = new THREE.Matrix3()
  private readonly starKey = new Float64Array(13).fill(NaN)

  constructor(base: number) {
    const st = skyFrame.stars
    const main = Math.round(base * st.countScale)
    const count = main + Math.round(base * st.micro)
    this.pass = new Pass(SKY_FRAG, {
      uSky: { value: null }, uInvProj: { value: new THREE.Matrix4() }, uRot: { value: this.rot }, uTint: { value: new THREE.Vector3().fromArray(skyFrame.grade.tint) }, uFloor: { value: new THREE.Vector3().fromArray(skyFrame.grade.floor) }, uGamma: { value: skyFrame.grade.gamma }, uBand: { value: null }, uGal: { value: galactic() }, uBandMap: { value: bandMap() }, uBandWiden: { value: 1 / skyFrame.band.widen }, uBandFadeEnd: { value: skyFrame.band.fadeEnd }, uBandGrade: { value: new THREE.Vector4(skyFrame.band.gain, skyFrame.band.gamma, skyFrame.band.regionRef, skyFrame.band.offGain) }, uBandTint: { value: new THREE.Vector4(skyFrame.band.tint[0], skyFrame.band.tint[1], skyFrame.band.tint[2], skyFrame.band.saturation) }, uFrame: { value: new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion())) }, uExposure: { value: 1 },
      uSunDir: { value: new THREE.Vector3(0, 0, 1) }, uSunColor: { value: new THREE.Vector3(1, 1, 1) }, uSunRadius: { value: 0.01 }, uSunGlare: { value: 0 }, uGlow: { value: 1 }, uTerrainBand: { value: skyFrame.band.terrainGain }, uBandClean: { value: new THREE.Vector3(skyFrame.band.cleanRadius, skyFrame.band.cleanKeep, skyFrame.band.cleanBlur) },
      uLens: { value: new THREE.Vector2(0, 16 / 9) }, uPatchA: { value: this.blank }, uPatchB: { value: this.blank }, uPatchM: { value: this.patchM }, uPatchLens: { value: this.patchLens }, uPatchRing: { value: this.patchRing }, uPatchMode: { value: this.patchMode },
    }, BEHIND)
    const rnd = stream('stars')
    const pos = new Float32Array(count * 3)
    const star = new Float32Array(count * 4)
    const col = new Float32Array(count * 3)
    const pole = new THREE.Vector3(...POLE).normalize()
    const v = new THREE.Vector3()
    const warm = new THREE.Color(1.0, 0.58, 0.34)
    const cool = new THREE.Color(0.5, 0.7, 1.0)
    const white = new THREE.Color(1, 1, 1)
    const rose = new THREE.Color(1.0, 0.42, 0.5)
    const amber = new THREE.Color(1.0, 0.62, 0.25)
    const azure = new THREE.Color(0.38, 0.6, 1.0)
    const c = new THREE.Color()
    let i = 0
    while (i < count) {
      const z = rnd.range(-1, 1)
      const a = rnd.range(0, Math.PI * 2)
      const s = Math.sqrt(1 - z * z)
      v.set(s * Math.cos(a), z, s * Math.sin(a))
      const lat = v.dot(pole)
      const micro = i >= main
      const band = micro ? Math.exp(-Math.pow(lat / st.microWidth, 2)) : Math.exp(-Math.pow(lat / st.bandWidth, 2)) + st.halo * Math.exp(-Math.pow(lat / 0.5, 2))
      const floor = micro ? 0 : st.floor
      if (rnd.next() > floor + (1 - floor) * Math.min(band, 1)) continue
      pos[i * 3] = v.x
      pos[i * 3 + 1] = v.y
      pos[i * 3 + 2] = v.z
      const u = Math.max(rnd.next(), 1e-6)
      const bright = micro ? st.microBright * (0.4 + 0.6 * u) : Math.min(st.brightness * Math.pow(u, -st.slope), 14)
      star[i * 4] = Math.min(2.6 + 2.2 * Math.log2(1 + bright), STAR_MAX_SIZE)
      star[i * 4 + 1] = bright
      star[i * 4 + 2] = micro ? 1 : 1 - Math.min(bright * 0.024 / st.brightness, 1)
      const temp = rnd.next()
      if (temp < 0.5) c.copy(warm).lerp(white, Math.pow(temp * 2, 0.6))
      else c.copy(white).lerp(cool, Math.pow((temp - 0.5) * 2, 1.4))
      const vivid = rnd.next()
      if (vivid < 0.35 * st.vivid) c.copy(rose)
      else if (vivid < 0.65 * st.vivid) c.copy(amber)
      else if (vivid < st.vivid) c.copy(azure)
      col[i * 3] = Math.max(1 + (c.r - 1) * st.color, 0.05)
      col[i * 3 + 1] = Math.max(1 + (c.g - 1) * st.color, 0.05)
      col[i * 3 + 2] = Math.max(1 + (c.b - 1) * st.color, 0.05)
      i++
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aStar', new THREE.BufferAttribute(star, 4))
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    this.starPos = pos
    this.starOrder = new THREE.BufferAttribute(new Uint32Array(count), 1)
    this.starOrder.setUsage(THREE.DynamicDrawUsage)
    const culled = new THREE.BufferGeometry()
    for (const name of ['position', 'aStar', 'aColor']) culled.setAttribute(name, geo.getAttribute(name))
    culled.setIndex(this.starOrder)
    culled.setDrawRange(0, 0)
    this.starPlain = geo
    this.starCulled = culled
    const mat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: { uPixel: { value: 1 }, uExposure: { value: 1 }, uGlow: { value: 1 }, uSky: { value: null }, uHasSky: { value: 0 }, uBand: { value: null }, uGal: { value: galactic() }, uBandMap: { value: bandMap() }, uBandWiden: { value: 1 / skyFrame.band.widen }, uBandFadeEnd: { value: skyFrame.band.fadeEnd }, uCrowd: { value: new THREE.Vector2(skyFrame.band.crowdRef, skyFrame.band.crowdLod) }, uTerrainStars: { value: new THREE.Vector4(st.terrainGain, st.terrainCrowd, st.terrainCore, st.terrainCap) }, uCrowdShape: { value: new THREE.Vector2(skyFrame.band.crowdPow, skyFrame.band.crowdMin) }, uCore: { value: skyFrame.stars.core }, uPatchA: { value: this.blank }, uPatchB: { value: this.blank }, uPatchM: { value: this.patchM }, uPatchLens: { value: this.patchLens }, uPatchRing: { value: this.patchRing }, uPatchMode: { value: this.patchMode } },
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      ...BEHIND,
    })
    this.stars = new THREE.Points(geo, mat)
    this.stars.frustumCulled = false
    this.starScene.add(this.stars)
  }

  setFrame(q: THREE.Quaternion): void {
    this.frame.copy(q)
  }

  setPatches(list: { patch: SkyPatch; weight: number }[]): void {
    for (let i = 0; i < 2; i++) {
      const e = list[i]
      this.patchMode[i]!.x = e ? e.weight : 0
      this.patchTex[i] = e ? e.patch.texture : this.blank
      if (!e) continue
      const p = e.patch
      this.patchM[i]!.setFromMatrix4(this.m4.makeRotationFromQuaternion(this.q.copy(p.aim).invert()))
      this.patchLens[i]!.set(p.tan[0], p.tan[1], p.gain, 1)
      this.patchRing[i]!.fromArray(p.ring)
      this.patchMode[i]!.set(e.weight, p.add ? 1 : 0, p.edge)
    }
  }

  private orderStars(camera: THREE.PerspectiveCamera, height: number, aspect: number): void {
    const m = this.starView.setFromMatrix4(this.m4.makeRotationFromQuaternion(this.q.copy(camera.quaternion).invert().multiply(this.stars.quaternion))).elements
    const p = camera.projectionMatrix.elements
    const half = STAR_MAX_SIZE * 0.5 * height / 1080 + STAR_CULL_PAD_PX
    const limX = 1 + (half + Math.ceil(Math.abs(p[8]!) * height * aspect * 0.5)) * 2 / (height * aspect)
    const limY = 1 + (half + Math.ceil(Math.abs(p[9]!) * height * 0.5)) * 2 / height
    const key = this.starKey
    const px = p[0]!
    const py = p[5]!
    let same = key[9] === px && key[10] === py && key[11] === limX && key[12] === limY
    for (let i = 0; i < 9; i++) same = same && key[i] === m[i]
    if (same) return
    for (let i = 0; i < 9; i++) key[i] = m[i]!
    key[9] = px
    key[10] = py
    key[11] = limX
    key[12] = limY
    const m0 = m[0]!, m1 = m[1]!, m2 = m[2]!, m3 = m[3]!, m4 = m[4]!, m5 = m[5]!, m6 = m[6]!, m7 = m[7]!, m8 = m[8]!
    const pos = this.starPos
    const order = this.starOrder.array as Uint32Array
    const count = pos.length / 3
    let n = 0
    for (let i = 0; i < count; i++) {
      const x = pos[i * 3]!
      const y = pos[i * 3 + 1]!
      const z = pos[i * 3 + 2]!
      const w = -(m2 * x + m5 * y + m8 * z)
      if (w <= 0) continue
      if (Math.abs(px * (m0 * x + m3 * y + m6 * z)) > w * limX || Math.abs(py * (m1 * x + m4 * y + m7 * z)) > w * limY) continue
      order[n++] = i
    }
    this.starOrder.clearUpdateRanges()
    this.starOrder.addUpdateRange(0, n)
    this.starOrder.needsUpdate = true
    this.starCulled.setDrawRange(0, n)
  }

  setTexture(t: THREE.Texture, band: THREE.Texture): void {
    this.texture = t
    this.band = band
  }

  render(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget, camera: THREE.PerspectiveCamera, skyQuaternion: THREE.Quaternion, exposure: number, glow: number, turn: THREE.Quaternion, height: number, sun: SunState, vignette: number, aspect: number, open: readonly number[] | null): void {
    const saved = camera.quaternion.clone()
    const savedPos = camera.position.clone()
    camera.quaternion.copy(skyQuaternion)
    camera.position.set(0, 0, 0)
    camera.updateMatrixWorld(true)
    const u = this.pass.material.uniforms
    u.uSky!.value = this.texture
    u.uBand!.value = this.band
    ;(u.uInvProj!.value as THREE.Matrix4).copy(camera.projectionMatrixInverse)
    this.rot.setFromMatrix4(this.m4.makeRotationFromQuaternion(skyQuaternion))
    u.uExposure!.value = exposure
    u.uGlow!.value = glow
    ;(u.uLens!.value as THREE.Vector2).set(vignette, aspect)
    u.uPatchA!.value = this.patchTex[0]
    u.uPatchB!.value = this.patchTex[1]
    this.q.copy(turn).invert().premultiply(this.frame)
    ;(u.uFrame!.value as THREE.Matrix3).setFromMatrix4(this.m4.makeRotationFromQuaternion(this.q))
    this.stars.quaternion.copy(this.q).invert()
    ;(u.uSunDir!.value as THREE.Vector3).copy(sun.dir)
    ;(u.uSunColor!.value as THREE.Vector3).set(sun.color.r, sun.color.g, sun.color.b)
    u.uSunRadius!.value = sun.angularRadius
    u.uSunGlare!.value = sun.glare
    if (this.texture && !open) this.pass.render(renderer, target)
    if (this.texture && open) {
      target.scissorTest = true
      for (let i = 0; i < open.length; i += 4) {
        target.scissor.set(open[i]!, open[i + 1]!, open[i + 2]!, open[i + 3]!)
        this.pass.render(renderer, target)
      }
      target.scissorTest = false
      target.scissor.set(0, 0, target.width, target.height)
    }
    const su = (this.stars.material as THREE.ShaderMaterial).uniforms
    su.uSky!.value = this.texture
    su.uBand!.value = this.band
    su.uHasSky!.value = this.texture ? 1 : 0
    su.uPixel!.value = height / 1080
    su.uExposure!.value = exposure
    su.uGlow!.value = glow
    su.uPatchA!.value = this.patchTex[0]
    su.uPatchB!.value = this.patchTex[1]
    this.stars.geometry = this.cull ? this.starCulled : this.starPlain
    if (this.cull && (!open || open.length > 0)) this.orderStars(camera, height, aspect)
    renderer.setRenderTarget(target)
    if (!open || open.length > 0) renderer.render(this.starScene, camera)
    camera.quaternion.copy(saved)
    camera.position.copy(savedPos)
    camera.updateMatrixWorld(true)
  }
}
