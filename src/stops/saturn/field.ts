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
uniform vec4 uRfGroove;
uniform vec4 uRfGrooveFit;
uniform vec4 uRfHue;
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
vec3 ringBits(uint h) {
  return vec3(float(h & 1023u), float((h >> 10) & 1023u), float((h >> 20) & 1023u)) * (1.0 / 1023.0);
}
// One octave of ringlets at x, in cells: plateaus whose edges are jittered inside each cell, and at each edge a
// groove of its own width and depth. f is the half width of the pixel in cells. Returns the level and two hue
// offsets (-1 to 1) and how much of the pixel lies in a groove, weighted by the groove's depth.
vec4 ringOctave(float x, uint seed, float f) {
  float cell = floor(x);
  float t = x - cell;
  uint s = ringPcg(seed);
  uint base = uint(int(cell)) + s;
  vec3 prev = ringBits(ringPcg(base - 2u));
  vec3 acc = prev;
  float groove = 0.0;
  for (int k = -1; k <= 1; k++) {
    uint h = ringPcg(base + uint(k));
    vec3 v = ringBits(h);
    vec3 e = ringBits(ringPcg(h));
    float d = t - float(k) - (0.2 + 0.6 * e.x);
    acc += (v - prev) * smoothstep(-f, f, d);
    float wide = uRfGroove.x + uRfGroove.y * e.y * e.y;
    float deep = smoothstep(uRfGroove.z, 1.0, e.z);
    groove += deep * clamp(min(d + f, wide) - max(d - f, -wide), 0.0, 2.0 * f) / (2.0 * f);
    prev = v;
  }
  return vec4(acc * 2.0 - 1.0, groove);
}
void ringFine(float r, float fp, float amp, inout float tau, inout float lum, inout vec3 ink) {
  float wave = uRfFine.x;
  float kl = 1.0;
  float kt = 1.0;
  vec2 hue = vec2(0.0);
  for (int o = 0; o < ${fine.octaves}; o++) {
    float seen = clamp(wave / (fp * uRfFine.w) - 1.0, 0.0, 1.0);
    float gain = amp * min(1.0, (float(o) + 1.0) * uRfAmp.z);
    float dark = gain * uRfGrooveFit.x;
    float gap = gain * uRfGrooveFit.y;
    for (int k = 0; k < (seen > 0.0 ? 1 : 0); k++) {
      vec4 q = ringOctave(r / wave + float(o) * uRfAmp.w, uint(o) + 1u, max(uRfFine.z, uRfGrooveFit.w * fp / wave));
      kl *= (1.0 + gain * seen * uRfAmp.x * q.x) * mix(1.0, (1.0 - min(dark * q.w, 1.0)) / (1.0 - dark * uRfGrooveFit.z), seen);
      kt *= (1.0 + gain * seen * uRfAmp.y * q.x) * mix(1.0, (1.0 - min(gap * q.w, 1.0)) / (1.0 - gap * uRfGrooveFit.z), seen);
      hue += seen * gain * q.yz;
    }
    wave *= uRfFine.y;
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
  ink *= 1.0 + uRfWarm * (hue.x * uRfHue.x) + uRfPink * (hue.y * uRfHue.y);
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

function meanSmoothstep(from: number): number {
  let sum = 0
  const n = 4096
  for (let i = 0; i < n; i++) {
    const x = Math.min(Math.max(((i + 0.5) / n - from) / (1 - from), 0), 1)
    sum += x * x * (3 - 2 * x)
  }
  return sum / n
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
  const groove = fine.groove
  // the share of a cell that lies in a groove, weighted by depth: one edge per cell, half width w0 + (w1 - w0) u^2,
  // depth smoothstep(rare, 1, v) with u and v even on 0 to 1
  const grooveMean = 2 * (groove.width[0] + (groove.width[1] - groove.width[0]) / 3) * meanSmoothstep(groove.rare)
  return {
    texture,
    finest: fine.first * Math.pow(fine.ratio, fine.octaves - 1),
    uniforms: {
      uRfMap: { value: texture },
      uRfSpan: { value: new THREE.Vector4(span[0], 1 / (span[1] - span[0]), n, levels) },
      uRfLight: { value: new THREE.Vector4(1 / model.muSun + 1 / model.muHero, model.muSun, model.muHero, 0) },
      uRfFine: { value: new THREE.Vector4(fine.first, fine.ratio, fine.edge, fine.footprints) },
      uRfAmp: { value: new THREE.Vector4(fine.lum, fine.tau, 1 / fine.easeIn, fine.shift) },
      uRfGroove: { value: new THREE.Vector4(groove.width[0], groove.width[1] - groove.width[0], groove.rare, 0) },
      uRfGrooveFit: { value: new THREE.Vector4(groove.dark, groove.open, grooveMean, fine.filter) },
      uRfHue: { value: new THREE.Vector4(fine.hue.warm, fine.hue.pink, 0, 0) },
      uRfWarm: { value: new THREE.Vector3().fromArray(fine.hue.warmAxis) },
      uRfPink: { value: new THREE.Vector3().fromArray(fine.hue.pinkAxis) },
      uRfWaves: { value: fine.waves.trains.map((t) => new THREE.Vector4(t[0], t[1], t[2], t[3])) },
      uRfWaveFit: { value: new THREE.Vector4(ends.lum, ends.tau, ends.tight, 0) },
      uRfWaveEnds: { value: new THREE.Vector4(ends.rise[0], ends.rise[1], ends.fall[0], ends.fall[1]) },
    },
  }
}
