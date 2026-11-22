import * as THREE from 'three'
import { Pass } from '../core/pass'
import { stream } from '../core/random'
import { tileRects, type Tiles } from '../core/tiles'
import type { SkyPatch, SunState } from '../core/types'
import { FLIGHT_SIZE, SIZE, bandField, flightField, type FlightDef, type FlightField, type StripDef } from './travel/field'
import { TEXEL_GLSL, implicitUniform } from '../core/texel'
import { INVERSE_FILMIC_GLSL } from '../post/chain'
import skyFrame from './skyframe.json'

export const EQUIRECT_GLSL = /* glsl */ `
${TEXEL_GLSL}
const float PI = 3.141592653589793;
vec4 equirectGrad(sampler2D tex, vec3 dir, float grad) {
  float u = atan(dir.x, dir.z) / (2.0 * PI) + 0.5;
  float v = asin(clamp(dir.y, -1.0, 1.0)) / PI + 0.5;
  float u2 = fract(u + 0.5) - 0.5;
  vec2 dx = vec2(abs(dFdx(u)) < abs(dFdx(u2)) ? dFdx(u) : dFdx(u2), dFdx(v));
  vec2 dy = vec2(abs(dFdy(u)) < abs(dFdy(u2)) ? dFdy(u) : dFdy(u2), dFdy(v));
  return gradTexel(tex, vec2(u, v), dx * grad, dy * grad);
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
uniform sampler2D uFlightMap;
uniform vec4 uFlightGlow;
uniform vec4 uFlightHaze;
uniform float uFlightBandWidth;
uniform vec3 uFlightOff;
uniform vec3 uFlightDust;
uniform vec3 uFlightLight;
uniform vec4 uFlightBand;
uniform vec2 uFlightLook;
uniform vec4 uFlightVeil;
uniform vec4 uFlightVeilWarm;
uniform sampler2D uBandGlow;
uniform vec3 uFlightStrip;
uniform vec3 uFlightEdge;
uniform vec4 uFlightFeather;
uniform float uFlightRough;
in vec2 vUv;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${SKY_BAND_GLSL}
${SKY_PATCH_GLSL}
vec3 patchTexel(sampler2D s, vec3 p) {
  vec2 gx = dFdx(p.xy);
  vec2 gy = dFdy(p.xy);
  vec2 dx = gx * 0.25;
  vec2 dy = gy * 0.25;
  vec3 t = vec3(0.0);
#ifdef PATCH_IMPLICIT
  for (int k = 0; k < (p.z > 0.0 ? 1 : 0); k++) t = 0.25 * (texture(s, p.xy + dx + dy).rgb + texture(s, p.xy - dx + dy).rgb + texture(s, p.xy + dx - dy).rgb + texture(s, p.xy - dx - dy).rgb);
#else
  for (int k = 0; k < (p.z > 0.0 ? 1 : 0); k++) t = 0.25 * (textureGrad(s, p.xy + dx + dy, gx, gy).rgb + textureGrad(s, p.xy - dx + dy, gx, gy).rgb + textureGrad(s, p.xy + dx - dy, gx, gy).rgb + textureGrad(s, p.xy - dx - dy, gx, gy).rgb);
#endif
  return t;
}
vec3 smoothLod(sampler2D s, vec2 uv, float lod) {
  vec2 size = vec2(textureSize(s, int(lod)));
  vec2 st = uv * size - 0.5;
  vec2 i = floor(st);
  vec2 f = st - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
  vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 g0 = w0 + w1;
  vec2 g1 = 1.0 - g0;
  vec2 h0 = (i - 0.5 + w1 / g0) / size;
  vec2 h1 = (i + 1.5 + w3 / g1) / size;
  return g0.y * (g0.x * textureLod(s, vec2(h0.x, h0.y), lod).rgb + g1.x * textureLod(s, vec2(h1.x, h0.y), lod).rgb) + g1.y * (g0.x * textureLod(s, vec2(h0.x, h1.y), lod).rgb + g1.x * textureLod(s, vec2(h1.x, h1.y), lod).rgb);
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
  vec2 plan = texelPlan(uBand, bc.xy, dx, dy);
  for (int k = 0; k < (bc.z > 0.0 ? 1 : 0); k++) {
    vec2 tx = uBandClean.x / vec2(textureSize(uBand, 0));
    vec3 b0 = vec3(0.0);
    for (int j = 0; j < (plan.x > 0.5 ? 1 : 0); j++) b0 = texture(uBand, bc.xy, plan.y).rgb;
    for (int j = 0; j < (plan.x > 0.5 ? 0 : 1); j++) b0 = textureGrad(uBand, bc.xy, dx, dy).rgb;
    vec2 gx = dx * uBandClean.z;
    vec2 gy = dy * uBandClean.z;
    vec3 kept = b0;
    for (int j = 0; j < (uBandClean.y < 1.0 ? 1 : 0); j++) {
      vec3 lo = min(min(textureGrad(uBand, bc.xy + vec2(tx.x, tx.y), gx, gy).rgb, textureGrad(uBand, bc.xy + vec2(-tx.x, tx.y), gx, gy).rgb), min(textureGrad(uBand, bc.xy + vec2(tx.x, -tx.y), gx, gy).rgb, textureGrad(uBand, bc.xy - tx, gx, gy).rgb));
      lo = min(lo, min(min(textureGrad(uBand, bc.xy + vec2(tx.x * 1.41, 0.0), gx, gy).rgb, textureGrad(uBand, bc.xy - vec2(tx.x * 1.41, 0.0), gx, gy).rgb), min(textureGrad(uBand, bc.xy + vec2(0.0, tx.y * 1.41), gx, gy).rgb, textureGrad(uBand, bc.xy - vec2(0.0, tx.y * 1.41), gx, gy).rgb)));
      kept = mix(min(b0, lo), b0, uBandClean.y);
    }
    band = inverseFilmic(kept);
    vec3 pd = bandPlane(sd);
    vec2 puv = vec2(atan(pd.x, pd.z) / (2.0 * PI) + 0.5, asin(clamp(pd.y, -1.0, 1.0)) / PI + 0.5);
    float region = clamp(sqrt(dot(textureLod(uSky, puv, log2(float(textureSize(uSky, 0).x)) - 6.0).rgb, vec3(0.3, 0.5, 0.2)) / uBandGrade.z), 0.7, 1.4);
    float bl = dot(band, vec3(0.3, 0.5, 0.2));
    band = mix(vec3(bl), band, uBandTint.w) * uBandTint.rgb * uBandGrade.x * region * pow(max(bl, 1e-5) / 0.05, uBandGrade.y - 1.0);
  }
  float bz = bc.z;
  for (int k = 0; k < (uFlightStrip.x > 0.0 ? 1 : 0); k++) {
    vec2 fuv = vec2(atan(sd.x, sd.z) / (2.0 * PI) + 0.5, asin(clamp(sd.y, -1.0, 1.0)) / PI + 0.5);
    float ax = abs(asin(clamp((uGal * sd).z, -1.0, 1.0))) / uBandMap.z;
    vec2 fv = textureLod(uFlightMap, fuv, 0.0).gb;
    float ar = ax * (1.0 + uFlightFeather.x * clamp((uFlightFeather.y - fv.x) * uFlightFeather.z, 0.0, 1.0));
    float fz = 1.0 - smoothstep(uFlightEdge.x, uFlightEdge.y, ar + uFlightRough * fv.y * smoothstep(0.0, 0.5 * uFlightEdge.x, ar) + uFlightEdge.z * (fv.x - 1.0));
    highp uint hs = uint(gl_FragCoord.x) * 0x85EBCA77u ^ uint(gl_FragCoord.y) * 0xC2B2AE3Du;
    hs ^= hs >> 15;
    hs *= 0x2C1B3C6Du;
    hs ^= hs >> 12;
    hs *= 0x297A2D39u;
    hs ^= hs >> 15;
    float grain = 1.0 + uFlightStrip.y * (float(hs >> 8) * (1.0 / 16777216.0) - 0.5);
    vec3 soft = smoothLod(uSky, fuv, max(log2(float(textureSize(uSky, 0).x)) - uFlightStrip.z, 0.0));
    soft = mix(vec3(dot(soft, vec3(0.3, 0.5, 0.2))), soft, 0.6);
    off = mix(off, pow(max(soft * uBandGrade.w, vec3(0.0)), vec3(uGamma)) * uTint * grain, uFlightStrip.x);
    vec3 glow = vec3(0.0);
    for (int j = 0; j < (fz > 0.0 ? 1 : 0); j++) {
      vec3 sq = smoothLod(uBandGlow, bc.xy, 0.0);
      glow = inverseFilmic(sq * sq) * grain;
      fz = smoothstep(uFlightFeather.w * (1.0 - dot(sq, vec3(0.3, 0.5, 0.2))), 1.0, fz);
      vec3 pd = bandPlane(sd);
      vec2 puv = vec2(atan(pd.x, pd.z) / (2.0 * PI) + 0.5, asin(clamp(pd.y, -1.0, 1.0)) / PI + 0.5);
      float region = clamp(sqrt(dot(textureLod(uSky, puv, log2(float(textureSize(uSky, 0).x)) - 6.0).rgb, vec3(0.3, 0.5, 0.2)) / uBandGrade.z), 0.7, 1.4);
      float gl = dot(glow, vec3(0.3, 0.5, 0.2));
      glow = mix(vec3(gl), glow, uBandTint.w) * uBandTint.rgb * uBandGrade.x * region * pow(max(gl, 1e-5) / 0.05, uBandGrade.y - 1.0);
    }
    band = mix(band, glow, uFlightStrip.x);
    bz = mix(bc.z, fz, uFlightStrip.x);
  }
  if (uGlow < 0.999) band *= uTerrainBand;
  if (uFlightGlow.w > 0.0 || uFlightLook.x > 0.0) {
    float ol = dot(uFlightOff, vec3(0.3, 0.5, 0.2));
    off = mix(off, off * uFlightOff / ol, uFlightLook.x) * mix(1.0, ol, uFlightGlow.w);
    float fl = max(dot(band, vec3(0.3, 0.5, 0.2)), 1e-5);
    band = mix(band, band * mix(uFlightDust, uFlightLight, smoothstep(uFlightBand.x, uFlightBand.y, fl)) * uFlightLook.y * pow(fl / uFlightBand.y, uFlightBand.z), uFlightLook.x) * mix(1.0, uFlightBand.w / uFlightLook.y, uFlightGlow.w);
  }
  col = (mix(off, band, bz) + uFloor) * uGlow * uExposure;
  if (uFlightGlow.w > 0.0) {
    vec2 fm = textureLod(uFlightMap, vec2(atan(sd.x, sd.z) / (2.0 * PI) + 0.5, asin(clamp(sd.y, -1.0, 1.0)) / PI + 0.5), 0.0).rg;
    col += uFlightHaze.rgb * (uFlightGlow.w * (uFlightHaze.w + (1.0 - uFlightHaze.w) * exp(-pow(asin(clamp((uGal * sd).z, -1.0, 1.0)) / uFlightBandWidth, 2.0)))) + uFlightGlow.rgb * (uFlightGlow.w * fm.r);
    vec2 vq = (vUv - 0.5) * vec2(uLens.y, 1.0);
    highp uint h = uint(gl_FragCoord.x) * 0x9E3779B1u ^ uint(gl_FragCoord.y) * 0x85EBCA77u;
    h ^= h >> 15;
    h *= 0x2C1B3C6Du;
    h ^= h >> 12;
    h *= 0x297A2D39u;
    h ^= h >> 15;
    col += mix(uFlightVeil.rgb, uFlightVeilWarm.rgb, smoothstep(0.7, 1.5, fm.g)) * (uFlightGlow.w * fm.g * (1.0 + uFlightVeil.w * (float(h >> 8) * (1.0 / 16777216.0) - 0.5)) / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uLens.x * uFlightVeilWarm.w));
  }
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
    float core = 40.0 * exp(-(ang * ang) / (coreR * coreR)) * (1.0 - smoothstep(0.06, 0.085, uSunRadius));
    float o = max(x, 1.0);
    float big = clamp(sqrt(0.02 / uSunRadius), 0.4, 1.0);
    float corona = 1.3 * big * pow(o, -3.6) + 0.035 * pow(o, -1.6) * exp(-o * 0.2);
    float wide = smoothstep(0.06, 0.085, uSunRadius);
    float mu = sqrt(max(1.0 - x * x, 0.0));
    vec3 face = mix(vec3(1.0), 2.6 * pow(vec3(mu + 0.05), vec3(0.22, 0.42, 0.8)), wide);
    corona += wide * (0.5 * exp(-(o - 1.0) * 9.0) + 0.16 * pow(o, -1.4) * exp(-(o - 1.0) * 0.3));
    col += uSunColor * uSunGlare * (disc * (face * limb * 3.6 * big + core) + (1.0 - disc) * corona);
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
uniform vec2 uStarLift;
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
  b *= mix(1.0, max(uStarLift.y / max(crowd, 1e-4), 1.0), uStarLift.x);
  b *= (1.0 - patchCoord(0, normalize(position)).z * uPatchLens[0].w) * (1.0 - patchCoord(1, normalize(position)).z * uPatchLens[1].w);
  vColor = aColor * b * uExposure;
}`

