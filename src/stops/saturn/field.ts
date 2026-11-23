import * as THREE from 'three'
import type { SetContext } from '../../core/types'
import fine from './ringfine.json'
import model from './ringfield.json'

export const RING_HASH_GLSL = /* glsl */ `
uint ringPcg(uint v) {
  uint s = v * 747796405u + 2891336453u;
  uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}
float ringUnit(uint h) {
  return float(h >> 8) * (1.0 / 16777216.0);
}
float ringRand(int i, uint seed) {
  return ringUnit(ringPcg(uint(i) + ringPcg(seed)));
}
uint ringCell(int i, int j, uint seed) {
  return ringPcg(uint(i) + ringPcg(uint(j) + ringPcg(seed)));
}`

export const RING_FIELD_GLSL = /* glsl */ `
uniform highp sampler2D uRfMap;
uniform vec4 uRfSpan;
uniform vec4 uRfLight;
uniform vec4 uRfFine;
uniform vec4 uRfAmp;
uniform vec4 uRfHue;
uniform vec4 uRfHueFit;
uniform vec3 uRfWarm;
uniform vec3 uRfPink;
uniform vec4 uRfWaves[${fine.waves.trains.length}];
uniform vec4 uRfWaveFit;
uniform vec4 uRfWaveEnds;
${RING_HASH_GLSL}
float ringRows() {
  return 2.0 * uRfSpan.w + 3.0;
}
float ringLevel(float fp) {
  return clamp(log2(max(fp * uRfSpan.y * uRfSpan.z, 1.0)), 0.0, uRfSpan.w - 1.0);
}
vec2 ringKnots(float r, float fp) {
  float x = (r - uRfSpan.x) * uRfSpan.y;
  float level = ringLevel(fp);
  float rows = ringRows();
  return vec2(textureLod(uRfMap, vec2(x, (level + 0.5) / rows), 0.0).r, textureLod(uRfMap, vec2(x, (uRfSpan.w + level + 0.5) / rows), 0.0).r);
}
float ringDepth(float r, float fp) {
  float x = (r - uRfSpan.x) * uRfSpan.y;
  return textureLod(uRfMap, vec2(x, (ringLevel(fp) + 0.5) / ringRows()), 0.0).r;
}
vec4 ringInk(float r) {
  float x = (r - uRfSpan.x) * uRfSpan.y;
  float rows = ringRows();
  float red = textureLod(uRfMap, vec2(x, (2.0 * uRfSpan.w + 0.5) / rows), 0.0).r;
  float blue = textureLod(uRfMap, vec2(x, (2.0 * uRfSpan.w + 1.5) / rows), 0.0).r;
  return vec4(red, (1.0 - 0.2126 * red - 0.0722 * blue) / 0.7152, blue, textureLod(uRfMap, vec2(x, (2.0 * uRfSpan.w + 2.5) / rows), 0.0).r);
}
float ringStep(float x, uint seed, float e) {
  float y = x - 0.5;
  float i = floor(y);
  float f = y - i;
  float a = ringRand(int(i), seed);
  float b = ringRand(int(i) + 1, seed);
  return mix(a, b, smoothstep(0.5 - e, 0.5 + e, f)) * 2.0 - 1.0;
}
void ringFine(float r, float fp, float amp, inout float tau, inout float lum, inout vec3 ink) {
  float wave = uRfFine.x;
  float gain = amp;
  float kl = 1.0;
  float kt = 1.0;
  for (int o = 0; o < ${fine.octaves}; o++) {
    float seen = clamp(wave / (fp * uRfFine.w) - 1.0, 0.0, 1.0);
    for (int k = 0; k < (seen > 0.0 ? 1 : 0); k++) {
      float x = r / wave + float(o) * uRfAmp.w;
      float e = clamp(max(uRfFine.z, fp / wave), 0.0, 0.5);
      kl *= 1.0 + gain * seen * uRfAmp.x * ringStep(x, uint(o) * 4u + 1u, e);
      kt *= 1.0 + gain * seen * uRfAmp.y * ringStep(x, uint(o) * 4u + 2u, e);
    }
    wave *= uRfFine.y;
    gain *= uRfAmp.z;
  }
  for (int w = 0; w < ${fine.waves.trains.length}; w++) {
    float x = (r - uRfWaves[w].x) * uRfWaves[w].w;
    float away = abs(x) / uRfWaves[w].y;
    float local = uRfWaves[w].z / max(away, uRfWaveFit.z);
    float seen = (x > 0.0 && away < uRfWaveEnds.w) ? clamp(local / (fp * uRfFine.w) - 1.0, 0.0, 1.0) * smoothstep(uRfWaveEnds.x, uRfWaveEnds.y, away) * (1.0 - smoothstep(uRfWaveEnds.z, uRfWaveEnds.w, away)) : 0.0;
    for (int k = 0; k < (seen > 0.0 ? 1 : 0); k++) {
      float s = sin(3.14159265 * away * away * uRfWaves[w].y / uRfWaves[w].z);
      kl *= 1.0 + uRfWaveFit.x * seen * s;
      kt *= 1.0 + uRfWaveFit.y * seen * s;
    }
  }
  lum *= kl;
  tau *= kt;
  float lane = uRfHue.x;
  vec2 hue = vec2(0.0);
  for (int o = 0; o < ${fine.hue.octaves}; o++) {
    float seen = clamp(lane / (fp * uRfFine.w) - 1.0, 0.0, 1.0);
    for (int k = 0; k < (seen > 0.0 ? 1 : 0); k++) {
      float x = r / lane + float(o) * uRfHueFit.y;
      float e = clamp(max(uRfHueFit.x, fp / lane), 0.0, 0.5);
      hue += seen * vec2(ringStep(x, uint(o) * 4u + 3u, e), ringStep(x, uint(o) * 4u + 4u, e));
    }
    lane *= uRfHue.y;
  }
  ink *= 1.0 + uRfWarm * (hue.x * uRfHue.z) + uRfPink * (hue.y * uRfHue.w);
}
float ringSat(float x) {
  return x < 1e-3 ? x : 1.0 - exp(-x);
}`