const STAR_FRAG = /* glsl */ `
precision highp float;
in vec3 vColor;
in float vSize;
uniform float uCore;
uniform float uHalo;
out vec4 outColor;
void main() {
  vec2 p = (gl_PointCoord - 0.5) * vSize;
  float r2 = dot(p, p);
  float core = exp(-r2 / uCore);
  float glow = uHalo * exp(-r2 / (0.035 * vSize * vSize));
  outColor = vec4(vColor * (core + glow), 0.0);
}`

const DEEP_VERT = /* glsl */ `
uniform float uPixel;
uniform float uExposure;
uniform vec3 uLens;
uniform vec3 uDeepLaw;
uniform vec3 uDeepSize;
in float aStar;
in vec3 aColor;
out vec3 vColor;
out float vSize;
${SKY_PATCH_GLSL}
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 0.0);
  gl_Position = projectionMatrix * vec4(mv.xyz, 1.0);
  vec2 lq = gl_Position.xy / gl_Position.w * 0.5 * vec2(uLens.y, 1.0);
  gl_Position.z = 0.0;
  float b = uDeepLaw.x * aStar * pow(aStar / uDeepLaw.z, uDeepLaw.y);
  float size = min(uDeepSize.x + uDeepSize.y * log2(1.0 + b), uDeepSize.z) * uPixel;
  gl_PointSize = size;
  vSize = size;
  vec3 d = normalize(position);
  vColor = aColor * (b * uExposure * (1.0 - patchCoord(0, d).z * uPatchLens[0].w) * (1.0 - patchCoord(1, d).z * uPatchLens[1].w) / mix(1.0, 1.0 / pow(1.0 + dot(lq, lq) * 0.9, 2.0), uLens.x * uLens.z));
}`