function boxed(src: number[], width: number): Float32Array {
  const n = src.length
  const sum = new Float64Array(n + 1)
  for (let i = 0; i < n; i++) sum[i + 1] = sum[i]! + src[i]!
  const out = new Float32Array(n)
  const lo = Math.floor((width - 1) / 2)
  const hi = width - 1 - lo
  for (let i = 0; i < n; i++) {
    const a = Math.max(i - lo, 0)
    const b = Math.min(i + hi, n - 1)
    out[i] = (sum[b + 1]! - sum[a]!) / width
  }
  return out
}

export interface RingField { uniforms: Record<string, THREE.IUniform>; texture: THREE.DataTexture; finest: number }

export function ringField(ctx: SetContext): RingField {
  const n = model.knots
  const levels = Math.round(Math.log2(n)) + 1
  const rows = 2 * levels + 3
  const data = new Float32Array(n * rows)
  for (let l = 0; l < levels; l++) {
    data.set(boxed(model.tau, 1 << l), l * n)
    data.set(boxed(model.lum, 1 << l), (levels + l) * n)
  }
  data.set(model.red, 2 * levels * n)
  data.set(model.blue, (2 * levels + 1) * n)
  data.set(model.fine, (2 * levels + 2) * n)
  const texture = ctx.floatTexture(data, n, rows)
  const span = model.span as [number, number]
  const ends = fine.waves
  return {
    texture,
    finest: fine.first * Math.pow(fine.ratio, fine.octaves - 1),
    uniforms: {
      uRfMap: { value: texture },
      uRfSpan: { value: new THREE.Vector4(span[0], 1 / (span[1] - span[0]), n, levels) },
      uRfLight: { value: new THREE.Vector4(1 / model.muSun + 1 / model.muHero, model.muSun, model.muHero, 0) },
      uRfFine: { value: new THREE.Vector4(fine.first, fine.ratio, fine.edge, fine.footprints) },
      uRfAmp: { value: new THREE.Vector4(fine.lum, fine.tau, fine.falloff, fine.shift) },
      uRfHue: { value: new THREE.Vector4(fine.hue.first, fine.hue.ratio, fine.hue.warm, fine.hue.pink) },
      uRfHueFit: { value: new THREE.Vector4(fine.hue.edge, fine.hue.shift, 0, 0) },
      uRfWarm: { value: new THREE.Vector3().fromArray(fine.hue.warmAxis) },
      uRfPink: { value: new THREE.Vector3().fromArray(fine.hue.pinkAxis) },
      uRfWaves: { value: fine.waves.trains.map((t) => new THREE.Vector4(t[0], t[1], t[2], t[3])) },
      uRfWaveFit: { value: new THREE.Vector4(ends.lum, ends.tau, ends.tight, 0) },
      uRfWaveEnds: { value: new THREE.Vector4(ends.rise[0], ends.rise[1], ends.fall[0], ends.fall[1]) },
    },
  }
}