const STRIP_VERT = /* glsl */ `
uniform float uPixel;
uniform float uExposure;
uniform float uLift;
uniform sampler2D uSky;
uniform mat3 uGal;
uniform vec4 uBandGrade;
uniform vec4 uBandTint;
uniform vec3 uFlightDust;
uniform vec3 uFlightLight;
uniform vec4 uFlightBand;
uniform vec2 uFlightLook;
uniform vec2 uStripStar;
uniform vec3 uStripSize;
in vec2 aStar;
in vec3 aColor;
out vec3 vColor;
out float vSize;
${SKY_PATCH_GLSL}
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 0.0);
  gl_Position = projectionMatrix * vec4(mv.xyz, 1.0);
  gl_Position.z = 0.0;
  vec3 d = normalize(position);
  vec3 g = uGal * d;
  vec3 pd = transpose(uGal) * vec3(normalize(g.xy + vec2(1e-6, 0.0)), 0.0);
  vec2 puv = vec2(atan(pd.x, pd.z) / 6.283185307179586 + 0.5, asin(clamp(pd.y, -1.0, 1.0)) / 3.141592653589793 + 0.5);
  float region = clamp(sqrt(dot(textureLod(uSky, puv, log2(float(textureSize(uSky, 0).x)) - 6.0).rgb, vec3(0.3, 0.5, 0.2)) / uBandGrade.z), 0.7, 1.4);
  float k = uBandGrade.x * region * pow(aStar.y / 0.05, uBandGrade.y - 1.0);
  float fl = max(aStar.y * dot(uBandTint.rgb, vec3(0.3, 0.5, 0.2)) * k, 1e-5);
  vec3 look = mix(uFlightDust, uFlightLight, smoothstep(uFlightBand.x, uFlightBand.y, fl * uStripStar.y)) * uFlightLook.y * pow(fl / uFlightBand.y, uFlightBand.z);
  look = mix(vec3(dot(look, vec3(0.3, 0.5, 0.2))), look, uStripStar.x);
  vec3 c = mix(vec3(1.0), aColor, uBandTint.w) * uBandTint.rgb * mix(vec3(1.0), look, uFlightLook.x);
  c *= k * mix(1.0, uFlightBand.w / uFlightLook.y, uLift) * aStar.x * uExposure * (1.0 - patchCoord(0, d).z * uPatchLens[0].w) * (1.0 - patchCoord(1, d).z * uPatchLens[1].w);
  vColor = c;
  float size = min(uStripSize.x + uStripSize.y * log2(1.0 + max(c.r, max(c.g, c.b))), uStripSize.z) * uPixel;
  gl_PointSize = size;
  vSize = size;
}`

const BEHIND = { stencilWrite: true, stencilFunc: THREE.EqualStencilFunc, stencilRef: 0, stencilFuncMask: 0xff, stencilWriteMask: 0 } as const

const POLE = [0.45, 0.82, 0.35] as const
const GAMMA_TURN = 0.28
const STAR_MAX_SIZE = 11
const STAR_HALO = 0.012
const STAR_CULL_PAD_PX = 4
const NO_TILES = new Uint8Array(0)

export function galactic(): THREE.Matrix3 {
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

function catalog(base: number): { pos: Float32Array; star: Float32Array; col: Float32Array } {
  const st = skyFrame.stars
  const main = Math.round(base * st.countScale)
  const count = main + Math.round(base * st.micro)
  const rnd = stream('stars')
  const pos = new Float32Array(count * 3)
  const star = new Float32Array(count * 3)
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
    star[i * 3] = Math.min(2.6 + 2.2 * Math.log2(1 + bright), STAR_MAX_SIZE)
    star[i * 3 + 1] = bright
    star[i * 3 + 2] = micro ? 1 : 1 - Math.min(bright * 0.024 / st.brightness, 1)
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
  return { pos, star, col }
}

const shed = (a: THREE.BufferAttribute): THREE.BufferAttribute => a.onUpload(() => { (a as unknown as { array: null }).array = null })

export class Sky {
  cull = false
  private readonly pass: Pass
  private readonly stars: THREE.Points
  private readonly starScene = new THREE.Scene()
  private readonly flight: THREE.Points
  private readonly deep: THREE.Points
  private deepLevel = 0
  private deepLens = 0
  private readonly strip: THREE.Points
  private stripGlow: THREE.Texture | null = null
  private stripBytes: ArrayBuffer | null = null
  private stripDef: StripDef | null = null
  private field: Pick<FlightField, 'veil' | 'veilLow' | 'veilHigh' | 'rough' | 'width' | 'height'> | null = null
  private flightDef: FlightDef | null = null
  private base = 0
  private canvas: HTMLCanvasElement | null = null
  private stale = false
  private readonly inView: { points: THREE.Points; pos: Float32Array; order: THREE.BufferAttribute; key: Float64Array }[] = []
  private readonly ahead = new THREE.Vector3()
  private flightLevel = 0
  private flightLift = 0
  private readonly flightGlow = new THREE.Vector3()
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
  private readonly patchRaw = [0, 0]
  private readonly flightHalo = { value: STAR_HALO }
  private readonly starPos: Float32Array
  private readonly starOrder: THREE.BufferAttribute
  private readonly starPlain: THREE.BufferGeometry
  private readonly starCulled: THREE.BufferGeometry
  private readonly starView = new THREE.Matrix3()
  private readonly starKey = new Float64Array(13).fill(NaN)
  private starTiles: Uint8Array = NO_TILES
  private starInView = new Uint32Array(0)
  private starInViewCount = 0

  constructor(base: number) {
    const st = skyFrame.stars
    this.pass = new Pass(SKY_FRAG, {
      uImplicit: implicitUniform, uSky: { value: null }, uInvProj: { value: new THREE.Matrix4() }, uRot: { value: this.rot }, uTint: { value: new THREE.Vector3().fromArray(skyFrame.grade.tint) }, uFloor: { value: new THREE.Vector3().fromArray(skyFrame.grade.floor) }, uGamma: { value: skyFrame.grade.gamma }, uBand: { value: null }, uGal: { value: galactic() }, uBandMap: { value: bandMap() }, uBandWiden: { value: 1 / skyFrame.band.widen }, uBandFadeEnd: { value: skyFrame.band.fadeEnd }, uBandGrade: { value: new THREE.Vector4(skyFrame.band.gain, skyFrame.band.gamma, skyFrame.band.regionRef, skyFrame.band.offGain) }, uBandTint: { value: new THREE.Vector4(skyFrame.band.tint[0], skyFrame.band.tint[1], skyFrame.band.tint[2], skyFrame.band.saturation) }, uFrame: { value: new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion())) }, uExposure: { value: 1 },
      uSunDir: { value: new THREE.Vector3(0, 0, 1) }, uSunColor: { value: new THREE.Vector3(1, 1, 1) }, uSunRadius: { value: 0.01 }, uSunGlare: { value: 0 }, uGlow: { value: 1 }, uTerrainBand: { value: skyFrame.band.terrainGain }, uBandClean: { value: new THREE.Vector3(skyFrame.band.cleanRadius, skyFrame.band.cleanKeep, skyFrame.band.cleanBlur) },
      uLens: { value: new THREE.Vector2(0, 16 / 9) }, uPatchA: { value: this.blank }, uPatchB: { value: this.blank }, uPatchM: { value: this.patchM }, uPatchLens: { value: this.patchLens }, uPatchRing: { value: this.patchRing }, uPatchMode: { value: this.patchMode },
      uBandGlow: { value: this.blank }, uFlightStrip: { value: new THREE.Vector3() }, uFlightEdge: { value: new THREE.Vector3(0, 1, 0) }, uFlightFeather: { value: new THREE.Vector4(0, 1, 1, 0) }, uFlightRough: { value: 0 },
      uFlightMap: { value: this.blank }, uFlightGlow: { value: new THREE.Vector4() }, uFlightHaze: { value: new THREE.Vector4() }, uFlightBandWidth: { value: 1 }, uFlightOff: { value: new THREE.Vector3(1, 1, 1) }, uFlightDust: { value: new THREE.Vector3(1, 1, 1) }, uFlightLight: { value: new THREE.Vector3(1, 1, 1) }, uFlightBand: { value: new THREE.Vector4(0, 1, 0, 1) }, uFlightLook: { value: new THREE.Vector2(0, 1) }, uFlightVeil: { value: new THREE.Vector4() }, uFlightVeilWarm: { value: new THREE.Vector4() },
    }, BEHIND)
    const { pos, star, col } = catalog(base)
    this.base = base
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aStar', shed(new THREE.BufferAttribute(star, 3)))
    geo.setAttribute('aColor', shed(new THREE.BufferAttribute(col, 3)))
    this.starPos = pos
    this.starOrder = new THREE.BufferAttribute(new Uint32Array(pos.length / 3), 1)
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
      uniforms: { uStarLift: { value: new THREE.Vector2(0, 1) }, uPixel: { value: 1 }, uExposure: { value: 1 }, uGlow: { value: 1 }, uSky: { value: null }, uHasSky: { value: 0 }, uBand: { value: null }, uGal: { value: galactic() }, uBandMap: { value: bandMap() }, uBandWiden: { value: 1 / skyFrame.band.widen }, uBandFadeEnd: { value: skyFrame.band.fadeEnd }, uCrowd: { value: new THREE.Vector2(skyFrame.band.crowdRef, skyFrame.band.crowdLod) }, uTerrainStars: { value: new THREE.Vector4(st.terrainGain, st.terrainCrowd, st.terrainCore, st.terrainCap) }, uCrowdShape: { value: new THREE.Vector2(skyFrame.band.crowdPow, skyFrame.band.crowdMin) }, uCore: { value: skyFrame.stars.core }, uHalo: { value: STAR_HALO }, uPatchA: { value: this.blank }, uPatchB: { value: this.blank }, uPatchM: { value: this.patchM }, uPatchLens: { value: this.patchLens }, uPatchRing: { value: this.patchRing }, uPatchMode: { value: this.patchMode } },
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
    const fm = mat.clone()
    for (const name of ['uPatchM', 'uPatchLens', 'uPatchRing', 'uPatchMode']) fm.uniforms[name] = mat.uniforms[name]!
    fm.uniforms.uHalo = this.flightHalo
    this.flight = new THREE.Points(new THREE.BufferGeometry(), fm)
    this.flight.frustumCulled = false
    this.flight.visible = false
    this.stars.add(this.flight)
    const dm = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: DEEP_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: { uCore: mat.uniforms.uCore!, uHalo: this.flightHalo, uPixel: { value: 1 }, uExposure: { value: 0 }, uLens: { value: new THREE.Vector3(0, 16 / 9, 0) }, uDeepLaw: { value: new THREE.Vector3(1, 0, 1) }, uDeepSize: { value: new THREE.Vector3(SIZE[0], SIZE[1], FLIGHT_SIZE) }, uPatchA: { value: this.blank }, uPatchB: { value: this.blank }, uPatchM: { value: this.patchM }, uPatchLens: { value: this.patchLens }, uPatchRing: { value: this.patchRing }, uPatchMode: { value: this.patchMode } },
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      ...BEHIND,
    })
    this.deep = new THREE.Points(new THREE.BufferGeometry(), dm)
    this.deep.frustumCulled = false
    this.deep.visible = false
    this.stars.add(this.deep)
    const pu = this.pass.material.uniforms
    const sm = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: STRIP_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: { uCore: mat.uniforms.uCore!, uHalo: this.flightHalo, uPixel: { value: 1 }, uExposure: { value: 0 }, uLift: { value: 0 }, uSky: { value: null }, uGal: pu.uGal!, uBandGrade: pu.uBandGrade!, uBandTint: pu.uBandTint!, uFlightDust: pu.uFlightDust!, uFlightLight: pu.uFlightLight!, uFlightBand: pu.uFlightBand!, uFlightLook: pu.uFlightLook!, uStripStar: { value: new THREE.Vector2(1, 1) }, uStripSize: { value: new THREE.Vector3(SIZE[0], SIZE[1], FLIGHT_SIZE) }, uPatchA: { value: this.blank }, uPatchB: { value: this.blank }, uPatchM: { value: this.patchM }, uPatchLens: { value: this.patchLens }, uPatchRing: { value: this.patchRing }, uPatchMode: { value: this.patchMode } },
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      ...BEHIND,
    })
    this.strip = new THREE.Points(new THREE.BufferGeometry(), sm)
    this.strip.frustumCulled = false
    this.strip.visible = false
    this.stars.add(this.strip)
  }

  setFlightBand(glow: THREE.Texture, stars: ArrayBuffer, def: StripDef): void {
    this.stripGlow = glow
    this.stripBytes = stars
    this.stripDef = def
    const u = this.pass.material.uniforms
    u.uBandGlow!.value = glow
    ;(u.uFlightStrip!.value as THREE.Vector3).set(0, def.dither, def.offLevel)
    ;(u.uFlightEdge!.value as THREE.Vector3).fromArray(def.edge)
    ;((this.strip.material as THREE.ShaderMaterial).uniforms.uStripStar!.value as THREE.Vector2).set(def.stars.tint, def.stars.warm)
    this.flightHalo.value = def.stars.halo
    ;((this.deep.material as THREE.ShaderMaterial).uniforms.uDeepLaw!.value as THREE.Vector3).set(def.deep.gain, def.deep.tail, def.deep.ref)
    this.buildStrip()
  }

  private buildStrip(): void {
    const def = this.stripDef
    if (!def || !this.stripBytes || !this.field) return
    const b = skyFrame.band
    ;(this.pass.material.uniforms.uFlightFeather!.value as THREE.Vector4).set(def.feather.reach, this.field.veilHigh, 1 / (this.field.veilHigh - this.field.veilLow), def.feather.follow)
    this.pass.material.uniforms.uFlightRough!.value = def.feather.rough
    const set = bandField(this.stripBytes, { repeats: b.repeats, offset: b.offsetDeg / 360 * b.repeats, latSpan: THREE.MathUtils.degToRad(b.latSpanDeg), widen: b.widen, gal: galactic().elements }, def, this.field)
    const geo = this.strip.geometry
    geo.setAttribute('position', new THREE.BufferAttribute(set.position, 3))
    geo.setAttribute('aStar', shed(new THREE.BufferAttribute(set.star, 2)))
    geo.setAttribute('aColor', shed(new THREE.BufferAttribute(set.color, 3)))
    const order = new THREE.BufferAttribute(new Uint32Array(set.position.length / 3), 1)
    order.setUsage(THREE.DynamicDrawUsage)
    geo.setIndex(order)
    geo.setDrawRange(0, 0)
    for (let i = this.inView.length - 1; i >= 0; i--) if (this.inView[i]!.points === this.strip) this.inView.splice(i, 1)
    this.inView.push({ points: this.strip, pos: set.position, order, key: new Float64Array(4).fill(NaN) })
  }

  private refill(): void {
    const c = catalog(this.base)
    const star = shed(new THREE.BufferAttribute(c.star, 3))
    const col = shed(new THREE.BufferAttribute(c.col, 3))
    for (const g of [this.starPlain, this.starCulled]) {
      g.setAttribute('aStar', star)
      g.setAttribute('aColor', col)
    }
    if (this.flightDef) this.setFlightStars(this.flightDef)
  }

  setFlightStars(def: FlightDef): void {
    const field = flightField(def)
    this.flightDef = def
    this.field = { veil: field.veil, veilLow: field.veilLow, veilHigh: field.veilHigh, rough: field.rough, width: field.width, height: field.height }
    const geo = this.flight.geometry
    geo.setAttribute('position', new THREE.BufferAttribute(field.position, 3))
    geo.setAttribute('aStar', shed(new THREE.BufferAttribute(field.star, 4)))
    geo.setAttribute('aColor', shed(new THREE.BufferAttribute(field.color, 3)))
    const dg = this.deep.geometry
    dg.setAttribute('position', new THREE.BufferAttribute(field.deep.position, 3))
    dg.setAttribute('aStar', shed(new THREE.BufferAttribute(field.deep.star, 1)))
    dg.setAttribute('aColor', shed(new THREE.BufferAttribute(field.deep.color, 3)))
    this.deepLevel = def.deep.level
    this.deepLens = def.deep.lens
    this.inView.length = 0
    for (const [points, pos] of [[this.flight, field.position], [this.deep, field.deep.position]] as const) {
      const order = new THREE.BufferAttribute(new Uint32Array(pos.length / 3), 1)
      order.setUsage(THREE.DynamicDrawUsage)
      points.geometry.setIndex(order)
      points.geometry.setDrawRange(0, 0)
      this.inView.push({ points, pos, order, key: new Float64Array(4).fill(NaN) })
    }
    this.buildStrip()
    const half = new Uint16Array(field.glow.length * 4)
    for (let i = 0; i < field.glow.length; i++) {
      half[i * 4] = THREE.DataUtils.toHalfFloat(field.glow[i]!)
      half[i * 4 + 1] = THREE.DataUtils.toHalfFloat(field.veil[i]!)
      half[i * 4 + 2] = THREE.DataUtils.toHalfFloat(field.rough[i]!)
    }
    const map = new THREE.DataTexture(half, field.width, field.height, THREE.RGBAFormat, THREE.HalfFloatType)
    map.wrapS = THREE.RepeatWrapping
    map.magFilter = THREE.LinearFilter
    map.minFilter = THREE.LinearFilter
    map.needsUpdate = true
    this.pass.material.uniforms.uFlightMap!.value = map
    this.flightGlow.fromArray(def.glowTint).multiplyScalar(def.glow)
    const u = this.pass.material.uniforms
    ;(u.uFlightHaze!.value as THREE.Vector4).set(def.haze.tint[0]!, def.haze.tint[1]!, def.haze.tint[2]!, def.haze.away)
    u.uFlightBandWidth!.value = (def.haze.widthDeg * Math.PI) / 180
    ;(u.uFlightOff!.value as THREE.Vector3).fromArray(def.band.off)
    ;(u.uFlightDust!.value as THREE.Vector3).fromArray(def.band.dust)
    ;(u.uFlightLight!.value as THREE.Vector3).fromArray(def.band.light)
    ;(u.uFlightBand!.value as THREE.Vector4).set(def.band.span[0]!, def.band.span[1]!, def.band.contrast, def.band.gain)
    ;(u.uFlightLook!.value as THREE.Vector2).y = def.band.level
    ;(u.uFlightVeil!.value as THREE.Vector4).set(def.veil.cool[0]! * def.veil.level, def.veil.cool[1]! * def.veil.level, def.veil.cool[2]! * def.veil.level, def.veil.dither)
    ;(u.uFlightVeilWarm!.value as THREE.Vector4).set(def.veil.neutral[0]! * def.veil.level, def.veil.neutral[1]! * def.veil.level, def.veil.neutral[2]! * def.veil.level, def.veil.lens)
  }

  setFrame(q: THREE.Quaternion): void {
    this.frame.copy(q)
  }

  setStarLift(amount: number, floor: number, flight: number): void {
    ;((this.stars.material as THREE.ShaderMaterial).uniforms.uStarLift!.value as THREE.Vector2).set(amount, floor)
    this.flightLevel = amount * flight
    this.flightLift = amount
  }

  setBandLook(weight: number): void {
    ;(this.pass.material.uniforms.uFlightLook!.value as THREE.Vector2).x = weight
  }

  setPatches(list: { patch: SkyPatch; weight: number }[]): void {
    for (let i = 0; i < 2; i++) {
      const e = list[i]
      this.patchMode[i]!.x = e ? e.weight : 0
      this.patchRaw[i] = e ? e.weight : 0
      this.patchTex[i] = e ? e.patch.texture : this.blank
      if (!e) continue
      const p = e.patch
      this.patchM[i]!.setFromMatrix4(this.m4.makeRotationFromQuaternion(this.q.copy(p.aim).invert()))
      this.patchLens[i]!.set(p.tan[0], p.tan[1], p.gain, 1)
      this.patchRing[i]!.fromArray(p.ring)
      this.patchMode[i]!.set(e.weight, p.add ? 1 : 0, p.edge)
    }
  }

  private orderStars(camera: THREE.PerspectiveCamera, height: number, aspect: number, tiles: Tiles | null): void {
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
    const m0 = m[0]!, m1 = m[1]!, m2 = m[2]!, m3 = m[3]!, m4 = m[4]!, m5 = m[5]!, m6 = m[6]!, m7 = m[7]!, m8 = m[8]!
    const pos = this.starPos
    if (this.starInView.length !== pos.length / 3) this.starInView = new Uint32Array(pos.length / 3)
    const inView = this.starInView
    if (!same) {
      for (let i = 0; i < 9; i++) key[i] = m[i]!
      key[9] = px
      key[10] = py
      key[11] = limX
      key[12] = limY
      const count = pos.length / 3
      let n = 0
      for (let i = 0; i < count; i++) {
        const x = pos[i * 3]!
        const y = pos[i * 3 + 1]!
        const z = pos[i * 3 + 2]!
        const w = -(m2 * x + m5 * y + m8 * z)
        if (w <= 0) continue
        if (Math.abs(px * (m0 * x + m3 * y + m6 * z)) > w * limX || Math.abs(py * (m1 * x + m4 * y + m7 * z)) > w * limY) continue
        inView[n++] = i
      }
      this.starInViewCount = n
    }
    const grid = tiles ? tiles.open : NO_TILES
    const seen = this.starTiles
    same = same && seen.length === grid.length
    for (let i = 0; same && i < grid.length; i++) same = seen[i] === grid[i]
    if (same) return
    this.starTiles = grid.slice()
    const order = this.starOrder.array as Uint32Array
    const total = this.starInViewCount
    let n = 0
    if (tiles) {
      const { tile, cols, rows } = tiles
      const halfW = height * aspect * 0.5
      const halfH = height * 0.5
      const padX = (limX - 1) * halfW
      const padY = (limY - 1) * halfH
      for (let j = 0; j < total; j++) {
        const i = inView[j]!
        const x = pos[i * 3]!
        const y = pos[i * 3 + 1]!
        const z = pos[i * 3 + 2]!
        const w = -(m2 * x + m5 * y + m8 * z)
        const sx = (px * (m0 * x + m3 * y + m6 * z) / w + 1) * halfW
        const sy = (py * (m1 * x + m4 * y + m7 * z) / w + 1) * halfH
        const c0 = Math.max(Math.floor((sx - padX) / tile), 0)
        const c1 = Math.min(Math.floor((sx + padX) / tile), cols - 1)
        const r0 = Math.max(Math.floor((sy - padY) / tile), 0)
        const r1 = Math.min(Math.floor((sy + padY) / tile), rows - 1)
        let any = false
        for (let r = r0; r <= r1 && !any; r++) for (let c = c0; c <= c1; c++) any = any || grid[r * cols + c] === 1
        if (any) order[n++] = i
      }
    } else {
      order.set(inView.subarray(0, total))
      n = total
    }
    this.starOrder.clearUpdateRanges()
    this.starOrder.addUpdateRange(0, n)
    this.starOrder.needsUpdate = true
    this.starCulled.setDrawRange(0, n)
  }

  private viewStars(camera: THREE.PerspectiveCamera): void {
    const p = camera.projectionMatrix.elements
    const lim = Math.cos(Math.atan(Math.hypot((1 + Math.abs(p[8]!)) / p[0]!, (1 + Math.abs(p[9]!)) / p[5]!) * 1.02) + 0.01)
    const f = this.ahead.set(0, 0, -1).applyQuaternion(this.q.copy(this.stars.quaternion).invert().multiply(camera.quaternion))
    for (const set of this.inView) {
      const key = set.key
      if (key[0] === f.x && key[1] === f.y && key[2] === f.z && key[3] === lim) continue
      key[0] = f.x
      key[1] = f.y
      key[2] = f.z
      key[3] = lim
      const pos = set.pos
      const order = set.order.array as Uint32Array
      let n = 0
      for (let i = 0, count = pos.length / 3; i < count; i++) if (pos[i * 3]! * f.x + pos[i * 3 + 1]! * f.y + pos[i * 3 + 2]! * f.z >= lim) order[n++] = i
      set.order.clearUpdateRanges()
      set.order.addUpdateRange(0, n)
      set.order.needsUpdate = true
      set.points.geometry.setDrawRange(0, n)
    }
  }

  setTexture(t: THREE.Texture, band: THREE.Texture): void {
    this.texture = t
    this.band = band
  }

  render(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget, camera: THREE.PerspectiveCamera, skyQuaternion: THREE.Quaternion, exposure: number, glow: number, turn: THREE.Quaternion, height: number, sun: SunState, vignette: number, aspect: number, open: Tiles | null): void {
    if (this.canvas !== renderer.domElement) {
      this.canvas = renderer.domElement
      this.canvas.addEventListener('webglcontextrestored', () => { this.stale = true })
    }
    if (this.stale) {
      this.stale = false
      this.refill()
    }
    const saved = camera.quaternion.clone()
    const savedPos = camera.position.clone()
    camera.quaternion.copy(skyQuaternion)
    camera.position.set(0, 0, 0)
    camera.updateMatrixWorld(true)
    const u = this.pass.material.uniforms
    u.uSky!.value = this.texture
    u.uBand!.value = this.band
    ;(u.uInvProj!.value as THREE.Matrix4).copy(camera.projectionMatrixInverse)
    const inv = (u.uInvProj!.value as THREE.Matrix4).elements
    if (Math.fround(Math.fround(inv[11]!) + Math.fround(inv[15]!)) === 0) {
      inv[11] = 0
      inv[15] = 1
    }
    this.rot.setFromMatrix4(this.m4.makeRotationFromQuaternion(skyQuaternion))
    u.uExposure!.value = exposure
    u.uGlow!.value = glow
    ;(u.uLens!.value as THREE.Vector2).set(vignette, aspect)
    u.uPatchA!.value = this.patchTex[0]
    u.uPatchB!.value = this.patchTex[1]
    ;(u.uFlightGlow!.value as THREE.Vector4).set(this.flightGlow.x, this.flightGlow.y, this.flightGlow.z, this.flightLift)
    const swap = this.stripGlow && this.stripDef ? THREE.MathUtils.smoothstep(this.flightLift, 0, this.stripDef.swap) : 0
    ;(u.uFlightStrip!.value as THREE.Vector3).x = swap
    for (let i = 0; i < 2; i++) this.patchMode[i]!.x = swap > 0 ? Math.pow(this.patchRaw[i]!, 1 + this.stripDef!.patchHold * this.flightLift) : this.patchRaw[i]!
    this.q.copy(turn).invert().premultiply(this.frame)
    ;(u.uFrame!.value as THREE.Matrix3).setFromMatrix4(this.m4.makeRotationFromQuaternion(this.q))
    this.stars.quaternion.copy(this.q).invert()
    ;(u.uSunDir!.value as THREE.Vector3).copy(sun.dir)
    ;(u.uSunColor!.value as THREE.Vector3).set(sun.color.r, sun.color.g, sun.color.b)
    u.uSunRadius!.value = sun.angularRadius
    u.uSunGlare!.value = sun.glare
    const sky = this.pass.material
    if (('PATCH_IMPLICIT' in sky.defines) !== this.cull) {
      if (this.cull) sky.defines.PATCH_IMPLICIT = ''
      else delete sky.defines.PATCH_IMPLICIT
      sky.needsUpdate = true
    }
    const rects = open ? tileRects(open, target.width, target.height) : null
    if (this.texture && !rects) this.pass.render(renderer, target)
    if (this.texture && rects) {
      target.scissorTest = true
      for (let i = 0; i < rects.length; i += 4) {
        target.scissor.set(rects[i]!, rects[i + 1]!, rects[i + 2]!, rects[i + 3]!)
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
    su.uHalo!.value = swap > 0 ? STAR_HALO + (this.flightHalo.value - STAR_HALO) * swap : STAR_HALO
    su.uPatchA!.value = this.patchTex[0]
    su.uPatchB!.value = this.patchTex[1]
    this.stars.geometry = this.cull ? this.starCulled : this.starPlain
    const fu = (this.flight.material as THREE.ShaderMaterial).uniforms
    fu.uPixel!.value = height / 1080
    fu.uExposure!.value = this.flightLevel
    fu.uPatchA!.value = this.patchTex[0]
    fu.uPatchB!.value = this.patchTex[1]
    this.flight.visible = this.flightLevel > 0 && this.flight.geometry.hasAttribute('position')
    const du = (this.deep.material as THREE.ShaderMaterial).uniforms
    du.uPixel!.value = height / 1080
    du.uExposure!.value = this.flightLift * this.deepLevel
    ;(du.uLens!.value as THREE.Vector3).set(vignette, aspect, this.deepLens)
    du.uPatchA!.value = this.patchTex[0]
    du.uPatchB!.value = this.patchTex[1]
    this.deep.visible = this.flightLift > 0 && this.deepLevel > 0 && this.deep.geometry.hasAttribute('position')
    const tu = (this.strip.material as THREE.ShaderMaterial).uniforms
    tu.uPixel!.value = height / 1080
    tu.uExposure!.value = exposure * glow * swap
    tu.uLift!.value = this.flightLift
    tu.uSky!.value = this.texture
    tu.uPatchA!.value = this.patchTex[0]
    tu.uPatchB!.value = this.patchTex[1]
    this.strip.visible = swap > 0 && this.texture !== null && this.strip.geometry.hasAttribute('position')
    if (this.flight.visible || this.deep.visible || this.strip.visible) this.viewStars(camera)
    const some = !rects || rects.length > 0
    if (this.cull && some) this.orderStars(camera, height, aspect, open)
    renderer.setRenderTarget(target)
    if (some) renderer.render(this.starScene, camera)
    camera.quaternion.copy(saved)
    camera.position.copy(savedPos)
    camera.updateMatrixWorld(true)
  }
}
